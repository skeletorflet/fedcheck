#!/usr/bin/env node
/**
 * Batch: genera links MP para múltiples cuotas desde deudas_full.json
 * Lee DNI de cada asegurado via editDatosAsegurado.do
 * Uso: node backend/caja_mp_batch.mjs --user 7224 --pass Cuervo13 --email-por-defecto ATOVAL21@YAHOO.COM [--caja-ids "id1,id2"]
 */
import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { HttpSession, RateLimiter } from './lib/session.mjs';
import { runCajaMp } from './lib/caja_mp.mjs';
import { fetchDni } from './lib/fetch_dni.mjs';
import { ensureSession } from './lib/auth.mjs';

const program = new Command();
program
  .name('caja_mp_batch')
  .description('Genera links MP en lote desde deudas_full.json')
  .option('-u, --user <string>', 'Productor (7224, 26620, 29494)', '7224')
  .option('-p, --pass <string>', 'Contraseña SELF')
  .option('--email-por-defecto <string>', 'Email a usar si no hay mail en SELF', 'ATOVAL21@YAHOO.COM')
  .option('--caja-ids <string>', 'Lista de cajaId separados por coma (default: todos)')
  .option('--estado <string>', 'Filtrar por estado (VIGENTE, PENDIENTE, etc.)', 'VIGENTE')
  .option('--concurrency <number>', 'Intervalo ms entre requests', '500')
  .option('--out <string>', 'Archivo JSON de resultados', 'salida/<user>/caja_mp_batch.json')
  .option('--limit <number>', 'Máximo de cuotas a procesar', '50')
  .action(async (opts) => {
    const { user, pass, emailPorDefecto, cajaIds, estado, concurrency, out, limit } = opts;
    if (!pass) { console.error('Falta --pass'); process.exit(2); }

    const base = `salida/${user}/deudas_full.json`;
    if (!fs.existsSync(base)) { console.error('No existe', base); process.exit(1); }
    const data = JSON.parse(fs.readFileSync(base, 'utf8'));
    let cuotas = data.cuotas.filter((c) => c.estado === estado);
    if (cajaIds) {
      const ids = new Set(cajaIds.split(',').map((x) => x.trim()));
      cuotas = cuotas.filter((c) => ids.has(c.cajaId));
    }
    if (cuotas.length > limit) cuotas = cuotas.slice(0, limit);
    console.log(`[${user}] ${cuotas.length} cuotas a procesar`);

    const limiter = new RateLimiter({ minInterval: Number(concurrency) });
    const s = HttpSession.load(user, { limiter });
    if (!s) {
      const { ensureSession } = await import('./lib/auth.mjs');
      await ensureSession(user, { pass, limiter });
    }
    const session = HttpSession.load(user, { limiter });

    const results = [];
    for (let i = 0; i < cuotas.length; i++) {
      const c = cuotas[i];
      console.log(`\n[${i + 1}/${cuotas.length}] ${c.cajaId} - ${c.asegurado} - $${c.saldoTexto}`);
      try {
        // Fetch DNI
        let dni;
        try {
          dni = await fetchDni(session, c.matricula);
          console.log(`  DNI: ${dni}`);
        } catch (e) {
          console.log(`  ⚠ No se pudo obtener DNI: ${e.message}, saltando...`);
          results.push({ cajaId: c.cajaId, ok: false, error: `DNI: ${e.message}` });
          continue;
        }

        // Email: intentar usar uno de los mails del asegurado, sino default
        const mailObj = (c.mails || []).find((m) => m.mail && m.mail !== 'notiene@mail.com');
        const email = mailObj ? mailObj.mail : emailPorDefecto;
        console.log(`  Email: ${email}`);

        const input = {
          matricula: c.matricula,
          monto: c.saldoTexto.replace(/\s/g, ''),
          importe: c.saldo,
          ramo: String(c.ramo),
          poliza: String(c.polizaNumero),
          certificado: String(c.certificado),
          cuota: String(c.cuotaNumero),
          endoso: '999',
          email,
          moneda: '01',
        };

        const res = await runCajaMp(user, pass, input, limiter, session);
        results.push({ cajaId: c.cajaId, ...res });
        console.log(`  ✅ Ingreso ${res.nroIngreso}, lote ${res.lote} - ${res.mensaje}`);
      } catch (e) {
        console.log(`  ❌ Error: ${e.message}`);
        results.push({ cajaId: c.cajaId, ok: false, error: e.message, step: e.step });
      }
    }

    const outPath = out.replace('<user>', user);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
    console.log(`\n=== RESUMEN ===`);
    const ok = results.filter((r) => r.ok).length;
    console.log(`Procesadas: ${results.length} | OK: ${ok} | Error: ${results.length - ok}`);
    console.log(`Guardado en ${outPath}`);
  });

program.parse();