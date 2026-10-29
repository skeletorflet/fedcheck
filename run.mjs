/**
 * Pipeline multi-cuenta:
 *   pestaña aislada por cuenta -> login -> cuotas impagas -> contactos -> Excel
 *
 * Uso:
 *   node run.mjs                        todas las cuentas de accounts.json
 *   node run.mjs 7224                   solo esa cuenta
 *   node run.mjs 7224 26620 29494       las que quieras
 *   node run.mjs 01/09/26 30/09/26      todas, con rango de fechas
 *   node run.mjs 7224 --desde 01/09/26 --hasta 30/09/26
 *
 * Salidas:
 *   salida/<user>/deudas.xlsx   (detalle + por cliente + resumen de esa cuenta)
 *   deudas_todas.xlsx           (consolidado de todas las cuentas)
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { loadConfig, resolveUsers } from './accounts.mjs';
import { ensureTab, primaryUser, tabFileFor } from './tabs.mjs';
import { loginAccount } from './login.mjs';

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 ? argv[i + 1] : def;
};
const fechas = argv.filter((a) => /^\d{2}\/\d{2}\/\d{2,4}$/.test(a));
const desde = opt('desde', fechas[0]);
const hasta = opt('hasta', fechas[1]);

const py = process.platform === 'win32' ? 'python' : 'python3';
const paso = (t) => console.log(`\n=== ${t} ===`);
const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const users = resolveUsers(argv);
const { primary } = loadConfig();
console.log(`cuentas: ${users.map((u) => u.user).join(', ')}`);
if (desde) console.log(`rango: ${desde} -> ${hasta || desde}`);

fs.mkdirSync('salida', { recursive: true });

// ---------- 1) pestañas + login ----------
paso('1/5  Sesiones');
const sesiones = [];
for (const acc of users) {
  const user = String(acc.user);
  process.stdout.write(`\n[${user}] `);
  try {
    const tab = await ensureTab(user, { adoptDefault: user === primary });
    const esAislada = !!tab.contextId;
    console.log(esAislada ? 'pestaña aislada lista' : 'usando pestaña del perfil normal');
    const r = await loginAccount({ user, pass: acc.pass, tabFile: tabFileFor(user) });
    sesiones.push({ user, nombre: acc.nombre || '', ok: r.ok, reason: r.reason || '' });
    console.log(`[${user}]`, r.ok ? 'OK' : `ERROR: ${r.reason}`);
  } catch (e) {
    sesiones.push({ user, nombre: acc.nombre || '', ok: false, reason: e.message });
    console.log(`[${user}] ERROR: ${e.message}`);
  }
  await sleep(8000); // pausa entre logins para no gatillar 429 de Cloudflare
}

const activas = sesiones.filter((s) => s.ok);
if (!activas.length) {
  console.log('\n❌ ninguna cuenta pudo iniciar sesión');
  process.exit(1);
}

// ---------- 2) scrape ----------
paso('2/5  Cuotas impagas');
const scraped = [];
for (const s of activas) {
  try {
    const a = ['scrape.mjs', '--user', s.user, '--out', `salida/${s.user}`];
    if (desde) a.push(desde, hasta || desde);
    run('node', a);
    const meta = JSON.parse(fs.readFileSync(`salida/${s.user}/meta.json`, 'utf8'));
    s.nombre = meta.nombre || s.nombre;
    scraped.push(s);
  } catch (e) {
    console.log(`[${s.user}] fallo el scrape: ${e.message}`);
  }
  await sleep(3000);
}
if (!scraped.length) { console.log('\n❌ no se pudo extraer ninguna cuenta'); process.exit(1); }

// ---------- 3) contactos ----------
paso('3/5  Teléfonos / mails / detalle');
const enriquecidas = [];
for (const s of scraped) {
  try {
    run('node', ['enrich.mjs', '--user', s.user, '--out', `salida/${s.user}`]);
    enriquecidas.push(s);
  } catch (e) {
    console.log(`[${s.user}] fallo el enriquecido: ${e.message}`);
  }
}

// ---------- 4) Excel por cuenta ----------
paso('4/5  Excel por cuenta');
for (const s of enriquecidas) {
  run(py, ['build_xlsx.py', '--in', `salida/${s.user}/deudas_full.json`,
    '--out', `salida/${s.user}/deudas.xlsx`, '--meta', `salida/${s.user}/meta.json`]);
}

// ---------- 5) consolidado ----------
paso('5/5  Consolidado');
if (enriquecidas.length > 1) {
  run(py, ['build_all.py', '--out', 'deudas_todas.xlsx', ...enriquecidas.map((s) => `salida/${s.user}/deudas_full.json`)]);
} else {
  const s = enriquecidas[0];
  fs.copyFileSync(`salida/${s.user}/deudas.xlsx`, 'deudas_todas.xlsx');
  console.log(`una sola cuenta: deudas_todas.xlsx = salida/${s.user}/deudas.xlsx`);
}

// ---------- resumen ----------
console.log('\n================ RESUMEN ================');
for (const s of sesiones) {
  let linea = `${s.ok ? '✅' : '❌'} ${s.user.padEnd(6)} ${(s.nombre || '').slice(0, 28).padEnd(28)}`;
  const metaPath = `salida/${s.user}/meta.json`;
  if (s.ok && fs.existsSync(metaPath)) {
    const m = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    linea += ` ${String(m.clientes).padStart(3)} clientes | ${String(m.cuotas).padStart(3)} cuotas | $ ${m.total.toLocaleString('es-AR')}`;
  } else if (!s.ok) {
    linea += ` ${s.reason}`;
  }
  console.log(linea);
}
console.log('\nArchivos:');
for (const s of enriquecidas) console.log(`  salida/${s.user}/deudas.xlsx`);
if (enriquecidas.length > 1) console.log('  deudas_todas.xlsx  (consolidado)');
