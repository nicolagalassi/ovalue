// useStrategy.js
// Production Planner: simulatore + greedy goal-oriented per raggiungere un target
// di produzione giornaliera. L'obiettivo può essere metallo, cristallo e/o
// deuterio (somma NON pesata delle produzioni selezionate). Riusa le formule di
// useOgameFormulas.js e i costi di PackCalc.vue.
//
// Modello di "stato simulato":
//   {
//     settings: { ecoSpeed, playerClass, rocktalEnhancement, allyClass,
//                 plasma, geologist, staff, lfBonus },
//     planets:  [{ name, pos, metal, crystal, deuterium, item, itemCustom,
//                  magma, human, lifeform, crawlers, overload }, ...],
//     pack:     { rateMet, rateCry, rateDeut, minLevel, lfRsrLabLevel },
//     lfChoice: ['inherit'|'rocktal'|'humans'|'mecha', ...]  // per pianeta
//   }
//
// Lo stato è una *copia indipendente* del profilo attivo: il planner non scrive
// mai sul profilo, espone solo i risultati.

import { OGAME_DB } from '../data/ogame_db';
import { useOgameFormulas } from './useOgameFormulas';

const {
    calcPlanetMetalProduction, calcPlanetResourceProduction, getBuildCostLF,
    calcLFResearchBonus, calcPlanetLFContribution, hasLFResearchData
} = useOgameFormulas();

const RESOURCE_KEYS = ['metal', 'crystal', 'deuterium'];
const mineDefTypes = ['metal_mine', 'crystal_mine', 'deuterium_synthesizer'];
const normalizeResources = (raw) => {
    const list = Array.isArray(raw)
        ? raw
        : (raw && typeof raw === 'object' ? RESOURCE_KEYS.filter(k => raw[k]) : ['metal']);
    const clean = RESOURCE_KEYS.filter(k => list.includes(k));
    return clean.length ? clean : ['metal'];
};
const productionScore = (byRes, resources) =>
    resources.reduce((sum, r) => sum + (byRes[r] || 0), 0);

// ───── Helpers di base ─────────────────────────────────────────────────────

const effectiveLifeform = (planet, choice) => {
    if (!choice || choice === 'inherit') return planet.lifeform || 'humans';
    return choice;
};

const buildingCumulativeCost = (itemKey, fromLevel, toLevel, minLevel) => {
    const itemData =
        OGAME_DB.resources.items[itemKey] ||
        OGAME_DB.facilities.items[itemKey] ||
        OGAME_DB.research.items[itemKey];
    if (!itemData) return [0, 0, 0];
    const isMine = ['metal_mine', 'crystal_mine', 'deuterium_synthesizer'].includes(itemKey);
    const discount = isMine ? Math.min(0.5, (parseInt(minLevel) || 0) * 0.005) : 0;
    let m = 0, c = 0, d = 0;
    for (let i = fromLevel + 1; i <= toLevel; i++) {
        const factor = Math.pow(itemData.factor, i - 1);
        let cm = Math.floor(itemData.cost[0] * factor);
        let cc = Math.floor(itemData.cost[1] * factor);
        let cd = Math.floor(itemData.cost[2] * factor);
        if (discount > 0) {
            cm = Math.floor(cm * (1 - discount));
            cc = Math.floor(cc * (1 - discount));
            cd = Math.floor(cd * (1 - discount));
        }
        m += cm; c += cc; d += cd;
    }
    return [m, c, d];
};

const lfResearchCost = (species, researchId, fromLevel, toLevel, lfRsrLabLevel) => {
    const cat = OGAME_DB[`lf_${species}_res`];
    if (!cat) return [0, 0, 0];
    return getBuildCostLF(String(researchId), fromLevel, toLevel, cat.items, lfRsrLabLevel || 0, 0);
};

const lfBuildingCost = (lifeform, techId, fromLevel, toLevel, lfRsrLabLevel) => {
    let catKey;
    if (lifeform === 'humans') catKey = 'lf_humans';
    else if (lifeform === 'rocktal') catKey = 'lf_rocktal';
    else return [0, 0, 0];
    const cat = OGAME_DB[catKey];
    if (!cat) return [0, 0, 0];
    return getBuildCostLF(String(techId), fromLevel, toLevel, cat.items, lfRsrLabLevel || 0, 0);
};

const toMSU = (cost, pack) => {
    const rM = parseFloat(pack.rateMet) || 3;
    const rC = parseFloat(pack.rateCry) || 2;
    const rD = parseFloat(pack.rateDeut) || 1;
    return cost[0] + cost[1] * (rM / rC) + cost[2] * (rM / rD);
};

// Valore MSU di una produzione giornaliera: stessa conversione dei costi, così
// ROI e pacchi restano coerenti anche quando l'obiettivo è multi-risorsa.
const productionValue = (byRes, pack) =>
    toMSU([byRes.metal || 0, byRes.crystal || 0, byRes.deuterium || 0], pack);

