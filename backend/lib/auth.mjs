/**
 * Obtención/renovación de sesiones.
 *
 * El login de SELF está protegido por Cloudflare Turnstile: no se puede hacer
 * un POST de login "a ciegas" por HTTP. La estrategia es:
 *
 *  1. sessions/<user>.json  (sesión HTTP guardada, se valida con un GET)
 *  2. si no sirve: UNA pestaña aislada temporal en el navegador ya abierto,
 *     login normal, exportar cookies y cerrar la pestaña.
 *  3. toda la extracción posterior es HTTP puro, sin navegador.
 *
 * Una sola pestaña por cuenta, secuencial, y se cierra al terminar: no quedan
 * instancias ni contextos consumiendo RAM.
 */
import fs from 'node:fs';
import { HttpSession, HttpError, DEFAULT_UA, SESS_DIR, HOME } from './session.mjs';
import { loginHttp } from './fedpat.mjs';

export const CF_NAMES = ['cf_clearance', '__cflb', 'nx_cookie', '__cf_ob'];

export function loadCfSeed() {
  const f = `${SESS_DIR}/cf.json`;
  if (!fs.existsSync(f)) return null;
  try {
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    let cookies = j.cookies || {};
    if (Array.isArray(cookies)) {
      cookies = Object.fromEntries(cookies.filter((c) => CF_NAMES.includes(c.name)).map((c) => [c.name, c.value]));
    } else {
      cookies = Object.fromEntries(Object.entries(cookies).filter(([k]) => CF_NAMES.includes(k)));
    }
    if (!cookies.cf_clearance) return null;
    return { ua: j.ua || DEFAULT_UA, cookies };
  } catch {
    return null;
  }
}

export function saveCfSeed({ ua, cookies }) {
  fs.mkdirSync(SESS_DIR, { recursive: true });
  const only = Object.fromEntries(Object.entries(cookies).filter(([k]) => CF_NAMES.includes(k)));
  fs.writeFileSync(`${SESS_DIR}/cf.json`, JSON.stringify({ ua: ua || DEFAULT_UA, savedAt: new Date().toISOString(), cookies: only }, null, 2));
  return only;
}

const fedpatCookies = (cookies) => (cookies || []).filter((k) => /fedpat/.test(k.domain));

/**
 * Crea un contexto aislado nuevo, loguea la cuenta con el navegador y exporta
 * las cookies de ESE contexto. Cierra la pestaña y destruye el contexto.
 */
