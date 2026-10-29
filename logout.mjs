/**
 * Cierra la sesión de SELF en una cuenta (o en todas).
 *
 *   node logout.mjs             -> cuenta principal (7224)
 *   node logout.mjs 26620       -> esa cuenta
 *   node logout.mjs --all       -> todas las cuentas con pestaña abierta
 */
import { connectById, list } from './cdp.mjs';
import { tabFileFor, readTab, primaryUser } from './tabs.mjs';
import fs from 'node:fs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const arg = process.argv[2];

let users;
if (arg === '--all') {
  users = fs.existsSync('tabs')
    ? fs.readdirSync('tabs').filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''))
    : [primaryUser];
} else {
  users = [arg || primaryUser];
}

const tabs = await list();
for (const user of users) {
  const saved = readTab(user);
  if (!saved) { console.log(`${user}: no hay pestaña registrada`); continue; }
  const t = tabs.find((x) => x.id === saved.id);
  if (!t) { console.log(`${user}: pestaña cerrada`); continue; }
  const c = await connectById(t.id);
  await c.eval(`location.href='/self/logout.do'`);
  await sleep(4500);
  const st = await c.eval(`({ url: location.href, form: !!document.getElementById('loginForm'), logged: !!document.querySelector('a[href*="logout.do"]') })`).catch(() => null);
  console.log(`${user}:`, JSON.stringify(st));
  await c.close();
}
