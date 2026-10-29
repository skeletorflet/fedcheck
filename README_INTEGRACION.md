# FED Check - Sistema de Consulta de Deudas y Cuponeras

Sistema 100% HTTP (sin navegador) para consultar cuotas impagas de FEDPAT, enriquecer con contactos/detalle, descargar cuponeras PDF por asegurado y generar Excel consolidado.

---

## 🏗️ ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────────────┐
│                    accounts.json                                 │
│  (usuarios/contraseñas de productores FED)                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  backend/run.mjs  →  ORQUESTADOR PRINCIPAL                      │
│  • Pipeline multi-cuenta                                        │
│  • Manejo de sesiones (reutiliza cookies)                       │
│  • Fallback login navegador si Cloudflare exige Turnstile       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ scrape.mjs    │  │ enrich.mjs    │  │ cuponeras.mjs │
│ (PASO 1)      │  │ (PASO 2)      │  │ (PASO 3)      │
│ • Listado     │  │ • Contactos   │  │ • PDF por     │
│   cuotas      │  │   (tel/mail)  │  │   asegurado   │
│   impagas     │  │ • Detalle     │  │ • Carpeta     │
│ • HTTP puro   │  │   cuota (x/12)│  │   por nombre  │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ deudas.json   │  │ deudas_full.  │  │ cuponeras/    │
│ deudas.csv    │  │ json          │  │ <Asegurado>/  │
│ meta.json     │  │ enrich_cache. │  │   *_cuponera_ │
│               │  │ json          │  │   YYYYMMDD.pdf│
└───────────────┘  └───────────────┘  └───────────────┘
        │                  │
        └────────┬─────────┘
                 ▼
        ┌───────────────┐
        │ build_xlsx.py │  (PASO 4) Excel por cuenta
        │ build_all.py  │  (PASO 5) Consolidado multi-cuenta
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │ deudas.xlsx   │
        │ deudas_todas. │
        │ xlsx          │
        └───────────────┘
```

---

## 📦 ESTRUCTURA DE ARCHIVOS DE SALIDA

### Por cuenta (`salida/<productor>/`)

| Archivo | Descripción |
|---------|-------------|
| `deudas.json` | Listado crudo de cuotas impagas (scrape) |
| `deudas.csv` | Mismo listado en CSV (sep `;`) |
| `meta.json` | Resumen: clientes, cuotas, total, rango, productor |
| `deudas_full.json` | **Unificado** cuotas + contactos + detalle cuota (enrich) |
| `enrich_cache.json` | **Compartido** cache global de contactos y detalle cuota |
| `links_pago.json/.csv` | Links de MercadoPago (opcional, `link_pago.mjs`) |
| `cuponeras/` | **NUEVO** PDFs organizados por asegurado |
| `deudas.xlsx` | Excel formateado por cuenta |
| `deudas_todas.xlsx` | Consolidado multi-cuenta (raíz del proyecto) |

### Estructura `cuponeras/`
```
cuponeras/
├── index.csv                                    # Índice: matricula;asegurado;archivo;tamaño;fecha
├── APELLIDO NOMBRE/
│   └── APELLIDO NOMBRE_cuponera_20261029.pdf   # PDF reporte cuotas impagas
└── OTRO ASEGURADO/
    └── OTRO ASEGURADO_cuponera_20261029.pdf
```

---

## 🔌 COMANDOS DISPONIBLES

### 1. Pipeline completo (recomendado)
```bash
# Todas las cuentas de accounts.json
node backend/run.mjs

# Solo una cuenta
node backend/run.mjs 7224

# Varias cuentas
node backend/run.mjs 7224 26620 29494

# Rango de fechas manual (dd/mm/aa o dd/mm/aaaa)
node backend/run.mjs 01/09/26 30/09/26

# Concurrencia en enrich (default 3)
node backend/run.mjs --concurrency 4

# Sin fallback navegador (falla si hay Turnstile)
node backend/run.mjs --no-browser