// ───── Simulatore produzione ───────────────────────────────────────────────
// Wrapper su calcPlanetMetalProduction (unica fonte di verità in useOgameFormulas):
// stesso calcolo del Production Core, crawler compresi (min tra posseduti e cap).
// Le ipotesi di simulazione (crawler al massimo, sovraccarico, item, classe) non
// vivono qui: le applica la vista sullo stato prima di passarlo al planner, così
// senza ipotesi la produzione di partenza coincide con quella del Production Core.
// Unica differenza: l'override della lifeform per-pianeta tramite lfChoice.
//
// Accetta opzionalmente `precomp.lfBonus` (risultato già calcolato di
// calcLFResearchBonus) per evitare di ricalcolarlo per ogni candidato nel loop.
const simulateDailyProduction = (state, precomp = null) => {
    const { settings, planets, lfChoice } = state;
    const lfResearchPct = precomp?.lfBonus ?? calcLFResearchBonus(planets);
    let hourly = 0;
    planets.forEach((p, idx) => {
        hourly += calcPlanetMetalProduction(p, settings, lfResearchPct, {
            lifeform: effectiveLifeform(p, lfChoice[idx])
        }).total;
    });
    return Math.floor(hourly * 24);
};

// Stessa simulazione, ma separata per risorsa. Il metallo passa sempre dalla
// funzione verificata qui sopra; cristallo e deuterio usano le formule pubbliche
// in useOgameFormulas (temperatura planetaria opzionale per il deuterio).
const simulateDailyProductionByResource = (state, precomp = null) => {
    const { settings, planets, lfChoice } = state;
    const lfResearchPct = precomp?.lfBonus ?? calcLFResearchBonus(planets);
    const out = { metal: 0, crystal: 0, deuterium: 0 };
    planets.forEach((p, idx) => {
        const opts = { lifeform: effectiveLifeform(p, lfChoice[idx]) };
        RESOURCE_KEYS.forEach(r => {
            out[r] += calcPlanetResourceProduction(p, settings, lfResearchPct, r, opts).total;
        });
    });
    RESOURCE_KEYS.forEach(r => { out[r] = Math.floor(out[r] * 24); });
    return out;
};

// Obiettivo del planner: somma delle produzioni giornaliere delle risorse
// selezionate. Con una sola risorsa coincide con la produzione di quella risorsa.
const simulateProductionScore = (state, resources = ['metal'], precomp = null) =>
    productionScore(simulateDailyProductionByResource(state, precomp), normalizeResources(resources));

// ───── Generatori di candidati ─────────────────────────────────────────────
// Ogni candidato espone:
//   applyMut(state) → backup   — muta state in-place, ritorna i valori originali
//   revertMut(state, backup)   — ripristina state allo stato precedente
// Questo evita JSON.parse/stringify per ogni valutazione, riducendo il tempo
// di calcolo di 10-100x rispetto al clone-per-candidato.
//
// Ogni candidato dichiara inoltre uno `scope` che dice al planner quanto stato
// invalida la sua applicazione, per la valutazione incrementale:
//   'planet'      — cambia solo la produzione del pianeta planetIdx
//   'global'      — cambia un setting account-wide (plasma): tutti i pianeti
//   'lf_research' — cambia il bonus ricerche globale: tutti i pianeti + lfPct

