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

    return {
        formatNum,
        calcMineProduction,
        getPosMult,
        calcCrawlerCap,
        calcBuildCostLF,
        getBuildCostLF
    };
}