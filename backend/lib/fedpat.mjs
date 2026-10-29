/**
 * Operaciones SELF por HTTP puro (sin navegador):
 *  - login (usuario/clave)
 *  - generación del listado de cuotas impagas (JSF/A4J)
 *  - contactos del asegurado
 *  - detalle de la cuota (x/12, importe, saldo)
 */
import {
  BASE, HOME, LOGIN_URL, PAGE_CUOTAS, HttpSession, HttpError,
} from './session.mjs';
import {
  attr, inputValue, jsJsonVar, parseA4JParams, parseSimilarity, viewState,
  findGenerarBoton, vencimientoISO, moneyAR, fechaCorta,
} from './parse.mjs';

/* ------------------------------------------------------------------ login */

/**
 * Login por HTTP. Si Cloudflare exige Turnstile, lanza HttpError con
 * `challenge: true` (el llamador puede sembrar cookies con el navegador).
 */
export async function loginHttp(s, user, pass, { turnstileToken = '' } = {}) {
  const home = await s.getFollow(HOME, { retryOnChallenge: false, retries: 1 });
  if (home.status === 429 || /Just a moment|Enable JavaScript/i.test(home.text)) {
    throw new HttpError('Cloudflare bloqueó el GET del login', { challenge: true, status: home.status });
  }
  if (!/id="loginForm"/.test(home.text)) {
    const ya = await s.check();
    if (ya.logged) return { ok: true, reused: true, prod: ya.prod, url: ya.url };
    return { ok: false, reason: 'no apareció el formulario de login', status: home.status };
  }

  const r = await s.postForm(
    LOGIN_URL,
    { usuario: String(user), password: String(pass), captcha: '', turnstileToken, Aceptar: 'Ingresar' },
    {
      headers: { Referer: HOME, Origin: BASE },
      redirect: 'manual',
      retryOnChallenge: false,
      retries: 0,
    },
  );

  if (r.status === 429 || (r.status === 403 && /Just a moment|Enable JavaScript/i.test(r.text))) {
    throw new HttpError('Cloudflare bloqueó el POST de login (Turnstile)', {
      challenge: true, status: r.status, body: r.text.slice(0, 300),
    });
  }

  if (r.status >= 300 && r.status < 400 && r.location) {
    const dest = /^https?:\/\//i.test(r.location) ? r.location : BASE + r.location;
    const page = await s.getFollow(dest, { retries: 1 });
    const logged = /logout\.do/.test(page.text) || /loadProductor\.do/.test(page.url || '');
    if (logged) {
      const prod = (page.text.match(/Prod\.?:?\s*(\d+)/) || [])[1] || null;
      if (prod && String(prod) !== String(user)) {
        return { ok: false, reason: `quedó logueado el productor ${prod}`, prod };
      }
      return { ok: true, prod, url: page.url };
    }
    if (/id="loginForm"/.test(page.text)) {
      const err = (page.text.match(/Usuario o clave incorrectos|clave incorrecta|bloquead[ao]|ERROR EN LA SOLICITUD/i) || [])[0];
      return { ok: false, reason: err || 'el sitio volvió al formulario' };
    }
    return { ok: false, reason: `destino inesperado (${page.status})` };
  }

  const msg = (r.text.match(/Usuario o clave incorrectos|clave incorrecta|bloquead[ao]|ERROR EN LA SOLICITUD/i) || [])[0];
  return { ok: false, reason: msg || `login devolvió ${r.status}`, status: r.status };
}

/* --------------------------------------------------------------- listado */

function rangoDelTitulo(html) {
  const m = html.match(/cuotas impagas entre el (\d{2}\/\d{2}\/\d{4}) y el (\d{2}\/\d{2}\/\d{4})/i);
  return m ? { d: m[1], h: m[2] } : { d: '', h: '' };
}

function nombreDelTitulo(html) {
  const m = html.match(/del productor\s+(\d+)\s*-\s*([^<\n|]+)/i);
  return m ? { user: m[1], nombre: m[2].trim() } : null;
}

/**
 * Genera el listado de cuotas impagas y devuelve el JSON de la grilla.
 * @param {HttpSession} s
 * @param {{desde?:string, hasta?:string}} opts fechas dd/mm/aaaa (o dd/mm/aa)
 */
