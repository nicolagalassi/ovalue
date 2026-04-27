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
        calcBuildCostLF,
        getBuildCostLF,
        parseDurationToTimestamp
    };
}