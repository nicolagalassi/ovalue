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

    // Calcolo Cap Crawler (Identico)
    // Max = (M+C+D) * 8. Se Collector+Geo -> Max * 1.1
    const calcCrawlerCap = (metal, crystal, deut, isCollector, hasGeologist) => {
        const mineSum = parseInt(metal||0) + parseInt(crystal||0) + parseInt(deut||0);
        let max = mineSum * 8;
        if (isCollector && hasGeologist) {
            max = Math.floor(max * 1.10); 
        }
        return max;
    };

    return {
        formatNum,
        calcMineProduction,
        getPosMult,
        calcCrawlerCap
    };
}