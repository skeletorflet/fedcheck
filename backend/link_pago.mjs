/**
 * Genera links de pago de MercadoPago (Checkout Pro) para cuotas impagas.
 *
 *   node backend/link_pago.mjs --user 7224 --index 1
 *   node backend/link_pago.mjs --user 7224 --cuota 4-35149500-0-oct_06_2026
 *   node backend/link_pago.mjs --user 7224 --mat 6998123
 *   node backend/link_pago.mjs --user 7224 --all --dias 15
 *
 *   --dry-run            muestra el payload y el curl, sin llamar a MercadoPago
 *   --refresh            regenera links ya cacheados
 *   --sandbox            fuerza el link de prueba (sandbox_init_point)
 *   --notification-url   URL pública para el webhook de pagos
 *   --statement          texto que aparece en el resumen de la tarjeta (default FEDPAT)
 *   --quiet              imprime solo los links
 *
 * Credenciales: MP_ACCESS_TOKEN o mp.json { "access_token": "APP_USR-..." }.
 * Cache: salida/<user>/links_pago.json   |   CSV: salida/<user>/links_pago.csv
 */
import fs from 'node:fs';
import {
  crearPreferencia, buildPreference, loadMpCredentials, esTokenTest, MP_API, MpError,
} from './lib/mercadopago.mjs';

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 ? argv[i + 1] : def;
};
const flag = (name) => argv.includes('--' + name);

const user = String(opt('user', process.env.FED_USER || '7224'));
const outDir = opt('out', `salida/${user}`);
const cuotaId = opt('cuota', null);
const mat = opt('mat', null);
const poliza = opt('poliza', null);
const index = Number(opt('index', 0)) || 0;
const all = flag('all');
const limit = Number(opt('limit', 0)) || 0;
const dias = Number(opt('dias', 30));
const notificationUrl = opt('notification-url', process.env.MP_NOTIFICATION_URL || '');
const statement = opt('statement', process.env.MP_STATEMENT || 'FEDPAT');
const sandbox = flag('sandbox');
const dryRun = flag('dry-run');
const refresh = flag('refresh');
const quiet = flag('quiet');

const money = (n) => '$ ' + Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function cargarCuotas() {
  for (const f of [`${outDir}/deudas_full.json`, `${outDir}/deudas.json`]) {
    if (!fs.existsSync(f)) continue;
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    return { archivo: f, cuotas: j.cuotas || [] };
  }
  throw new Error(`no encontré ${outDir}/deudas_full.json (corré backend/scrape.mjs primero)`);
}

const { archivo, cuotas } = cargarCuotas();

let seleccion = [];
if (cuotaId) seleccion = cuotas.filter((q) => q.cajaId === cuotaId);
else if (mat) seleccion = cuotas.filter((q) => String(q.matricula) === String(mat));
else if (poliza) seleccion = cuotas.filter((q) => q.poliza === poliza || String(q.polizaNumero) === String(poliza));
else if (index) seleccion = [cuotas[index - 1]].filter(Boolean);
else if (all) seleccion = cuotas.slice();
else {
  console.log('Elegí qué cuota(s) generar:\n');
  console.log('  --index 1                 una cuota por posición del listado');
  console.log('  --cuota <cajaId>          una cuota exacta');
  console.log('  --mat <matricula>         todas las cuotas de un cliente');
  console.log('  --poliza <nro>            todas las cuotas de una póliza');
  console.log('  --all                     todas las cuotas de la cuenta\n');
  console.log(`cuotas disponibles: ${cuotas.length} (${archivo})\n`);
  cuotas.slice(0, 12).forEach((q, i) => {
    console.log(`  ${String(i + 1).padStart(3)}. ${q.cajaId.padEnd(36)} ${String(q.asegurado).slice(0, 28).padEnd(28)} ${money(q.saldo).padStart(14)}`);
  });
  if (cuotas.length > 12) console.log(`  ... y ${cuotas.length - 12} más`);
  process.exit(0);
}

if (!seleccion.length) {
  console.log('no hay cuotas que coincidan con el filtro');
  process.exit(1);
}
if (limit) seleccion = seleccion.slice(0, limit);

const cacheFile = `${outDir}/links_pago.json`;
const cache = fs.existsSync(cacheFile) && !refresh
  ? JSON.parse(fs.readFileSync(cacheFile, 'utf8'))
  : { generado: new Date().toISOString(), links: {} };
cache.links ||= {};