# Saltar pasos
node backend/run.mjs --skip-enrich      # Solo scrape + excel
node backend/run.mjs --skip-excel       # Solo scrape + enrich + cuponeras
node backend/run.mjs --skip-cuponeras   # Solo scrape + enrich + excel
```

### 2. Módulos independientes

#### Scrape - Listado de cuotas impagas
```bash
node backend/scrape.mjs --user 7224
node backend/scrape.mjs --user 7224 --desde 01/09/26 --hasta 30/09/26
node backend/scrape.mjs --user 7224 --out salida/7224 --no-browser
```
**Salida:** `salida/7224/deudas.json`, `deudas.csv`, `meta.json`

#### Enriquecer - Contactos y detalle de cuota
```bash
node backend/enrich.mjs --user 7224
node backend/enrich.mjs --user 7224 --concurrency 4
node backend/enrich.mjs --user 7224 --mat 6998123 --limit 3   # prueba rápida
node backend/enrich.mjs --user 7224 --refresh                 # forzar re-consulta
```
**Salida:** `salida/7224/deudas_full.json` (usa `enrich_cache.json` compartido)

#### Cuponeras - PDF por asegurado
```bash
node backend/cuponeras.mjs --user 7224
node backend/cuponeras.mjs --user 7224 --limit 10
node backend/cuponeras.mjs --user 7224 --mat 6998123
node backend/cuponeras.mjs --user 7224 --force               # re-descargar
```
**Salida:** `salida/7224/cuponeras/<Asegurado>/<Asegurado>_cuponera_YYYYMMDD.pdf` + `index.csv`

#### Links de pago MercadoPago
```bash
node backend/link_pago.mjs --user 7224 --all --dias 15
node backend/link_pago.mjs --user 7224 --mat 6998123
node backend/link_pago.mjs --user 7224 --dry-run             # solo muestra payload
```
**Requiere:** `mp.json` con `access_token` o variable `MP_ACCESS_TOKEN`

---

## 📊 ESTRUCTURA DE DATOS (JSON)

### `deudas.json` / `deudas_full.json`
```json
{
  "generado": "2026-10-29T14:15:24.531Z",
  "productor": "7224",
  "nombre": "TOVAL JUAN CARLOS",
  "rango": { "d": "01/01/2020", "h": "29/10/2026" },
  "clientes": 98,
  "cuotas": [
    {
      "productor": "7224",
      "asegurado": "TARIFENO ALICIA ELBA",
      "matricula": "5433037",
      "poliza": "4/35149500/0",
      "vencimiento": "29/10/2026",
      "vencimientoISO": "2026-10-29",
      "saldo": 83689.00,
      "saldoTexto": "$ 83.689,00",
      "estado": "VIGENTE",
      "marca": "V1",
      "dia": "Jue 29/10",
      "nroOperacion": "",
      "cajaId": "4-35149500-0-29/10/2026",
      "ramo": "4",
      "polizaNumero": "35149500",
      "certificado": "0",
      "referenciaMultirramica": "",
      "alias": "",
      "producto": "AUTOMOTORES",
      "pagoEnTramite": false,
      "montoPagoEnTramite": 0,
      "obligacionPagoPermitida": true,
      "adheridoSMSDeuda": false,
      "primerCuota": true,
      "tipoGarantiaCobertura": "",
      // --- CAMPOS ENRIQUECIDOS (solo en deudas_full.json) ---
      "telefonos": [
        { "raw": "1155551234", "desc": "Celular", "celular": true }
      ],
      "mails": [
        { "mail": "cliente@email.com", "desc": "Personal" }
      ],
      "cuotaNumero": 1,
      "cuotaTotal": 12,
      "descripcionCuota": "1/12 - AUTOMOTORES - Poliza 35149500"
    }
  ],
  "sinDetalle": 0,
  "fuente": "http",
  "enriquecido": "2026-10-29T14:15:24.531Z"
}
```

### `meta.json`
```json
{
  "user": "7224",
  "nombre": "TOVAL JUAN CARLOS",
  "rango": { "d": "01/01/2020", "h": "29/10/2026" },
  "generado": "2026-10-29T14:15:24.531Z",
  "clientes": 98,
  "cuotas": 107,
  "total": 9918245.03,
  "fuente": "http"
}
```

### `cuponeras/index.csv`
```csv
matricula;asegurado;archivo;tamaño_bytes;fecha_descarga
"5433037";"TARIFENO ALICIA ELBA";"salida/7224/cuponeras/TARIFENO ALICIA ELBA/TARIFENO ALICIA ELBA_cuponera_20261029.pdf";"57018";"2026-10-29T14:15:24.531Z"
```

---

## 🔍 CÓMO INTEGRAR EN TU APLICACIÓN

### Opción A: Leer archivos generados (más simple)
```javascript
// 1. Leer deudas_full.json de una cuenta
const deudas = JSON.parse(fs.readFileSync('salida/7224/deudas_full.json', 'utf8'));

// 2. Filtrar por asegurado, póliza, vencimiento, etc.
const deudasCliente = deudas.cuotas.filter(q => q.matricula === '5433037');
const deudasPoliza = deudas.cuotas.filter(q => q.polizaNumero === '35149500');
const deudasVencidas = deudas.cuotas.filter(q => q.vencimientoISO < '2026-10-29');

