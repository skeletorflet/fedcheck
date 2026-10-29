/**
 * Exporta la sesión completa de una cuenta desde una pestaña viva del navegador
 * a sessions/<user>.json, para que el backend HTTP la use sin volver a loguearse.
 *
 *   node backend/export_session.mjs 7224
 *
 * Útil si iniciaste sesión a mano en el navegador. No crea pestañas.
 */
import fs from 'node:fs';
import { CDP, list } from '../cdp.mjs';
import { readTab } from '../tabs.mjs';
import { DEFAULT_UA, SESS_DIR } from './lib/session.mjs';

const user = process.argv[2] || '7224';
const tabs = await list().catch(() => []);

let tab = null;
const saved = readTab(user);
if (saved) tab = tabs.find((t) => t.id === saved.id) || null;

if (!tab) {
  // buscar por productor en el cuerpo de la página
  for (const t of tabs.filter((x) => x.type === 'page' && x.url.includes('online.fedpat.com.ar'))) {
    const c = new CDP(t.webSocketDebuggerUrl);
    await c.connect();
    const prod = await c.eval(`(document.body.innerText.match(/Prod\\.?:?\\s*(\\d+)/) || [])[1] || null`).catch(() => null);
    await c.close();
    if (String(prod) === String(user)) { tab = t; break; }
  }
}

if (!tab) {
  console.log(`no hay pestaña viva de ${user}. Abrí sesión en el navegador y reintentá.`);
  process.exit(2);
}

const c = new CDP(tab.webSocketDebuggerUrl);
await c.connect();
const ua = (await c.eval('navigator.userAgent')) || DEFAULT_UA;
const { cookies } = await c.send('Network.getAllCookies');
const fed = cookies.filter((k) => /fedpat/.test(k.domain));
await c.close();

const map = Object.fromEntries(fed.map((k) => [k.name, k.value]));
if (!map.JSESSIONID) {
  console.log('la pestaña no tiene JSESSIONID de SELF (¿sesión vencida?)');
  process.exit(2);
}

fs.mkdirSync(SESS_DIR, { recursive: true });
fs.writeFileSync(`${SESS_DIR}/${user}.json`, JSON.stringify({
  user, ua, savedAt: new Date().toISOString(), cookies: map,
}, null, 2));

console.log(`✅ sessions/${user}.json guardado (${Object.keys(map).length} cookies)`);
console.log('   ', Object.keys(map).join(', '));