const cred = loadMpCredentials();
if (!dryRun && !cred) {
  console.log('❌ Falta el access token de MercadoPago.\n');
  console.log('  1) Entrá a https://www.mercadopago.com.ar/developers/panel/app');
  console.log('  2) Elegí tu aplicación -> Credenciales de producción');
  console.log('  3) Copiá el Access Token y guardalo en mp.json:\n');
  console.log('     { "access_token": "APP_USR-..." }\n');
  console.log('  (o definí la variable de entorno MP_ACCESS_TOKEN)\n');
  console.log('  Mientras tanto podés validar el payload con --dry-run.');
  process.exit(2);
}

if (!quiet) {
  console.log(`[${user}] ${seleccion.length} cuota(s) | ${archivo}`);
  if (cred) console.log(`token ${esTokenTest(cred.access_token) ? 'de PRUEBA (TEST-)' : 'de producción'} (${cred.source})`);
  if (dryRun) console.log('MODO DRY-RUN: no se llama a MercadoPago');
  console.log('');
}

const resultados = [];
let errores = 0;

for (let i = 0; i < seleccion.length; i++) {
  const q = seleccion[i];
  const previo = cache.links[q.cajaId];
  const opts = { dias, notificationUrl: notificationUrl || undefined, statement, sandbox };

  try {
    if (previo && !refresh) {
      resultados.push(previo);
      if (!quiet) console.log(`[${i + 1}/${seleccion.length}] ${q.cajaId}  (cache)  ${previo.link}`);
      else console.log(previo.link);
      continue;
    }

    if (dryRun) {
      const body = buildPreference(q, opts);
      const curl = `curl -X POST '${MP_API}/checkout/preferences' \\\n  -H 'Authorization: Bearer $MP_ACCESS_TOKEN' \\\n  -H 'Content-Type: application/json' \\\n  -d '${JSON.stringify(body)}'`;
      console.log(`[${i + 1}/${seleccion.length}] ${q.cajaId} | ${q.asegurado} | ${money(q.saldo)}`);
      console.log(JSON.stringify(body, null, 2));
      console.log('\n' + curl + '\n');
      continue;
    }

    const r = await crearPreferencia(q, opts);
    const item = {
      cajaId: q.cajaId,
      productor: String(q.productor || user),
      asegurado: q.asegurado,
      matricula: String(q.matricula),
      poliza: q.poliza,
      cuota: q.cuotaNumero ?? null,
      cuotaTotal: q.cuotaTotal ?? null,
      vencimiento: q.vencimientoISO || q.vencimiento,
      saldo: Number(q.saldo),
      preference_id: r.preference_id,
      link: r.link,
      init_point: r.init_point,
      sandbox_init_point: r.sandbox_init_point || null,
      expira: r.expira,
      creado: new Date().toISOString(),
    };
    cache.links[q.cajaId] = item;
    cache.generado = new Date().toISOString();
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
    resultados.push(item);

    if (quiet) console.log(r.link);
    else {
      console.log(`[${i + 1}/${seleccion.length}] ${q.cajaId} | ${q.asegurado} | ${money(q.saldo)}`);
      console.log(`  link:   ${r.link}`);
      console.log(`  pref:   ${r.preference_id}${r.expira ? `  |  expira: ${r.expira}` : ''}`);
    }
  } catch (e) {
    errores++;
    if (e instanceof MpError && e.faltanCredenciales) {
      console.log('❌ falta el access token de MercadoPago (mp.json o MP_ACCESS_TOKEN)');
      process.exit(2);
    }
    console.error(`[${i + 1}/${seleccion.length}] ${q.cajaId} ERROR: ${e.message}`);
    if (e.response) console.error(JSON.stringify(e.response, null, 2));
  }
}

if (dryRun) {
  console.log(`dry-run: ${seleccion.length} payload(s) generados, 0 llamadas a MercadoPago`);
  process.exit(0);
}

// CSV de links
const cols = ['productor', 'asegurado', 'matricula', 'poliza', 'cuota', 'cuotaTotal', 'vencimiento', 'saldo', 'cajaId', 'preference_id', 'link', 'expira', 'creado'];
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const csv = [cols.join(';'), ...resultados.map((r) => cols.map((k) => esc(r[k])).join(';'))].join('\r\n');
const csvFile = `${outDir}/links_pago.csv`;
fs.writeFileSync(csvFile, '\ufeff' + csv, 'utf8');

console.log('');
console.log(`${resultados.length} link(s) | ${errores} error(es)`);
console.log(`cache: ${cacheFile}`);
console.log(`csv:   ${csvFile}`);
if (errores) process.exit(1);
