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
    //   lifeform — override della lifeform (per il planner); default: planet.lifeform
    //
    // Nota: "bonusProd" è il contributo del totPerc sul mineBase (non arrotondato);
    // il totale orario è natProd + mineBase + bonusProd e va arrotondato solo sul
    // giornaliero (Math.floor(hourly * 24)). La somma di .total su tutti i pianeti
    // è esattamente uguale all'hourly del footer MetalCalc.
    const calcPlanetMetalProduction = (planet, settings, lfResearchPct, options = {}) => {
        const { lifeform: lfOverride = null } = options;

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

        // Bonus LF: o calcolato dalle ricerche (globale, account-wide) o il totale
        // manuale settings.lfBonus — mai entrambi. Il totale manuale (o quello
        // importato dalla pagina Bonus LF) include già tutte le ricerche, quindi
        // sommarlo a lfResearchPct.metal conterebbe le ricerche due volte.
        totPerc += lfResearchPct?.fromResearch
            ? (lfResearchPct.metal || 0)
            : (settings.lfBonus || 0);

        const maxCraw  = calcCrawlerCap(met, planet.crystal, planet.deuterium,
                                        isCollector, settings.geologist, settings.rocktalEnhancement);
        const rawCraw  = parseInt(planet.crawlers) || 0;
        const actCraw  = Math.min(rawCraw, maxCraw);
        if (actCraw > 0) {
            let mult = 0.02;
            if (isCollector) {
                mult *= (1 + (50 * collFactor) / 100);
                if (planet.overload) mult *= 1.5;
            }
            totPerc += Math.min(actCraw * mult, 50);
        }

        // Come OGame: si arrotondano produzione naturale e base miniera, NON il bonus.
        // Il totale orario resta frazionario e si arrotonda solo il giornaliero
        // (verificato al metallo sul valore del "Pacchetto Metallo" di un account
        // reale: arrotondando anche il bonus si perdevano ~256 metallo al giorno).
        const bonusProd = mineBase * (totPerc / 100);
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
    // Contributo del SINGOLO pianeta al bonus globale (frazioni raw, non %).
    // Il cap di ogni ricerca è applicato per-termine dentro il loop pianeta,
    // quindi il bonus totale è esattamente la somma dei contributi per-pianeta:
    // questo permette al planner di aggiornare un solo pianeta in modo incrementale.
    // Moltiplicatore delle ricerche LF di un pianeta (formula ADDITIVA OGame):
    //   1 + livello specie attiva × 0.1% + boost edifici della specie attiva.
    // Vale per TUTTE le ricerche del pianeta (anche cross-species), ma contano solo
    // gli edifici della specie ATTIVA: quelli di specie usate in passato restano sul
    // pianeta ma sono inattivi e non amplificano nulla.
    // Rates: Metropolis 0.5%/lvl, HPT 0.3%/lvl, CMP 0.4%/lvl, Clone 0.25%/lvl
    const LF_RESEARCH_BOOST_BUILDINGS = {
        humans:  { '1011': 0.005 },                  // Metropolis
        rocktal: {},
        mecha:   { '3007': 0.003, '3011': 0.004 },   // Trasformatore alta potenza, Produzione massa chip
        kaelesh: { '4007': 0.0025 }                  // Laboratorio Clonazione
    };
    const calcPlanetResearchMult = (p) => {
        const lfLevel = parseInt(p.lifeformLevel) || 0;
        const bld     = p.lfBuildings || {};
        const rates   = LF_RESEARCH_BOOST_BUILDINGS[p.lifeform || 'humans'] || {};
        let mult = 1 + lfLevel * 0.001;
        for (const [id, rate] of Object.entries(rates)) mult += (parseInt(bld[id]) || 0) * rate;
        return mult;
    };

    // Solo le ricerche LF con almeno un bonus produzione, nello stesso ordine del
    // database (specie, poi id): le altre contribuiscono 0. Calcolata una volta:
    // calcPlanetLFContribution è il punto più caldo del planner.
    const LF_BONUS_RESEARCH = [];
    for (const species of ['humans', 'rocktal', 'mecha', 'kaelesh']) {
        const catData = OGAME_DB[`lf_${species}_res`];
        if (!catData) continue;
        for (const [idStr, itemData] of Object.entries(catData.items || {})) {
            const bonus = itemData.bonus;
            if (bonus && bonus.some(v => v)) LF_BONUS_RESEARCH.push([idStr, bonus]);
        }
    }

    const calcPlanetLFContribution = (p) => {
        const contrib = { metal: 0, crystal: 0, deuterium: 0, collectorBonus: 0 };
        const lfData   = p.lfResearch || {};
        const lfActive = p.lfActive || {};
        let mult = null;   // calcolato solo se serve

        for (const [idStr, bonus] of LF_BONUS_RESEARCH) {
            const level = parseInt(lfData[idStr]) || 0;
            if (level <= 0) continue;
            if (lfActive[idStr] !== true) continue;
            if (mult === null) mult = calcPlanetResearchMult(p);

            contrib.metal          += Math.min(level * (bonus[0] || 0) * mult, bonus[3] || Infinity);
            contrib.crystal        += Math.min(level * (bonus[1] || 0) * mult, bonus[4] || Infinity);
            contrib.deuterium      += Math.min(level * (bonus[2] || 0) * mult, bonus[5] || Infinity);
            contrib.collectorBonus += level * (bonus[6] || 0) * mult;
        }
        return contrib;
    };

    // True se almeno un pianeta ha livelli di ricerca LF (anche non attivi):
    // in quel caso il bonus LF arriva dalle ricerche e il campo manuale è ignorato.
    const hasLFResearchData = (planets) =>
        Array.isArray(planets) && planets.some(p => Object.values(p.lfResearch || {}).some(v => v > 0));

    const calcLFResearchBonus = (planets) => {
        if (!Array.isArray(planets) || planets.length === 0)
            return { metal: 0, crystal: 0, deuterium: 0, collectorBonus: 0, fromResearch: false };

        const bonusPerc = { metal: 0, crystal: 0, deuterium: 0, collectorBonus: 0 };

        planets.forEach(p => {
            const c = calcPlanetLFContribution(p);
            bonusPerc.metal          += c.metal;
            bonusPerc.crystal        += c.crystal;
            bonusPerc.deuterium      += c.deuterium;
            bonusPerc.collectorBonus += c.collectorBonus;
        });

        return {
            metal:          bonusPerc.metal * 100,
            crystal:        bonusPerc.crystal * 100,
            deuterium:      bonusPerc.deuterium * 100,
            collectorBonus: bonusPerc.collectorBonus * 100,
            fromResearch:   hasLFResearchData(planets)
        };
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
        calcPlanetLFContribution,
        calcPlanetResearchMult,
        hasLFResearchData
    };
}