// Costi degli edifici Project Orion nel Pack Exchange: stessa formula del
// builder (floor(base × factor^(L−1)) per livello), confrontata con i prezzi letti
// dal gioco sul server di test s808-en (riportati nello script OGLight Orion Addons).
import { describe, it, expect } from 'vitest';
import { OGAME_DB } from '../src/data/ogame_db.js';

const costAt = (key, level) => {
    const it = OGAME_DB.orion.items[key];
    const f = Math.pow(it.factor, level - 1);
    return it.cost.map(c => Math.floor(c * f));
};

describe('Project Orion: costi come nel gioco', () => {
    it('Interstellar Anomaly Scanner, livelli 52 e 54', () => {
        expect(costAt('orion_anomaly_scanner', 52)).toEqual([86078902528, 43039451264, 14346483754]);
        expect(costAt('orion_anomaly_scanner', 54)).toEqual([193677530690, 96838765345, 32279588448]);
    });
    it('Intergalactic Recovery Center, livello 1', () => {
        expect(costAt('orion_recovery_center', 1)).toEqual([75000, 52500, 22500]);
    });
    it('Lithium Electrolysis Lab, livelli 3, 5 e 19 (metallo)', () => {
        expect(costAt('orion_lithium_lab', 3)[0]).toBe(118125);
        expect(costAt('orion_lithium_lab', 5)[0]).toBe(265781);
        expect(costAt('orion_lithium_lab', 19)[0]).toBe(77589323);
    });
    it('Conversion Catalyst, livello 11', () => {
        expect(costAt('orion_conversion_catalyst', 11)).toEqual([7352292, 6487316, 3027414]);
    });
    it('tutti gli edifici hanno id, costi e nome tradotto', () => {
        const en = require('../src/locales/en.json');
        for (const [key, it] of Object.entries(OGAME_DB.orion.items)) {
            expect(it.cost).toHaveLength(3);
            expect(it.factor).toBe(1.5);
            expect(en[key]).toBeTruthy();
        }
    });
});
