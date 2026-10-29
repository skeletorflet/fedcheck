/**
 * Obtiene el DNI/CUIT del asegurado desde editDatosAsegurado.do
 * Uso: await fetchDni(s, matricula)
 */
import { viewState, inputValue } from './parse.mjs';

export async function fetchDni(s, matricula) {
  const url = `/self/editDatosAsegurado.do?matricula=${encodeURIComponent(matricula)}&tipoAsegurado=M&fromListado=true`;
  const r = await s.get(url, {
    headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: '*/*' },
  });
  if (r.status !== 200) throw new Error(`fetchDni ${r.status}`);
  const val = inputValue(r.text, 'numeroDocumento');
  if (!val) throw new Error(`DNI no encontrado para matricula ${matricula}`);
  return val;
}