// Ogni elemento selezionabile nel costruttore del Pack Exchange deve avere un nome
// almeno in inglese: è il fallback per DE/FR (e per IT se manca), altrimenti la UI
// mostra la chiave grezza (era il caso di lunar_base, sensor_phalanx, jump_gate).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { OGAME_DB } from '../src/data/ogame_db.js';

const en = JSON.parse(readFileSync(new URL('../src/locales/en.json', import.meta.url), 'utf8'));
const pack = readFileSync(new URL('../src/views/PackCalc.vue', import.meta.url), 'utf8');
const cats = [...pack.matchAll(/<option value="([a-z_]+)"/g)].map(m => m[1]).filter(c => OGAME_DB[c]);

describe('Pack Exchange: nomi degli elementi', () => {
    it('trova le categorie del menu', () => expect(cats.length).toBeGreaterThan(10));
    for (const cat of cats) {
        it(cat, () => {
            const missing = Object.keys(OGAME_DB[cat].items).filter(k => !en[k]);
            expect(missing).toEqual([]);
        });
    }
});