const buildCandidates = (state, options) => {
    const candidates = [];
    const { settings, planets, pack, lfChoice } = state;
    const { caps } = options;
    const resources = normalizeResources(options.resources);
    const crawlerSupport = options.includeCrawlerMines === true;

    // 1) Miniere +1. Una miniera è candidata se produce una risorsa selezionata,
    // oppure se ( categorie "miniere crawler" ) alza il cap crawler: la somma
    // dei livelli miniere determina quanti crawler sono produttivi, con effetto
    // su tutte e tre le risorse finché il bonus non è al tetto del 50%.
    const mineDefs = [
        { type: 'metal_mine',          field: 'metal',     resource: 'metal' },
        { type: 'crystal_mine',        field: 'crystal',   resource: 'crystal' },
        { type: 'deuterium_synthesizer', field: 'deuterium', resource: 'deuterium' }
    ];
    mineDefs.forEach(({ type, field, resource }) => {
        const direct = resources.includes(resource);
        const allowed = resource === 'metal'
            ? (options.includeMines || (crawlerSupport && !direct))
            : (direct || crawlerSupport);
        if (!allowed) return;
        planets.forEach((p, idx) => {
            const lvl = parseInt(p[field]) || 0;
            if (lvl >= (caps?.metalMine ?? Infinity)) return;
            const cost = buildingCumulativeCost(type, lvl, lvl + 1, pack.minLevel);
            candidates.push({
                type,
                scope: 'planet',
                planetIdx: idx,
                from: lvl, to: lvl + 1,
                cost,
                benefits: [resource],
                directBenefit: direct,
                applyMut:  (s) => { const v = s.planets[idx][field]; s.planets[idx][field] = lvl + 1; return v; },
                revertMut: (s, v) => { s.planets[idx][field] = v; }
            });
        });
    });

    // 2) Tecnologia Plasma +1 (globale)
    if (options.includePlasma) {
        const lvl = parseInt(settings.plasma) || 0;
        if (lvl < (caps?.plasma ?? Infinity)) {
            const cost = buildingCumulativeCost('plasma_technology', lvl, lvl + 1, pack.minLevel);
            candidates.push({
                type: 'plasma_technology',
                scope: 'global',
                from: lvl, to: lvl + 1,
                cost,
                applyMut:  (s) => { const v = s.settings.plasma; s.settings.plasma = lvl + 1; return v; },
                revertMut: (s, v) => { s.settings.plasma = v; }
            });
        }
    }

    // 3) Edifici LF per miniera (Rocktal/Humans): effetto metallo noto. Per le
    // altre risorse i dati importati non espongono bonus per-risorsa, quindi non
    // vengono inventati (AGENTS.md §6).
    if (options.includeLf && resources.includes('metal')) {
        planets.forEach((p, idx) => {
            const lf = effectiveLifeform(p, lfChoice[idx]);
            if (lf === 'rocktal') {
                const lvl = parseInt(p.magma) || 0;
                if (lvl >= (caps?.lfBuilding ?? Infinity)) return;
                const cost = lfBuildingCost('rocktal', 2006, lvl, lvl + 1, pack.lfRsrLabLevel);
                candidates.push({
                    type: 'lf_magma',
                    scope: 'planet',
                    planetIdx: idx,
                    from: lvl, to: lvl + 1,
                    cost,
                    applyMut:  (s) => { const v = s.planets[idx].magma; s.planets[idx].magma = lvl + 1; return v; },
                    revertMut: (s, v) => { s.planets[idx].magma = v; }
                });
            } else if (lf === 'humans') {
                const lvl = parseInt(p.human) || 0;
                if (lvl >= (caps?.lfBuilding ?? Infinity)) return;
                const cost = lfBuildingCost('humans', 1006, lvl, lvl + 1, pack.lfRsrLabLevel);
                candidates.push({
                    type: 'lf_human',
                    scope: 'planet',
                    planetIdx: idx,
                    from: lvl, to: lvl + 1,
                    cost,
                    applyMut:  (s) => { const v = s.planets[idx].human; s.planets[idx].human = lvl + 1; return v; },
                    revertMut: (s, v) => { s.planets[idx].human = v; }
                });
            }
        });
    }

    // 4) Ricerche LF con bonus su una risorsa selezionata — un candidato per
    // ogni (ricerca, pianeta). Trattare ogni pianeta separatamente evita il salto
    // di livelli (es. da 0 a max+1) che gonfiava artificialmente il delta.
    //
    // INVARIANTE: si genera un candidato solo se la ricerca è già attiva OPPURE
    // è completamente nuova (livello 0). Se ha livelli ma è inattiva viene saltata:
    // il suo contributo alla produzione è 0 ma il costo sarebbe reale, rendendo il
    // delta calcolato pari al beneficio di TUTTI i livelli accumulati — ROI falso.
    if (options.includeLfResearch) {
        const capRes = caps?.lfResearch ?? Infinity;
        // Il Potenziamento Collezionista (bonus[6]) non dà risorse dirette: amplifica
        // il collFactor, che agisce su bonus di classe (+25%), moltiplicatore crawler
        // e cap crawler del Geologo per tutte e tre le risorse. Rende solo da
        // Collezionista, quindi è candidabile unicamente con quella classe.
        const isCollector = settings.playerClass === 'collector';
        // Selezione per-ricerca: Set di ID abilitati. Se non fornito → tutte le
        // ricerche candidabili (retro-compatibilità).
        const allowedIds = Array.isArray(options.lfResearchIds)
            ? new Set(options.lfResearchIds.map(String))
            : null;
        for (const species of ['humans', 'rocktal', 'mecha', 'kaelesh']) {
            const catData = OGAME_DB[`lf_${species}_res`];
            if (!catData) continue;
            for (const [idStr, itemData] of Object.entries(catData.items || {})) {
                const bonus = itemData.bonus;
                if (!bonus) continue;
                const benefits = RESOURCE_KEYS.filter((r, i) =>
                    resources.includes(r) && (bonus[i] || 0) > 0
                );
                const givesCollector = (bonus[6] || 0) > 0 && isCollector;
                if (benefits.length === 0 && !givesCollector) continue;
                if (allowedIds && !allowedIds.has(idStr)) continue;
                planets.forEach((p, planetIdx) => {
                    const currentLevel = parseInt((p.lfResearch || {})[idStr]) || 0;
                    const isActive     = (p.lfActive || {})[idStr] === true;

                    // Ricerca con livelli ma inattiva → skip per evitare delta gonfiato
                    if (currentLevel > 0 && !isActive) return;
                    if (currentLevel >= capRes) return;

                    const cost = lfResearchCost(species, idStr, currentLevel, currentLevel + 1, pack.lfRsrLabLevel);
                    candidates.push({
                        type: 'lf_research',
                        scope: 'lf_research',
                        species,
                        researchId: idStr,
                        researchName: itemData.name || idStr,
                        // true = nessun bonus diretto sulle risorse selezionate
                        indirectBonus: benefits.length === 0,
                        benefits,
                        planetIdx,
                        from: currentLevel,
                        to: currentLevel + 1,
                        cost,
                        applyMut: (s) => {
                            const planet = s.planets[planetIdx];
                            if (!planet.lfResearch) planet.lfResearch = {};
                            if (!planet.lfActive)   planet.lfActive   = {};
                            const prevLevel  = planet.lfResearch[idStr];
                            const prevActive = planet.lfActive[idStr];
                            planet.lfResearch[idStr] = currentLevel + 1;
                            planet.lfActive[idStr]   = true;
                            return { prevLevel, prevActive };
                        },
                        revertMut: (s, bk) => {
                            const planet = s.planets[planetIdx];
                            if (bk.prevLevel === undefined) delete planet.lfResearch[idStr];
                            else planet.lfResearch[idStr] = bk.prevLevel;
                            if (bk.prevActive === undefined) delete planet.lfActive[idStr];
                            else planet.lfActive[idStr] = bk.prevActive;
                        }
                    });
                });
            }
        }
    }

    return candidates;
};

