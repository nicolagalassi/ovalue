// Sovraccarico crawler dedotto dalla produzione reale di accountInfo
// (inferOverloadFromProduction nello userscript). La "produzione reale" qui è
// calcolata con lo stesso Production Core e un sovraccarico noto per pianeta,
// più un piccolo scarto: la deduzione deve ritrovare il sovraccarico giusto.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { loadFixture, userscriptPath } from './helpers';

const src = readFileSync(userscriptPath, 'utf8');
const slice = (from, to) => {
    const a = src.indexOf(from), b = src.indexOf(to, a);
    if (a < 0 || b < 0) throw new Error(`marcatori non trovati: ${from} / ${to}`);
    return src.slice(a, b);
};
const core = slice('// ── PRODUCTION CORE', '// ── STATO');
const infer = slice('const OVERLOAD_TOLERANCE', '// Costruisce/aggiorna d.planets');
const load = (d) => new Function('d',
    `${core}\n${infer}\nreturn { buildProductionModel, lfResearchPercent, planetHourlyMetal, inferOverloadFromProduction };`)(d);

// Export reale reso Collezionista, con pochi crawler (sotto il tetto) sui primi pianeti
const makeData = () => {
    const d = JSON.parse(JSON.stringify(loadFixture('nembus')));
    d.playerClass = 'collector';
    d.crawlerFactorByPlanet = {};
    d.planets.forEach((p, i) => { p.overload = false; if (i < 6) p.crawlers = 300; });
    return d;
};

// Produzione "reale" per pianeta con il sovraccarico indicato
const realProduction = (d, overloadById, noise = 1.0004) => {
    const { buildProductionModel, lfResearchPercent, planetHourlyMetal } = load(d);
    const model = buildProductionModel();
    const lf = lfResearchPercent(model.planets);
    const out = {};
    d.planets.forEach((p, i) => {
        out[p.id] = planetHourlyMetal({ ...model.planets[i], overload: !!overloadById[p.id] }, model.settings, lf) * noise;
    });
    return out;
};

describe('sovraccarico crawler dedotto dalla produzione reale', () => {
    it('ritrova 150% e 100% sui pianeti sotto il tetto', () => {
        const d = makeData();
        const [a, b] = d.planets;
        d.realMetal = realProduction(d, { [a.id]: true });
        load(d).inferOverloadFromProduction();
        expect(d.overloadCheck[a.id].result).toBe('api');
        expect(d.crawlerFactorByPlanet[a.id]).toBe(150);
        expect(d.planets[0].overload).toBe(true);
        expect(d.overloadCheck[b.id].result).toBe('api');
        expect(d.crawlerFactorByPlanet[b.id]).toBe(100);
    });

    it('crawler al tetto: ininfluente, nessun valore scritto', () => {
        const d = makeData();
        // Miniere alte e molti crawler: il +50% si raggiunge anche senza sovraccarico
        const capped = d.planets[10];
        Object.assign(capped, { metal: 70, crystal: 65, deuterium: 65, crawlers: 3000 });
        d.realMetal = realProduction(d, {});
        load(d).inferOverloadFromProduction();
        expect(d.overloadCheck[capped.id].result).toBe('capped');
        expect(d.crawlerFactorByPlanet[capped.id]).toBeUndefined();
    });

    it('produzione che non coincide (es. miniere al 90%): nessuna deduzione', () => {
        const d = makeData();
        const p = d.planets[0];
        d.realMetal = realProduction(d, {});
        d.realMetal[p.id] *= 0.9;
        load(d).inferOverloadFromProduction();
        expect(d.overloadCheck[p.id].result).toBe('nomatch');
        expect(d.crawlerFactorByPlanet[p.id]).toBeUndefined();
    });

    it('classe diversa da Collezionista: non fa nulla', () => {
        const d = makeData();
        d.playerClass = 'explorer';
        d.realMetal = realProduction(d, {});
        load(d).inferOverloadFromProduction();
        expect(d.overloadCheck).toBeUndefined();
    });
});
