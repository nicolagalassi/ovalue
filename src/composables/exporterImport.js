// Conversione dei dati dell'OValue Exporter nel modello `production` di un profilo.
// Modulo puro (niente Vue, niente localStorage): lo usano sia l'import automatico
// dall'exporter sia l'import manuale, e i test lo usano sugli export reali.

import { useOgameFormulas } from './useOgameFormulas';

const LF_MAP = { 'Humans': 'humans', 'Rocktal': 'rocktal', 'Mechas': 'mecha', 'Kaelesh': 'kaelesh' };
const LF_NUMBER = { humans: 1, rocktal: 2, mecha: 3, kaelesh: 4 };
const CLASS_MAP = {
    // vecchio formato IT (esportatore ≤3.2.x)
    'Collezionista': 'collector', 'Generale': 'other', 'Esploratore': 'other',
    // nuovo formato neutro (esportatore ≥3.3.0) + EN/DE/FR
    'collector': 'collector', 'general': 'other', 'explorer': 'other',
    'Collector': 'collector', 'General': 'other', 'Explorer': 'other',
    'Sammler': 'collector', 'Allgemein': 'other', 'Entdecker': 'other',
    'Collecteur': 'collector', 'Général': 'other', 'Explorateur': 'other'
};

// Produzione giornaliera di metallo (arrotondata come OGame: solo il giornaliero).
export const calcDailyProduction = (settings, planets) => {
    if (!Array.isArray(planets) || planets.length === 0) return 0;
    const { calcLFResearchBonus, calcPlanetMetalProduction } = useOgameFormulas();
    // Bonus globale: somma di tutti i pianeti, applicato ugualmente a ciascuno
    const lfResearchPct = calcLFResearchBonus(planets);
    let hourly = 0;
    planets.forEach(p => {
        hourly += calcPlanetMetalProduction(p, settings, lfResearchPct).total;
    });
    return Math.floor(hourly * 24);
};

// Pianeti dell'export → pianeti del profilo.
export const planetsFromExport = (raw) => raw.planets.map(p => {
    // LF_MAP[rawLf] ?? 'humans' gestisce anche 'none'/null
    const rawLf = p.lifeform || (raw.planetLifeforms?.[p.id]) || null;
    const lifeform = LF_MAP[rawLf] ?? 'humans';
    // Priorità: lfLevels dalla pagina LF (più affidabile) > per-pianeta dall'impero
    const lifeformLevel = raw.lfLevels?.[String(LF_NUMBER[lifeform])] || p.lifeformLevel || 0;
    // lfActive: default inattivo, contano solo le true esplicite.
    // Priorità: planetResearches (pagina lfresearch / API) > activeResearches (lfbonuses)
    const lfActive = {};
    const perPlanetResearches = raw.planetResearches?.[String(p.id)];
    if (perPlanetResearches) {
        Object.keys(perPlanetResearches).forEach(key => { lfActive[key] = true; });
    } else if (raw.lf_collected && Array.isArray(raw.activeResearches)) {
        raw.activeResearches.forEach(numId => {
            const key = String(numId);
            if (key in (p.lfResearch || {})) lfActive[key] = true;
        });
    }
    // Con planetResearches i livelli di quel pianeta sono più precisi
    const lfResearch = perPlanetResearches
        ? { ...(p.lfResearch ?? {}), ...perPlanetResearches }
        : (p.lfResearch ?? {});
    return {
        name: p.name ?? '',
        pos: p.pos ?? 8,
        metal: p.metal ?? 0,
        crystal: p.crystal ?? 0,
        deuterium: p.deuterium ?? 0,
        magma: p.magma ?? 0,
        human: p.human ?? 0,
        crawlers: p.crawlers ?? 0,
        item: p.item ?? 0,
        itemCustom: p.itemCustom ?? 0,
        lifeform,
        overload: p.overload ?? false,
        lifeformLevel,
        lfResearch,
        lfBuildings: p.lfBuildings ?? {},
        lfActive
    };
});

// Applica un export a `production` (settings + pianeti + daily). Muta e restituisce production.
export const applyExportToProduction = (production, raw) => {
    const s = production.settings;
    if (raw.playerClass && raw.playerClass !== 'none') {
        s.playerClass = CLASS_MAP[raw.playerClass] ?? s.playerClass;
    }
    // Classe alleanza (esportatore ≥3.7.0): OValue applica il +5% solo per 'trader'
    if (raw.allianceClass) s.allyClass = raw.allianceClass === 'trader' ? 'trader' : 'none';
    if (raw.settings?.plasma != null) s.plasma = Number(raw.settings.plasma);
    if (raw.universeSpeed != null) s.ecoSpeed = Number(raw.universeSpeed);
    if (raw.lfBonuses?.metal) s.lfBonus = parseFloat(String(raw.lfBonuses.metal).replace(',', '.')) || 0;

    // Ufficiali → geologo + staff completo. Vecchio formato IT (≤3.2.x) e CSS-class (≥3.3.0)
    if (raw.officers) {
        const geologo = raw.officers['geologist'] || raw.officers['Geologo'];
        if (geologo) s.geologist = geologo.active === true;
        const OLD = ['Comandante', 'Ammiraglio', 'Ingegnere', 'Geologo', 'Tecnico'];
        const NEW = ['commander', 'admiral', 'engineer', 'geologist', 'technocrat'];
        const ORDER = NEW.some(n => raw.officers[n] !== undefined) ? NEW : OLD;
        if (ORDER.some(n => raw.officers[n] !== undefined)) {
            s.staff = ORDER.every(n => raw.officers[n]?.active === true);
        }
    }

    if (Array.isArray(raw.planets) && raw.planets.length > 0) {
        production.planets = planetsFromExport(raw);
    }
    production.daily = calcDailyProduction(s, production.planets);
    return production;
};
