#!/usr/bin/env node
/**
 * Genera link de pago MP vía flujo nativo SELF (Caja → 232 BOT PAGO MERCADOPAGO).
 *
 * Uso:
 *   node backend/caja_mp.mjs --user 7224 --pass Cuervo13 \
 *     --dni 13968031 --monto "83.689,00" --importe 83689 \
 *     --ramo 4 --poliza 35149500 --cert 0 \
 *     --cuota 8 --endoso 999 --email ATOVAL21@YAHOO.COM
 *
 * Lee deudas_full.json y permite --caja-id para autollenar.
 */
import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { HttpSession, RateLimiter } from './lib/session.mjs';
import { generarLinkCajaMp, runCajaMp } from './lib/caja_mp.mjs';

const program = new Command();
program
  .name('caja_mp')
  .description('Genera link de pago MercadoPago vía flujo nativo SELF (Caja 232)')
  .option('-u, --user <string>', 'Productor (7224, 26620, 29494)')
  .option('-p, --pass <string>', 'Contraseña SELF')
  .option('--dni <string>', 'DNI del asegurado')
  .option('--monto <string>', 'Monto formateado ARS (ej: "83.689,00")')
  .option('--importe <number>', 'Importe en centavos/entero (ej: 83689)')
  .option('--ramo <string>', 'Ramo (ej: 4)')
  .option('--poliza <string>', 'Número de póliza (ej: 35149500)')
  .option('--cert <string>', 'Certificado (ej: 0)', '0')
  .option('--cuota <string>', 'Número de cuota (ej: 8)')
  .option('--endoso <string>', 'Endoso (ej: 999)', '999')
  .option('--email <string>', 'Email del contacto (debe existir en SELF para ese DNI)')
  .option('--caja-id <string>', 'Usar cajaId de deudas_full.json para autollenar (formato: 4-35149500-0-oct_06_2026)')
  .option('--concurrency <number>', 'Intervalo ms entre requests', '350')
  .option('--out <string>', 'Archivo JSON de salida', 'salida/<user>/caja_mp_result.json')
  .option('--quiet', 'Solo JSON en stdout')
  .action(async (opts) => {
    const { user, pass, cajaId, concurrency, out, quiet } = opts;
    if (!user || !pass) { console.error('Faltan --user y --pass'); process.exit(2); }

    let input;

    if (cajaId) {
      const base = `salida/${user}/deudas_full.json`;
      if (!fs.existsSync(base)) { console.error('No existe', base); process.exit(1); }
      const data = JSON.parse(fs.readFileSync(base, 'utf8'));
      const c = data.cuotas.find((x) => x.cajaId === cajaId);
      if (!c) { console.error('cajaId no encontrado en deudas_full.json'); process.exit(1); }
      if (!opts.dni) { console.error('Para autollenar desde deudas_full.json falta --dni (no viene en el JSON)'); process.exit(1); }
      if (!opts.email) { console.error('Falta --email'); process.exit(1); }
      input = {
        dni: opts.dni,
        monto: opts.monto || c.saldoTexto.replace(/\s/g, ''),
        importe: c.saldo,
        ramo: String(c.ramo),
        poliza: String(c.polizaNumero),
        certificado: String(c.certificado),
        cuota: String(c.cuotaNumero),
        endoso: String(c.referenciaMultirramica || '999'),
        email: opts.email,
        moneda: '01',
      };
    } else {
      const req = ['dni', 'monto', 'importe', 'ramo', 'poliza', 'cuota', 'email'];
      for (const k of req) if (!opts[k]) { console.error(`Falta --${k}`); process.exit(2); }
      input = {
        dni: opts.dni,
        monto: opts.monto,
        importe: opts.importe,
        ramo: opts.ramo,
        poliza: opts.poliza,
        certificado: opts.cert,
        cuota: opts.cuota,
        endoso: opts.endoso,
        email: opts.email,
        moneda: '01',
      };
    }

    const limiter = new RateLimiter({ minInterval: Number(concurrency) });
    let result;
    try {
      result = await runCajaMp(user, pass, input, limiter);
    } catch (e) {
      const err = { ok: false, error: e.message, step: e.step, input };
      if (!quiet) console.error(JSON.stringify(err, null, 2));
      process.exit(1);
    }

    const outPath = out.replace('<user>', user);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

    if (quiet) {
      console.log(JSON.stringify(result));
    } else {
      console.log('\n=== RESULTADO ===');
      console.log(JSON.stringify(result, null, 2));
      console.log(`\nGuardado en ${outPath}`);
    }

    if (!result.ok) process.exit(1);
  });

program.parse();