# fedcheck - Deudas SELF (Federación Patronal)

Extracción de **cuotas impagas** de SELF (<https://online.fedpat.com.ar/self/homeWin32.do>) para
uno o varios productores, con salida a **Excel** listos para el envío de deudas.

Hay dos caminos:

- **`backend/` (recomendado)** — extracción **100 % HTTP** (Node `fetch`): no abre pestañas ni
  instancias de navegador. El único uso del navegador es el **login** (Cloudflare Turnstile),
  con **una pestaña temporal aislada** que se cierra al terminar; después todo es backend.
- **Raíz del proyecto (legacy)** — extracción por **CDP** sobre Thorium/Chrome en `127.0.0.1:9222`
  (`run.mjs`, `scrape.mjs`, `enrich.mjs`). Queda como respaldo.

## Requisitos

- Node 22+ (usa `fetch` y `WebSocket` nativos)
- Python 3 + `openpyxl`
- Para el login: Thorium/Chrome abierto con `--remote-debugging-port=9222`
  (el backend **no** crea instancias; se conecta al navegador que ya esté abierto)

## Cuentas

Las credenciales se configuran en `accounts.json`:

```json
{
  "primary": "7224",
  "accounts": [
    { "user": "7224",  "pass": "Cuervo13"  },
    { "user": "26620", "pass": "Cuervo13"  },
    { "user": "29494", "pass": "Ringuito10" }
  ]
}
```

Para sumar una cuenta alcanza con agregarla a la lista.

## Uso (backend HTTP)

```bash
node backend/run.mjs                        # TODAS las cuentas de accounts.json
node backend/run.mjs 7224                   # solo una
node backend/run.mjs 7224 26620 29494       # las que quieras
node backend/run.mjs 01/09/26 30/09/26      # todas, con rango manual (dd/mm/aa)
node backend/run.mjs 7224 --desde 01/09/26 --hasta 30/09/26
node backend/run.mjs --concurrency 4        # concurrencia de enriquecido (default 3)
node backend/run.mjs --no-browser           # prohíbe el login con navegador
node backend/run.mjs --skip-enrich --skip-excel
```

Pasos individuales:

| Script | Qué hace |
|---|---|
| `node backend/scrape.mjs --user 26620` | login (si hace falta) + listado de cuotas impagas |
| `node backend/enrich.mjs --user 26620` | agrega teléfonos, mails y detalle de cuota (x/12) |
| `node backend/export_session.mjs 7224` | exporta las cookies de una pestaña viva a `sessions/7224.json` |
| `node backend/seed_cf.mjs` | guarda `sessions/cf.json` (experimental, ver Cloudflare) |
| `python build_xlsx.py --in salida/26620/deudas_full.json --out salida/26620/deudas.xlsx --meta salida/26620/meta.json` | Excel de esa cuenta |
| `python build_all.py` | consolidado `deudas_todas.xlsx` |

Opciones útiles de `scrape.mjs` / `enrich.mjs`: `--out`, `--desde`, `--hasta`, `--no-browser`,
`--refresh` (ignora `enrich_cache.json`), `--mat`, `--cuota`, `--limit`, `--interval` (ms entre
requests), `--concurrency`.

## Cómo funciona el backend HTTP

1. **Sesión** — se reutiliza `sessions/<user>.json` si sigue válida. Si venció, se hace **un solo
   login** en una **pestaña temporal de un browser context aislado** del navegador ya abierto:
   se exportan las cookies con `Storage.getCookies({ browserContextId })`, se cierra la pestaña y
   se destruye el contexto. No queda ninguna sesión de navegador abierta.
2. **Listado** — `GET /self/StrutsJsfServlet?beanName=menuBean&method=cuotasImpagas` para obtener
   el formulario y el botón real "Generar listado"; después `POST` A4J a
   `/self/jsf/contaduria/cuotasImpagas2.jsf` (`AJAXREQUEST=_viewRoot`). La respuesta trae
   `jsonGridCuotasImpagas` (JSON completo de la grilla) y `jsonFechas`.
3. **Contactos** — `GET /self/editDatosAsegurado.do?matricula=<mat>&tipoAsegurado=M&fromListado=true`.
4. **Detalle de cuota** — `GET /self/generarRemesaCaja/obtenerOpcionesCuotasImpagas.do?cuotaId=<cajaId>`.

`cajaId` = `id.replace(/\//g,'-') + '-' + fechaVencimientoStr` (ej. `4-36103782-0-oct_06_2026`).

La **marca** se reconstruye con la misma regla que `hlp.getLabel()` de `cuotasImpagas.js`:

```js
texto = (tipoGarantiaCobertura !== "N") ? "G" : color;   // + "1" si obligacionPagoPermitida && primerCuota
```

Por eso aparecen `R`, `V`, `A`, `V1`, `G1`. El `*` de fin de semana de `jsonFechas` se quita del
campo `dia`.

El cliente HTTP (`backend/lib/session.mjs`) mantiene el jar de cookies, reintenta con backoff ante
429/challenge (30/60/120/180 s) y comparte un **rate limiter global** (default 300 ms entre
requests) porque Cloudflare limita por IP. Las cuentas se procesan **secuencialmente**; el
enriquecido usa un pool de concurrencia 3.

## Multi-cuenta

Cada cuenta tiene su propia sesión HTTP en `sessions/<user>.json`, así que las tres conviven sin
pisarse. En el navegador se usa un **browser context aislado por login** (cookies propias) y se
destruye al terminar; no se tocan las pestañas que estés usando.

Cloudflare da **429** con frecuencia al abrir sesiones nuevas. El backend espera y reintenta. Si
el login con navegador falla por rate limit, conviene esperar un minuto y volver a correr.

## Salidas

```
salida/7224/deudas.xlsx       detalle + por cliente + resumen de esa cuenta
salida/26620/deudas.xlsx
salida/29494/deudas.xlsx
deudas_todas.xlsx             consolidado: Resumen | Deudas | Por cliente
```

Cada `salida/<user>/` incluye además `deudas.json`, `deudas_full.json`, `deudas.csv` y `meta.json`.

Hojas de cada Excel:

- **Deudas** — una fila por cuota impaga: asegurado, matrícula, póliza, cuota (x/12),
  vencimiento, días vencida, saldo, estado, situación, teléfono, WhatsApp (+54 9), email,
  link directo a WhatsApp, ID de cuota.
- **Por cliente** — total adeudado por asegurado, ordenado de mayor a menor, con contacto.
- **Resumen** — totales, cuotas vencidas/a vencer, composición por situación y estado,
  y referencias de las marcas del sitio (R, V, A, `+`, `.`, `1`, `G`).

El consolidado agrega la columna **Productor** en `Deudas` y `Por cliente`, y una tabla de
totales por productor en `Resumen`.

## Cómo se maneja Cloudflare (importante)

El **login** de SELF está protegido por Cloudflare Turnstile. Un `POST /self/login.do` por HTTP
puro recibe **403** ("Just a moment…") aunque se reutilice `cf_clearance`: el token de Turnstile
es obligatorio y de un solo uso. Por eso:

1. Se intenta reutilizar la sesión guardada (lo normal: sirve durante el día).
2. Si venció, se hace el login en una pestaña temporal del navegador ya abierto, que resuelve el
   interstitial y el widget Turnstile; se exportan las cookies y se cierra el contexto.
3. Toda la extracción posterior es HTTP puro.

El script espera el interstitial de página completa y **nunca reenvía** el formulario en esa
etapa; antes de enviar fuerza `turnstile.reset()` y espera un token nuevo. También bloquea el
autocompletado del gestor de contraseñas y verifica que el productor logueado sea el esperado.

Si Cloudflare responde **429**, el backend espera y reintenta. Entre cuenta y cuenta hay una pausa
para no gatillar el rate limit por IP.

**Nota:** `sessions/cf.json` + `FED_HTTP_LOGIN=1` habilitan un intento de login 100 % HTTP con
`cf_clearance`. Hoy Cloudflare lo bloquea, así que queda como experimental.

## Links de pago (MercadoPago)

SELF **no** genera links de MercadoPago: el módulo "Caja" solo registra obligaciones internas de
pago. El link se crea por API con **Checkout Pro**:

```
POST https://api.mercadopago.com/checkout/preferences
Authorization: Bearer <ACCESS_TOKEN>
```

La respuesta trae `init_point`, que es el link que se comparte con el cliente. Cada cuota genera
una preferencia con `unit_price = saldo`, `external_reference = cajaId` y metadata
(productor/matrícula/póliza/cuota), lo que permite conciliar el pago después.

### Credenciales

1. Entrá a <https://www.mercadopago.com.ar/developers/panel/app>.
2. Elegí tu aplicación → **Credenciales de producción**.
3. Guardá el Access Token en `mp.json` (no se versiona):

```json
{ "access_token": "APP_USR-..." }
```

o definí `MP_ACCESS_TOKEN`. El token nunca se imprime en los logs.

### Uso

```bash
node backend/link_pago.mjs --user 7224 --index 1          # una cuota del listado
node backend/link_pago.mjs --user 7224 --mat 6998123      # todas las cuotas de un cliente
node backend/link_pago.mjs --user 7224 --cuota 4-35149500-0-oct_06_2026
node backend/link_pago.mjs --user 7224 --all --dias 15    # todas, con vencimiento del link
node backend/link_pago.mjs --user 7224 --index 1 --dry-run  # solo muestra el payload
```

Salidas: `salida/<user>/links_pago.json` (cache por `cajaId`) y `salida/<user>/links_pago.csv`.
Los links ya generados se reutilizan; `--refresh` los regenera.

Opciones: `--dias` (expiración del link, 30 por defecto; `0` = sin vencimiento), `--sandbox`,
`--notification-url` (webhook HTTPS), `--statement` (texto en el resumen de tarjeta), `--quiet`.

**Importante:** el dinero entra en la cuenta de MercadoPago del token. Si cobrás en nombre del
productor, después hay que registrar el pago en SELF ("Caja" → Pagar) o conciliarlo aparte. Para
automatizarlo del todo se puede recibir el webhook `payment.created` y consultar
`GET /v1/payments/search?external_reference=<cajaId>`.

## Próximos pasos (no implementado aún)

El envío automático quedó pendiente por decisión del usuario. El Excel ya trae todo lo necesario:

- **WhatsApp**: la columna `Link WhatsApp` abre el chat con el número normalizado.
- **Email**: columna `Email` + `Otros emails`.
- **SMS**: el sitio tiene "Aviso de deuda por SMS" por cliente (Listado de clientes).
- **Link de pago**: ver la sección anterior (`backend/link_pago.mjs`).

## Notas técnicas

- `backend/lib/session.mjs` — cliente HTTP, cookies, rate limiter y reintentos.
- `backend/lib/parse.mjs` — parseo HTML/JS sin DOM (ViewState, botón A4J, JSON embebido, fechas).
- `backend/lib/fedpat.mjs` — login, listado, normalización, contactos y detalle.
- `backend/lib/auth.mjs` — reutilización de sesión y siembra con pestaña temporal.
- `cdp.mjs` / `tabs.mjs` / `login.mjs` — camino legacy por CDP (sigue disponible para la raíz).
- `enrich_cache.json` es compartido entre cuentas y evita repetir pedidos; `--refresh` lo ignora y
  vuelve a consultar todo.
- Las cuotas con marca `+` tienen más de una póliza el mismo día; el extractor legacy lee **todos**
  los tooltips de la celda.
- Los errores de login se guardan como capturas en `salida/_errores/`.