export async function getListado(s, { desde, hasta } = {}) {
  const entryPath = '/self/StrutsJsfServlet?beanName=menuBean&method=cuotasImpagas';
  const entry = await s.getFollow(entryPath);
  if (entry.status !== 200) throw new HttpError(`entrada al listado: HTTP ${entry.status}`, { status: entry.status });

  const html = entry.text;
  if (!/id="formId"/.test(html)) {
    throw new HttpError('la página del listado no trajo el formulario (¿sesión vencida?)', {
      status: entry.status, login: /id="loginForm"/.test(html),
    });
  }

  const pageUrl = entry.url || PAGE_CUOTAS;
  const titulo = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]?.replace(/\s+/g, ' ').trim() || '';
  const prodInfo = nombreDelTitulo(html);
  const rango = rangoDelTitulo(html);
  const btn = findGenerarBoton(html);

  // Si la página ya viene con el listado generado (misma sesión), se puede reutilizar.
  if (!btn) {
    const grid = jsJsonVar(html, 'jsonGridCuotasImpagas');
    if (grid) {
      return {
        ok: true, reutilizado: true, productor: prodInfo?.user || s.user, nombre: prodInfo?.nombre || '',
        titulo, rango, grid, fechas: jsJsonVar(html, 'jsonFechas') || {},
      };
    }
    throw new HttpError('no encontré el botón "Generar listado"', { titulo });
  }

  const vs = viewState(html);
  if (!vs) throw new HttpError('la página no trajo javax.faces.ViewState');

  const btnId = attr(btn, 'id');
  const btnName = attr(btn, 'name');
  const onclick = attr(btn, 'onclick') || '';
  const params = parseA4JParams(onclick);
  const sim = parseSimilarity(onclick) || btnId;

  const d1 = desde ? fechaCorta(desde) : (inputValue(html, 'fecha-desde') || '');
  const d2 = hasta ? fechaCorta(hasta) : (inputValue(html, 'fecha-hasta') || '');

  const body = new URLSearchParams({
    AJAXREQUEST: '_viewRoot',
    'fecha-desde': d1,
    'fecha-hasta': d2,
    stIncumplimiento: inputValue(html, 'stIncumplimiento') ?? '1',
    selCobradores: inputValue(html, 'selCobradores') ?? '',
    j_id116: inputValue(html, 'j_id116') ?? '0',
    currencyFormatter: inputValue(html, 'currencyFormatter') ?? '',
    pagoComplete: inputValue(html, 'pagoComplete') ?? 'true',
    mostrarCajaComplete: inputValue(html, 'mostrarCajaComplete') ?? 'false',
    formId: 'formId',
    autoScroll: '',
    ...params,
    'javax.faces.ViewState': vs,
    [sim]: sim,
  });

  const r = await s.postForm(pageUrl.replace(BASE, ''), body, {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      Accept: '*/*',
      Origin: BASE,
      Referer: pageUrl,
    },
    redirect: 'manual',
  });

  if (r.status !== 200) {
    throw new HttpError(`generar listado: HTTP ${r.status}`, { status: r.status, body: r.text.slice(0, 400) });
  }
  if (/id="loginForm"/.test(r.text)) throw new HttpError('sesión vencida al generar el listado');

  const grid = jsJsonVar(r.text, 'jsonGridCuotasImpagas');
  if (!grid) {
    const update = (r.text.match(/Ajax-Update-Ids" content="([^"]+)"/) || [])[1] || '-';
    throw new HttpError('la respuesta A4J no trajo la grilla', { update, len: r.text.length });
  }

  return {
    ok: true,
    reutilizado: false,
    productor: prodInfo?.user || s.user,
    nombre: prodInfo?.nombre || '',
    titulo,
    rango: rango.d ? rango : { d: d1, h: d2 },
    grid,
    fechas: jsJsonVar(r.text, 'jsonFechas') || {},
    rangoPedido: { d: d1, h: d2 },
  };
}

/** Convierte el JSON de la grilla al formato de deudas.json. */
export function normalizarListado({ grid, fechas }, user) {
  const rows = [];
  for (const [mk, porFecha] of Object.entries(grid || {})) {
    const matriculaClave = mk.replace(/^M/, '');
    for (const [fecha, arr] of Object.entries(porFecha || {})) {
      const dia = String(fechas?.[fecha] || '').replace(/\*+$/, '').trim() || fecha;
      for (const q of arr || []) {
        // Misma regla que hlp.getLabel() de cuotasImpagas.js:
        //   texto = (tipoGarantiaCobertura !== 'N') ? 'G' : color
        //   + '1' solo si obligacionPagoPermitida && primerCuota
        const baseMarca = q.tipoGarantiaCobertura && q.tipoGarantiaCobertura !== 'N' ? 'G' : q.color;
        const marca = `${baseMarca || ''}${q.obligacionPagoPermitida && q.primerCuota ? '1' : ''}`;
        rows.push({
          productor: String(q.codigoProductor || user),
          asegurado: q.asegurado || '',
          matricula: String(q.matricula ?? matriculaClave),
          poliza: `${q.ramo}/${q.poliza}/${q.certificado}`,
          vencimiento: q.fechaVencimiento || '',
          vencimientoISO: vencimientoISO(q.fechaVencimiento),
          saldo: Number(q.monto) || 0,
          saldoTexto: moneyAR(q.monto, q.signoMoneda || '$'),
          estado: q.estado || '',
          marca,
          dia,
          nroOperacion: String(q.observacion2 ?? ''),
          cajaId: `${String(q.id).replace(/\//g, '-')}-${q.fechaVencimientoStr}`,
          ramo: q.ramo,
          polizaNumero: q.poliza,
          certificado: q.certificado,
          referenciaMultirramica: q.referenciaMultirramica,
          alias: q.alias,
          producto: q.producto,
          pagoEnTramite: !!q.pagoEnTramite,
          montoPagoEnTramite: Number(q.montoPagoEnTramite) || 0,
          obligacionPagoPermitida: !!q.obligacionPagoPermitida,
          adheridoSMSDeuda: !!q.adheridoSMSDeuda,
          primerCuota: !!q.primerCuota,
          tipoGarantiaCobertura: q.tipoGarantiaCobertura || '',
        });
      }
    }
  }
  // dedupe por cajaId
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    if (seen.has(r.cajaId)) continue;
    seen.add(r.cajaId);
    out.push(r);
  }
  out.sort((a, b) =>
    (a.vencimientoISO || '').localeCompare(b.vencimientoISO || '') ||
    a.matricula.localeCompare(b.matricula) ||
    a.poliza.localeCompare(b.poliza));
  return out;
}

