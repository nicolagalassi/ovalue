// Utility condivise dai test: caricano gli export reali in tests/fixtures e li
// convertono con lo stesso codice dell'import dell'app (exporterImport.js).
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { applyExportToProduction } from '../src/composables/exporterImport';

const here = dirname(fileURLToPath(import.meta.url));

export const loadFixture = (name) =>
    JSON.parse(readFileSync(join(here, 'fixtures', `${name}.json`), 'utf8'));

// Stesso default di createDefaultProduction (useProfiles.js)
const defaultProduction = () => ({
    settings: {
        ecoSpeed: 8, playerClass: 'collector', rocktalEnhancement: 0, allyClass: 'none',
        plasma: 0, geologist: false, staff: false, lfBonus: 0
    },
    planets: []
});

// Profilo minimo come quello che l'app costruisce dopo un import dall'exporter.
export const profileFromFixture = (name) => {
    const raw = loadFixture(name);
    return {
        raw,
        id: `test-${name}`,
        production: applyExportToProduction(defaultProduction(), raw),
        packExchange: {
            settings: { rateMet: 3, rateCry: 2, rateDeut: 1, minLevel: 0, lfRsrLabLevel: 0 },
            stock: { metal: 0, crystal: 0, deuterium: 0 }, queue: []
        }
    };
};

export const userscriptPath = join(here, '..', 'util', 'OValue_Exporter_v3.user.js');
