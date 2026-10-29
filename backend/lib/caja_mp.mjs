/**
 * Flujo nativo SELF: Caja → 232 BOT PAGO MERCADOPAGO
 * Genera link de pago MP con la cuenta de FEDPAT (collector 463870024)
 * sin requerir token MP propio.
 *
 * Flujo HTTP:
 *   1. GET /self/StrutsJsfServlet?beanName=moduloCajaBean&method=init
 *   2. POST tipoMov=232 (A4J ajaxSingle)
 *   3. POST DNI + monto (onchange j_id161:2:j_id167) → trae select contactos
 *   4. POST agregar movimiento (j_id186) con contacto elegido
 *   5. POST buscar deuda por póliza (aceptarId con ramo/poliza/cert) → genTablaCaja
 *   6. POST aplicar cuota (j_id284 con param1=nro, param2=endoso, param3=importe, param4=tasa)
 *   7. POST confirmar (botonConfirmar)
 *
 * Respuesta confirmación: nroIngreso, lote, estado "queda a la espera..."
 * Link MP: se envía por mail al contacto; no viene en el HTML.
 */
import { HttpSession, RateLimiter, BASE } from './session.mjs';
import { viewState, inputValue } from './parse.mjs';

const PAGE = '/self/jsf/contaduria/moduloCaja.jsf';
const HEADERS_POST = {
  'X-Requested-With': 'XMLHttpRequest',
  Accept: 'text/xml, application/xml, application/xhtml+xml, text/html;q=0.9, text/plain;q=0.8, image/png, */*;q=0.5',
  Referer: BASE + PAGE,
  Origin: BASE,
};
const HEADERS_NORMAL = { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', Referer: BASE + PAGE, Origin: BASE };
const unesc = (v) => String(v).replace(/&amp;/g, '&').replace(/&quot;/g, '\"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const txt = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

export class MpError extends Error {
  constructor(message, step, html) { super(message); this.name = 'MpError'; this.step = step; this.html = html; }
}

function optsFor(html, name) {
  const re = new RegExp(`<select[^>]+name="${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[\\s\\S]*?</select>`, 'i');
  const block = (html.match(re) || [])[0] || '';
  return [...block.matchAll(/<option[^>]*value="([^"]*)"[^>]*>([\s\S]*?)<\/option>/g)].map((m) => ({ value: unesc(m[1]), label: unesc(m[2]).replace(/\s+/g, ' ').trim() }));
}

async function postA4J(s, html, extra) {
  const vs = viewState(html);
  if (!vs) throw new MpError('sin ViewState', 'postA4J');
  const body = new URLSearchParams({
    AJAXREQUEST: '_viewRoot',
    tipoMov: '232',
    formId: 'formId',
    autoScroll: '',
    'javax.faces.ViewState': vs,
    ...extra,
  });
  const r = await s.postForm(PAGE, body, { headers: HEADERS_POST });
  if (r.status !== 200) throw new MpError(`POST ${r.status}`, 'postA4J', r.text);
  return r.text;
}

async function postNormal(s, html, extra) {
  const vs = viewState(html);
  if (!vs) throw new MpError('sin ViewState', 'postNormal');
  const body = new URLSearchParams({
    AJAXREQUEST: '_viewRoot',
    formId: 'formId',
    autoScroll: '',
    'javax.faces.ViewState': vs,
    ...extra,
  });
  const r = await s.postForm(PAGE, body, { headers: HEADERS_POST });
  if (r.status !== 200) throw new MpError(`POST ${r.status}`, 'postNormal', r.text);
  return r.text;
}

async function postDeleteMov(s, html, key) {
  const vs = viewState(html);
  const body = new URLSearchParams({ formId: 'formId', autoScroll: '', 'javax.faces.ViewState': vs, [key]: key });
  const r = await s.postForm(PAGE, body, { headers: HEADERS_NORMAL });
  if (r.status !== 200) throw new MpError(`DELETE MOV ${r.status}`, 'postDeleteMov', r.text);
  return r.text;
}

async function limpiarCarrito(s) {
  let html = (await s.getFollow('/self/StrutsJsfServlet?beanName=moduloCajaBean&method=init')).text;
  for (let i = 0; i < 10; i++) {
    const deuda = html.match(/registrosCaja:(\d+):j_id142/);
    if (deuda) {
      const key = deuda[0].replace('j_id142', 'j_id142');
      const vs = viewState(html);
      const body = new URLSearchParams({ AJAXREQUEST: '_viewRoot', tipoMov: '232', formId: 'formId', autoScroll: '', 'javax.faces.ViewState': vs, [key]: key, ajaxSingle: key });
      const r = await s.postForm(PAGE, body, { headers: HEADERS_POST });
      html = r.text;
      continue;
    }
    const mov = html.match(/j_id191:(\d+):j_id209/);
    if (mov) {
      html = await postDeleteMov(s, html, mov[0]);
      continue;
    }
    break;
  }
  return html;
}

export async function generarLinkCajaMp(s, input) {
  const { dni, monto, importe, ramo, poliza, certificado, nroCuota, cuota, endoso, email, moneda = '01', matricula } = input;
  const nroCuotaFinal = nroCuota ?? cuota;

  // Si no viene DNI pero sí matrícula, lo buscamos
  let dniFinal = dni;
  if (!dniFinal && matricula) {
    const url = `/self/editDatosAsegurado.do?matricula=${encodeURIComponent(matricula)}&tipoAsegurado=M&fromListado=true`;
    const r = await s.get(url, {
      headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: '*/*' },
    });
    if (r.status !== 200) throw new MpError(`fetchDni ${r.status}`, 'fetchDni');
    const val = inputValue(r.text, 'numeroDocumento');
    if (!val) throw new MpError(`DNI no encontrado para matricula ${matricula}`, 'fetchDni');
    dniFinal = val;
  }
  if (!dniFinal) throw new MpError('Falta DNI o matricula', 'input');

  let html = await limpiarCarrito(s);

  // 1) Seleccionar tipo 232
  html = await postA4J(s, html, { j_id159: 'j_id159', ajaxSingle: 'tipoMov' });

  // 2) Lookup DNI (llena select contactos)
  html = await postA4J(s, html, {
    'j_id161:2:j_id167': 'j_id161:2:j_id167',
    'j_id161:0:j_id170': moneda,
    'j_id161:1:j_id168': monto,
    'j_id161:2:j_id166': dni,
    'j_id161:3:j_id170': '',
  });

  const contactos = optsFor(html, 'j_id161:3:j_id170').filter((o) => o.value);
  const elegido = contactos.find((c) => c.value.toUpperCase().includes('MAIL:' + email.toUpperCase())) || contactos[0];
  if (!elegido) throw new MpError(`No hay contactos para DNI ${dni}`, 'contactos', html);

  // 3) Agregar movimiento MP
  html = await postA4J(s, html, {
    'j_id161:0:j_id170': moneda,
    'j_id161:1:j_id168': monto,
    'j_id161:2:j_id166': dni,
    'j_id161:3:j_id170': elegido.value,
    j_id186: 'j_id186',
  });
  // DEBUG: check cart state
  const movsAfterAdd = (html.match(/j_id191:\d+:j_id209/g) || []).length;
  const deudasAfterAdd = (html.match(/registrosCaja:\d+:j_id142/g) || []).length;
  const difAfterAdd = (txt(html).match(/DIFERENCIA:\s*([^\s]+)/) || [])[1] || '';
  console.log(`  [DEBUG] After add MP: movs=${movsAfterAdd} deudas=${deudasAfterAdd} dif=${difAfterAdd}`);

  // 4) Buscar deuda por póliza (SIN tipoMov en body)
  const vs4 = viewState(html);
  const body4 = new URLSearchParams({
    AJAXREQUEST: '_viewRoot',
    formId: 'formId',
    autoScroll: '',
    'javax.faces.ViewState': vs4,
    ramoSeleccionadoId: ramo,
    nuPolizaSeleccionadaId: poliza,
    certificadoSeleccionadoId: certificado,
    aceptarId: 'aceptarId',
  });
  let r4 = await s.postForm(PAGE, body4, { headers: HEADERS_POST });
  if (r4.status !== 200) throw new MpError(`POST deuda ${r4.status}`, 'buscarDeuda', r4.text);
  html = r4.text;
  // DEBUG
  const movsAfterDeuda = (html.match(/j_id191:\d+:j_id209/g) || []).length;
  const deudasAfterDeuda = (html.match(/registrosCaja:\d+:j_id142/g) || []).length;
  console.log(`  [DEBUG] After buscar deuda: movs=${movsAfterDeuda} deudas=${deudasAfterDeuda}`);

  // Extraer JSON de genTablaCaja
  let jsonM = html.match(/genTablaCaja\('(\{[\s\S]*?\})'\s*,\s*''\)/);
  if (!jsonM) {
    const m2 = html.match(/genTablaCaja\(['"](\{[\s\S]*?\})['"]/);
    if (m2) jsonM = m2;
  }
  if (!jsonM) throw new MpError('No vino genTablaCaja (deuda no encontrada)', 'genTablaCaja', html);
  const data = JSON.parse(unesc(jsonM[1]).replace(/\\'/g, "'"));
  const cuotaEncontrada = (data.lsCuotas || []).find((c) => String(c.numero) === String(nroCuotaFinal) && String(c.endoso) === String(endoso));
  if (!cuotaEncontrada) throw new MpError(`Cuota ${nroCuotaFinal}/${endoso} no encontrada en deuda`, 'cuota', html);

  // 5) Aplicar cuota al carrito (j_id284)
  html = await postA4J(s, html, {
    ramoSeleccionadoId: ramo,
    nuPolizaSeleccionadaId: poliza,
    certificadoSeleccionadoId: certificado,
    j_id284: 'j_id284',
    param1: nroCuotaFinal,
    param2: endoso,
    param3: String(importe),
    param4: '0',
  });
  // DEBUG
  const movsAfterCuota = (html.match(/j_id191:\d+:j_id209/g) || []).length;
  const deudasAfterCuota = (html.match(/registrosCaja:\d+:j_id142/g) || []).length;
  const difAfterCuota = (txt(html).match(/DIFERENCIA:\s*([^\s]+)/) || [])[1] || '';
  console.log(`  [DEBUG] After aplicar cuota: movs=${movsAfterCuota} deudas=${deudasAfterCuota} dif=${difAfterCuota}`);

  // 6) Confirmar
  html = await postA4J(s, html, { botonConfirmar: 'botonConfirmar' });

  // Parsear respuesta: nroIngreso, lote, mensaje (buscar en HTML crudo porque están en <script>)
  const ingresoM = html.match(/var ingreso\s*=\s*(\d+)\s*;/);
  const loteM = html.match(/var lote\s*=\s*(\d+)\s*;/);
  const t = txt(html);
  const msgM = t.match(/Transacci[oó]n exitosa; queda a la espera de la confirmacion del pago/);
  const errM = t.match(/Error[^<]{0,200}/);

  const nroIngreso = ingresoM ? Number(ingresoM[1]) : undefined;
  const lote = loteM ? Number(loteM[1]) : undefined;
  const ok = !!msgM && !errM;

  return {
    ok,
    nroIngreso,
    lote,
    monto,
    contacto: elegido.label,
    asegurado: data.asegurado,
    poliza: `${ramo}/${poliza}/${certificado}`,
    ramo,
    nroCuota: nroCuotaFinal,
    endoso,
    estado: ok ? 'PENDIENTE_MP' : 'ERROR',
    mensaje: ok ? 'Transacción exitosa; queda a la espera de la confirmacion del pago' : (errM ? errM[0] : 'Error desconocido'),
  };
}

// Helper: crear sesión y ejecutar todo en uno
export async function runCajaMp(user, pass, input, limiter, session) {
  const s = session || HttpSession.load(user, { limiter });
  if (!s) {
    const { ensureSession } = await import('./auth.mjs');
    const res = await ensureSession(user, { pass, limiter });
    if (!res || !res.cookies) throw new MpError(`Login falló`, 'login');
  }
  return generarLinkCajaMp(s, input);
}