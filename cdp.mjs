// Minimal CDP driver over raw WebSocket (Node 22+ built-in WebSocket)
// Usage: node cdp.mjs <command> [args...]
const HOST = '127.0.0.1:9222';

async function list() {
  const r = await fetch(`http://${HOST}/json/list`);
  return r.json();
}

export async function pageByUrl(substr) {
  const tabs = await list();
  const t = tabs.find((x) => x.type === 'page' && x.url.includes(substr));
  if (!t) throw new Error(`no page matching ${substr}`);
  return t;
}

/** Conexión al endpoint del navegador (para crear contextos/pestañas). */
export async function browser() {
  const ver = await (await fetch(`http://${HOST}/json/version`)).json();
  const c = await new CDP(ver.webSocketDebuggerUrl).connect();
  c.version = ver;
  return c;
}

export class CDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
  }
  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((res, rej) => {
      this.ws.addEventListener('open', res, { once: true });
      this.ws.addEventListener('error', rej, { once: true });
    });
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id != null) {
        const p = this.pending.get(msg.id);
        if (p) {
          this.pending.delete(msg.id);
          msg.error ? p.rej(new Error(JSON.stringify(msg.error))) : p.res(msg.result);
        }
      } else {
        this.events.push(msg);
        const h = this.handlers?.get(msg.method);
        if (h) h(msg.params);
      }
    });
    this.handlers = new Map();
    return this;
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((res, rej) => this.pending.set(id, { res, rej }));
  }
  on(method, fn) {
    this.handlers.set(method, fn);
  }
  async eval(expression, opts = {}) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
      ...opts,
    });
    if (r.exceptionDetails) {
      return { __exception: r.exceptionDetails.exception?.description || r.exceptionDetails.text };
    }
    return r.result?.value;
  }
  async close() {
    try { this.ws.close(); } catch {}
  }
}

/**
 * Conecta a una pestaña.
 * @param {string} urlSubstr  fragmento de URL esperado (informativo)
 * @param {string} tabFile    archivo con { id } de la pestaña dedicada
 * @param {{anyUrl?: boolean}} opts  anyUrl: aceptar la pestaña aunque esté en otra URL
 */
export async function connect(urlSubstr, tabFile = process.env.FED_TAB_FILE || 'tab.json', opts = {}) {
  // Preferir la pestaña dedicada de automatización (tab.json / tabs/<user>.json)
  try {
    const fs = await import('node:fs');
    if (tabFile && fs.existsSync(tabFile)) {
      const saved = JSON.parse(fs.readFileSync(tabFile, 'utf8'));
      const tabs = await list();
      const t = tabs.find((x) => x.id === saved.id);
      const okUrl = !urlSubstr || t?.url.includes(urlSubstr) || opts.anyUrl;
      if (t && okUrl) {
        const c = await new CDP(t.webSocketDebuggerUrl).connect();
        c.target = t;
        return c;
      }
    }
  } catch {}
  if (opts.anyUrl) throw new Error(`no hay pestaña viva en ${tabFile}`);
  const t = await pageByUrl(urlSubstr);
  const c = await new CDP(t.webSocketDebuggerUrl).connect();
  c.target = t;
  return c;
}

export async function connectById(tabId) {
  const tabs = await list();
  const t = tabs.find((x) => x.id === tabId);
  if (!t) throw new Error(`no page with id ${tabId}`);
  const c = await new CDP(t.webSocketDebuggerUrl).connect();
  c.target = t;
  return c;
}

export { list };
