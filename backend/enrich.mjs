/**
 * Enriquece deudas.json con teléfonos/mails y detalle de cuota, por HTTP puro.
 *
 *   node backend/enrich.mjs --user 7224
 *   node backend/enrich.mjs --user 7224 --concurrency 4
 *   node backend/enrich.mjs --user 7224 --mat 6998123 --limit 3   (prueba)
 *
 * Salida: deudas_full.json (cache/resume en enrich_cache.json compartido).
 */
import fs from 'node:fs';
import { ensureSession } from './lib/auth.mjs';
import { getContactos, getDetalleCuota, detalleParaCache } from './lib/fedpat.mjs';
import { getAccount } from '../accounts.mjs';
import { RateLimiter } from './lib/session.mjs';
import { pool } from './lib/pool.mjs';

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 ? argv[i + 1] : def;
};
const flag = (name) => argv.includes('--' + name);

const user = String(opt('user', process.env.FED_USER || '7224'));
const outDir = opt('out', `salida/${user}`);
const concurrency = Number(opt('concurrency', 3));
const onlyMat = opt('mat', null);
const onlyCuota = opt('cuota', null);
const limit = Number(opt('limit', 0)) || 0;
const allowBrowser = !flag('no-browser');
const refresh = flag('refresh');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const acc = getAccount(user);
if (!acc) throw new Error(`la cuenta ${user} no está en accounts.json`);

const deudas = JSON.parse(fs.readFileSync(`${outDir}/deudas.json`, 'utf8'));
const cacheFile = 'enrich_cache.json';
const cache = fs.existsSync(cacheFile) && !refresh
  ? JSON.parse(fs.readFileSync(cacheFile, 'utf8'))
  : { clientes: {}, cuotas: {} };
cache.clientes ||= {};
cache.cuotas ||= {};
const saveCache = () => fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));

const limiter = new RateLimiter({ minInterval: Number(opt('interval', 300)) });
let s = await ensureSession(user, { pass: acc.pass, limiter, allowBrowser });

let matriculas = [...new Set(deudas.cuotas.map((q) => q.matricula))];
let cuotaIds = [...new Set(deudas.cuotas.map((q) => q.cajaId).filter(Boolean))];
if (onlyMat) matriculas = matriculas.filter((m) => String(m) === String(onlyMat));
if (onlyCuota) cuotaIds = cuotaIds.filter((id) => id === onlyCuota);
if (limit) { matriculas = matriculas.slice(0, limit); cuotaIds = cuotaIds.slice(0, limit); }

const pendientesMat = matriculas.filter((m) => !cache.clientes[m]);
const pendientesCuota = cuotaIds.filter((id) => !cache.cuotas[id]);
console.log(`[${user}] clientes: ${matriculas.length} (${pendientesMat.length} a consultar) | cuotas: ${cuotaIds.length} (${pendientesCuota.length} a consultar) | concurrencia ${concurrency}`);

async function renovarSesion(motivo) {
  console.log(`  ! ${motivo} -> renuevo sesión`);
  try {
    s = await ensureSession(user, { pass: acc.pass, limiter, allowBrowser, log: () => {} });
  } catch (e) {
    console.log('  ! no se pudo renovar:', e.message);
  }
}

function alProgreso(etiqueta) {
  let last = 0;
  return (done, total) => {
    const pct = Math.round((done / total) * 100);
    if (done === total || done - last >= 10 || pct === 100) {
      last = done;
      process.stdout.write(`  ${etiqueta} ${done}/${total} (${pct}%)\n`);
    }
  };
}

async function pedirContacto(mat) {
  try {
    const c = await getContactos(s, mat);
    cache.clientes[mat] = c;
    saveCache();
    return c;
  } catch (e) {
    if (/sesión vencida|loginForm/i.test(e.message)) await renovarSesion('sesión vencida en contactos');
    throw e;
  }
}

async function pedirCuota(id) {
  try {
    const j = await getDetalleCuota(s, id);
    cache.cuotas[id] = detalleParaCache(j);
    saveCache();
    return cache.cuotas[id];
  } catch (e) {
    if (/sesión vencida|loginForm/i.test(e.message)) await renovarSesion('sesión vencida en cuotas');
    throw e;
  }
}

if (pendientesMat.length) {
  const res = await pool(pendientesMat, pedirContacto, { concurrency, onProgress: alProgreso('contactos') });
  const errs = res.filter((r) => r && r.__error);
  if (errs.length) console.log(`  ! ${errs.length} contactos fallaron: ${errs.slice(0, 3).map((e) => e.__error).join(' | ')}`);
}

if (pendientesCuota.length) {
  const res = await pool(pendientesCuota, pedirCuota, { concurrency, onProgress: alProgreso('cuotas') });
  const errs = res.filter((r) => r && r.__error);
  if (errs.length) console.log(`  ! ${errs.length} cuotas fallaron: ${errs.slice(0, 3).map((e) => e.__error).join(' | ')}`);
}

// Reintento único de lo que quedó sin datos (rate limit transitorio)
const faltanMat = pendientesMat.filter((m) => !cache.clientes[m]);
const faltanCuota = pendientesCuota.filter((id) => !cache.cuotas[id]);
if (faltanMat.length || faltanCuota.length) {
  console.log(`  reintento: ${faltanMat.length} contactos | ${faltanCuota.length} cuotas`);
  await sleep(10000);
  if (faltanMat.length) await pool(faltanMat, pedirContacto, { concurrency: 1, onProgress: alProgreso('contactos (retry)') });
  if (faltanCuota.length) await pool(faltanCuota, pedirCuota, { concurrency: 1, onProgress: alProgreso('cuotas (retry)') });
}

// unir
for (const q of deudas.cuotas) {
  const cli = cache.clientes[q.matricula] || { telefonos: [], mails: [] };
  const det = cache.cuotas[q.cajaId] || {};
  q.productor = q.productor || user;
  q.telefonos = cli.telefonos || [];
  q.mails = cli.mails || [];
  q.cuotaNumero = det.cuotaNumero ?? null;
  q.cuotaTotal = det.cuotaTotal ?? null;
  q.descripcionCuota = det.descripcion || '';
}
deudas.enriquecido = new Date().toISOString();
deudas.nombre = deudas.nombre || '';
fs.writeFileSync(`${outDir}/deudas_full.json`, JSON.stringify(deudas, null, 2));

const sinTel = deudas.cuotas.filter((q) => !q.telefonos.length).length;
const sinMail = deudas.cuotas.filter((q) => !q.mails.length).length;
console.log(`\n[${user}] listo. cuotas sin teléfono: ${sinTel} | sin mail: ${sinMail}`);
console.log(`archivo: ${outDir}/deudas_full.json`);
