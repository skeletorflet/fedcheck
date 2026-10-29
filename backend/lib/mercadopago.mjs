/**
 * MercadoPago Checkout Pro: creación de links de pago por cuota.
 *
 *   POST https://api.mercadopago.com/checkout/preferences
 *   Authorization: Bearer <ACCESS_TOKEN>
 *
 * La respuesta trae `init_point` (link de producción) y `sandbox_init_point`
 * (link de prueba). El comprador paga ahí con tarjeta, transferencia, efectivo, etc.
 *
 * Credenciales (en este orden):
 *   1. variable de entorno MP_ACCESS_TOKEN
 *   2. mp.json  ->  { "access_token": "APP_USR-...", "public_key": "..." }
 *
 * El token se obtiene en https://www.mercadopago.com.ar/developers/panel/app
 * (Aplicación -> Credenciales de producción). No se loguea nunca.
 */
import fs from 'node:fs';

export const MP_API = 'https://api.mercadopago.com';

export class MpError extends Error {
  constructor(message, info = {}) {
    super(message);
    Object.assign(this, info);
  }
}

export function loadMpCredentials() {
  const env = (process.env.MP_ACCESS_TOKEN || '').trim();
  if (env) return { access_token: env, public_key: (process.env.MP_PUBLIC_KEY || '').trim(), source: 'MP_ACCESS_TOKEN' };

  for (const f of ['mp.json', '.mp.json']) {
    if (!fs.existsSync(f)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(f, 'utf8'));
      const token = String(j.access_token || j.accessToken || '').trim();
      if (token) return { access_token: token, public_key: j.public_key || '', source: f };
    } catch {
      // archivo inválido: se ignora y se sigue
    }
  }
  return null;
}

export const esTokenTest = (token) => /^TEST-/i.test(String(token || ''));

const pad = (n) => String(n).padStart(2, '0');

/**
 * Fecha de expiración del link en ISO 8601 con offset de Argentina (-03:00).
 * Por defecto: `dias` días desde ahora, a las 23:59:59.
 */
export function fechaExpiracion(dias = 30, now = new Date()) {
  if (!dias || dias <= 0) return null;
  // fecha calendario en Argentina (UTC-3), a las 23:59:59 de ese día
  const d = new Date(now.getTime() - 3 * 3600000 + dias * 86400000);
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  return `${y}-${m}-${day}T23:59:59.000-03:00`;
}

const tituloCuota = (q) => {
  const cuota = q.cuotaNumero && q.cuotaTotal ? ` (${q.cuotaNumero}/${q.cuotaTotal})` : '';
  return `Cuota SELF ${q.poliza}${cuota}`.slice(0, 250);
};

const descripcionCuota = (q) => {
  const iso = q.vencimientoISO || '';
  const venc = iso ? iso.split('-').reverse().join('/') : (q.vencimiento || '');
  return `${q.asegurado || 'Asegurado'} - vence ${venc}`.slice(0, 250);
};

/**
 * Payload de la preferencia (exportado para --dry-run y tests).
 * @param {object} q cuota de deudas_full.json
 * @param {{dias?:number, notificationUrl?:string, backUrls?:object, statement?:string, sandbox?:boolean}} opts
 */
export function buildPreference(q, opts = {}) {
  if (!q || !q.cajaId) throw new Error('cuota inválida: falta cajaId');
  const monto = Number(q.saldo);
  if (!Number.isFinite(monto) || monto <= 0) throw new Error(`monto inválido para ${q.cajaId}: ${q.saldo}`);

  const body = {
    items: [
      {
        id: q.cajaId,
        title: tituloCuota(q),
        description: descripcionCuota(q),
        quantity: 1,
        currency_id: 'ARS',
        unit_price: Math.round(monto * 100) / 100,
      },
    ],
    external_reference: q.cajaId,
    statement_descriptor: (opts.statement || 'FEDPAT').slice(0, 22),
    metadata: {
      caja_id: q.cajaId,
      productor: String(q.productor || ''),
      matricula: String(q.matricula || ''),
      poliza: String(q.poliza || ''),
      cuota: q.cuotaNumero ?? '',
      cuota_total: q.cuotaTotal ?? '',
      asegurado: q.asegurado || '',
    },
  };

  if (opts.notificationUrl) {
    if (!/^https:\/\//i.test(opts.notificationUrl)) {
      throw new MpError('notification_url debe ser una URL HTTPS pública');
    }
    body.notification_url = opts.notificationUrl;
  }
  if (opts.backUrls) {
    body.back_urls = opts.backUrls;
    body.auto_return = 'approved';
  }

  const exp = fechaExpiracion(opts.dias ?? 30);
  if (exp) {
    body.expires = true;
    body.expiration_date_to = exp;
  }
  return body;
}

async function mpFetch(path, { method = 'GET', body, token, timeout = 30000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(MP_API + path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const text = await r.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
    if (!r.ok) {
      const msg = json?.message || json?.error || json?.cause?.[0]?.description || `HTTP ${r.status}`;
      throw new MpError(`MercadoPago ${r.status}: ${msg}`, { status: r.status, response: json });
    }
    return json;
  } catch (e) {
    if (e instanceof MpError) throw e;
    if (e.name === 'AbortError') throw new MpError('MercadoPago: timeout');
    throw new MpError(`MercadoPago: ${e.message}`);
  } finally {
    clearTimeout(t);
  }
}

/**
 * Crea la preferencia y devuelve el link.
 * @returns {Promise<{preference_id:string, init_point:string, sandbox_init_point?:string, link:string, expira?:string}>}
 */
export async function crearPreferencia(q, opts = {}) {
  const cred = loadMpCredentials();
  if (!cred) {
    throw new MpError(
      'falta el access token de MercadoPago. Definí MP_ACCESS_TOKEN o creá mp.json con {"access_token":"APP_USR-..."}',
      { faltanCredenciales: true },
    );
  }

  const body = buildPreference(q, opts);
  const json = await mpFetch('/checkout/preferences', { method: 'POST', body, token: cred.access_token });

  const test = esTokenTest(cred.access_token);
  const init = json.init_point || '';
  const sandbox = json.sandbox_init_point || '';
  return {
    preference_id: json.id,
    init_point: init,
    sandbox_init_point: sandbox,
    link: (opts.sandbox ?? test) ? (sandbox || init) : (init || sandbox),
    expira: body.expiration_date_to || null,
    collector_id: json.collector_id,
    raw: json,
  };
}

export async function getPreferencia(id) {
  const cred = loadMpCredentials();
  if (!cred) throw new MpError('falta el access token de MercadoPago', { faltanCredenciales: true });
  return mpFetch(`/checkout/preferences/${encodeURIComponent(id)}`, { token: cred.access_token });
}

/** Busca pagos asociados a un external_reference (para conciliar). */
export async function buscarPagosPorReferencia(externalReference) {
  const cred = loadMpCredentials();
  if (!cred) throw new MpError('falta el access token de MercadoPago', { faltanCredenciales: true });
  return mpFetch(`/v1/payments/search?external_reference=${encodeURIComponent(externalReference)}`, {
    token: cred.access_token,
  });
}
