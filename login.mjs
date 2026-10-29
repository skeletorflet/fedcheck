/**
 * Login SELF FedPat por CDP (:9222) manejando las DOS etapas de Cloudflare:
 *   A) Interstitial de página completa ("Verificación de seguridad en curso")
 *      -> puede aparecer al abrir y también después del POST de login. Se resuelve
 *         solo en el navegador; hay que esperar, NO reenviar el formulario.
 *   B) Widget Turnstile del formulario ("Verificando...")
 *      -> el token es de un solo uso y vence ~5 min. Antes de enviar se fuerza
 *         turnstile.reset() y se espera un token NUEVO.
 *
 * Además neutraliza el autocompletado del gestor de contraseñas (que puede
 * sobrescribir usuario/clave y hasta iniciar sesión con otra cuenta).
 *
 * Uso: node login.mjs [usuario] [clave]
 *      node login.mjs 26620 Cuervo13
 */
import { connect, list } from './cdp.mjs';
import { ensureTab, tabFileFor, primaryUser } from './tabs.mjs';
import fs from 'node:fs';

const HOME = 'https://online.fedpat.com.ar/self/homeWin32.do';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isCFInterstitial = (title, body) => /Un momento|Verificación de seguridad/i.test(`${title} ${body}`);
const isLoggedIn = (url, hasLogout) => hasLogout || /loadProductor|homePage\.do/.test(url);

/**
 * Inicia sesión en la pestaña indicada.
 * @param {{user:string, pass:string, tabFile:string, log?:Function}} opts
 */
