import { OGAME_DB } from '../data/ogame_db';

export function useOgameFormulas() {
    
    // Formatter numeri (es. 1.000.000)
    const formatNum = (n) => {
        return new Intl.NumberFormat('it-IT').format(Math.floor(n));
    };

    // Calcolo Produzione Base Miniera (Identico al vecchio script)
    // mineBase = 30 * Eco * PosMult * Lvl * 1.1^Lvl
    const calcMineProduction = (level, ecoSpeed, posMult) => {
        if (level <= 0) return 0;
        return Math.floor(30 * ecoSpeed * posMult * level * Math.pow(1.1, level));
    };

    // Calcolo Moltiplicatore Posizione (Identico)
    const getPosMult = (pos) => {
        pos = parseInt(pos);
        if (pos === 8) return 1.35;
        if (pos === 7 || pos === 9) return 1.23;
        if (pos === 6 || pos === 10) return 1.17;
        return 1.0;
    };

    // Calcolo Cap Crawler (Centralizzato)
    const calcCrawlerCap = (metal, crystal, deut, isCollector, hasGeologist, rocktalEnhancement = 0) => {
        const mineSum = parseInt(metal||0) + parseInt(crystal||0) + parseInt(deut||0);
        let max = mineSum * 8;
        
        if (isCollector && hasGeologist) {
            const collFactor = 1 + (parseFloat(rocktalEnhancement || 0) / 100);
            const geoBonus = 0.1 * collFactor;
            max = Math.floor(max * (1 + geoBonus));
        }
        
        return max;
    };

    // ─── Calcolo produzione oraria metallo per un singolo pianeta ─────────────
    // Unica fonte di verità usata da MetalCalc, PlanetCard e useStrategy.
    // Restituisce tutti i valori numerici necessari al display e al calcolo.
    //
    // options:
    //   lifeform       — override della lifeform (per il planner); default: planet.lifeform
    //   useMaxCrawlers — usa il cap come crawler effettivi (planner); default: false
    //
    // Nota: "bonusProd" è il contributo del totPerc sul mineBase; il totale orario
    // è natProd + mineBase + bonusProd. La somma di .total su tutti i pianeti
    // è esattamente uguale all'hourly del footer MetalCalc.
    const calcPlanetMetalProduction = (planet, settings, lfResearchPct, options = {}) => {
        const { lifeform: lfOverride = null, useMaxCrawlers = false } = options;

        const ecoSpeed   = settings.ecoSpeed || 1;
        const isCollector = settings.playerClass === 'collector';
        const collFactor  = 1
            + ((settings.rocktalEnhancement || 0) / 100)
            + ((lfResearchPct?.collectorBonus  || 0) / 100);

        const met      = parseInt(planet.metal) || 0;
        const posMult  = getPosMult(planet.pos);
        const natProd  = Math.floor(30 * ecoSpeed * posMult);
        const mineBase = calcMineProduction(met, ecoSpeed, posMult);

        let totPerc = (settings.plasma || 0) * 1;
        if (settings.geologist)           totPerc += 10;
        if (settings.staff)               totPerc += 2;
        if (isCollector)                  totPerc += 25 * collFactor;
        if (settings.allyClass === 'trader') totPerc += 5;
        totPerc += (parseInt(planet.item) || 0) + (parseInt(planet.itemCustom) || 0);

        const lf = lfOverride || planet.lifeform || 'humans';
        if (lf === 'rocktal') totPerc += (parseInt(planet.magma) || 0) * 2;
        else if (lf === 'humans') totPerc += (parseInt(planet.human) || 0) * 1.5;

        totPerc += lfResearchPct?.metal || 0;
        // Fallback manuale per-pianeta: si applica solo se questo pianeta non ha
        // ricerche LF con livello > 0 (stessa logica di MetalCalc e PlanetCard).
        const planetHasLfResearch = Object.values(planet.lfResearch || {}).some(v => v > 0);
        if (!planetHasLfResearch) totPerc += settings.lfBonus || 0;

        const maxCraw  = calcCrawlerCap(met, planet.crystal, planet.deuterium,
                                        isCollector, settings.geologist, settings.rocktalEnhancement);
        const rawCraw  = parseInt(planet.crawlers) || 0;
        const actCraw  = useMaxCrawlers ? maxCraw : Math.min(rawCraw, maxCraw);
        if (actCraw > 0) {
            let mult = 0.02;
            if (isCollector) {
                mult *= (1 + (50 * collFactor) / 100);
                if (planet.overload) mult *= 1.5;
            }
            totPerc += Math.min(actCraw * mult, 50);
        }

        const bonusProd = Math.floor(mineBase * (totPerc / 100));
        return {
            natProd,
            mineBase,
            totPerc,
            bonusProd,
            total: natProd + mineBase + bonusProd,
            maxCraw,
            actCraw,
            collFactor,
            isCrawCapReached: rawCraw > maxCraw
        };
    };

    // FORMULA LIFEFORMS (Corrected as per user feedback)
    const calcBuildCostLF = (itemData, techLevel, costRdc) => {
        if (techLevel < 1 || !itemData) return [0, 0, 0];
        const cost = [0, 0, 0];
        const rdc = Math.min(0.99, costRdc);
        const baseCost = itemData.cost;
        const factors = itemData.factors;
        for (let i = 0; i < 3; i++) {
            const rawCost = Math.floor(baseCost[i] * techLevel * Math.pow(factors[i], techLevel - 1));
            cost[i] = Math.floor((1 - rdc) * rawCost);
        }
        return cost;
    };

    const getBuildCostLF = (techID, techLevelFrom, techLevelTo, techData, rsrLabLevel, bldCostRdc) => {
        let totalCost = [0, 0, 0];
        const id = parseInt(techID);
        const itemData = techData[techID];
        if (!itemData) return [0, 0, 0];
        
        // La riduzione si applica solo alle ricerche (ID % 1000 >= 100)
        // Livello Lab Ricerca LF: 0.25% per livello, max 25%
        let costReduction = 0;
        if (id % 1000 >= 100) {
            costReduction = Math.min(0.25, (parseFloat(rsrLabLevel)||0) * 0.0025);
        }
        
        for (let i = parseInt(techLevelFrom) + 1; i <= parseInt(techLevelTo); i++) {
            const cost = calcBuildCostLF(itemData, i, costReduction);
            totalCost[0] += cost[0]; totalCost[1] += cost[1]; totalCost[2] += cost[2];
        }
        return totalCost;
    };

    // Calcola il bonus produzione totale dalle ricerche LF per un set di pianeti.
    // Le ricerche LF aumentano la produzione di tutti i pianeti (bonus globale).
    // Ogni pianeta contribuisce col proprio livello di ricerca * bonus per livello.
    // Bonus per livello: [metal, crystal, deut, metalCap, crystalCap, deutCap, collectorBonus]
    //   bonus[0-2]: frazione per livello (es. 0.0006 = 0.06% per livello)
    //   bonus[3-5]: cap (0 = nessun cap)
    //   bonus[6]:   frazione collectorBonus per livello (aggiunge a rocktalEnhancement)
    // Edifici LF che amplificano le ricerche:
    //   1011 (Metropolis)  → +0.5%/livello     [metal/crystal/deut]
    //   3007 (HPT)         → +0.3%/livello     [crystal]
    //   3011 (Chip Mass)   → +0.4%/livello     [metal]
    //   4007 (Cloning Lab) → +0.25%/livello    [Kaelesh solo]
    // Calcola il bonus GLOBALE delle ricerche LF da tutti i pianeti dell'account.
    // Le ricerche LF sono account-wide: ogni pianeta contribuisce al pool globale.
    // Il totale si applica ugualmente a tutti i pianeti (non è per-pianeta).
    // Cross-species: un pianeta Mecha può avere ricerche Umani/Rocktal/Kaelesh attive.
    // Building mult per-specie: ogni edificio amplifica solo le ricerche della sua specie.
    const calcLFResearchBonus = (planets) => {
        if (!Array.isArray(planets) || planets.length === 0)
            return { metal: 0, crystal: 0, deuterium: 0, collectorBonus: 0 };

        const bonusPerc = { metal: 0, crystal: 0, deuterium: 0, collectorBonus: 0 };

        planets.forEach(p => {
            const lfData   = p.lfResearch || {};
            const lfLevel  = parseInt(p.lifeformLevel) || 0;

            const bld      = p.lfBuildings || {};
            const metroLvl = parseInt(bld['1011']) || 0;  // Metropolis (Humans)
            const hptLvl   = parseInt(bld['3007']) || 0;  // Trasformatore alta potenza (Mecha)
            const cmpLvl   = parseInt(bld['3011']) || 0;  // Produzione massa chip (Mecha)
            const cloneLvl = parseInt(bld['4007']) || 0;  // Laboratorio Clonazione (Kaelesh)

            // Formula OGame ADDITIVA: tutti i bonus si sommano (non si moltiplicano tra loro).
            // Gli edifici del pianeta amplificano TUTTE le ricerche sul pianeta (cross-species).
            // Rates verificati: Metropolis 0.5%/lvl, HPT 0.3%/lvl, CMP 0.4%/lvl, Clone 0.25%/lvl
            const mult = 1 + lfLevel*0.001 + metroLvl*0.005 + hptLvl*0.003 + cmpLvl*0.004 + cloneLvl*0.0025;

            const lfActive = p.lfActive || {};

            for (const species of ['humans', 'rocktal', 'mecha', 'kaelesh']) {
                const catData = OGAME_DB[`lf_${species}_res`];
                if (!catData) continue;

                for (const [idStr, itemData] of Object.entries(catData.items || {})) {
                    const level = parseInt(lfData[idStr]) || 0;
                    if (level <= 0) continue;
                    if (lfActive[idStr] !== true) continue;

                    const bonus = itemData.bonus;
                    if (!bonus) continue;

                    bonusPerc.metal          += Math.min(level * (bonus[0] || 0) * mult, bonus[3] || Infinity);
                    bonusPerc.crystal        += Math.min(level * (bonus[1] || 0) * mult, bonus[4] || Infinity);
                    bonusPerc.deuterium      += Math.min(level * (bonus[2] || 0) * mult, bonus[5] || Infinity);
                    bonusPerc.collectorBonus += level * (bonus[6] || 0) * mult;
                }
            }
        });

        return {
            metal:          bonusPerc.metal * 100,
            crystal:        bonusPerc.crystal * 100,
            deuterium:      bonusPerc.deuterium * 100,
            collectorBonus: bonusPerc.collectorBonus * 100
        };
    };

    // Parsea stringhe di durata OGame in timestamp di scadenza.
    // Formati supportati:
    //   - lettere IT:  "8s 2g 14o 8m 32s"  (s=settimane, g=giorni, o=ore, m=minuti, s=secondi)
    //   - lettere EN:  "7d 12h 30m 10s"    (d=days, h=hours, m=minutes, s=seconds)
    //   - countdown:   "6:23:45:12"        (D:HH:MM:SS) o "3:45:12" (H:MM:SS)
    //   - permanente:  "Permanente", "Permanent", "∞"
    //
    // Disambiguazione di 's': in italiano 's' può essere settimane o secondi.
    // Regola: se dopo 's' compaiono unità più grandi (g, d, o, h, m), allora 's' = settimane.
    const parseDurationToTimestamp = (durationStr) => {
        if (!durationStr) return { expires: null, total: null };

        const str = durationStr.trim();

        // Permanente
        if (/^(Permanente|Permanent|Sconosciuto|Unknown|∞|-)$/i.test(str)) {
            return { expires: null, total: null };
        }

        // Formato countdown OGame: D:HH:MM:SS oppure H:MM:SS
        const colonMatch = str.match(/^(\d+):(\d{2}):(\d{2})(?::(\d{2}))?$/);
        if (colonMatch) {
            const totalMs = colonMatch[4] !== undefined
                ? (parseInt(colonMatch[1]) * 86400 + parseInt(colonMatch[2]) * 3600 + parseInt(colonMatch[3]) * 60 + parseInt(colonMatch[4])) * 1000
                : (parseInt(colonMatch[1]) * 3600  + parseInt(colonMatch[2]) * 60   + parseInt(colonMatch[3])) * 1000;
            return { expires: Date.now() + totalMs, total: totalMs };
        }

        // Formato con unità lettere: raccogli tutti i token
        const regex = /(\d+)\s*([a-zA-Z]+)/g;
        const tokens = [];
        let match;
        while ((match = regex.exec(str)) !== null) {
            tokens.push({ val: parseInt(match[1]), unit: match[2].toLowerCase() });
        }

        if (tokens.length === 0) return { expires: null, total: null };

        let totalMs = 0;
        tokens.forEach((token, i) => {
            const { val, unit } = token;

            if (unit.startsWith('w') || unit.startsWith('se')) {
                // esplicito: week / settimane
                totalMs += val * 7 * 24 * 60 * 60 * 1000;
            } else if (unit.startsWith('d') || unit.startsWith('g')) {
                totalMs += val * 24 * 60 * 60 * 1000;
            } else if (unit.startsWith('h') || unit === 'o') {
                // h=hours (EN), o=ore (IT)
                totalMs += val * 60 * 60 * 1000;
            } else if (unit.startsWith('m')) {
                totalMs += val * 60 * 1000;
            } else if (unit === 's') {
                // Ambiguo: 's' può essere settimane (IT) o secondi
                // Se dopo questo token esistono unità più grandi → è settimane
                const hasLargerAfter = tokens.slice(i + 1).some(t =>
                    t.unit.startsWith('g') || t.unit.startsWith('d') ||
                    t.unit.startsWith('h') || t.unit === 'o' ||
                    t.unit.startsWith('m')
                );
                totalMs += hasLargerAfter
                    ? val * 7 * 24 * 60 * 60 * 1000   // settimane
                    : val * 1000;                       // secondi
            }
        });

        return { expires: Date.now() + totalMs, total: totalMs };
    };

    return {
        formatNum,
        calcMineProduction,
        getPosMult,
        calcCrawlerCap,
        calcPlanetMetalProduction,
        calcBuildCostLF,
        getBuildCostLF,
        calcLFResearchBonus,
        parseDurationToTimestamp
    };
}