/* -------------------------------------------------------------- contactos */

function parseContactosHtml(html) {
  const telefs = {};
  const mails = {};
  for (const m of html.matchAll(/<input\b[^>]*>/gi)) {
    const tag = m[0];
    const name = attr(tag, 'name') || '';
    const value = (attr(tag, 'value') || '').trim();
    let x = name.match(/^telefono\[(\d+)\]\.(prefijo|prefijoCelular|caracteristica|numeroTelefono|descripcion|telefonoNoValidado)$/);
    if (x) { (telefs[x[1]] ||= {})[x[2]] = value; continue; }
    x = name.match(/^mail\[(\d+)\]\.(mail|descripcion|mailNoValidado)$/);
    if (x) (mails[x[1]] ||= {})[x[2]] = value;
  }
  const tels = Object.values(telefs)
    .filter((t) => t.numeroTelefono)
    .map((t) => ({
      raw: `${t.prefijo || ''}${t.prefijoCelular || ''}${t.caracteristica || ''}${t.numeroTelefono || ''}`.replace(/\s/g, ''),
      desc: t.descripcion || '',
      celular: !!t.prefijoCelular,
    }));
  const ms = Object.values(mails)
    .filter((m) => m.mail)
    .map((m) => ({ mail: m.mail.toLowerCase(), desc: m.descripcion || '' }));
  return {
    telefonos: [...new Map(tels.map((t) => [t.raw, t])).values()],
    mails: [...new Map(ms.map((m) => [m.mail, m])).values()],
  };
}

export async function getContactos(s, matricula) {
  const path = `/self/editDatosAsegurado.do?matricula=${encodeURIComponent(matricula)}&tipoAsegurado=M&fromListado=true`;
  const r = await s.get(path, {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      Accept: '*/*',
      Referer: PAGE_CUOTAS,
    },
    retries: 2,
  });
  if (r.status !== 200) throw new HttpError(`contacto ${matricula}: HTTP ${r.status}`, { status: r.status });
  if (/<title>\s*PROD - Errores/i.test(r.text)) throw new HttpError(`contacto ${matricula}: página de error`);
  if (/id="loginForm"/.test(r.text)) throw new HttpError('sesión vencida al pedir contactos');
  return parseContactosHtml(r.text);
}

/* ------------------------------------------------------------------ cuota */

export async function getDetalleCuota(s, cajaId) {
  const path = `/self/generarRemesaCaja/obtenerOpcionesCuotasImpagas.do?cuotaId=${encodeURIComponent(cajaId)}`;
  const r = await s.get(path, {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      Referer: PAGE_CUOTAS,
    },
    retries: 2,
  });
  if (r.status !== 200) throw new HttpError(`cuota ${cajaId}: HTTP ${r.status}`, { status: r.status });
  try {
    return JSON.parse(r.text);
  } catch {
    throw new HttpError(`cuota ${cajaId}: respuesta no JSON`);
  }
}

export function detalleParaCache(j) {
  const first = j?.lsCuotas?.[0];
  const desc = first?.descripcion || '';
  const m = desc.match(/^(\d+)\/(\d+)/);
  return {
    cuotaNumero: m ? Number(m[1]) : null,
    cuotaTotal: m ? Number(m[2]) : null,
    descripcion: desc,
    importeCuota: first?.importe ?? null,
    saldoAcumulado: first?.saldo ?? null,
    asegurado: j?.asegurado || '',
  };
}

/**
 * Descarga la cuponera (reporte de cuotas impagas) para un asegurado.
 * Devuelve el ArrayBuffer del PDF.
 * @param {HttpSession} s
 * @param {string} matricula
 */
export async function getCuponeraPdf(s, matricula) {
  // Calentar la sesión visitando la página de cuotas primero
  // (el reporte requiere una sesión inicializada en ese contexto)
  await s.getFollow(PAGE_CUOTAS, { retries: 1 });
  const path = `/self/StrutsJsfServlet?beanName=cuotasImpagasBean&method=getReporteCuotasImpagasByClienteGrupo&matricula=${encodeURIComponent(matricula)}`;
  return s.getBlob(path, { label: `cuponera ${matricula}` });
}

/**
 * Sanitiza un nombre para usarlo como nombre de carpeta/archivo.
 */
export function sanitizeFilename(name) {
  return String(name || 'sin_nombre')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')          // chars ilegales
    .replace(/\s+/g, ' ')                            // espacios múltiples
    .trim()
    .slice(0, 120);
}
