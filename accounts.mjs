/** Lectura de accounts.json (credenciales y cuenta principal). */
import fs from 'node:fs';

const FILE = 'accounts.json';

export function loadConfig() {
  if (!fs.existsSync(FILE)) {
    return { primary: '7224', accounts: [{ user: '7224', pass: 'Cuervo13' }] };
  }
  const cfg = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  if (!cfg.accounts?.length) throw new Error('accounts.json no tiene cuentas');
  return { primary: cfg.primary || cfg.accounts[0].user, accounts: cfg.accounts };
}

export function getAccount(user) {
  return loadConfig().accounts.find((a) => String(a.user) === String(user));
}

export function resolveUsers(args) {
  const { accounts } = loadConfig();
  const wanted = args.filter((a) => !a.startsWith('--') && /^\d+$/.test(a));
  if (!wanted.length) return accounts;
  return wanted.map((u) => {
    const a = accounts.find((x) => String(x.user) === String(u));
    if (!a) throw new Error(`la cuenta ${u} no está en accounts.json`);
    return a;
  });
}
