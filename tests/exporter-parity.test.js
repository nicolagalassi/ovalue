// L'exporter ha una sua copia del calcolo della produzione (Production Core del
// pannello): è uno userscript senza build, quindi non può importare i moduli
// dell'app. Questo test garantisce che le due copie diano lo stesso numero sugli
// stessi dati: se si corregge una formula in un posto solo, fallisce.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { profileFromFixture, userscriptPath } from './helpers';

// Estrae la sezione tra i marcatori PRODUCTION CORE e STATO dello userscript
// e la valuta con `d` = dati dell'export (come nel pannello).
const loadExporterCore = () => {
    const src = readFileSync(userscriptPath, 'utf8');
    const start = src.indexOf('// ── PRODUCTION CORE');
    const end = src.indexOf('// ── STATO', start);
    if (start < 0 || end < 0) throw new Error('Marcatori PRODUCTION CORE / STATO non trovati nello userscript');
    const code = src.slice(start, end);
    return (d) => new Function('d', `${code}; return { buildProductionModel, computeProduction };`)(d);
};

describe('exporter e app calcolano la stessa produzione', () => {
    const core = loadExporterCore();
    for (const name of ['veritate', 'nembus', 'amico']) {
        it(name, () => {
            const { raw, production } = profileFromFixture(name);
            const d = { empire_collected: true, ...raw };
            const { buildProductionModel, computeProduction } = core(d);
            expect(computeProduction(buildProductionModel(), null).daily).toBe(production.daily);
        });
    }
});
