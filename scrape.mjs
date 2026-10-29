/**
 * Scraper de "Cuotas impagas" (deudas) de SELF FedPat, por cuenta.
 *
 *  node scrape.mjs                          -> cuenta 7224, rango del sitio
 *  node scrape.mjs 01/09/26 30/09/26        -> rango manual
 *  node scrape.mjs --user 26620             -> otra cuenta
 *  node scrape.mjs --user 26620 --out salida/26620
 *
 * Salidas (en --out): deudas.csv, deudas.json, meta.json
 */
import { connect } from './cdp.mjs';
import { tabFileFor, ensureTab, primaryUser } from './tabs.mjs';
import { getAccount } from './accounts.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const num = (s) => Number(String(s || '0').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
const URL_CUOTAS = 'https://online.fedpat.com.ar/self/StrutsJsfServlet?beanName=menuBean&method=cuotasImpagas';

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 ? argv[i + 1] : def;
};
const user = String(opt('user', process.env.FED_USER || primaryUser));
const outDir = opt('out', process.env.FED_OUT || `salida/${user}`);
const fechas = argv.filter((a) => /^\d{2}\/\d{2}\/\d{2,4}$/.test(a));
const [desde, hasta] = fechas;

fs.mkdirSync(outDir, { recursive: true });

// asegurar pestaña y sesión
await ensureTab(user, { adoptDefault: user === primaryUser });
const c = await connect('online.fedpat.com.ar', tabFileFor(user), { anyUrl: true });
await c.send('Page.enable');
await c.send('Network.enable');

async function pageState() {
  return c.eval(`({ url: location.href, hasLogout: !!document.querySelector('a[href*="logout.do"]'), hasForm: !!document.getElementById('loginForm'), body: document.body.innerText.slice(0,200) })`).catch(() => null);
}

let st = await pageState();
if (!st || st.hasForm || !st.hasLogout) {
  const acc = getAccount(user);
  if (!acc) throw new Error(`falta la clave de ${user} en accounts.json`);
  console.log(`sin sesión en ${user} -> login`);
  execFileSync('node', ['login.mjs', user, acc.pass], { stdio: 'inherit' });
  await c.eval(`location.href='/self/loadProductor.do'`);
  await sleep(4000);
  st = await pageState();
  if (!st?.hasLogout) { console.log('no se pudo iniciar sesión:', JSON.stringify(st)); process.exit(2); }
}

// ir a cuotas impagas
console.log(`[${user}] navegando a Cuotas impagas...`);
await c.eval(`location.href = ${JSON.stringify(URL_CUOTAS)}`);
await sleep(6000);

for (let i = 0; i < 30; i++) {
  st = await c.eval(`({ url: location.href, hasFilter: !!document.getElementById('fecha-desde') })`).catch(() => null);
  if (st?.hasFilter) break;
  await sleep(1000);
}
if (!st?.hasFilter) { console.log('no se cargó el filtro:', JSON.stringify(st)); process.exit(2); }

// rango de fechas opcional
if (desde) {
  await c.eval(`(() => {
    const set = (id, v) => { const e = document.getElementById(id);
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(e, v); e.dispatchEvent(new Event('input', {bubbles:true})); e.dispatchEvent(new Event('change', {bubbles:true})); e.blur(); };
    set('fecha-desde', ${JSON.stringify(desde)});
    set('fecha-hasta', ${JSON.stringify(hasta || desde)});
    return true;
  })()`);
  console.log('rango:', desde, '->', hasta || desde);
  await sleep(1000);
}

const rango = await c.eval(`({ d: document.getElementById('fecha-desde')?.value, h: document.getElementById('fecha-hasta')?.value })`);
console.log('fechas aplicadas:', JSON.stringify(rango));

// nombre del productor (aparece en el encabezado del listado)
const prodInfo = await c.eval(`(() => {
  const t = document.body.innerText;
  const m = t.match(/PRODUCTOR\\s+(\\d+)\\s*-\\s*([^\\n|]+)/i);
  return m ? { user: m[1], nombre: m[2].trim() } : null;
})()`);

// generar listado
const btn = await c.eval(`(() => { const b = document.getElementById('j_id142') || [...document.querySelectorAll('input[type=button]')].find(i => /Generar listado/i.test(i.value));
  if (!b) return null; b.scrollIntoView({block:'center'}); const r = b.getBoundingClientRect();
  return { x: r.x + r.width/2, y: r.y + r.height/2, w: r.width, value: b.value }; })()`);
if (!btn?.w) { console.log('no encontré el botón Generar listado'); process.exit(2); }
await c.eval(`(() => { const b = document.getElementById('j_id142') || [...document.querySelectorAll('input[type=button]')].find(i => /Generar listado/i.test(i.value)); b.click(); return true; })()`);
console.log('generando listado...');

