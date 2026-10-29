// ============================================================
// QUICK REFERENCE - Integración programática FED Check
// ============================================================

import fs from 'fs';
import path from 'path';

// ------------------------------------------------------------------
// 1. LEER DEUDAS YA PROCESADAS (más rápido, sin HTTP)
// ------------------------------------------------------------------
function leerDeudas(productor) {
  const file = `salida/${productor}/deudas_full.json`;
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Buscar por matrícula
function buscarPorMatricula(productor, matricula) {
  const data = leerDeudas(productor);
  if (!data) return [];
  return data.cuotas.filter(q => String(q.matricula) === String(matricula));
}

// Buscar por póliza
function buscarPorPoliza(productor, polizaNumero) {
  const data = leerDeudas(productor);
  if (!data) return [];
  return data.cuotas.filter(q => String(q.polizaNumero) === String(polizaNumero));
}

// Buscar por certificado
function buscarPorCertificado(productor, certificado) {
  const data = leerDeudas(productor);
  if (!data) return [];
  return data.cuotas.filter(q => String(q.certificado) === String(certificado));
}

// Buscar por rango de vencimiento
function buscarPorVencimiento(productor, desdeISO, hastaISO) {
  const data = leerDeudas(productor);
  if (!data) return [];
  return data.cuotas.filter(q => 
    q.vencimientoISO >= desdeISO && q.vencimientoISO <= hastaISO
  );
}

// Buscar por nombre asegurado (parcial, case-insensitive)
function buscarPorNombre(productor, nombreParcial) {
  const data = leerDeudas(productor);
  if (!data) return [];
  const term = nombreParcial.toLowerCase();
  return data.cuotas.filter(q => q.asegurado.toLowerCase().includes(term));
}

// ------------------------------------------------------------------
// 2. OBTENER RUTA DEL PDF CUPONERA
// ------------------------------------------------------------------
function sanitizeFilename(name) {
  return String(name || 'sin_nombre')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ').trim().slice(0, 120);
}

function getCuponeraPath(productor, matricula, fecha = new Date()) {
  const data = leerDeudas(productor);
  if (!data) return null;
  
  const cuota = data.cuotas.find(q => String(q.matricula) === String(matricula));
  if (!cuota) return null;
  
  const nombre = sanitizeFilename(cuota.asegurado);
  const fechaStr = `${fecha.getFullYear()}${String(fecha.getMonth()+1).padStart(2,'0')}${String(fecha.getDate()).padStart(2,'0')}`;
  
  return path.join('salida', productor, 'cuponeras', nombre, `${nombre}_cuponera_${fechaStr}.pdf`);
}

// Verificar si existe y leer buffer
function getCuponeraBuffer(productor, matricula, fecha = new Date()) {
  const pdfPath = getCuponeraPath(productor, matricula, fecha);
  if (!pdfPath || !fs.existsSync(pdfPath)) return null;
  return fs.readFileSync(pdfPath);
}

// ------------------------------------------------------------------3. USAR INDEX.CSV PARA BÚSQUEDA RÁPIDA DE PDF
// ------------------------------------------------------------------
function leerIndexCuponeras(productor) {
  const file = `salida/${productor}/cuponeras/index.csv`;
  if (!fs.existsSync(file)) return [];
  
  const lines = fs.readFileSync(file, 'utf8').split('\r\n').filter(l => l);
  const headers = lines[0].split(';').map(h => h.replace(/"/g, ''));
  
  return lines.slice(1).map(line => {
    const vals = line.split(';').map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
    const obj = {};
    headers.forEach((h, i) => obj[h] = vals[i]);
    return obj;
  });
}

function buscarCuponeraEnIndex(productor, matricula) {
  const index = leerIndexCuponeras(productor);
  return index.find(row => String(row.matricula) === String(matricula));
}

// ------------------------------------------------------------------
// 4. EJECUTAR PIPELINE DESDE CÓDIGO
// ------------------------------------------------------------------
import { spawn } from 'child_process';

function runPipeline(productor, opciones = {}) {
  return new Promise((resolve, reject) => {
    const args = ['backend/run.mjs', String(productor)];
    if (opciones.skipEnrich) args.push('--skip-enrich');
    if (opciones.skipExcel) args.push('--skip-excel');
    if (opciones.skipCuponeras) args.push('--skip-cuponeras');
    if (opciones.desde) args.push(opciones.desde, opciones.hasta || opciones.desde);
    if (opciones.concurrency) args.push('--concurrency', String(opciones.concurrency));
    if (opciones.noBrowser) args.push('--no-browser');
    
    const proc = spawn('node', args, { stdio: 'inherit' });
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`Pipeline exit ${code}`)));
  });
}

