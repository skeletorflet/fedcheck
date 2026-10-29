/**
 * Cliente HTTP puro para SELF FedPat.
 *
 * - Maneja cookies como un navegador (Set-Cookie manual, porque fetch de Node no persiste).
 * - Reintenta con backoff ante 429 / challenge de Cloudflare.
 * - Rate limiter global: todas las cuentas comparten el mismo límite por IP.
 * - Detecta sesión logueada / expirada.
 *
 * No usa navegador ni CDP.
 */
import fs from 'node:fs';
import path from 'node:path';

export const BASE = 'https://online.fedpat.com.ar';
export const HOME = BASE + '/self/homeWin32.do';
export const LOGIN_URL = BASE + '/self/login.do';
export const PAGE_CUOTAS = BASE + '/self/jsf/contaduria/cuotasImpagas2.jsf';
export const SESS_DIR = 'sessions';

export const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (ms) => ms + Math.floor(Math.random() * 1500);

export class HttpError extends Error {
  constructor(message, info = {}) {
    super(message);
    Object.assign(this, info);
  }
}

/** Límite compartido por todas las sesiones (Cloudflare limita por IP). */
export class RateLimiter {
  constructor({ minInterval = 260, cooldown = 45000 } = {}) {
    this.minInterval = minInterval;
    this.defaultCooldown = cooldown;
    this.next = 0;
    this.blockedUntil = 0;
    this.requests = 0;
  }
  async wait() {
    const now = Date.now();
    const t = Math.max(now, this.next, this.blockedUntil);
    this.next = t + this.minInterval;
    if (t > now) await sleep(t - now);
    this.requests++;
  }
  block(ms = this.defaultCooldown) {
    this.blockedUntil = Math.max(this.blockedUntil, Date.now() + ms);
  }
  get blocked() {
    return Date.now() < this.blockedUntil;
  }
}

const CHALLENGE_RE = /Just a moment|Enable JavaScript and cookies to continue|cf-chl|Verificación de seguridad en curso|challenge-platform\/cdn-cgi/i;

export class HttpSession {
  constructor({ user, cookies = {}, ua = DEFAULT_UA, limiter = null, log = console.log } = {}) {
    this.user = user;
    this.cookies = { ...cookies };
    this.ua = ua;
    this.limiter = limiter || new RateLimiter();
    this.log = log;
    this.savedAt = null;
  }

  static file(user) {
    return path.join(SESS_DIR, `${user}.json`);
  }

  static load(user, opts = {}) {
    const f = HttpSession.file(user);
    if (!fs.existsSync(f)) return null;
    try {
      const j = JSON.parse(fs.readFileSync(f, 'utf8'));
      const s = new HttpSession({ user, cookies: j.cookies || {}, ua: j.ua || DEFAULT_UA, ...opts });
      s.savedAt = j.savedAt || null;
      s.nombre = j.nombre || '';
      return s;
    } catch {
      return null;
    }
  }

  save(extra = {}) {
    fs.mkdirSync(SESS_DIR, { recursive: true });
    const data = {
      user: this.user,
      ua: this.ua,
      savedAt: new Date().toISOString(),
      cookies: this.cookies,
      ...extra,
    };
    fs.writeFileSync(HttpSession.file(this.user), JSON.stringify(data, null, 2));
    this.savedAt = data.savedAt;
    return data;
  }

