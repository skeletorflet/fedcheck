/**
 * Pipeline multi-cuenta 100% HTTP (sin instancias de navegador).
 *
 *   node backend/run.mjs                        todas las cuentas de accounts.json
 *   node backend/run.mjs 7224                   solo una
 *   node backend/run.mjs 7224 26620 29494       las que quieras
 *   node backend/run.mjs 01/09/26 30/09/26      rango manual
 *   node backend/run.mjs --concurrency 4
 *   node backend/run.mjs --no-browser           no permitir el fallback de login con navegador
 *   node backend/run.mjs --skip-enrich          saltar enriquecimiento (contactos/detalle cuota)
 *   node backend/run.mjs --skip-excel           saltar generación de Excel
 *   node backend/run.mjs --skip-cuponeras       saltar descarga de cuponeras PDF
 *
 * Salidas:
 *   salida/<user>/deudas.xlsx
 *   salida/<user>/cuponeras/<Asegurado>/<Asegurado>_cuponera_YYYYMMDD.pdf
 *   deudas_todas.xlsx
 *
 * Login: reutiliza sessions/<user>.json; si no sirve, prueba login HTTP con
 * sessions/cf.json; si Cloudflare exige Turnstile, hace UN login con el navegador
 * ya abierto y sigue por HTTP (a menos que se use --no-browser).
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { loadConfig, resolveUsers } from '../accounts.mjs';

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 ? argv[i + 1] : def;
};
const flag = (name) => argv.includes('--' + name);
const fechas = argv.filter((a) => /^\d{2}\/\d{2}\/\d{2,4}$/.test(a));
const desde = opt('desde', fechas[0] || null);
const hasta = opt('hasta', fechas[1] || null);
const concurrency = opt('concurrency', '3');
const noBrowser = flag('no-browser');
const skipEnrich = flag('skip-enrich');
const skipExcel = flag('skip-excel');
const skipCuponeras = flag('skip-cuponeras');

const py = process.platform === 'win32' ? 'python' : 'python3';
const paso = (t) => console.log(`\n=== ${t} ===`);
const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const users = resolveUsers(argv);
const { primary } = loadConfig();
console.log(`cuentas: ${users.map((u) => u.user).join(', ')} | backend HTTP puro${noBrowser ? ' (sin fallback de navegador)' : ''}`);
if (desde) console.log(`rango: ${desde} -> ${hasta || desde}`);

fs.mkdirSync('salida', { recursive: true });

const extra = [];
if (desde) extra.push('--desde', desde, '--hasta', hasta || desde);
if (noBrowser) extra.push('--no-browser');

// ---------- 1) scrape ----------
paso('1/4  Cuotas impagas (HTTP)');
const ok = [];
for (const acc of users) {
  const user = String(acc.user);
  try {
    run('node', ['backend/scrape.mjs', '--user', user, '--out', `salida/${user}`, ...extra]);
    ok.push(acc);
  } catch (e) {
    console.log(`[${user}] ❌ ${e.message}`);
  }
  await sleep(2000);
}
if (!ok.length) { console.log('\n❌ ninguna cuenta pudo extraerse'); process.exit(1); }

// ---------- 2) enriquecer ----------
if (!skipEnrich) {
  paso('2/4  Contactos y detalle de cuota (HTTP)');
  for (const acc of ok) {
    const user = String(acc.user);
    try {
      run('node', ['backend/enrich.mjs', '--user', user, '--out', `salida/${user}`,
        '--concurrency', concurrency, ...(noBrowser ? ['--no-browser'] : [])]);
    } catch (e) {
      console.log(`[${user}] ❌ enriquecido: ${e.message}`);
    }
  }
}

// ---------- 3) Cuponeras (PDF por asegurado) ----------
if (!skipCuponeras) {
  paso('3/5  Cuponeras PDF por asegurado');
  for (const acc of ok) {
    const user = String(acc.user);
    const full = `salida/${user}/deudas_full.json`;
    if (!fs.existsSync(full)) { console.log(`[${user}] sin deudas_full.json, salto cuponeras`); continue; }
    try {
      run('node', ['backend/cuponeras.mjs', '--user', user, '--out', `salida/${user}`, '--concurrency', '1', ...(noBrowser ? ['--no-browser'] : [])]);
    } catch (e) {
      console.log(`[${user}] ❌ cuponeras: ${e.message}`);
    }
  }
}

if (skipExcel) {
  console.log('\n(skip-excel) listo');
  process.exit(0);
}

// ---------- 4) Excel por cuenta ----------
paso('4/5  Excel por cuenta');
for (const acc of ok) {
  const user = String(acc.user);
  const full = `salida/${user}/deudas_full.json`;
  if (!fs.existsSync(full)) { console.log(`[${user}] sin deudas_full.json, salto Excel`); continue; }
  run(py, ['build_xlsx.py', '--in', full, '--out', `salida/${user}/deudas.xlsx`, '--meta', `salida/${user}/meta.json`]);
}

// ---------- 5) consolidado ----------
paso('5/5  Consolidado');
const files = ok.map((a) => `salida/${a.user}/deudas_full.json`).filter((f) => fs.existsSync(f));
if (files.length > 1) {
  run(py, ['build_all.py', '--out', 'deudas_todas.xlsx', ...files]);
} else if (files.length === 1) {
  const user = ok[0].user;
  fs.copyFileSync(`salida/${user}/deudas.xlsx`, 'deudas_todas.xlsx');
  console.log(`una sola cuenta: deudas_todas.xlsx = salida/${user}/deudas.xlsx`);
}

console.log('\n================ RESUMEN ================');
for (const acc of users) {
  const user = String(acc.user);
  const metaPath = `salida/${user}/meta.json`;
  if (fs.existsSync(metaPath) && ok.some((a) => String(a.user) === user)) {
    const m = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    console.log(`✅ ${user.padEnd(6)} ${String(m.nombre || '').slice(0, 28).padEnd(28)} ${String(m.clientes).padStart(3)} clientes | ${String(m.cuotas).padStart(3)} cuotas | $ ${m.total.toLocaleString('es-AR')}`);
  } else {
    console.log(`❌ ${user.padEnd(6)} sin datos`);
  }
}
console.log('\nArchivos:');
for (const acc of ok) console.log(`  salida/${acc.user}/deudas.xlsx`);
if (ok.length > 1) console.log('  deudas_todas.xlsx  (consolidado)');