// ───── Greedy planner ─────────────────────────────────────────────────────
// Valutazione incrementale: la produzione oraria di ogni pianeta e il
// contributo per-pianeta al bonus ricerche LF sono tenuti in cache.
//   - candidato scope 'planet'      → ricalcola solo quel pianeta: O(1)
//   - candidato scope 'global'      → ricalcola tutti i pianeti: O(N), ma è 1 solo
//   - candidato scope 'lf_research' → aggiorna il contributo del pianeta toccato
//                                     e ricalcola la produzione: O(N + R_pianeta)
// Risultati identici alla simulazione completa (il bonus LF globale è la somma
// esatta dei contributi per-pianeta), ma con un costo per step di ordini di
// grandezza inferiore.
//
// options.onProgress({ step, maxSteps, currentProd, initialProd, target }) viene
// invocata periodicamente per aggiornare la UI (usata dal worker).
export const runPlanner = (initialState, options = {}) => {
    const cfg = {
        maxSteps: 200,
        includeMines: true,
        includeCrawlerMines: false,
        includePlasma: true,
        includeLf: true,
        includeLfResearch: false,
        // Compliance: ottimizzazione locale su dati importati; nessuna chiamata
        // al gioco, nessun timer e nessuna azione automatica (AGENTS.md §1/§4).
        resources: ['metal'],
        minScoreThreshold: 0,
        packMode: 'dynamic',
        onProgress: null,
        caps: { metalMine: Infinity, plasma: Infinity, lfBuilding: Infinity, lfResearch: Infinity },
        ...options
    };
    const resources = normalizeResources(cfg.resources);
    // Metallo-only conserva la contabilità storica (solo metallo). Negli altri
    // casi il costo è MSU, quindi anche i pacchi/ROI devono usare il valore MSU.
    const isMetalOnly = resources.length === 1 && resources[0] === 'metal';

    const state = JSON.parse(JSON.stringify(initialState));
    const packUnits = (byRes) => isMetalOnly
        ? productionScore(byRes, resources)
        : productionValue(byRes, state.pack);
    const steps = [];

    // ─ Cache incrementali: una produzione oraria per pianeta e risorsa ─
    const lfContribs = state.planets.map(p => calcPlanetLFContribution(p));
    // Sorgente del bonus LF fissata sullo stato iniziale: se l'account parte dal
    // totale manuale, le ricerche simulate non devono "spegnerlo" a metà piano.
    const lfFromResearch = hasLFResearchData(state.planets);
    const sumLfPct = () => {
        const t = { metal: 0, crystal: 0, deuterium: 0, collectorBonus: 0 };
        lfContribs.forEach(c => {
            t.metal += c.metal; t.crystal += c.crystal;
            t.deuterium += c.deuterium; t.collectorBonus += c.collectorBonus;
        });
        return {
            metal: t.metal * 100, crystal: t.crystal * 100,
            deuterium: t.deuterium * 100, collectorBonus: t.collectorBonus * 100,
            fromResearch: lfFromResearch
        };
    };
    let lfPct = sumLfPct();

    const planetCalcs = (idx, pct = lfPct) => {
        const opts = { lifeform: effectiveLifeform(state.planets[idx], state.lfChoice[idx]) };
        const out = {};
        RESOURCE_KEYS.forEach(r => {
            out[r] = calcPlanetResourceProduction(state.planets[idx], state.settings, pct, r, opts);
        });
        return out;
    };
    const planetHourly = (idx, pct = lfPct) => {
        const calc = planetCalcs(idx, pct);
        const out = {};
        RESOURCE_KEYS.forEach(r => { out[r] = calc[r].total; });
        return out;
    };
    const sumHourly = (matrix) => {
        const out = { metal: 0, crystal: 0, deuterium: 0 };
        RESOURCE_KEYS.forEach(r => { out[r] = matrix[r].reduce((a, b) => a + b, 0); });
        return out;
    };
    const fullHourlySums = (pct = lfPct) => {
        const matrix = { metal: [], crystal: [], deuterium: [] };
        state.planets.forEach((_, i) => {
            const h = planetHourly(i, pct);
            RESOURCE_KEYS.forEach(r => matrix[r].push(h[r]));
        });
        return sumHourly(matrix);
    };
    const dailyOf = (sums) => {
        const out = {};
        RESOURCE_KEYS.forEach(r => { out[r] = Math.floor(sums[r] * 24); });
        return out;
    };

    const hourly = { metal: [], crystal: [], deuterium: [] };
    state.planets.forEach((_, i) => {
        const h = planetHourly(i);
        RESOURCE_KEYS.forEach(r => hourly[r].push(h[r]));
    });
    let hourlySums = sumHourly(hourly);

    // Un cambio globale (plasma o ricerca LF) modifica TUTTI i pianeti: aggiornare
    // solo hourlySums lascerebbe hourly[] vecchio e il prossimo step planet-scope
    // sottrarrebbe un valore obsoleto, generando delta negativi fasulli.
    const refreshHourlyCache = (pct = lfPct) => {
        state.planets.forEach((_, i) => {
            const h = planetHourly(i, pct);
            RESOURCE_KEYS.forEach(r => { hourly[r][i] = h[r]; });
        });
        hourlySums = sumHourly(hourly);
    };

    // Il bonus LF è un +% sulla base miniera, uguale per tutti i pianeti: la sua
    // variazione si stima in O(1) per risorsa invece di ricalcolare ogni pianeta.
    const mineBaseSums = () => {
        const out = { metal: 0, crystal: 0, deuterium: 0 };
        state.planets.forEach((_, i) => {
            const c = planetCalcs(i);
            RESOURCE_KEYS.forEach(r => { out[r] += c[r].mineBase; });
        });
        return out;
    };
    let mineBaseSum = mineBaseSums();

    const initialByRes = dailyOf(hourlySums);
    const initialProd = productionScore(initialByRes, resources);
    const initialValue = packUnits(initialByRes);
    let currentByRes = { ...initialByRes };
    let currentProd = initialProd;
    let currentValue = initialValue;
    let cumulativeMSU = 0;
    let cumulativePacks = 0;
    let creditMSU = 0;

    // Modalità "obiettivo di spesa": c'è un acquisto da fare (goalMSU, es. Astro 31)
    // e si alza la produzione prima solo finché conviene. Un pacco vale un giorno
    // di produzione in MSU (valore di cambio delle risorse): un upgrade che alza
    // il valore da P a P+Δ fa risparmiare C/P − C/(P+Δ) pacchi. Il ranking degli
    // step resta sulla somma non pesata scelta dall'utente. Nessun target di produzione.
    const goalMSU = Math.max(0, Number(cfg.goalMSU) || 0);
    const goalMode = goalMSU > 0;
    let investedPacks = 0;

    const target = goalMode ? Infinity : (parseInt(cfg.target) || 0);
    if (!goalMode && target <= initialProd) {
        return {
            initialProd, finalProd: initialProd, steps,
            initialByRes: { ...initialByRes }, finalByRes: { ...initialByRes },
            initialValue, finalValue: initialValue,
            resources,
            cumulativeMSU: 0, cumulativePacks: 0,
            reachedTarget: true, stoppedReason: 'already_at_target'
        };
    }

    let stoppedReason = 'max_steps';

    // packValue dinamico: si aggiorna ogni packBatch pacchi accumulati.
    const packBatch = Math.max(1, parseInt(cfg.packBatch) || 1);
    let packValueSnapshot = initialValue;
    let lastSnapshotAt = 0;

    for (let step = 0; step < cfg.maxSteps; step++) {
        if (currentProd >= target) { stoppedReason = 'target_reached'; break; }

        if (typeof cfg.onProgress === 'function' && step % 20 === 0) {
            cfg.onProgress({
                step, maxSteps: cfg.maxSteps, currentProd, initialProd, target,
                currentByRes: { ...currentByRes }
            });
        }

        if (cfg.packMode === 'dynamic' && cumulativePacks - lastSnapshotAt >= packBatch) {
            packValueSnapshot = currentValue;
            lastSnapshotAt = cumulativePacks;
        }
        const packValue = cfg.packMode === 'fixed'
            ? Math.max(1, initialProd)
            : Math.max(1, packValueSnapshot);

        const candidates = buildCandidates(state, cfg);
        if (candidates.length === 0) { stoppedReason = 'no_candidates'; break; }

        let best = null;
        for (const cand of candidates) {
            const backup = cand.applyMut(state);

            let newByRes, newPlanetTotals = null, newContrib = null;
            if (cand.scope === 'planet') {
                newPlanetTotals = planetHourly(cand.planetIdx);
                const sums = { ...hourlySums };
                RESOURCE_KEYS.forEach(r => {
                    sums[r] = hourlySums[r] - hourly[r][cand.planetIdx] + newPlanetTotals[r];
                });
                newByRes = dailyOf(sums);
            } else if (cand.scope === 'lf_research') {
                newContrib = calcPlanetLFContribution(state.planets[cand.planetIdx]);
                const old = lfContribs[cand.planetIdx];
                const pct = {
                    ...lfPct,
                    metal:          lfPct.metal          + (newContrib.metal          - old.metal)          * 100,
                    crystal:        lfPct.crystal        + (newContrib.crystal        - old.crystal)        * 100,
                    deuterium:      lfPct.deuterium      + (newContrib.deuterium      - old.deuterium)      * 100,
                    collectorBonus: lfPct.collectorBonus + (newContrib.collectorBonus - old.collectorBonus) * 100
                };
                if (newContrib.collectorBonus === old.collectorBonus) {
                    // Bonus diretto per risorsa: effetto lineare sulla base miniere
                    // (scarto dovuto agli arrotondamenti per pianeta trascurabile).
                    // Senza dati di ricerca (bonus LF manuale) il +% non si applica.
                    newByRes = { ...currentByRes };
                    RESOURCE_KEYS.forEach(r => {
                        const dPct = lfPct.fromResearch ? (newContrib[r] - old[r]) * 100 : 0;
                        newByRes[r] = currentByRes[r] + Math.floor(mineBaseSum[r] * dPct / 100 * 24);
                    });
                } else {
                    // Potenziamento Collezionista: agisce su collFactor (non lineare) → esatto
                    newByRes = dailyOf(fullHourlySums(pct));
                }
            } else {
                // 'global' (plasma): cambia il totPerc di tutti i pianeti
                newByRes = dailyOf(fullHourlySums());
            }

            cand.revertMut(state, backup);

            const deltaByRes = {};
            RESOURCE_KEYS.forEach(r => { deltaByRes[r] = newByRes[r] - currentByRes[r]; });
            const deltaProd = productionScore(deltaByRes, resources);
            const deltaValue = packUnits(deltaByRes);
            if (deltaProd <= 0 || deltaValue <= 0) continue;
            const costMSU = toMSU(cand.cost, state.pack);
            if (costMSU <= 0) continue;
            const score = deltaProd / (costMSU / packValue);

            if (!best || score > best.score || (score === best.score && costMSU < best.costMSU)) {
                best = { cand, deltaProd, deltaValue, costMSU, score, newByRes, newPlanetTotals, newContrib };
            }
        }

        if (!best) { stoppedReason = 'no_positive_delta'; break; }
        if (goalMode) {
            const P = currentValue, d = best.deltaValue;
            if (best.costMSU >= goalMSU * d / (P + d)) { stoppedReason = 'goal_optimal'; break; }
            investedPacks += best.costMSU / P;
        }
        if (cfg.minScoreThreshold > 0 && best.score < cfg.minScoreThreshold) {
            stoppedReason = 'score_below_threshold'; break;
        }

        const prevByRes = { ...currentByRes };
        best.cand.applyMut(state);
        if (best.cand.scope === 'planet') {
            RESOURCE_KEYS.forEach(r => {
                hourlySums[r] += best.newPlanetTotals[r] - hourly[r][best.cand.planetIdx];
                hourly[r][best.cand.planetIdx] = best.newPlanetTotals[r];
            });
            if (mineDefTypes.includes(best.cand.type)) mineBaseSum = mineBaseSums();
        } else if (best.cand.scope === 'lf_research') {
            lfContribs[best.cand.planetIdx] = best.newContrib;
            lfPct = sumLfPct();
            refreshHourlyCache();
        } else {
            refreshHourlyCache();
        }
        cumulativeMSU += best.costMSU;

        const netMSU = Math.max(0, best.costMSU - creditMSU);
        const packsNeeded = Math.ceil(netMSU / packValue);
        creditMSU = packsNeeded > 0 ? (packsNeeded * packValue - netMSU) : (creditMSU - best.costMSU);
        cumulativePacks += packsNeeded;

        currentByRes = dailyOf(hourlySums);
        currentProd = productionScore(currentByRes, resources);
        currentValue = packUnits(currentByRes);
        const deltaByResExact = {};
        RESOURCE_KEYS.forEach(r => { deltaByResExact[r] = currentByRes[r] - prevByRes[r]; });

        steps.push({
            n: step + 1,
            type: best.cand.type,
            planetIdx: best.cand.planetIdx ?? null,
            planetName: best.cand.planetIdx != null
                ? (state.planets[best.cand.planetIdx].name || `#${best.cand.planetIdx + 1}`)
                : null,
            researchId:   best.cand.researchId   ?? null,
            researchName: best.cand.researchName ?? null,
            species:      best.cand.species      ?? null,
            indirectBonus: best.cand.indirectBonus === true,
            from: best.cand.from,
            to: best.cand.to,
            cost: best.cand.cost,
            costMSU: best.costMSU,
            packs: packsNeeded,
            packValue,
            deltaProd: productionScore(deltaByResExact, resources),
            deltaValue: packUnits(deltaByResExact),
            deltaByRes: deltaByResExact,
            cumulativeProd: currentProd,
            cumulativeMSU,
            cumulativePacks,
            score: best.score
        });
    }

    const goal = goalMode ? {
        msu: goalMSU,
        directPacks: goalMSU / Math.max(1, initialValue),
        investedPacks,
        goalPacks: goalMSU / Math.max(1, currentValue)
    } : null;

    return {
        initialProd, finalProd: currentProd, steps,
        initialByRes: { ...initialByRes }, finalByRes: { ...currentByRes },
        initialValue, finalValue: currentValue,
        resources,
        cumulativeMSU, cumulativePacks,
        // In modalità spesa il piano è "completo" se si è fermato perché non conviene più
        reachedTarget: goalMode ? stoppedReason !== 'max_steps' : currentProd >= target,
        stoppedReason,
        goal
    };
};