  cookieHeader() {
    return Object.entries(this.cookies)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  absorb(res) {
    const list = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    for (const raw of list) {
      const parts = raw.split(';').map((x) => x.trim());
      const kv = parts[0];
      const eq = kv.indexOf('=');
      if (eq <= 0) continue;
      const name = kv.slice(0, eq).trim();
      const value = kv.slice(eq + 1).trim();
      let expired = false;
      for (const p of parts.slice(1)) {
        const [k, ...rest] = p.split('=');
        const key = k.toLowerCase();
        const val = rest.join('=');
        if (key === 'max-age' && Number(val) <= 0) expired = true;
        if (key === 'expires' && /1970|1969/.test(val)) expired = true;
      }
      if (expired) delete this.cookies[name];
      else this.cookies[name] = value;
    }
  }

  headersFor(extra = {}, hasBody = false) {
    const h = {
      'User-Agent': this.ua,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': hasBody ? 'empty' : 'document',
      'Sec-Fetch-Mode': hasBody ? 'cors' : 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      ...(hasBody ? { 'Sec-Fetch-User': undefined } : { 'Sec-Fetch-User': '?1' }),
      ...extra,
    };
    if (hasBody && !h['Content-Type']) h['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
    const ck = this.cookieHeader();
    if (ck) h.Cookie = ck;
    for (const k of Object.keys(h)) if (h[k] === undefined) delete h[k];
    return h;
  }

  /**
   * Petición con reintentos.
   * @param {string} target ruta (/self/...) o URL absoluta
   * @param {{method?:string, headers?:object, body?:any, redirect?:RequestRedirect,
   *          retries?:number, retryOnChallenge?:boolean, label?:string}} opts
   */
  async request(target, opts = {}) {
    const {
      method = 'GET',
      headers = {},
      body,
      redirect = 'manual',
      retries = 4,
      retryOnChallenge = true,
      label,
    } = opts;
    const url = /^https?:\/\//i.test(target) ? target : BASE + target;
    const hasBody = body !== undefined && body !== null;

    for (let attempt = 0; ; attempt++) {
      if (this.limiter) await this.limiter.wait();
      let res;
      try {
        res = await fetch(url, { method, headers: this.headersFor(headers, hasBody), body, redirect });
      } catch (e) {
        if (attempt >= retries) throw new HttpError(`fetch falló: ${e.message}`, { url, cause: e });
        await sleep(jitter(3000 * (attempt + 1)));
        continue;
      }
      this.absorb(res);
      const text = method === 'HEAD' ? '' : await res.text();
      const challenge = (res.status === 403 || res.status === 429 || res.status === 503) && CHALLENGE_RE.test(text);
      const limited = res.status === 429;

      if (limited || (challenge && retryOnChallenge)) {
        if (attempt >= retries) {
          throw new HttpError(
            limited ? 'Cloudflare 429 (rate limit)' : 'Cloudflare challenge',
            { status: res.status, url, challenge: true, body: text.slice(0, 500) },
          );
        }
        const waits = [30000, 60000, 120000, 180000];
        const wait = jitter(waits[Math.min(attempt, waits.length - 1)]);
        if (this.limiter) this.limiter.block(wait);
        this.log(`  · ${res.status}${challenge ? ' challenge' : ' rate limit'} en ${label || url.replace(BASE, '')} -> espero ${Math.round(wait / 1000)}s`);
        continue;
      }

      return {
        status: res.status,
        ok: res.ok,
        text,
        headers: res.headers,
        location: res.headers.get('location'),
        url,
      };
    }
  }

  async get(target, opts = {}) {
    return this.request(target, { ...opts, method: 'GET' });
  }

  /** GET siguiendo redirects manualmente (para capturar cookies de cada salto). */
  async getFollow(target, opts = {}) {
    let r = await this.request(target, { ...opts, method: 'GET' });
    let hops = 0;
    while (r.status >= 300 && r.status < 400 && r.location && hops++ < 8) {
      const next = /^https?:\/\//i.test(r.location) ? r.location : BASE + r.location;
      r = await this.request(next, { ...opts, method: 'GET' });
    }
    return r;
  }

  async postForm(target, data, opts = {}) {
    const body = data instanceof URLSearchParams ? data : new URLSearchParams(data);
    return this.request(target, {
      ...opts,
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', ...(opts.headers || {}) },
    });
  }

  /**
   * Descarga un archivo binario (PDF, etc.) y devuelve el ArrayBuffer.
   * No intenta parsear el texto, útil para reportes PDF.
   * Sigue redirects manualmente para capturar cookies de cada salto.
   */
  async getBlob(target, opts = {}) {
    const url = /^https?:\/\//i.test(target) ? target : BASE + target;
    let currentUrl = url;
    for (let attempt = 0; ; attempt++) {
      if (this.limiter) await this.limiter.wait();
      let res;
      try {
        res = await fetch(currentUrl, { method: 'GET', headers: this.headersFor({ Accept: 'application/pdf,*/*' }), redirect: 'manual' });
      } catch (e) {
        if (attempt >= (opts.retries ?? 4)) throw new HttpError(`fetch falló: ${e.message}`, { url: currentUrl, cause: e });
        await sleep(jitter(3000 * (attempt + 1)));
        continue;
      }
      this.absorb(res);
      const challenge = (res.status === 403 || res.status === 429 || res.status === 503) && CHALLENGE_RE.test(await res.clone().text());
      const limited = res.status === 429;
      if (limited || (challenge && (opts.retryOnChallenge !== false))) {
        if (attempt >= (opts.retries ?? 4)) {
          throw new HttpError(
            limited ? 'Cloudflare 429 (rate limit)' : 'Cloudflare challenge',
            { status: res.status, url: currentUrl, challenge: true },
          );
        }
        const waits = [30000, 60000, 120000, 180000];
        const wait = jitter(waits[Math.min(attempt, waits.length - 1)]);
        if (this.limiter) this.limiter.block(wait);
        this.log(`  · ${res.status}${challenge ? ' challenge' : ' rate limit'} en ${currentUrl.replace(BASE, '')} -> espero ${Math.round(wait / 1000)}s`);
        continue;
      }
      // Seguir redirects manualmente (como getFollow)
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        const loc = res.headers.get('location');
        currentUrl = /^https?:\/\//i.test(loc) ? loc : BASE + loc;
        if (opts.label) this.log(`  · redirect ${res.status} -> ${currentUrl.replace(BASE, '')}`);
        continue;
      }
      if (!res.ok) throw new HttpError(`HTTP ${res.status} descargando ${currentUrl}`, { status: res.status, url: currentUrl });
      return await res.arrayBuffer();
    }
  }

  /** true si la sesión sigue logueada. */
  async check() {
    const r = await this.getFollow('/self/loadProductor.do', { retries: 1 });
    const logged = r.status === 200 && (/logout\.do/.test(r.text) || /loadProductor\.do/.test(r.url || ''));
    const prod = (r.text.match(/id=['"]productornumero['"][^>]*>\s*(\d+)/i) || [])[1]
      || (r.text.match(/Prod\.?:?\s*(\d+)/) || [])[1]
      || null;
    const nombre = ((r.text.match(/id=["']nombreProductor["'][^>]*>([^<]*)/i) || [])[1] || '').trim();
    return { logged, prod, nombre, status: r.status, url: r.url, text: r.text };
  }
}