export async function loginAccount({ user, pass, tabFile, log = console.log }) {
  const shot = (name) => `salida/_errores/${user}_${name}.png`;

  const c = await connect('online.fedpat.com.ar', tabFile, { anyUrl: true });
  await c.send('Page.enable');
  await c.send('Network.enable');

  // Defensa contra el gestor de contraseñas: deja los campos "readonly" al cargar
  // (Chrome no autocompleta ni auto-loguea con readonly); nuestro fill los libera.
  await c.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `(() => {
      const lock = () => {
        const p = document.getElementById('password');
        if (p && !p.dataset.__ours) p.readOnly = true;
        const u = document.getElementById('usuario');
        if (u && !u.dataset.__ours) u.setAttribute('autocomplete', 'off');
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', lock);
      else lock();
    })();`,
  });

  let last429 = 0;
  c.on('Network.requestWillBeSent', (p) => {
    if (/login\.do/.test(p.request.url) && p.request.method === 'POST') log('  · → POST login.do');
  });
  c.on('Network.responseReceived', (p) => {
    if (/login\.do|homeWin32|loadProductor/.test(p.response.url) && p.type === 'Document') {
      log(`  · ← ${p.response.status} ${p.response.url.split('/self/')[1] || p.response.url}`);
    }
    if (p.response.status === 429 && /online\.fedpat/.test(p.response.url)) {
      last429 = Date.now();
      log('  · Cloudflare devolvió 429 (rate limit)');
    }
  });
  c.on('Page.frameNavigated', (p) => {
    if (!p.frame.parentId) log('  · nav:', p.frame.url.replace('https://online.fedpat.com.ar', ''));
  });
  c.on('Page.javascriptDialogOpening', async (p) => {
    log('  · ⚠ diálogo JS:', p.message);
    try { await c.send('Page.handleJavaScriptDialog', { accept: true }); } catch {}
  });

  async function snapshot() {
    return c.eval(`(() => ({
      url: location.href, title: document.title,
      body: (document.body?.innerText || '').slice(0, 500),
      hasForm: !!document.getElementById('loginForm'),
      hasLogout: !!document.querySelector('a[href*="logout.do"]'),
      usuario: document.getElementById('usuario')?.value ?? null,
      pwLen: document.getElementById('password')?.value.length ?? null,
      token: document.getElementById('turnstileToken')?.value || '',
      tsWidget: (document.querySelector('.cf-turnstile')?.innerText || '').replace(/\\s+/g,' ').trim(),
      captchaOblig: window.IS_CAPTCHA_OBLIGATORIO === true
    }))()`);
  }

  async function goto(url) {
    await c.eval(`location.href = ${JSON.stringify(url)}`);
    await sleep(2500);
  }

  /** espera a que se resuelva el interstitial A, aparezca el form o una sesión ya abierta */
  async function waitForForm(maxMs = 90000) {
    const t0 = Date.now();
    let sawCF = false;
    while (Date.now() - t0 < maxMs) {
      const s = await snapshot().catch(() => null);
      if (s?.hasLogout || /YA SE ENCUENTRA LOGUEADO/i.test(s?.body || '')) return { ok: true, logged: true, sawCF };
      if (s?.hasForm) return { ok: true, sawCF };
      if (s && isCFInterstitial(s.title, s.body)) {
        if (!sawCF) { sawCF = true; log('  · Cloudflare A (interstitial al cargar): esperando resolución...'); }
      }
      await sleep(1000);
    }
    return { ok: false, sawCF };
  }

  async function fill(sel, text) {
    const box = await c.eval(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null;
      e.readOnly = false; e.dataset.__ours = '1';
      e.scrollIntoView({block:'center'}); e.focus(); e.select(); const r=e.getBoundingClientRect();
      return {x:r.x+r.width/2, y:r.y+r.height/2, w:r.width}; })()`);
    if (!box || !box.w) throw new Error('campo no visible: ' + sel);
    for (const type of ['mousePressed', 'mouseReleased'])
      await c.send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
    await c.send('Input.insertText', { text });
  }

  async function clickEl(expr) {
    const box = await c.eval(`(() => { const b=${expr}; if(!b) return null;
      b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect();
      return {x:r.x+r.width/2, y:r.y+r.height/2, w:r.width}; })()`);
    if (!box || !box.w) return false;
    for (const type of ['mousePressed', 'mouseReleased'])
      await c.send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
    return true;
  }

  /** Fuerza token Turnstile nuevo (etapa B). Devuelve el token o null. */
  async function freshTurnstile(maxMs = 75000) {
    const before = await c.eval(`document.getElementById('turnstileToken')?.value || ''`);
    await c.eval(`window.__tokBefore = document.getElementById('turnstileToken').value; try{ turnstile.reset(); }catch(e){}`);
    const t0 = Date.now();
    let clicked = false;
    while (Date.now() - t0 < maxMs) {
      const s = await snapshot().catch(() => null);
      if (!s) { await sleep(800); continue; }
      const tok = s.token || '';
      if (tok && tok !== before && tok.length > 80) return tok;
      if (!clicked && Date.now() - t0 > 15000) {
        const box = await c.eval(`(() => { const w=document.querySelector('.cf-turnstile'); if(!w) return null;
          const r=w.getBoundingClientRect(); return {x:r.x+30, y:r.y+r.height/2, w:r.width}; })()`);
        if (box?.w) {
          for (const type of ['mousePressed','mouseReleased'])
            await c.send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
          clicked = true;
          log('  · Turnstile pidió interacción: click en el checkbox');
        }
      }
      await sleep(700);
    }
    return null;
  }

  async function saveCookies() {
    try {
      fs.mkdirSync(`salida/${user}`, { recursive: true });
      const { cookies } = await c.send('Network.getCookies', { urls: ['https://online.fedpat.com.ar/'] });
      fs.writeFileSync(`salida/${user}/session.json`, JSON.stringify({ savedAt: new Date().toISOString(), user, cookies }, null, 2));
    } catch {}
  }

  async function screenshot(name) {
    try {
      fs.mkdirSync('salida/_errores', { recursive: true });
      const { data } = await c.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(shot(name), Buffer.from(data, 'base64'));
    } catch {}
  }

  async function run(attempt = 1) {
    log(`→ login ${user} (intento ${attempt})`);

    // 0) si la pestaña ya está en una pantalla logueada, no recargar (evita 429)
    if (attempt === 1) {
      const tabs = await list().catch(() => []);
      const cur = tabs.find((t) => t.id === c.target?.id);
      if (cur && /online\.fedpat/.test(cur.url) && /loadProductor|homeWin32|homePage|loadPoliza|cuotasImpagas|listadoClientes|newCotizacion/.test(cur.url)) {
        const s0 = await snapshot().catch(() => null);
        if (s0?.hasLogout) {
          const prod0 = (s0.body.match(/Prod\.?:?\s*(\d+)/) || [])[1];
          if (!prod0 || prod0 === user) {
            log('  · sesión ya activa, sin recargar');
            await saveCookies();
            return { ok: true, reused: true, url: s0.url, user: prod0 || null };
          }
        }
      }
    }

    // 1) cargar el login (y manejar 429 / interstitial)
    await goto(HOME);
    await sleep(2000);
    let wf = await waitForForm();
    if (!wf.ok && last429 && Date.now() - last429 < 180000) {
      log('  · rate limit activo: espero 30s y recargo');
      await sleep(30000);
      await goto(HOME);
      wf = await waitForForm();
    }
    if (!wf.ok) { await screenshot('sin_form.png'); return { ok: false, reason: 'no apareció el formulario' }; }

    let s = await snapshot();
    if (isLoggedIn(s.url, s.hasLogout) || /YA SE ENCUENTRA LOGUEADO/i.test(s.body)) {
      const prod = (s.body.match(/Prod\.?:?\s*(\d+)/) || [])[1];
      if (prod && prod !== user && attempt < 3) {
        log(`  · sesión activa de OTRO productor (${prod}): cerrando para entrar como ${user}`);
        await c.eval(`location.href='/self/logout.do'`);
        await sleep(3000);
        return run(attempt + 1);
      }
      log('  · ya había sesión activa del productor correcto');
      await saveCookies();
      return { ok: true, reused: true, url: s.url, user: prod };
    }

    // Neutralizar autofill del gestor de contraseñas + impedir submit automático
    await c.eval(`(() => {
      document.querySelectorAll('input[type=password]').forEach(i => i.setAttribute('autocomplete','off'));
      document.getElementById('loginForm').addEventListener('submit', () => { window.__submitAt = Date.now(); }, true);
      return true;
    })()`);

    // 1) usuario
    await fill('#usuario', user);
    await c.eval(`document.getElementById('password').focus()`); // onblur -> valida si el usuario exige captcha imagen
    await sleep(2500);
    s = await snapshot();
    if (s.usuario !== user) {
      log(`  · autofill pisó el usuario (${s.usuario}), re-escribiendo`);
      await fill('#usuario', user);
    }
    if (s.captchaOblig || await c.eval(`window.IS_CAPTCHA_OBLIGATORIO === true`)) {
      log('  ⚠ el sitio pide captcha de imagen para este usuario');
      await screenshot('captcha_imagen.png');
      return { ok: false, reason: 'captcha-imagen' };
    }

    // 2) clave (verificar antes de enviar)
    await fill('#password', pass);
    const check = await c.eval(`(() => ({ u: document.getElementById('usuario').value, p: document.getElementById('password').value }))()`);
    if (check.u !== user || check.p !== pass) {
      log(`  · credenciales pisadas por autofill (u=${check.u}, pLen=${check.p.length}); re-escribiendo`);
      await fill('#usuario', user);
      await fill('#password', pass);
    }
    const finalCheck = await c.eval(`(() => ({ u: document.getElementById('usuario').value, p: document.getElementById('password').value }))()`);
    if (finalCheck.u !== user || finalCheck.p !== pass) {
      await screenshot('autofill.png');
      return { ok: false, reason: 'autofill-pisa-credenciales', got: finalCheck.u };
    }

    // 3) Turnstile B: token nuevo sí o sí
    const token = await freshTurnstile();
    if (!token) {
      log('  ❌ no se pudo obtener token Turnstile');
      await screenshot('turnstile.png');
      return { ok: false, reason: 'sin-turnstile' };
    }
    log(`  · Turnstile OK (token nuevo, ${token.length} chars)`);

    // 4) enviar: click real y, si no dispara, la función del propio sitio
    const t0 = Date.now();
    await c.eval(`(() => {
      window.__submitted = 0;
      const orig = HTMLFormElement.prototype.submit;
      HTMLFormElement.prototype.submit = function(){ window.__submitted = Date.now(); return orig.apply(this, arguments); };
      return true;
    })()`);
    const clicked = await clickEl(`document.querySelector('input[name="Aceptar"]')`);
    log('  · click Ingresar:', clicked ? 'ok' : 'no visible');

    for (let i = 0; i < 3; i++) {
      await sleep(500);
      const r = await c.eval(`({ s: window.__submitted || 0, form: !!document.getElementById('loginForm') })`).catch(() => null);
      if (!r || !r.form || r.s) break;
    }
    const marca = await c.eval(`({ s: window.__submitted || 0, form: !!document.getElementById('loginForm') })`).catch(() => null);
    if (marca && marca.form && !marca.s) {
      log('  · el click no disparó el submit -> ingresar() directo');
      await c.eval(`try{ ingresar(); }catch(e){}`);
    }
    log('  · POST enviado, esperando resultado...');

    // 5) esperar resultado (contempla interstitial A posterior al POST)
    let sawCF = false;
    let backSince = 0;
    while (Date.now() - t0 < 120000) {
      await sleep(1200);
      const st = await snapshot().catch(() => null);
      if (!st) continue;
      if (isLoggedIn(st.url, st.hasLogout)) {
        const prod = (st.body.match(/Prod\.?:?\s*(\d+)/) || [])[1];
        if (prod && prod !== user && attempt < 3) {
          log(`  ⚠ quedó logueado el productor ${prod} (autofill del gestor de claves), reintentando`);
          await c.eval(`location.href='/self/logout.do'`);
          await sleep(3000);
          return run(attempt + 1);
        }
        log('  ✅ sesión iniciada:', st.url);
        await saveCookies();
        return { ok: true, url: st.url, user: prod || null };
      }
      if (isCFInterstitial(st.title, st.body)) {
        if (!sawCF) { sawCF = true; log('  · Cloudflare A (interstitial post-POST): esperando que se resuelva solo...'); }
        backSince = 0;
        continue;
      }
      if (st.hasForm) {
        const err = (st.body.match(/Usuario o clave incorrectos|clave incorrecta|bloquead[ao]|ERROR EN LA SOLICITUD/i) || [])[0];
        if (err) {
          log('  ❌ el sitio rechazó el login:', err);
          await screenshot('login.png');
          return { ok: false, reason: err, url: st.url };
        }
        if (!backSince) backSince = Date.now();
        if (Date.now() - backSince > 6000) {
          log('  ❌ el POST volvió al formulario sin sesión');
          await screenshot('vuelta_form.png');
          return { ok: false, reason: 'post-rechazado', url: st.url };
        }
      }
    }
    await screenshot('timeout.png');
    return { ok: false, reason: 'timeout' };
  }

  const result = await run();
  await c.close();
  return result;
}

// ---------------- CLI ----------------
const isMain = process.argv[1] && process.argv[1].toLowerCase().endsWith('login.mjs');
if (isMain) {
  const user = process.argv[2] || primaryUser;
  const pass = process.argv[3] || (user === primaryUser ? 'Cuervo13' : null);
  if (!pass) {
    console.error('falta la clave: node login.mjs <usuario> <clave>');
    process.exit(1);
  }
  const tab = await ensureTab(user, { adoptDefault: user === primaryUser });
  const r = await loginAccount({ user, pass, tabFile: tabFileFor(user) });
  console.log(JSON.stringify(r));
  process.exit(r.ok ? 0 : 2);
}