let rows = 0;
for (let i = 0; i < 90; i++) {
  await sleep(1000);
  rows = await c.eval(`document.getElementById('tblCuotasImpagas')?.rows.length || 0`).catch(() => 0);
  if (rows > 1) break;
}
if (rows < 2) console.log('la tabla no se generó (¿sin deudas en el rango?)');

// extraer
const data = await c.eval(`(() => {
  const t = document.getElementById('tblCuotasImpagas');
  if (!t) return { headCells: [], data: [] };
  const headCells = [...t.querySelectorAll('thead td')].map(td => td.innerText.replace(/\\s+/g,' ').trim());
  const out = [];
  for (const tr of [...(t.tBodies[0]?.rows || [])]) {
    const cells = [...tr.cells];
    const nameEl = cells[0]?.querySelector('span[id]');
    const rec = { nombre: cells[0]?.innerText.trim() || '', matricula: nameEl?.id?.slice(1) || '', cuotas: [] };
    cells.forEach((td, idx) => {
      const lbl = td.querySelector('span.celdasColores');
      if (!lbl) return;
      // una celda puede tener 1..N tooltips (marcador "+" = varias cuotas/pólizas ese día)
      const tips = [...td.children].filter((e) => e.tagName === 'DIV' && /^(tooltip)/.test(e.id || e.className || ''));
      if (!tips.length) {
        rec.cuotas.push({ columna: idx, dia: headCells[idx] || '', marca: lbl.innerText.trim(), poliza: '',
          vencimiento: '', saldoTexto: '', estado: '', nroOperacion: '', cajaId: null, sinDetalle: true });
        return;
      }
      for (const tip of tips) {
        const fields = {}; let nroOp = '';
        for (const row of tip.querySelectorAll('.row')) {
          const info = row.querySelector('.text-info');
          const label = info?.innerText.trim();
          const val = row.querySelector('strong')?.innerText.trim();
          if (label && label.includes(':') && val) fields[label.replace(':','').trim()] = val;
          else if (label && /^[\\d.,]+$/.test(label)) nroOp = label;
        }
        const marcaTip = tip.querySelector('.qtip-subtitle .label')?.innerText.trim() || lbl.innerText.trim();
        rec.cuotas.push({
          columna: idx, dia: headCells[idx] || '', marca: marcaTip,
          poliza: tip.querySelector('.qtip-subtitle a')?.innerText.trim() || '',
          vencimiento: fields['Vencimiento'] || '', saldoTexto: fields['Saldo'] || '',
          estado: fields['Estado'] || '', nroOperacion: nroOp,
          cajaId: tip.querySelector('.cajaTrigger')?.getAttribute('data-id') || null,
        });
      }
    });
    out.push(rec);
  }
  return { headCells, data: out };
})()`);

const flat = [];
let sinDetalle = 0;
for (const cli of data.data) for (const q of cli.cuotas) {
  if (!q.cajaId && !q.saldoTexto) { sinDetalle++; continue; }
  const m = String(q.vencimiento || '').match(/(\w+) (\d+), (\d+)/);
  const d = m ? new Date(`${m[1]} ${m[2]} ${m[3]}`) : null;
  flat.push({
    productor: user, asegurado: cli.nombre, matricula: cli.matricula, poliza: q.poliza,
    vencimiento: q.vencimiento, vencimientoISO: d && !isNaN(d) ? d.toISOString().slice(0, 10) : '',
    saldo: num(q.saldoTexto), saldoTexto: q.saldoTexto, estado: q.estado,
    marca: q.marca, dia: q.dia, nroOperacion: q.nroOperacion, cajaId: q.cajaId,
  });
}

const cols = ['productor','asegurado','matricula','poliza','vencimiento','vencimientoISO','saldo','estado','marca','dia','nroOperacion','cajaId'];
const csv = [cols.join(';'), ...flat.map(r => cols.map(k => `"${String(r[k] ?? '').replace(/"/g,'""')}"`).join(';'))].join('\r\n');
fs.writeFileSync(`${outDir}/deudas.csv`, '\ufeff' + csv, 'utf8');
fs.writeFileSync(`${outDir}/deudas.json`, JSON.stringify({
  generado: new Date().toISOString(), productor: user, nombre: prodInfo?.nombre || '',
  rango, clientes: data.data.length, cuotas: flat, sinDetalle,
}, null, 2), 'utf8');
fs.writeFileSync(`${outDir}/meta.json`, JSON.stringify({
  user, nombre: prodInfo?.nombre || '', rango, generado: new Date().toISOString(),
  clientes: data.data.length, cuotas: flat.length, total: flat.reduce((a, r) => a + r.saldo, 0),
}, null, 2), 'utf8');

const total = flat.reduce((a, r) => a + r.saldo, 0);
console.log(`\n✅ [${user}${prodInfo?.nombre ? ' - ' + prodInfo.nombre : ''}] ${data.data.length} clientes | ${flat.length} cuotas | total $ ${total.toLocaleString('es-AR')}`);
console.log(`archivos: ${outDir}/deudas.csv / deudas.json`);
await c.close();