// 3. Obtener PDF de cuponera
const pdfPath = `salida/7224/cuponeras/${sanitize(asegurado)}/${sanitize(asegurado)}_cuponera_${fechaHoy}.pdf`;
if (fs.existsSync(pdfPath)) {
  const pdfBuffer = fs.readFileSync(pdfPath);
  // enviar por WhatsApp, email, etc.
}
```

### Opción B: Usar la librería directamente (control total)
```javascript
import { ensureSession } from './backend/lib/auth.mjs';
import { getListado, normalizarListado, getContactos, getDetalleCuota, getCuponeraPdf } from './backend/lib/fedpat.mjs';
import { getAccount } from './accounts.mjs';
import { RateLimiter } from './backend/lib/session.mjs';

async function consultarDeudas(productor, { desde, hasta } = {}) {
  const acc = getAccount(productor);
  const limiter = new RateLimiter({ minInterval: 300 });
  const session = await ensureSession(productor, { pass: acc.pass, limiter });
  
  const listado = await getListado(session, { desde, hasta });
  const cuotas = normalizarListado(listado, productor);
  
  return { productor, nombre: listado.nombre, cuotas };
}

async function enriquecerCuotas(session, cuotas) {
  const matriculas = [...new Set(cuotas.map(q => q.matricula))];
  const cajaIds = [...new Set(cuotas.map(q => q.cajaId).filter(Boolean))];
  
  // Contactos en paralelo
  const contactos = {};
  for (const mat of matriculas) {
    contactos[mat] = await getContactos(session, mat);
  }
  
  // Detalle cuota en paralelo
  const detalles = {};
  for (const id of cajaIds) {
    const det = await getDetalleCuota(session, id);
    detalles[id] = det;
  }
  
  // Merge
  for (const q of cuotas) {
    q.telefonos = contactos[q.matricula]?.telefonos || [];
    q.mails = contactos[q.matricula]?.mails || [];
    const det = detalles[q.cajaId] || {};
    q.cuotaNumero = det.cuotaNumero;
    q.cuotaTotal = det.cuotaTotal;
    q.descripcionCuota = det.descripcion;
  }
  return cuotas;
}

async function descargarCuponera(session, matricula) {
  return await getCuponeraPdf(session, matricula); // ArrayBuffer (PDF)
}
```

### Opción C: CLI desde tu app (subproceso)
```javascript
import { spawn } from 'child_process';

function runScrape(user, desde, hasta) {
  return new Promise((resolve, reject) => {
    const args = ['backend/scrape.mjs', '--user', user];
    if (desde) args.push('--desde', desde, '--hasta', hasta || desde);
    const proc = spawn('node', args, { stdio: 'inherit' });
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`exit ${code}`)));
  });
}
```

---

## 🔑 CAMPOS CLAVE PARA BÚSQUEDAS

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `matricula` | string | ID único del asegurado en FED | `"5433037"` |
| `asegurado` | string | Nombre completo | `"TARIFENO ALICIA ELBA"` |
| `poliza` | string | `ramo/numero/certificado` | `"4/35149500/0"` |
| `ramo` | string | Código de ramo | `"4"` (Automotores), `"13"` (Caución) |
| `polizaNumero` | string | Número de póliza | `"35149500"` |
| `certificado` | string | Certificado/endoso | `"0"` |
| `cajaId` | string | ID único para caja/pago | `"4-35149500-0-29/10/2026"` |
| `vencimientoISO` | string | Fecha ISO para ordenar | `"2026-10-29"` |
| `marca` | string | Color + primer cuota | `"V1"` (Verde 1ra), `"R"` (Roja), `"A"` (Amarilla) |
| `obligacionPagoPermitida` | bool | Si se puede pagar por caja | `true/false` |
| `primerCuota` | bool | Si es la primera cuota | `true/false` |
| `cuotaNumero` | number | Nro de cuota (x/total) | `1` |
| `cuotaTotal` | number | Total de cuotas del plan | `12` |

### Colores / Marcas
| Marca | Significado |
|-------|-------------|
| `V` / `V1` | Verde - Al día / Primera cuota verde |
| `A` / `A1` | Amarilla - Vencida < 30 días |
| `R` / `R1` | Roja - Vencida > 30 días |
| `G` / `G1` | Gris - Con garantía/cobertura |

---

## 🛠️ CONFIGURACIÓN

### `accounts.json`
```json
{
  "primary": "7224",
  "accounts": [
    { "user": "7224", "pass": "TU_CLAVE" },
    { "user": "26620", "pass": "OTRA_CLAVE" }
  ]
}
```

### `mp.json` (opcional, para links de pago)
```json
{ "access_token": "APP_USR-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" }
```

### Variables de entorno
```bash
export FED_USER=7224              # Usuario por defecto
export FED_DESDE=01/09/26         # Fecha desde por defecto
export FED_HASTA=30/09/26         # Fecha hasta por defecto
export MP_ACCESS_TOKEN=APP_USR-... # Token MercadoPago
export MP_NOTIFICATION_URL=https://tu-webhook.com/mp
export MP_STATEMENT=FEDPAT        # Texto en resumen de tarjeta
```

---

## ⚡ RENDIMIENTO Y LIMITES

| Operación | Tiempo aprox. (1 cuenta, ~100 clientes) |
|-----------|------------------------------------------|
| Scrape | 5-10 seg |
| Enriquecer (contactos + detalle) | 30-60 seg (concurrencia 3) |
| Cuponeras (98 PDFs) | 2-4 min (secuencial, 1 por seg) |
| Excel | 2-3 seg |

**Rate limiting:** 280-300ms entre requests (configurable `--interval`). Cloudflare bloquea si excedes ~20 req/min.

**Sesiones:** Se guardan en `sessions/<user>.json` y se reutilizan. Duración ~24hs.

---

## 🐛 TROUBLESHOOTING

| Error | Causa | Solución |
|-------|-------|----------|
| `Cloudflare challenge` / `Turnstile` | IP nueva o cookies vencidas | Ejecutar con navegador abierto (default) o `--no-browser` si ya tienes sesión válida |
| `HTTP 302 -> /errores.jsp` | Sesión no inicializada en módulo cuotas | `getCuponeraPdf` ya hace `getFollow(PAGE_CUOTAS)` antes |
| `sin deudas_full.json` | No corrió enrich | `node backend/enrich.mjs --user 7224` |
| `PDF vacío / HTML` | Redirect no seguido | Usar `getBlob` de session.mjs (ya corregido) |
| `Rate limit 429` | Demasiados requests | Bajar concurrencia, subir `--interval` |

---

## 📝 EJEMPLO COMPLETO DE INTEGRACIÓN

```javascript
// buscarDeudas.js - Para usar desde tu app
import fs from 'fs';
import { spawn } from 'child_process';