export async function seedFromBrowser(user, pass, { limiter, log = console.log } = {}) {
  const { browser, connectById, list } = await import('../../cdp.mjs');
  const { loginAccount } = await import('../../login.mjs');

  log(`[${user}] login con navegador (pestaña temporal aislada)...`);
  const b = await browser();
  let contextId = null;
  let targetId = null;
  let cookiesAntes = new Set();
  try {
    ({ browserContextId: contextId } = await b.send('Target.createBrowserContext', { disposeOnDetach: false }));
    ({ targetId } = await b.send('Target.createTarget', { url: HOME, browserContextId: contextId }));
  } finally {
    await b.close();
  }

  // esperar la pestaña y dejar registro de las cookies previas (para distinguir el JSESSIONID nuevo)
  let tab = null;
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 500));
    tab = (await list()).find((x) => x.id === targetId);
    if (tab) break;
  }
  if (!tab) throw new Error(`no se pudo crear la pestaña de ${user}`);

  let ua = DEFAULT_UA;
  try {
    const c0 = await connectById(tab.id);
    ua = (await c0.eval('navigator.userAgent')) || DEFAULT_UA;
    const antes = await c0.send('Network.getAllCookies');
    cookiesAntes = new Set((antes.cookies || []).filter((k) => k.name === 'JSESSIONID').map((k) => k.value));
    await c0.close();
  } catch {}

  const tabFile = `tabs/_seed_${user}.json`;
  fs.mkdirSync('tabs', { recursive: true });
  fs.writeFileSync(tabFile, JSON.stringify({ id: tab.id, ws: tab.webSocketDebuggerUrl, contextId }, null, 2));

  let result;
  try {
    result = await loginAccount({ user, pass, tabFile, log: (m) => log('  ' + m) });
    if (!result.ok) throw new Error(`login falló: ${result.reason}`);

    const c = await connectById(tab.id);

    // 1) cookies del contexto exacto (si el backend lo soporta)
    let fed = [];
    try {
      const { cookies } = await c.send('Storage.getCookies', { browserContextId: contextId });
      fed = fedpatCookies(cookies);
    } catch {}
    // 2) fallback: todas las cookies, quedarse con el JSESSIONID nuevo
    if (!fed.some((k) => k.name === 'JSESSIONID')) {
      const all = await c.send('Network.getAllCookies');
      const todas = fedpatCookies(all.cookies);
      const js = todas.filter((k) => k.name === 'JSESSIONID');
      const nueva = js.find((k) => !cookiesAntes.has(k.value)) || js[js.length - 1];
      const otras = todas.filter((k) => k.name !== 'JSESSIONID');
      fed = nueva ? [...otras, nueva] : otras;
    }
    await c.close();

    const map = Object.fromEntries(fed.map((k) => [k.name, k.value]));
    if (!map.JSESSIONID) throw new Error('no se pudo exportar JSESSIONID');

    const s = new HttpSession({ user, cookies: map, ua, limiter, log });
    s.save({ nombre: result.user || '' });
    log(`[${user}] sesión HTTP lista (${Object.keys(map).length} cookies)`);
    return s;
  } finally {
    try {
      const bb = await browser();
      try { await bb.send('Target.closeTarget', { targetId }); } catch {}
      if (contextId) { try { await bb.send('Target.disposeBrowserContext', { browserContextId: contextId }); } catch {} }
      await bb.close();
    } catch {}
    try { fs.unlinkSync(tabFile); } catch {}
  }
}

/**
 * Devuelve una sesión HTTP válida para la cuenta.
 * @param {string} user
 * @param {{pass?:string, limiter?:object, allowBrowser?:boolean, log?:Function}} opts
 */
export async function ensureSession(user, { pass, limiter, allowBrowser = true, log = console.log } = {}) {
  // 1) sesión guardada
  const cached = HttpSession.load(user, { limiter, log });
  if (cached) {
    try {
      const st = await cached.check();
      if (st.logged && (!st.prod || String(st.prod) === String(user))) {
        log(`[${user}] sesión HTTP reutilizada (${st.prod || '?'})`);
        return cached;
      }
      log(`[${user}] sesión guardada vencida${st.prod ? ` (prod ${st.prod})` : ''}`);
    } catch (e) {
      log(`[${user}] no se pudo validar la sesión guardada: ${e.message}`);
    }
  }

  // 2) intento de login HTTP puro (experimental: Cloudflare hoy exige Turnstile)
  //    Se habilita con FED_HTTP_LOGIN=1 para no gastar requests al pedo.
  const cf = loadCfSeed();
  if (cf && process.env.FED_HTTP_LOGIN === '1') {
    const s = new HttpSession({ user, cookies: cf.cookies, ua: cf.ua, limiter, log });
    try {
      const r = await loginHttp(s, user, pass);
      if (r.ok) {
        s.save({ nombre: '' });
        log(`[${user}] login HTTP OK (productor ${r.prod || user})`);
        return s;
      }
      log(`[${user}] login HTTP rechazado: ${r.reason}`);
    } catch (e) {
      if (e instanceof HttpError && e.challenge) {
        log(`[${user}] Cloudflare exige Turnstile -> login con navegador`);
      } else {
        log(`[${user}] login HTTP falló: ${e.message}`);
      }
    }
  }

  // 3) login con una pestaña temporal del navegador ya abierto
  if (!allowBrowser) throw new Error(`no se pudo iniciar sesión de ${user} sin navegador`);
  if (!pass) throw new Error(`falta la clave de ${user} para sembrar la sesión`);
  return seedFromBrowser(user, pass, { limiter, log });
}