// ───── Conversione MO/€ ──────────────────────────────────────────────────
const basePacks = [
    { cost: 200, amount: 5100000 },
    { cost: 100, amount: 2525000 },
    { cost: 50,  amount: 1140000 },
    { cost: 25,  amount:  480000 },
    { cost: 10,  amount:  150000 },
    { cost: 5,   amount:   60000 }
];

export const computeEuroCost = (packsNeeded, shop = {}) => {
    const basePackPrice = 60000;
    const discountFactor = 1 - ((parseInt(shop.shopDiscount) || 0) / 100);
    const moPerPack = basePackPrice * discountFactor;
    const totalMO = Math.ceil(packsNeeded) * moPerPack;
    if (totalMO <= 0) return { totalMO: 0, totalEuro: 0, packList: [] };

    const bonusMult = 1 + ((parseInt(shop.moBonus) || 0) / 100);
    const hasPaymentBonus = !!shop.paymentBonus;
    const currentPacks = basePacks.map(p => {
        let amt = p.amount;
        if (hasPaymentBonus) amt += (p.cost * 1000);
        return { cost: p.cost, amount: Math.floor(amt * bonusMult) };
    });

    const findBest = (target, packs) => {
        if (target <= 0) return { totalCost: 0, packList: [] };
        const cur = packs[0];
        const countA = Math.ceil(target / cur.amount);
        if (packs.length === 1) return { totalCost: countA * cur.cost, packList: [{ count: countA, pack: cur }] };
        const countB = Math.floor(target / cur.amount);
        const sub = findBest(target - countB * cur.amount, packs.slice(1));
        const costB = countB * cur.cost + sub.totalCost;
        if (countA * cur.cost <= costB) return { totalCost: countA * cur.cost, packList: [{ count: countA, pack: cur }] };
        const listB = [...sub.packList];
        if (countB > 0) listB.push({ count: countB, pack: cur });
        return { totalCost: costB, packList: listB };
    };

    const res = findBest(totalMO, currentPacks);
    res.packList.sort((a, b) => b.pack.cost - a.pack.cost);
    return { totalMO, totalEuro: res.totalCost, packList: res.packList };
};