const PRODUCTOR = '7224';
const SALIDA = `salida/${PRODUCTOR}`;

async function main() {
  // 1. Asegurar datos actualizados (ejecutar pipeline si hace > 1 hora)
  const metaPath = `${SALIDA}/meta.json`;
  const needsUpdate = !fs.existsSync(metaPath) || 
    (Date.now() - new Date(JSON.parse(fs.readFileSync(metaPath)).generado).getTime()) > 3600000;
  
  if (needsUpdate) {
    console.log('Actualizando datos...');
    await runCmd('node', ['backend/run.mjs', PRODUCTOR, '--skip-excel']);
  }
  
  // 2. Leer deudas enriquecidas
  const { cuotas } = JSON.parse(fs.readFileSync(`${SALIDA}/deudas_full.json`, 'utf8'));
  
  // 3. Buscar lo que necesites
  const cliente = cuotas.find(q => q.matricula === '5433037');
  const poliza = cuotas.filter(q => q.polizaNumero === '35149500');
  const vencidasHoy = cuotas.filter(q => q.vencimientoISO <= new Date().toISOString().split('T')[0]);
  
  // 4. Obtener PDF cuponera
  if (cliente) {
    const pdfPath = `${SALIDA}/cuponeras/${sanitize(cliente.asegurado)}/${sanitize(cliente.asegurado)}_cuponera_${today()}.pdf`;
    if (fs.existsSync(pdfPath)) {
      console.log('PDF listo para enviar:', pdfPath);
      // await sendWhatsApp(cliente.telefonos[0]?.raw, pdfPath, mensaje);
    }
  }
}

function runCmd(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit' });
    p.on('close', c => c === 0 ? resolve() : reject(new Error(`${cmd} exit ${c}`)));
  });
}

function sanitize(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 120);
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

main().catch(console.error);
```

---

## 📂 RESUMEN DE ENTRY POINTS

| Necesidad | Comando / Archivo |
|-----------|-------------------|
| Todo automático | `node backend/run.mjs` |
| Solo actualizar deudas | `node backend/scrape.mjs --user 7224` |
| Solo actualizar contactos/detalle | `node backend/enrich.mjs --user 7224` |
| Solo descargar PDFs | `node backend/cuponeras.mjs --user 7224` |
| Generar links de pago | `node backend/link_pago.mjs --user 7224 --all` |
| Leer datos en tu app | `require('salida/7224/deudas_full.json')` |
| Buscar PDF de un cliente | `salida/7224/cuponeras/index.csv` → path |

---

**¿Dudas?** Revisa el código en `backend/lib/fedpat.mjs` para ver todas las funciones exportadas disponibles para integración programática.