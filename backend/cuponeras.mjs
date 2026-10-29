/**
 * Descarga las cuponeras (PDF de cuotas impagas) para cada asegurado
 * y las guarda organizadas en carpetas por nombre de asegurado.
 *
 *   node backend/cuponeras.mjs --user 7224
 *   node backend/cuponeras.mjs --user 7224 --concurrency 2
 *   node backend/cuponeras.mjs --user 7224 --mat 6998123   (solo uno)
 *
 * Salida: salida/<user>/cuponeras/<Asegurado>/<Asegurado>_cuponera_YYYYMMDD.pdf
 */
import fs from 'node:fs';
import { ensureSession } from './lib/auth.mjs';
import { getCuponeraPdf, sanitizeFilename } from './lib/fedpat.mjs';
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
const concurrency = Number(opt('concurrency', 1));
const onlyMat = opt('mat', null);
const limit = Number(opt('limit', 0)) || 0;
const allowBrowser = !flag('no-browser');
const force = flag('force'); // re-descargar aunque exista

const acc = getAccount(user);
if (!acc) throw new Error(`la cuenta ${user} no está en accounts.json`);

const deudasFile = `${outDir}/deudas_full.json`;
if (!fs.existsSync(deudasFile)) throw new Error(`no existe ${deudasFile} (corré enrich primero)`);

const deudas = JSON.parse(fs.readFileSync(deudasFile, 'utf8'));
const cuponerasDir = `${outDir}/cuponeras`;
fs.mkdirSync(cuponerasDir, { recursive: true });

// Agrupar cuotas por matricula (asegurado)
const porMatricula = new Map();
for (const q of deudas.cuotas) {
  const mat = String(q.matricula);
  if (!porMatricula.has(mat)) {
    porMatricula.set(mat, { matricula: mat, asegurado: q.asegurado, cuotas: [] });
  }
  porMatricula.get(mat).cuotas.push(q);
}

let matriculas = [...porMatricula.keys()];
if (onlyMat) matriculas = matriculas.filter((m) => String(m) === String(onlyMat));
if (limit) matriculas = matriculas.slice(0, limit);

console.log(`[${user}] ${matriculas.length} asegurado(s) con deudas | concurrencia ${concurrency}`);

const limiter = new RateLimiter({ minInterval: Number(opt('interval', 500)) });
let s = await ensureSession(user, { pass: acc.pass, limiter, allowBrowser });

const hoy = new Date();
const fechaStr = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}`;

async function descargarCuponera(mat) {
  const info = porMatricula.get(mat);
  const nombreAseg = sanitizeFilename(info.asegurado);
  const carpeta = `${cuponerasDir}/${nombreAseg}`;
  const archivo = `${carpeta}/${nombreAseg}_cuponera_${fechaStr}.pdf`;

  // Si ya existe y no se fuerza, saltar
  if (!force && fs.existsSync(archivo)) {
    return { mat, archivo, skipped: true, size: fs.statSync(archivo).size };
  }

  try {
    fs.mkdirSync(carpeta, { recursive: true });
    const pdfBuffer = await getCuponeraPdf(s, mat);
    if (!pdfBuffer || pdfBuffer.byteLength === 0) {
      throw new Error('PDF vacío');
    }
    fs.writeFileSync(archivo, Buffer.from(pdfBuffer));
    return { mat, archivo, skipped: false, size: pdfBuffer.byteLength };
  } catch (e) {
    if (/sesión vencida|loginForm/i.test(e.message)) {
      console.log(`  ! sesión vencida en ${mat} -> renuevo`);
      try {
        s = await ensureSession(user, { pass: acc.pass, limiter, allowBrowser, log: () => {} });
        // Reintentar una vez
        const pdfBuffer = await getCuponeraPdf(s, mat);
        if (!pdfBuffer || pdfBuffer.byteLength === 0) throw new Error('PDF vacío (reintento)');
        fs.mkdirSync(carpeta, { recursive: true });
        fs.writeFileSync(archivo, Buffer.from(pdfBuffer));
        return { mat, archivo, skipped: false, size: pdfBuffer.byteLength, retry: true };
      } catch (e2) {
        return { mat, error: e2.message };
      }
    }
    return { mat, error: e.message };
  }
}

function alProgreso(etiqueta) {
  let last = 0;
  return (done, total) => {
    const pct = Math.round((done / total) * 100);
    if (done === total || done - last >= 5 || pct === 100) {
      last = done;
      process.stdout.write(`  ${etiqueta} ${done}/${total} (${pct}%)\n`);
    }
  };
}

const resultados = await pool(matriculas, descargarCuponera, { concurrency, onProgress: alProgreso('cuponeras') });

const ok = resultados.filter((r) => r && !r.error && !r.skipped).length;
const skipped = resultados.filter((r) => r && r.skipped).length;
const errors = resultados.filter((r) => r && r.error).length;

console.log(`\n[${user}] cuponeras: ${ok} nuevas | ${skipped} ya existían | ${errors} errores`);
if (errors) {
  for (const r of resultados.filter((r) => r.error)) {
    console.log(`  ✗ ${r.mat}: ${r.error}`);
  }
}

// Generar un índice CSV para referencia rápida
const indexFile = `${cuponerasDir}/index.csv`;
const cols = ['matricula', 'asegurado', 'archivo', 'tamaño_bytes', 'fecha_descarga'];
const rows = resultados
  .filter((r) => r && !r.error)
  .map((r) => {
    const info = porMatricula.get(r.mat);
    return [r.mat, info?.asegurado || '', r.archivo || '', r.size || '', new Date().toISOString()];
  });
const csv = [cols.join(';'), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'))].join('\r\n');
fs.writeFileSync(indexFile, '\ufeff' + csv, 'utf8');
console.log(`índice: ${indexFile}`);