// ───── Costruzione stato iniziale dal profilo ─────────────────────────────
export const buildInitialState = (profile, lfChoiceOverrides = []) => {
    if (!profile) return null;
    const prod = profile.production || {};
    const pack = profile.packExchange?.settings || {};
    const planets = JSON.parse(JSON.stringify(prod.planets || []));
    const lfChoice = planets.map((_, i) => lfChoiceOverrides[i] || 'inherit');

    return {
        settings: JSON.parse(JSON.stringify(prod.settings || {})),
        planets,
        pack: {
            rateMet: pack.rateMet ?? 3,
            rateCry: pack.rateCry ?? 2,
            rateDeut: pack.rateDeut ?? 1,
            minLevel: pack.minLevel ?? 0,
            lfRsrLabLevel: pack.lfRsrLabLevel ?? 0
        },
        shop: {
            shopDiscount: pack.shopDiscount ?? 0,
            moBonus: pack.moBonus ?? 0,
            paymentBonus: pack.paymentBonus ?? true,
            smartRounding: pack.smartRounding ?? false
        },
        lfChoice
    };
};

// ───── Avanzamento del piano rispetto al profilo ─────────────────────────
// Il piano resta quello calcolato la prima volta; i dati del Production Core
// (import dell'exporter o modifiche manuali) dicono quali step sono già fatti.
// Nessuna chiamata al gioco: si confrontano solo dati già presenti nell'app.

