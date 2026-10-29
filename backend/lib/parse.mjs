/** Helpers de parseo HTML/JS para SELF (sin DOM, sin dependencias). */

export const attr = (tag, name) => {
  if (!tag) return null;
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i')) || tag.match(new RegExp(`\\b${name}\\s*=\\s*'([^']*)'`, 'i'));
  return m ? m[1] : null;
};

/** valor de un <input id="..."> */
export const inputValue = (html, id) => {
  for (const m of html.matchAll(/<input\b[^>]*>/gi)) {
    if (attr(m[0], 'id') === id) return attr(m[0], 'value') ?? '';
  }
  return null;
};

/** Busca `var nombre = '...'` (string JS) y devuelve el contenido crudo. */
export const jsStringVar = (html, name) => {
  const re = new RegExp(`${name}\\s*=\\s*'((?:[^'\\\\]|\\\\.)*)'`);
  const m = html.match(re);
  return m ? m[1] : null;
};

/** Convierte el string JS de un JSON embebido (jsonGrid...) a objeto. */
export const jsJsonVar = (html, name) => {
  const raw = jsStringVar(html, name);
  if (raw == null || raw === '') return null;
  // El contenido es JSON con comillas dobles; solo puede traer \' escapado por el JS.
  const unescaped = raw.replace(/\\'/g, "'");
  try {
    return JSON.parse(unescaped);
  } catch {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
};

/** Parámetros de un onclick de A4J: parameters:{'j_id142':'j_id142',...} */
export const parseA4JParams = (onclick) => {
  const out = {};
  const block = String(onclick || '').match(/'parameters'\s*:\s*\{([^}]*)\}/);
  if (!block) return out;
  for (const m of block[1].matchAll(/'([^']+)'\s*:\s*'([^']*)'/g)) out[m[1]] = m[2];
  return out;
};

export const parseSimilarity = (onclick) => {
  const m = String(onclick || '').match(/'similarityGroupingId'\s*:\s*'([^']*)'/);
  return m ? m[1] : null;
};

/** Primer ViewState de la página. */
export const viewState = (html) => (html.match(/name="javax\.faces\.ViewState"[^>]*value="([^"]+)"/) || [])[1] || null;

/** Botón "Generar listado" (el id j_idNNN cambia según el estado de la página). */
export const findGenerarBoton = (html) => {
  for (const m of html.matchAll(/<input\b[^>]*>/gi)) {
    const tag = m[0];
    if ((attr(tag, 'value') || '').trim().toLowerCase() === 'generar listado') return tag;
  }
  return null;
};

const MESES = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

/** "Oct 6, 2026" -> "2026-10-06" */
export const vencimientoISO = (s) => {
  const m = String(s || '').match(/([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})/);
  if (!m) return '';
  const mes = MESES[m[1]];
  if (!mes) return '';
  return `${m[3]}-${String(mes).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
};

/** Número en formato es-AR -> float */
export const numAR = (s) =>
  Number(String(s ?? '0').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;

/** float -> "$ 86.466,00" */
export const moneyAR = (n, signo = '$') =>
  `${signo} ${Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** dd/mm/aaaa -> dd/mm/aa (el sitio usa 2 dígitos) */
export const fechaCorta = (s) => {
  const m = String(s || '').match(/^(\d{2})\/(\d{2})\/(\d{2,4})$/);
  if (!m) return s;
  return `${m[1]}/${m[2]}/${m[3].slice(-2)}`;
};

/** dd/mm/aaaa -> ISO */
export const fechaISO = (s) => {
  const m = String(s || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
};
