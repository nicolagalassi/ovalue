// Formule di produzione verificate contro i valori reali del gioco.
import { describe, it, expect } from 'vitest';
import { useOgameFormulas } from '../src/composables/useOgameFormulas';
import { profileFromFixture } from './helpers';

const f = useOgameFormulas();

describe('produzione giornaliera = valore del Pacchetto Metallo in gioco', () => {
    // Il pacchetto dà un giorno di produzione: deve coincidere al metallo.
    for (const name of ['veritate', 'nembus']) {
        it(name, () => {
            const { raw, production } = profileFromFixture(name);
            expect(production.daily).toBe(raw._gamePackMetal);
        });
    }
});

describe('bonus ricerche LF', () => {
    it('account tutto Rocktal LF 100: 198,836% (in gioco la pagina mostra 198,7%)', () => {
        const { raw, production } = profileFromFixture('amico');
        const pct = f.calcLFResearchBonus(production.planets);
        expect(pct.fromResearch).toBe(true);
        expect(pct.metal).toBeCloseTo(198.836, 3);
        expect(Math.abs(pct.metal - raw._gameLfMetalPct)).toBeLessThan(0.2);
    });

    it('gli edifici di una specie non attiva non amplificano le ricerche', () => {
        // Pianeta Rocktal con edifici Mecha residui: conta solo il livello (100 → +10%)
        const mult = f.calcPlanetResearchMult({ lifeform: 'rocktal', lifeformLevel: 100, lfBuildings: { '3007': 10, '3011': 15 } });
        expect(mult).toBeCloseTo(1.1, 10);
        // Lo stesso pianeta Mecha li conta: 1 + 0,1 + 10×0,3% + 15×0,4%
        const mecha = f.calcPlanetResearchMult({ lifeform: 'mecha', lifeformLevel: 100, lfBuildings: { '3007': 10, '3011': 15 } });
        expect(mecha).toBeCloseTo(1.19, 10);
    });

    it('il totale manuale (lfBonus) non si somma al bonus calcolato dalle ricerche', () => {
        const { production } = profileFromFixture('veritate');
        const settings = { ...production.settings, lfBonus: 50 };
        const pct = f.calcLFResearchBonus(production.planets);
        const base = f.calcPlanetMetalProduction(production.planets[0], production.settings, pct).total;
        const withManual = f.calcPlanetMetalProduction(production.planets[0], settings, pct).total;
        expect(withManual).toBe(base);
    });

    it('senza dati di ricerca si usa il totale manuale', () => {
        const planet = { pos: 8, metal: 30, crystal: 20, deuterium: 20, lifeform: 'humans', lfResearch: {} };
        const settings = { ecoSpeed: 1, plasma: 0, lfBonus: 12 };
        const pct = f.calcLFResearchBonus([planet]);
        expect(pct.fromResearch).toBe(false);
        expect(f.calcPlanetMetalProduction(planet, settings, pct).totPerc).toBe(12);
    });
});