// Pianeta del profilo a cui si riferisce uno step. Si cerca per nome (l'ordine
// dei pianeti può cambiare tra un import e l'altro); se il nome manca o non è
// univoco si ripiega sulla posizione salvata nello step.
const findPlanPlanet = (planets, step) => {
    if (step.planetIdx == null || !Array.isArray(planets)) return null;
    if (step.planetName) {
        const byName = planets.filter(p => (p.name || '') === step.planetName);
        if (byName.length === 1) return byName[0];
    }
    return planets[step.planetIdx] || null;
};

// Livello attuale nel profilo della cosa che lo step alza (null se non trovata).
const currentStepLevel = (step, production) => {
    if (!production) return null;
    if (step.type === 'plasma_technology') return parseInt(production.settings?.plasma) || 0;
    const p = findPlanPlanet(production.planets, step);
    if (!p) return null;
    switch (step.type) {
        case 'metal_mine':            return parseInt(p.metal) || 0;
        case 'crystal_mine':          return parseInt(p.crystal) || 0;
        case 'deuterium_synthesizer': return parseInt(p.deuterium) || 0;
        case 'lf_magma':              return parseInt(p.magma) || 0;
        case 'lf_human':              return parseInt(p.human) || 0;
        case 'lf_research':           return parseInt((p.lfResearch || {})[step.researchId]) || 0;
        default:                      return null;
    }
};

