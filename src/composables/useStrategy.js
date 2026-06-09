// useStrategy.js
// Production Planner: simulatore + greedy goal-oriented per raggiungere un target
// di produzione giornaliera di metallo. Riusa al millimetro le formule di
// MetalCalc.vue e i costi di PackCalc.vue.
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

const { calcPlanetMetalProduction, getBuildCostLF, calcLFResearchBonus, calcPlanetLFContribution } = useOgameFormulas();

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

// ───── Simulatore produzione ───────────────────────────────────────────────
// Wrapper su calcPlanetMetalProduction (unica fonte di verità in useOgameFormulas).
// Differenze rispetto a MetalCalc: useMaxCrawlers=true (assume crawler sempre al cap)
// e supporta l'override della lifeform per-pianeta tramite lfChoice.
//
// Accetta opzionalmente `precomp.lfBonus` (risultato già calcolato di
// calcLFResearchBonus) per evitare di ricalcolarlo per ogni candidato nel loop.
const simulateDailyProduction = (state, precomp = null) => {
    const { settings, planets, lfChoice } = state;
    const lfResearchPct = precomp?.lfBonus ?? calcLFResearchBonus(planets);
    let hourly = 0;
    planets.forEach((p, idx) => {
        hourly += calcPlanetMetalProduction(p, settings, lfResearchPct, {
            lifeform: effectiveLifeform(p, lfChoice[idx]),
            useMaxCrawlers: true
        }).total;
    });
    return Math.floor(hourly * 24);
};

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

    // 1) Miniera di metallo +1 per ogni pianeta
    if (options.includeMines) {
        planets.forEach((p, idx) => {
            const lvl = parseInt(p.metal) || 0;
            if (lvl >= (caps?.metalMine ?? Infinity)) return;
            const cost = buildingCumulativeCost('metal_mine', lvl, lvl + 1, pack.minLevel);
            candidates.push({
                type: 'metal_mine',
                scope: 'planet',
                planetIdx: idx,
                from: lvl, to: lvl + 1,
                cost,
                applyMut:  (s) => { const v = s.planets[idx].metal; s.planets[idx].metal = lvl + 1; return v; },
                revertMut: (s, v) => { s.planets[idx].metal = v; }
            });
        });
    }

    // 1b) Miniere Cristallo/Deuterio +1 — non producono metallo, ma alzano il
    // cap crawler (somma livelli miniere × 8) e quindi il bonus % metallo dei
    // crawler, finché questo è sotto il tetto del 50%. Il loro costo è pieno
    // mentre il beneficio valutato è solo quello sul metallo: la produzione di
    // cristallo/deuterio extra è un regalo non conteggiato (scelta conservativa).
    if (options.includeCrawlerMines) {
        const crawlerMineDefs = [
            { type: 'crystal_mine',          field: 'crystal'   },
            { type: 'deuterium_synthesizer', field: 'deuterium' }
        ];
        planets.forEach((p, idx) => {
            crawlerMineDefs.forEach(({ type, field }) => {
                const lvl = parseInt(p[field]) || 0;
                if (lvl >= (caps?.metalMine ?? Infinity)) return;
                const cost = buildingCumulativeCost(type, lvl, lvl + 1, pack.minLevel);
                candidates.push({
                    type,
                    scope: 'planet',
                    planetIdx: idx,
                    from: lvl, to: lvl + 1,
                    cost,
                    applyMut:  (s) => { const v = s.planets[idx][field]; s.planets[idx][field] = lvl + 1; return v; },
                    revertMut: (s, v) => { s.planets[idx][field] = v; }
                });
            });
        });
    }

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

    // 3) Edifici LF per miniera (Rocktal/Humans)
    if (options.includeLf) {
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

    // 4) Ricerche LF con bonus metallo — un candidato per ogni (ricerca, pianeta).
    // Trattare ogni pianeta separatamente evita il salto di livelli (es. da 0 a max+1)
    // che gonfiava artificialmente il delta.
    //
    // INVARIANTE: si genera un candidato solo se la ricerca è già attiva OPPURE
    // è completamente nuova (livello 0). Se ha livelli ma è inattiva viene saltata:
    // il suo contributo alla produzione è 0 ma il costo sarebbe reale, rendendo il
    // delta calcolato pari al beneficio di TUTTI i livelli accumulati — ROI falso.
    if (options.includeLfResearch) {
        const capRes = caps?.lfResearch ?? Infinity;
        const allowedTierGroups = options.lfResearchTierGroups ?? [1, 2, 3];
        for (const species of ['humans', 'rocktal', 'mecha', 'kaelesh']) {
            const catData = OGAME_DB[`lf_${species}_res`];
            if (!catData) continue;
            for (const [idStr, itemData] of Object.entries(catData.items || {})) {
                const bonus = itemData.bonus;
                if (!bonus || (bonus[0] || 0) <= 0) continue;
                const tierGroup = Math.ceil((parseInt(idStr) % 100) / 6);
                if (!allowedTierGroups.includes(tierGroup)) continue;
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
        minScoreThreshold: 0,
        packMode: 'dynamic',
        onProgress: null,
        caps: { metalMine: Infinity, plasma: Infinity, lfBuilding: Infinity, lfResearch: Infinity },
        ...options
    };

    const state = JSON.parse(JSON.stringify(initialState));
    const steps = [];

    // ─ Cache incrementali ─
    const lfContribs = state.planets.map(p => calcPlanetLFContribution(p));
    const sumLfPct = () => {
        const t = { metal: 0, crystal: 0, deuterium: 0, collectorBonus: 0 };
        lfContribs.forEach(c => {
            t.metal += c.metal; t.crystal += c.crystal;
            t.deuterium += c.deuterium; t.collectorBonus += c.collectorBonus;
        });
        return {
            metal: t.metal * 100, crystal: t.crystal * 100,
            deuterium: t.deuterium * 100, collectorBonus: t.collectorBonus * 100
        };
    };
    let lfPct = sumLfPct();

    const planetHourly = (idx, pct = lfPct) =>
        calcPlanetMetalProduction(state.planets[idx], state.settings, pct, {
            lifeform: effectiveLifeform(state.planets[idx], state.lfChoice[idx]),
            useMaxCrawlers: true
        }).total;

    let hourly = state.planets.map((_, i) => planetHourly(i));
    let hourlySum = hourly.reduce((a, b) => a + b, 0);
    const fullHourlySum = (pct = lfPct) => {
        let s = 0;
        for (let i = 0; i < state.planets.length; i++) s += planetHourly(i, pct);
        return s;
    };

    const initialProd = Math.floor(hourlySum * 24);
    let currentProd = initialProd;
    let cumulativeMSU = 0;
    let cumulativePacks = 0;
    let creditMSU = 0;

    const target = parseInt(cfg.target) || 0;
    if (target <= initialProd) {
        return {
            initialProd, finalProd: initialProd, steps,
            cumulativeMSU: 0, cumulativePacks: 0,
            reachedTarget: true, stoppedReason: 'already_at_target'
        };
    }

    let stoppedReason = 'max_steps';

    // packValue dinamico: si aggiorna ogni packBatch pacchi accumulati.
    const packBatch = Math.max(1, parseInt(cfg.packBatch) || 1);
    let packValueSnapshot = initialProd;
    let lastSnapshotAt = 0;

    for (let step = 0; step < cfg.maxSteps; step++) {
        if (currentProd >= target) { stoppedReason = 'target_reached'; break; }

        if (typeof cfg.onProgress === 'function' && step % 20 === 0) {
            cfg.onProgress({ step, maxSteps: cfg.maxSteps, currentProd, initialProd, target });
        }

        // Aggiorna lo snapshot ogni packBatch pacchi (o ad ogni step se packBatch=1)
        if (cfg.packMode === 'dynamic' && cumulativePacks - lastSnapshotAt >= packBatch) {
            packValueSnapshot = currentProd;
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

            let newProd, newPlanetTotal = null, newContrib = null;
            if (cand.scope === 'planet') {
                newPlanetTotal = planetHourly(cand.planetIdx);
                newProd = Math.floor((hourlySum - hourly[cand.planetIdx] + newPlanetTotal) * 24);
            } else if (cand.scope === 'lf_research') {
                newContrib = calcPlanetLFContribution(state.planets[cand.planetIdx]);
                const old = lfContribs[cand.planetIdx];
                const pct = {
                    metal:          lfPct.metal          + (newContrib.metal          - old.metal)          * 100,
                    crystal:        lfPct.crystal        + (newContrib.crystal        - old.crystal)        * 100,
                    deuterium:      lfPct.deuterium      + (newContrib.deuterium      - old.deuterium)      * 100,
                    collectorBonus: lfPct.collectorBonus + (newContrib.collectorBonus - old.collectorBonus) * 100
                };
                newProd = Math.floor(fullHourlySum(pct) * 24);
            } else {
                // 'global' (plasma): cambia il totPerc di tutti i pianeti
                newProd = Math.floor(fullHourlySum() * 24);
            }

            cand.revertMut(state, backup);

            const deltaProd = newProd - currentProd;
            if (deltaProd <= 0) continue;
            const costMSU = toMSU(cand.cost, state.pack);
            if (costMSU <= 0) continue;
            const score = deltaProd / (costMSU / packValue);

            // A parità di score preferisci il costo minore: meno spreco di
            // arrotondamento pacchetti, stessa resa.
            if (!best || score > best.score || (score === best.score && costMSU < best.costMSU)) {
                best = { cand, deltaProd, costMSU, score, newProd, newPlanetTotal, newContrib };
            }
        }

        if (!best) { stoppedReason = 'no_positive_delta'; break; }
        if (cfg.minScoreThreshold > 0 && best.score < cfg.minScoreThreshold) {
            stoppedReason = 'score_below_threshold'; break;
        }

        // Applica definitivamente (senza revert) e aggiorna le cache.
        best.cand.applyMut(state);
        if (best.cand.scope === 'planet') {
            hourlySum += best.newPlanetTotal - hourly[best.cand.planetIdx];
            hourly[best.cand.planetIdx] = best.newPlanetTotal;
        } else if (best.cand.scope === 'lf_research') {
            lfContribs[best.cand.planetIdx] = best.newContrib;
            lfPct = sumLfPct();
            hourly = state.planets.map((_, i) => planetHourly(i));
            hourlySum = hourly.reduce((a, b) => a + b, 0);
        } else {
            hourly = state.planets.map((_, i) => planetHourly(i));
            hourlySum = hourly.reduce((a, b) => a + b, 0);
        }
        cumulativeMSU += best.costMSU;

        const netMSU = Math.max(0, best.costMSU - creditMSU);
        const packsNeeded = Math.ceil(netMSU / packValue);
        creditMSU = packsNeeded > 0 ? (packsNeeded * packValue - netMSU) : (creditMSU - best.costMSU);
        cumulativePacks += packsNeeded;
        currentProd = best.newProd;

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
            from: best.cand.from,
            to: best.cand.to,
            cost: best.cand.cost,
            costMSU: best.costMSU,
            packs: packsNeeded,
            packValue,
            deltaProd: best.deltaProd,
            cumulativeProd: currentProd,
            cumulativeMSU,
            cumulativePacks,
            score: best.score
        });
    }

    return {
        initialProd, finalProd: currentProd, steps,
        cumulativeMSU, cumulativePacks,
        reachedTarget: currentProd >= target,
        stoppedReason
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

export {
    simulateDailyProduction,
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
        simulateDailyProduction
    };
}