function runScrape(productor, desde, hasta) {
  return new Promise((resolve, reject) => {
    const args = ['backend/scrape.mjs', '--user', String(productor)];
    if (desde) args.push('--desde', desde, '--hasta', hasta || desde);
    const proc = spawn('node', args, { stdio: 'inherit' });
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`Scrape exit ${code}`)));
  });
}

function runEnrich(productor, opciones = {}) {
  return new Promise((resolve, reject) => {
    const args = ['backend/enrich.mjs', '--user', String(productor)];
    if (opciones.concurrency) args.push('--concurrency', String(opciones.concurrency));
    if (opciones.mat) args.push('--mat', opciones.mat);
    if (opciones.limit) args.push('--limit', String(opciones.limit));
    if (opciones.refresh) args.push('--refresh');
    if (opciones.noBrowser) args.push('--no-browser');
    const proc = spawn('node', args, { stdio: 'inherit' });
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`Enrich exit ${code}`)));
  });
}

function runCuponeras(productor, opciones = {}) {
  return new Promise((resolve, reject) => {
    const args = ['backend/cuponeras.mjs', '--user', String(productor)];
    if (opciones.limit) args.push('--limit', String(opciones.limit));
    if (opciones.mat) args.push('--mat', opciones.mat);
    if (opciones.force) args.push('--force');
    if (opciones.noBrowser) args.push('--no-browser');
    const proc = spawn('node', args, { stdio: 'inherit' });
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`Cuponeras exit ${code}`)));
  });
}

// ------------------------------------------------------------------
// 5. EJEMPLO DE USO COMPLETO
// ------------------------------------------------------------------
async function ejemploUso() {
  const PROD = '7224';
  
  // A) Leer datos locales (instantáneo)
  const deudas = leerDeudas(PROD);
  console.log(`Total cuotas: ${deudas?.cuotas.length || 0}`);
  
  // B) Buscar cliente específico
  const cliente = buscarPorMatricula(PROD, '5433037');
  console.log('Cuotas del cliente:', cliente.map(c => ({
    poliza: c.poliza,
    vencimiento: c.vencimiento,
    saldo: c.saldo,
    cuota: `${c.cuotaNumero}/${c.cuotaTotal}`,
    estado: c.estado,
    marca: c.marca
  })));
  
  // C) Obtener PDF para WhatsApp
  const pdfBuffer = getCuponeraBuffer(PROD, '5433037');
  if (pdfBuffer) {
    console.log(`PDF size: ${pdfBuffer.length} bytes`);
    // await whatsapp.send({ to: cliente[0].telefonos[0]?.raw, media: pdfBuffer, caption: 'Su cuponera...' });
  } else {
    console.log('PDF no existe, descargando...');
    await runCuponeras(PROD, { mat: '5433037' });
  }
  
  // D) Si necesitas datos frescos, ejecutar pipeline
  // await runPipeline(PROD, { skipExcel: true }); // scrape + enrich + cuponeras
}

// ejemploUso().catch(console.error);

export {
  leerDeudas,
  buscarPorMatricula,
  buscarPorPoliza,
  buscarPorCertificado,
  buscarPorVencimiento,
  buscarPorNombre,
  getCuponeraPath,
  getCuponeraBuffer,
  leerIndexCuponeras,
  buscarCuponeraEnIndex,
  runPipeline,
  runScrape,
  runEnrich,
  runCuponeras,
  sanitizeFilename
};