// Step completato: il livello nel profilo ha raggiunto (o superato) il "to".
// Livelli saltati (es. +2 in un colpo) completano anche gli step intermedi.
const isStepDoneInProfile = (step, production) => {
    const lvl = currentStepLevel(step, production);
    return lvl != null && lvl >= step.to;
};

// Riporta lo stato (forma di buildInitialState) ai livelli di partenza del piano
// per tutto ciò che il piano stesso alza. Così l'impronta del core resta uguale
// finché le differenze sono solo avanzamento del piano, e l'avviso "dati cambiati"
// scatta solo per cambiamenti estranei (classe, item, pianeti, …).
const STEP_FIELD = {
    metal_mine: 'metal', crystal_mine: 'crystal', deuterium_synthesizer: 'deuterium',
    lf_magma: 'magma', lf_human: 'human'
};
const rewindPlanProgress = (state, steps) => {
    if (!state || !Array.isArray(steps)) return state;
    const ranges = new Map();   // chiave → { from (primo), to (massimo), step }
    steps.forEach(st => {
        const key = st.type === 'plasma_technology'
            ? 'plasma'
            : `${st.type}|${st.planetName ?? st.planetIdx}|${st.researchId ?? ''}`;
        const r = ranges.get(key);
        if (!r) ranges.set(key, { from: st.from, to: st.to, step: st });
        else r.to = Math.max(r.to, st.to);
    });
    // Solo i valori effettivamente avanzati: riscrivere anche quelli fermi al
    // "from" cambierebbe il tipo (es. "55" → 55) e quindi l'impronta.
    const inRange = (v, r) => v > r.from && v <= r.to;
    ranges.forEach(r => {
        const st = r.step;
        if (st.type === 'plasma_technology') {
            const v = parseInt(state.settings?.plasma) || 0;
            if (inRange(v, r)) state.settings.plasma = r.from;
            return;
        }
        const p = findPlanPlanet(state.planets, st);
        if (!p) return;
        if (st.type === 'lf_research') {
            const v = parseInt((p.lfResearch || {})[st.researchId]) || 0;
            if (!inRange(v, r)) return;
            if (r.from === 0) {
                // Ricerca nuova: prima del piano non c'era né livello né attivazione
                if (p.lfResearch) delete p.lfResearch[st.researchId];
                if (p.lfActive)   delete p.lfActive[st.researchId];
            } else {
                p.lfResearch[st.researchId] = r.from;
            }
            return;
        }
        const field = STEP_FIELD[st.type];
        if (!field) return;
        const v = parseInt(p[field]) || 0;
        if (inRange(v, r)) p[field] = r.from;
    });
    return state;
};

// Applica uno step a uno stato (forma di buildInitialState), come se fosse già
// stato fatto in gioco. Usato da "Ricalcola il resto" per gli step spuntati a
// mano ma non ancora importati, così il planner non li ripropone.
const applyStepToState = (state, step) => {
    if (step.type === 'plasma_technology') {
        state.settings.plasma = Math.max(parseInt(state.settings.plasma) || 0, step.to);
        return;
    }
    const p = findPlanPlanet(state.planets, step);
    if (!p) return;
    if (step.type === 'lf_research') {
        if (!p.lfResearch) p.lfResearch = {};
        if (!p.lfActive)   p.lfActive   = {};
        p.lfResearch[step.researchId] = Math.max(parseInt(p.lfResearch[step.researchId]) || 0, step.to);
        p.lfActive[step.researchId] = true;
        return;
    }
    const field = STEP_FIELD[step.type];
    if (field) p[field] = Math.max(parseInt(p[field]) || 0, step.to);
};

export {
    simulateDailyProduction,
    simulateDailyProductionByResource,
    simulateProductionScore,
    findPlanPlanet,
    currentStepLevel,
    isStepDoneInProfile,
    rewindPlanProgress,
    applyStepToState,
    buildingCumulativeCost,
    lfBuildingCost,
    toMSU,
    buildCandidates,
    effectiveLifeform
};

export function useStrategy() {
    return {
        runPlanner,
        computeEuroCost,
        buildInitialState,
        simulateDailyProduction,
        simulateDailyProductionByResource,
        simulateProductionScore
    };
}
