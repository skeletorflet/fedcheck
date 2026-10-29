/**
 * Enriquece deudas.json con:
 *  - teléfonos y mails del asegurado (editDatosAsegurado.do)
 *  - descripción de la cuota (1/12, 2/12...) vía obtenerOpcionesCuotasImpagas.do
 * Guarda deudas_full.json (con cache/resume en enrich_cache.json)
 *
 * Uso: node enrich.mjs [--user 7224] [--out salida/7224]
 */
import { connect } from './cdp.mjs';
import { tabFileFor, primaryUser } from './tabs.mjs';
import fs from 'node:fs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 ? argv[i + 1] : def;
};
const user = String(opt('user', process.env.FED_USER || primaryUser));
const outDir = opt('out', process.env.FED_OUT || `salida/${user}`);

const deudas = JSON.parse(fs.readFileSync(`${outDir}/deudas.json`, 'utf8'));
const cacheFile = 'enrich_cache.json';
const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : { clientes: {}, cuotas: {} };
const saveCache = () => fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));

const c = await connect('online.fedpat.com.ar', tabFileFor(user), { anyUrl: true });

let renovadas = 0;
async function cfFetch(path, asJson) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await c.eval(`(async () => {
      const res = await fetch(${JSON.stringify(path)}, { credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      const txt = await res.text();
      return { status: res.status, body: txt.slice(0, 400000) };
    })()`);
    if (r?.status === 429) { console.log('  429 -> espero 30s'); await sleep(30000); continue; }
    if (r?.status === 200) {
      if (/loginForm/.test(r.body)) throw new Error('sesión expirada');
      return asJson ? JSON.parse(r.body) : r.body;
    }
    return null;
  }
  return null;
}

const matriculas = [...new Set(deudas.cuotas.map((q) => q.matricula))];
console.log(`[${user}] clientes a enriquecer: ${matriculas.length}`);

for (const mat of matriculas) {
  if (cache.clientes[mat]) continue;
  const html = await cfFetch(`/self/editDatosAsegurado.do?matricula=${mat}&tipoAsegurado=M&fromListado=true`, false);
  if (!html) { console.log(`  ! ${mat} sin respuesta`); continue; }
  const parsed = await c.eval(`(() => {
    const doc = new DOMParser().parseFromString(${JSON.stringify(html)}, 'text/html');
    const inputs = [...doc.querySelectorAll('input')].map(e => ({ n: e.name || '', v: (e.value || '').trim() }));
    const telefs = {}, mails = {};
    for (const {n, v} of inputs) {
      let m;
      if ((m = n.match(/^telefono\\[(\\d+)\\]\\.(prefijo|prefijoCelular|caracteristica|numeroTelefono|descripcion|telefonoNoValidado)$/))) (telefs[m[1]] ||= {})[m[2]] = v;
      if ((m = n.match(/^mail\\[(\\d+)\\]\\.(mail|descripcion|mailNoValidado)$/))) (mails[m[1]] ||= {})[m[2]] = v;
    }
    return { telefs, mails };
  })()`);

  const tels = Object.values(parsed?.telefs || {})
    .filter((t) => t.numeroTelefono)
    .map((t) => ({ raw: `${t.prefijo || ''}${t.prefijoCelular || ''}${t.caracteristica || ''}${t.numeroTelefono || ''}`.replace(/\s/g, ''), desc: t.descripcion || '', celular: !!t.prefijoCelular }));
  const ms = Object.values(parsed?.mails || {}).filter((m) => m.mail).map((m) => ({ mail: m.mail.toLowerCase(), desc: m.descripcion || '' }));

  cache.clientes[mat] = {
    telefonos: [...new Map(tels.map((t) => [t.raw, t])).values()],
    mails: [...new Map(ms.map((m) => [m.mail, m])).values()],
  };
  saveCache();
  renovadas++;
  process.stdout.write(`  ${mat}: ${tels.length} tel, ${ms.length} mail\n`);
  await sleep(500);
}

const cuotaIds = [...new Set(deudas.cuotas.map((q) => q.cajaId).filter(Boolean))];
console.log(`[${user}] cuotas a detallar: ${cuotaIds.length}`);
for (const id of cuotaIds) {
  if (cache.cuotas[id]) continue;
  const j = await cfFetch(`/self/generarRemesaCaja/obtenerOpcionesCuotasImpagas.do?cuotaId=${encodeURIComponent(id)}`, true).catch((e) => { console.log('  !', id, e.message); return null; });
  if (!j) continue;
  const first = j.lsCuotas?.[0];
  const desc = first?.descripcion || '';
  const m = desc.match(/^(\d+)\/(\d+)/);
  cache.cuotas[id] = {
    cuotaNumero: m ? Number(m[1]) : null,
    cuotaTotal: m ? Number(m[2]) : null,
    descripcion: desc,
    importeCuota: first?.importe ?? null,
    saldoAcumulado: first?.saldo ?? null,
    asegurado: j.asegurado || '',
  };
  saveCache();
  await sleep(400);
}

// unir
for (const q of deudas.cuotas) {
  const cli = cache.clientes[q.matricula] || { telefonos: [], mails: [] };
  const det = cache.cuotas[q.cajaId] || {};
  q.productor = q.productor || user;
  q.telefonos = cli.telefonos;
  q.mails = cli.mails;
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
await c.close();
