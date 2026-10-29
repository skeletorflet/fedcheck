/**
 * Guarda sessions/cf.json con las cookies de Cloudflare (cf_clearance, __cflb, nx_cookie, __cf_ob)
 * y el User-Agent del navegador. Se usa para el login HTTP puro.
 *
 *   node backend/seed_cf.mjs
 *
 * Usa una pestaña SELF ya abierta; si no hay, abre una temporal y la cierra.
 * No crea instancias nuevas de navegador: se conecta al Chrome/Thorium de :9222.
 */
import fs from 'node:fs';
import { CDP, browser, list } from '../cdp.mjs';
import { saveCfSeed } from './lib/auth.mjs';

const BASE = 'https://online.fedpat.com.ar';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CF = ['cf_clearance', '__cflb', 'nx_cookie', '__cf_ob'];

async function main() {
  const tabs = await list().catch(() => []);
  let tab = tabs.find((t) => t.type === 'page' && t.url.includes('online.fedpat.com.ar'));
  let creada = null;

  if (!tab) {
    console.log('no hay pestaña SELF abierta: abro una temporal...');
    const b = await browser();
    try {
      const { targetId } = await b.send('Target.createTarget', { url: BASE + '/self/homeWin32.do' });
      creada = targetId;
    } finally {
      await b.close();
    }
    for (let i = 0; i < 60; i++) {
      await sleep(1000);
      tab = (await list()).find((t) => t.id === creada);
      if (tab && tab.url.includes('online.fedpat.com.ar')) break;
    }
    if (!tab) throw new Error('no se pudo abrir la pestaña temporal');
  }

  const c = new CDP(tab.webSocketDebuggerUrl);
  await c.connect();
  await c.send('Page.enable');

  // esperar a que se resuelva el interstitial de Cloudflare
  let ua = '';
  for (let i = 0; i < 60; i++) {
    const st = await c.eval(`({ url: location.href, title: document.title, body: (document.body?.innerText||'').slice(0,300) })`).catch(() => null);
    if (st && !/Un momento|Verificación de seguridad/i.test(`${st.title} ${st.body}`)) {
      ua = await c.eval('navigator.userAgent');
      break;
    }
    await sleep(1500);
  }
  if (!ua) ua = await c.eval('navigator.userAgent');

  const { cookies } = await c.send('Network.getAllCookies');
  const fed = cookies.filter((k) => /fedpat/.test(k.domain) && CF.includes(k.name));
  const map = Object.fromEntries(fed.map((k) => [k.name, k.value]));

  if (!map.cf_clearance) {
    console.log('⚠ no hay cf_clearance. Abrí el sitio en el navegador, resolvé la verificación y volvé a ejecutar.');
    await c.close();
    process.exit(2);
  }

  saveCfSeed({ ua, cookies: map });
  console.log('✅ sessions/cf.json guardado');
  console.log('   UA:', ua);
  console.log('   cookies:', Object.keys(map).join(', '));

  await c.close();
  if (creada) {
    await fetch(`http://127.0.0.1:9222/json/close/${creada}`).catch(() => {});
    console.log('   pestaña temporal cerrada');
  }
}

await main();
