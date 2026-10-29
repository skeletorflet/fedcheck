/**
 * Scraper de "Cuotas impagas" por HTTP puro (sin navegador).
 *
 *   node backend/scrape.mjs --user 7224
 *   node backend/scrape.mjs --user 26620 --desde 01/09/26 --hasta 30/09/26
 *
 * Salidas en --out (por defecto salida/<user>): deudas.json, deudas.csv, meta.json
 */
import fs from 'node:fs';
import { ensureSession } from './lib/auth.mjs';
import { getListado, normalizarListado } from './lib/fedpat.mjs';
import { getAccount } from '../accounts.mjs';
import { RateLimiter } from './lib/session.mjs';

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 ? argv[i + 1] : def;
};
const flag = (name) => argv.includes('--' + name);

const user = String(opt('user', process.env.FED_USER || '7224'));
const outDir = opt('out', `salida/${user}`);
const desde = opt('desde', process.env.FED_DESDE || null);
const hasta = opt('hasta', process.env.FED_HASTA || null);
const allowBrowser = !flag('no-browser');
const limiter = new RateLimiter({ minInterval: Number(opt('interval', 280)) });

const acc = getAccount(user);
if (!acc) throw new Error(`la cuenta ${user} no está en accounts.json`);

fs.mkdirSync(outDir, { recursive: true });
console.log(`[${user}] backend HTTP puro${desde ? ` | rango ${desde} -> ${hasta || desde}` : ''}`);

const s = await ensureSession(user, { pass: acc.pass, limiter, allowBrowser });
const listado = await getListado(s, { desde, hasta });
const cuotas = normalizarListado(listado, user);

const matriculas = [...new Set(cuotas.map((q) => q.matricula))];
const total = cuotas.reduce((a, r) => a + r.saldo, 0);
const nombre = listado.nombre || '';
const rango = listado.rango;

const deudas = {
  generado: new Date().toISOString(),
  productor: user,
  nombre,
  rango,
  clientes: matriculas.length,
  cuotas,
  sinDetalle: 0,
  fuente: 'http',
};
fs.writeFileSync(`${outDir}/deudas.json`, JSON.stringify(deudas, null, 2));

const cols = ['productor', 'asegurado', 'matricula', 'poliza', 'vencimiento', 'vencimientoISO', 'saldo', 'estado', 'marca', 'dia', 'nroOperacion', 'cajaId'];
const csv = [cols.join(';'), ...cuotas.map((r) => cols.map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(';'))].join('\r\n');
fs.writeFileSync(`${outDir}/deudas.csv`, '\ufeff' + csv, 'utf8');

const meta = {
  user,
  nombre,
  rango,
  generado: new Date().toISOString(),
  clientes: matriculas.length,
  cuotas: cuotas.length,
  total,
  fuente: 'http',
};
fs.writeFileSync(`${outDir}/meta.json`, JSON.stringify(meta, null, 2));

console.log(`\n✅ [${user}${nombre ? ' - ' + nombre : ''}] ${matriculas.length} clientes | ${cuotas.length} cuotas | total $ ${total.toLocaleString('es-AR')}`);
console.log(`archivos: ${outDir}/deudas.json / deudas.csv / meta.json`);
