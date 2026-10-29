/**
 * Una pestaña aislada por cuenta.
 *
 * En un mismo perfil de Chrome las cookies se comparten entre pestañas, así que
 * dos sesiones de SELF no pueden convivir en el perfil normal. Para tener varias
 * cuentas logueadas AL MISMO TIEMPO se crea un "browser context" por cuenta
 * (equivalente a un perfil/incógnito separado): cada uno tiene sus propias cookies.
 *
 * Estado en tabs/<user>.json = { id, ws, contextId }
 *
 * Uso:
 *   node tabs.mjs             -> lista las pestañas de cuentas
 *   node tabs.mjs 7224 26620  -> asegura pestaña para esas cuentas
 *   node tabs.mjs --close 7224
 */
import { browser, list } from './cdp.mjs';
import fs from 'node:fs';

const HOME = 'https://online.fedpat.com.ar/self/homeWin32.do';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DIR = 'tabs';

export const primaryUser = '7224';

export function tabFileFor(user) {
  return `${DIR}/${user}.json`;
}

export function readTab(user) {
  const f = tabFileFor(user);
  if (!fs.existsSync(f)) return null;
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; }
}

export function saveTab(user, info) {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(tabFileFor(user), JSON.stringify(info, null, 2));
}

/**
 * Devuelve la pestaña dedicada de una cuenta, creándola si hace falta.
 * opts.adoptDefault: si existe tab.json (pestaña histórica del perfil normal),
 * la adopta en vez de crear un contexto nuevo (solo para la cuenta principal).
 */
export async function ensureTab(user, opts = {}) {
  const tabs = await list();

  const saved = readTab(user);
  if (saved) {
    const t = tabs.find((x) => x.id === saved.id);
    if (t) return { ...saved, ...t };
  }

  if (opts.adoptDefault && fs.existsSync('tab.json')) {
    try {
      const def = JSON.parse(fs.readFileSync('tab.json', 'utf8'));
      const t = tabs.find((x) => x.id === def.id);
      if (t) {
        const info = { id: t.id, ws: t.webSocketDebuggerUrl, contextId: null, adopted: true };
        saveTab(user, info);
        return { ...info, ...t };
      }
    } catch {}
  }

  // contexto aislado nuevo (cookies propias)
  const b = await browser();
  let browserContextId, targetId;
  try {
    ({ browserContextId } = await b.send('Target.createBrowserContext', { disposeOnDetach: false }));
    ({ targetId } = await b.send('Target.createTarget', { url: HOME, browserContextId }));
  } finally {
    await b.close();
  }

  let t = null;
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    t = (await list()).find((x) => x.id === targetId);
    if (t) break;
  }
  if (!t) throw new Error(`no se pudo crear la pestaña de ${user}`);

  const info = { id: t.id, ws: t.webSocketDebuggerUrl, contextId: browserContextId, created: new Date().toISOString() };
  saveTab(user, info);
  return { ...info, ...t };
}

/** Cierra la pestaña de una cuenta y elimina su contexto (cookies incluidas). */
export async function closeTab(user) {
  const saved = readTab(user);
  if (!saved) return false;
  try {
    const b = await browser();
    try { await b.send('Target.closeTarget', { targetId: saved.id }); } catch {}
    if (saved.contextId) {
      try { await b.send('Target.disposeBrowserContext', { browserContextId: saved.contextId }); } catch {}
    }
    await b.close();
  } catch {}
  try { fs.unlinkSync(tabFileFor(user)); } catch {}
  return true;
}

/** Borra todos los contextos aislados creados por la automatización. */
export async function disposeAllContexts() {
  const b = await browser();
  try {
    const { browserContextIds } = await b.send('Target.getBrowserContexts');
    for (const id of browserContextIds || []) {
      try { await b.send('Target.disposeBrowserContext', { browserContextId: id }); } catch {}
    }
  } finally {
    await b.close();
  }
}

const isMain = process.argv[1] && process.argv[1].toLowerCase().endsWith('tabs.mjs');
if (isMain) {
  const args = process.argv.slice(2);
  if (args[0] === '--close' && args[1]) {
    console.log('cerrada:', args[1], await closeTab(args[1]));
  } else if (args.length) {
    for (const u of args) {
      const t = await ensureTab(u, { adoptDefault: u === primaryUser });
      console.log(u, '->', t.id, t.url, t.contextId ? '(contexto aislado)' : '(perfil normal)');
    }
  } else {
    const users = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')) : [];
    const tabs = await list();
    for (const u of users) {
      const s = readTab(u);
      const t = tabs.find((x) => x.id === s?.id);
      console.log(u, '->', t ? `${t.id} ${t.url}` : '(pestaña cerrada)');
    }
    if (!users.length) console.log('no hay pestañas de cuentas todavía');
  }
}
