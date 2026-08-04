<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useProfiles } from '../composables/useProfiles';
import { useOgameFormulas } from '../composables/useOgameFormulas';
import { useStrategy, toMSU, buildingCumulativeCost, lfBuildingCost } from '../composables/useStrategy';
import { useToast } from '../composables/useToast';
import { OGAME_DB } from '../data/ogame_db';

const { t } = useLanguage();
const { show: showToast } = useToast();
const { activeProfile, saveProfiles } = useProfiles();
const { formatNum, calcLFResearchBonus, calcPlanetMetalProduction } = useOgameFormulas();
const { runPlanner, computeEuroCost, buildInitialState, simulateDailyProduction } = useStrategy();

const showIntro = ref(false);
const isComputing = ref(false);
const result = ref(null);
const progress = ref(null);        // { step, maxSteps, currentProd, initialProd, target } dal worker
const doneSteps = ref(new Set());  // blocchi spuntati come "fatto" nella roadmap
const typeFilter = ref('all');     // filtro tipo nella roadmap

// Form
const target = ref(0);             // Δ goal in metallo/giorno
const maxSteps = ref(500);

// Impostazioni costo pacchetti / MO (locali a questa view)
const shopDiscount = ref(0);
const moBonus = ref(0);
const packMode = ref('dynamic');           // 'dynamic' | 'fixed'
const packBatch = ref(10);                 // pacchi per aggiornamento valore dinamico
const playerClassOverride = ref('inherit'); // 'inherit' | 'collector'

// ───── Persistenza configurazione ────────────────────────────────────────
const STRATEGY_CFG_KEY = 'ovalue_strategy_config';
const _saveConfig = () => {
    try {
        localStorage.setItem(STRATEGY_CFG_KEY, JSON.stringify({
            packMode: packMode.value,
            packBatch: packBatch.value,
            playerClassOverride: playerClassOverride.value,
            includeMines: includeMines.value,
            includeCrawlerMines: includeCrawlerMines.value,
            includePlasma: includePlasma.value,
            includeLf: includeLf.value,
            includeLfResearch: includeLfResearch.value,
            lfResearchIds: lfResearchIds.value,
            capMine: capMine.value,
            capPlasma: capPlasma.value,
            capLf: capLf.value,
            capLfResearch: capLfResearch.value,
            maxSteps: maxSteps.value,
            shopDiscount: shopDiscount.value,
            moBonus: moBonus.value,
            astroCurrentLevel: astroCurrentLevel.value,
            astroPlanetPos: astroPlanetPos.value,
            astroMineTarget: astroMineTarget.value,
            astroLfChoice: astroLfChoice.value,
            astroLfTarget: astroLfTarget.value,
        }));
    } catch {}
};

// Input target formattato con separatore migliaia
const formTarget = computed({
    get() {
        return isNaN(target.value) || target.value === 0
            ? ''
            : new Intl.NumberFormat('it-IT').format(Math.floor(target.value));
    },
    set(newValue) {
        const rawValue = String(newValue).replace(/[^0-9]/g, '');
        const parsed = parseInt(rawValue);
        target.value = isNaN(parsed) ? 0 : parsed;
    }
});
const includeMines = ref(true);
const includeCrawlerMines = ref(false);
const includePlasma = ref(true);
const includeLf = ref(true);
const includeLfResearch = ref(false);

// Elenco completo delle ricerche LF con bonus metallo (le uniche candidabili
// dal planner). Sostituisce i vecchi gruppi-tier T1-6/T7-12/T13-18: ora ogni
// ricerca si attiva/disattiva singolarmente.
const LF_RESEARCH_ALL = (() => {
    const out = [];
    for (const sp of ['humans', 'rocktal', 'mecha', 'kaelesh']) {
        const cat = OGAME_DB[`lf_${sp}_res`];
        if (!cat) continue;
        for (const [id, item] of Object.entries(cat.items || {})) {
            if (item.bonus && (item.bonus[0] || 0) > 0)
                out.push({ id, name: item.name || id, species: sp, tier: parseInt(id) % 100 });
        }
    }
    return out.sort((a, b) => a.tier - b.tier);
})();
const ALL_LF_IDS = LF_RESEARCH_ALL.map(r => r.id);
const lfResearchIds = ref([...ALL_LF_IDS]);   // ID ricerca LF abilitati

const capMine = ref(0);            // 0 = nessun cap
const capPlasma = ref(0);
const capLf = ref(0);
const capLfResearch = ref(0);
const lfChoice = ref([]);          // per pianeta: 'inherit' | 'rocktal' | 'humans' | 'mecha'

// ───── Astrofisica: convenienza di un nuovo pianeta ──────────────────────
// L'astrofisica non produce metallo: sblocca un nuovo pianeta da costruire da 0.
// Questo pannello confronta il costo (livelli astro + costruzione) con la resa.
const astroCurrentLevel = ref(0);       // livello astrofisica attuale
const astroPlanetPos = ref(8);          // posizione del nuovo pianeta (temperatura)
const astroMineTarget = ref(25);        // livello obiettivo delle miniere del nuovo pianeta
const astroLfChoice = ref('none');      // 'none' | 'humans' | 'rocktal'
const astroLfTarget = ref(0);           // livello edificio LF sul nuovo pianeta

// Sync con profilo attivo: inizializza form e produzione corrente.
watch(activeProfile, (newP) => {
    if (!newP) return;
    const planets = newP.production?.planets || [];
    // lfChoice — preserva selezioni esistenti se la lunghezza coincide
    if (lfChoice.value.length !== planets.length) {
        lfChoice.value = planets.map(() => 'inherit');
    }
    // Imposta target di default a current × 1.5 se vuoto
    if (!target.value || target.value === 0) {
        const current = newP.production?.daily || 0;
        target.value = Math.floor(current * 1.5);
    }
    result.value = null;
}, { immediate: true });

// Carica config salvata al mount, poi avvia il watch per salvarla ad ogni cambio.
onMounted(() => {
    try {
        const raw = localStorage.getItem(STRATEGY_CFG_KEY);
        if (!raw) return;
        const cfg = JSON.parse(raw);
        if (cfg.packMode !== undefined)              packMode.value = cfg.packMode;
        if (cfg.packBatch !== undefined)             packBatch.value = cfg.packBatch;
        if (cfg.playerClassOverride !== undefined)   playerClassOverride.value = cfg.playerClassOverride;
        if (cfg.includeMines !== undefined)          includeMines.value = cfg.includeMines;
        if (cfg.includeCrawlerMines !== undefined)   includeCrawlerMines.value = cfg.includeCrawlerMines;
        if (cfg.includePlasma !== undefined)         includePlasma.value = cfg.includePlasma;
        if (cfg.includeLf !== undefined)             includeLf.value = cfg.includeLf;
        if (cfg.includeLfResearch !== undefined)     includeLfResearch.value = cfg.includeLfResearch;
        // Ripristina la selezione ricerche LF, scartando ID non più validi.
        if (Array.isArray(cfg.lfResearchIds))        lfResearchIds.value = cfg.lfResearchIds.filter(id => ALL_LF_IDS.includes(id));
        if (cfg.capMine !== undefined)               capMine.value = cfg.capMine;
        if (cfg.capPlasma !== undefined)             capPlasma.value = cfg.capPlasma;
        if (cfg.capLf !== undefined)                 capLf.value = cfg.capLf;
        if (cfg.capLfResearch !== undefined)         capLfResearch.value = cfg.capLfResearch;
        if (cfg.maxSteps !== undefined)              maxSteps.value = cfg.maxSteps;
        if (cfg.shopDiscount !== undefined)          shopDiscount.value = cfg.shopDiscount;
        if (cfg.moBonus !== undefined)               moBonus.value = cfg.moBonus;
        if (cfg.astroCurrentLevel !== undefined)     astroCurrentLevel.value = cfg.astroCurrentLevel;
        if (cfg.astroPlanetPos !== undefined)        astroPlanetPos.value = cfg.astroPlanetPos;
        if (cfg.astroMineTarget !== undefined)       astroMineTarget.value = cfg.astroMineTarget;
        if (cfg.astroLfChoice !== undefined)         astroLfChoice.value = cfg.astroLfChoice;
        if (cfg.astroLfTarget !== undefined)         astroLfTarget.value = cfg.astroLfTarget;
    } catch {}
});
watch(
    [packMode, packBatch, playerClassOverride, includeMines, includeCrawlerMines, includePlasma, includeLf, includeLfResearch,
     lfResearchIds, capMine, capPlasma, capLf, capLfResearch, maxSteps, shopDiscount, moBonus,
     astroCurrentLevel, astroPlanetPos, astroMineTarget, astroLfChoice, astroLfTarget],
    _saveConfig
);

// Applica gli override locali (classe) allo stato iniziale.
const applyOverrides = (state) => {
    if (!state) return state;
    if (playerClassOverride.value && playerClassOverride.value !== 'inherit') {
        state.settings.playerClass = playerClassOverride.value;
    }
    return state;
};

// Stato simulato corrente (read-only: solo per mostrare la produzione di partenza).
const currentSimState = computed(() => {
    if (!activeProfile.value) return null;
    return applyOverrides(buildInitialState(activeProfile.value, lfChoice.value));
});

// Produzione "reale" del profilo importato — non influenzata da override di classe.
// Usata per il display "Produzione attuale" e per i preset target.
const profileDailyProd = computed(() => activeProfile.value?.production?.daily || 0);

// Produzione simulata con override applicati — usata come baseline per il planner.
const currentProd = computed(() => {
    if (!currentSimState.value) return 0;
    return simulateDailyProduction(currentSimState.value);
});

const planets = computed(() => activeProfile.value?.production?.planets || []);

const lfResearchPct = computed(() => {
    if (!currentSimState.value) return { metal: 0, crystal: 0, deuterium: 0, collectorBonus: 0 };
    return calcLFResearchBonus(currentSimState.value.planets);
});
const hasLfResearchData = computed(() =>
    planets.value.some(p => Object.values(p.lfResearch || {}).some(v => v > 0))
);

// ───── LF per-pianeta: helpers per il toggle ────────────────────────────
const lfOpts = [
    { v: 'inherit', l: '≡', ac: 'bg-slate-700/70 text-slate-200' },
    { v: 'humans',  l: 'U',  ac: 'bg-blue-500/20 text-blue-300 border border-blue-400/30' },
    { v: 'rocktal', l: 'R',  ac: 'bg-orange-500/20 text-orange-300 border border-orange-400/30' },
    { v: 'mecha',   l: 'M',  ac: 'bg-teal-500/20 text-teal-300 border border-teal-400/30' },
    { v: 'kaelesh', l: 'K',  ac: 'bg-purple-500/20 text-purple-300 border border-purple-400/30' },
];
const effectiveLf = (p, idx) => {
    const c = lfChoice.value[idx];
    return (!c || c === 'inherit') ? (p.lifeform || 'humans') : c;
};
const lfBorderColor = (eff) => {
    if (eff === 'humans')  return 'border-blue-400/30 hover:border-blue-400/50';
    if (eff === 'rocktal') return 'border-orange-500/30 hover:border-orange-500/50';
    if (eff === 'mecha')   return 'border-teal-400/30 hover:border-teal-400/50';
    if (eff === 'kaelesh') return 'border-purple-400/30 hover:border-purple-400/50';
    return 'border-slate-700/20 hover:border-slate-600/40';
};
const lfBadgeClass = (eff) => {
    if (eff === 'humans')  return 'text-blue-400 bg-blue-500/10';
    if (eff === 'rocktal') return 'text-orange-400 bg-orange-500/10';
    if (eff === 'mecha')   return 'text-teal-400 bg-teal-500/10';
    if (eff === 'kaelesh') return 'text-purple-400 bg-purple-500/10';
    return 'text-slate-400';
};

// ───── Raggruppamento step roadmap ───────────────────────────────────────
// Strategia di raggruppamento in due regimi:
//
// STEP ECONOMICI (costMSU < packValue → meno di 1 pacchetto ciascuno):
//   Tutti gli step consecutivi dello stesso tipo vengono uniti in un unico blocco.
//   Il piano gira su tutti i pianeti a livello N prima di salire a N+1, quindi
//   questi step si interlacciano tra pianeti e non possono essere raggruppati
//   per pianeta. Il pack del blocco si ricalcola come ceil(totalCost / packValue).
//
// STEP COSTOSI (costMSU >= packValue → almeno 1 pacchetto):
//   Mostrati singolarmente per non falsare l'ordine e il conteggio pack.
//
// cumulativePacks è ricalcolato da zero sull'intera lista blocchi risultante.
const groupedSteps = computed(() => {
    if (!result.value) return [];
    const steps = result.value.steps;
    const blocks = [];
    let i = 0;

    while (i < steps.length) {
        const s = steps[i];
        const packVal = Math.max(1, s.packValue || 1);
        const cheap = s.costMSU < packVal;

        if (cheap) {
            // Raccogli step consecutivi economici dello stesso tipo.
            // Per lf_research raggruppa per researchId+from: step allo stesso livello
            // su pianeti diversi vengono uniti, ma livelli diversi restano blocchi separati.
            const sameGroup = (a, b) => {
                if (a.type !== b.type) return false;
                if (a.type === 'lf_research') return a.researchId === b.researchId && a.from === b.from;
                return true;
            };
            let j = i + 1;
            while (j < steps.length &&
                   sameGroup(s, steps[j]) &&
                   steps[j].costMSU < Math.max(1, steps[j].packValue || 1)) j++;

            const grp = steps.slice(i, j);
            const last = grp[grp.length - 1];
            const totalCost = grp.reduce((a, b) => a + b.costMSU, 0);

            // Pianeti univoci nel blocco (per step con pianeta)
            const planetSet = new Set(
                grp.filter(x => x.planetIdx != null).map(x => x.planetName || `#${x.planetIdx}`)
            );
            const planetLabel = s.planetIdx == null
                ? null
                : planetSet.size === 1
                    ? [...planetSet][0]
                    : `${planetSet.size} pianeti`;

            blocks.push({
                type:        s.type,
                species:     s.species     ?? null,
                researchId:  s.researchId  ?? null,
                researchName: s.researchName ?? null,
                from:       s.from,
                to:         last.to,
                planetName: planetLabel,
                cost:       grp.reduce((a, b) => [a[0]+b.cost[0], a[1]+b.cost[1], a[2]+b.cost[2]], [0,0,0]),
                costMSU:    totalCost,
                packs:      Math.ceil(totalCost / packVal),
                deltaProd:  grp.reduce((a, b) => a + b.deltaProd, 0),
                cumulativeProd: last.cumulativeProd,
                count:  grp.length,
                isBlock: grp.length > 1
            });
            i = j;

        } else {
            // Step costoso: mostralo singolarmente, ricalcola pack senza credit
            blocks.push({
                ...s,
                packs:   Math.ceil(s.costMSU / packVal),
                isBlock: false,
                count:   1
            });
            i++;
        }
    }

    // Ricalcola cumulativePacks da zero sull'intera lista blocchi
    let cumPacks = 0;
    blocks.forEach(b => {
        cumPacks += b.packs;
        b.cumulativePacks = cumPacks;
    });

    return blocks.map((b, idx) => ({ ...b, n: idx + 1 }));
});

// ───── Esecuzione planner ───────────────────────────────────────────────
// Il calcolo gira in un Web Worker: la UI resta fluida e mostra il progresso
// reale. Se il worker non è disponibile (browser/ambiente particolare) si
// ricade sul calcolo sincrono nel main thread.
let plannerWorker = null;

const buildPlannerOptions = () => ({
    target: parseInt(target.value) || 0,
    maxSteps: parseInt(maxSteps.value) || 80,
    includeMines: includeMines.value,
    includeCrawlerMines: includeCrawlerMines.value,
    includePlasma: includePlasma.value,
    includeLf: includeLf.value,
    includeLfResearch: includeLfResearch.value,
    lfResearchIds: [...lfResearchIds.value],
    packMode: packMode.value,
    packBatch: packBatch.value,
    caps: {
        metalMine:  capMine.value      > 0 ? capMine.value      : Infinity,
        plasma:     capPlasma.value    > 0 ? capPlasma.value    : Infinity,
        lfBuilding: capLf.value        > 0 ? capLf.value        : Infinity,
        lfResearch: capLfResearch.value > 0 ? capLfResearch.value : Infinity,
    }
});

const finalizePlan = (planRes, initialState) => {
    const euro = computeEuroCost(planRes.cumulativePacks, {
        ...initialState.shop,
        shopDiscount: shopDiscount.value,
        moBonus: moBonus.value,
    });
    result.value = {
        ...planRes, euro,
        lfChoiceSnapshot: [...lfChoice.value],
        targetSnapshot: parseInt(target.value) || 0
    };
    doneSteps.value = new Set();
    typeFilter.value = 'all';
    isComputing.value = false;
    progress.value = null;
};

const runPlannerSync = (initialState, options) => {
    try {
        finalizePlan(runPlanner(initialState, options), initialState);
    } catch {
        isComputing.value = false;
        progress.value = null;
    }
};

const computePlan = () => {
    if (!activeProfile.value || isComputing.value) return;
    isComputing.value = true;
    result.value = null;
    progress.value = null;

    const initialState = applyOverrides(buildInitialState(activeProfile.value, lfChoice.value));
    const options = buildPlannerOptions();

    try {
        plannerWorker?.terminate();
        plannerWorker = new Worker(new URL('../workers/planner.worker.js', import.meta.url), { type: 'module' });
        plannerWorker.onmessage = ({ data }) => {
            if (data.type === 'progress')   progress.value = data.progress;
            else if (data.type === 'done')  finalizePlan(data.result, initialState);
            else                            runPlannerSync(initialState, options);
        };
        plannerWorker.onerror = (e) => {
            e.preventDefault();
            runPlannerSync(initialState, options);
        };
        plannerWorker.postMessage({ initialState, options });
    } catch {
        runPlannerSync(initialState, options);
    }
};

onUnmounted(() => plannerWorker?.terminate());

// Percentuale di avanzamento verso il target durante il calcolo.
const computePct = computed(() => {
    const p = progress.value;
    if (!p || p.target <= p.initialProd) return 0;
    return Math.min(100, Math.round((p.currentProd - p.initialProd) / (p.target - p.initialProd) * 100));
});

// ───── Etichette/colore per tipo di step ────────────────────────────────
const LF_RESEARCH_SPECIES = {
    humans:  { label: 'Ric. Umani',   color: 'blue'   },
    rocktal: { label: 'Ric. Rocktal', color: 'orange' },
    mecha:   { label: 'Ric. Mecha',   color: 'teal'   },
    kaelesh: { label: 'Ric. Kaelesh', color: 'purple' },
};
// Accetta sia una stringa (type) sia un oggetto step { type, species }
const stepTypeLabel = (s) => {
    const type = typeof s === 'string' ? s : s.type;
    if (type === 'metal_mine') return t('strategy_step_metal_mine');
    if (type === 'crystal_mine') return t('strategy_step_crystal_mine');
    if (type === 'deuterium_synthesizer') return t('strategy_step_deut_mine');
    if (type === 'plasma_technology') return t('strategy_step_plasma');
    if (type === 'lf_magma') return t('strategy_step_lf_magma');
    if (type === 'lf_human') return t('strategy_step_lf_human');
    if (type === 'lf_research') return LF_RESEARCH_SPECIES[s.species]?.label ?? t('strategy_step_lf_research');
    return type;
};
const stepTypeColor = (s) => {
    const type = typeof s === 'string' ? s : s.type;
    if (type === 'metal_mine') return 'sky';
    if (type === 'crystal_mine') return 'cyan';
    if (type === 'deuterium_synthesizer') return 'indigo';
    if (type === 'plasma_technology') return 'violet';
    if (type === 'lf_magma') return 'orange';
    if (type === 'lf_human') return 'blue';
    if (type === 'lf_research') return LF_RESEARCH_SPECIES[s.species]?.color ?? 'emerald';
    return 'slate';
};
// Classi badge per colore tipo (mappa statica: Tailwind non vede classi dinamiche)
const STEP_BADGE_CLASSES = {
    sky:     'bg-sky-500/10 text-sky-300 border-sky-500/30',
    cyan:    'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    indigo:  'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    violet:  'bg-violet-500/10 text-violet-300 border-violet-500/30',
    orange:  'bg-orange-500/10 text-orange-300 border-orange-500/30',
    blue:    'bg-blue-500/10 text-blue-300 border-blue-500/30',
    teal:    'bg-teal-500/10 text-teal-300 border-teal-500/30',
    purple:  'bg-purple-500/10 text-purple-300 border-purple-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    slate:   'bg-slate-500/10 text-slate-300 border-slate-500/30',
};
const stepBadgeClass = (s) => STEP_BADGE_CLASSES[stepTypeColor(s)] || STEP_BADGE_CLASSES.slate;

// ───── Roadmap: stato "fatto", filtro tipo, prossimo step ───────────────
const toggleDone = (n) => {
    const next = new Set(doneSteps.value);
    next.has(n) ? next.delete(n) : next.add(n);
    doneSteps.value = next;
};
const doneCount = computed(() => doneSteps.value.size);
// Primo blocco non ancora spuntato (in ordine di piano, ignora il filtro)
const nextStepN = computed(() => {
    const blk = groupedSteps.value.find(b => !doneSteps.value.has(b.n));
    return blk ? blk.n : null;
});
// Tipi presenti nel piano, per i chip filtro
const presentTypes = computed(() => {
    const seen = new Set();
    return groupedSteps.value.filter(b => !seen.has(b.type) && seen.add(b.type)).map(b => b.type);
});
const filteredSteps = computed(() =>
    typeFilter.value === 'all'
        ? groupedSteps.value
        : groupedSteps.value.filter(b => b.type === typeFilter.value)
);
// Avanzamento del piano verso il target per una riga della roadmap
const rowProgressPct = computed(() => {
    if (!result.value) return () => 0;
    const start = result.value.initialProd;
    const end = Math.max(result.value.targetSnapshot || 0, result.value.finalProd);
    if (end <= start) return () => 100;
    return (cumProd) => Math.min(100, Math.round((cumProd - start) / (end - start) * 100));
});

// ROI: tempo di recupero del costo in giorni = costMSU / deltaProd
const formatROI = (costMSU, deltaProd) => {
    if (!deltaProd || deltaProd <= 0) return '—';
    const days = costMSU / deltaProd;
    if (days < 1)    return '< 1g';
    if (days < 30)   return `${Math.round(days)}g`;
    if (days < 365)  return `${(days / 30).toFixed(1)}m`;
    return `${(days / 365).toFixed(1)}a`;
};

// Classe colore ROI: verde < 30g, giallo 30-90g, arancio 90-365g, rosso > 1a
const roiColor = (costMSU, deltaProd) => {
    if (!deltaProd || deltaProd <= 0) return 'text-slate-600';
    const days = costMSU / deltaProd;
    if (days < 30)  return 'text-emerald-400';
    if (days < 90)  return 'text-yellow-400';
    if (days < 365) return 'text-orange-400';
    return 'text-red-400';
};

// Ricalcola solo il costo €/MO senza ri-eseguire il planner.
// Usata dai bottoni sconto/bonus per evitare lo scroll al top (result → null → DOM shrink).
const recomputeEuro = () => {
    if (!result.value || !currentSimState.value) return;
    const euro = computeEuroCost(result.value.cumulativePacks, {
        ...currentSimState.value.shop,
        shopDiscount: shopDiscount.value,
        moBonus: moBonus.value,
    });
    result.value = { ...result.value, euro };
};

// ───── Import nella queue PackExchange ───────────────────────────────────
const importToPackQueue = () => {
    if (!result.value || !activeProfile.value) return;
    const queue = activeProfile.value.packExchange.queue;

    // Aggrega gli step per (key + planet), mostrandoli come "da→a".
    const grouped = new Map();
    result.value.steps.forEach(s => {
        let key, cat, item;
        if (s.type === 'metal_mine') { key = 'metal_mine'; cat = 'resources'; item = key; }
        else if (s.type === 'crystal_mine') { key = 'crystal_mine'; cat = 'resources'; item = key; }
        else if (s.type === 'deuterium_synthesizer') { key = 'deuterium_synthesizer'; cat = 'resources'; item = key; }
        else if (s.type === 'plasma_technology') { key = 'plasma_technology'; cat = 'research'; item = key; }
        else if (s.type === 'lf_magma') { key = '2006'; cat = 'lf_rocktal'; item = key; }
        else if (s.type === 'lf_human') { key = '1006'; cat = 'lf_humans'; item = key; }
        else if (s.type === 'lf_research') { key = s.researchId; cat = `lf_${s.species}_res`; item = key; }
        else return;
        const gkey = `${cat}|${item}|${s.planetIdx ?? 'g'}`;
        if (!grouped.has(gkey)) {
            grouped.set(gkey, {
                key: item,
                cat,
                planetIdx: s.planetIdx,
                from: s.from,
                to: s.to,
                m: 0, c: 0, d: 0
            });
        }
        const g = grouped.get(gkey);
        g.to = s.to;
        g.m += s.cost[0]; g.c += s.cost[1]; g.d += s.cost[2];
    });

    grouped.forEach(g => {
        queue.push({
            key: g.key,
            cat: g.cat,
            level: g.from === g.to - 1 ? g.to : `${g.from} → ${g.to}`,
            amount: 1,
            m: g.m, c: g.c, d: g.d
        });
    });

    saveProfiles();
    showToast(t('strategy_imported_to_pack'), 'success');
};

// ───── Riassunto per pianeta degli upgrade ──────────────────────────────
const perPlanetSummary = computed(() => {
    if (!result.value) return [];
    const map = new Map();
    result.value.steps.forEach(s => {
        if (s.planetIdx == null) return;
        const k = s.planetIdx;
        if (!map.has(k)) {
            map.set(k, { idx: k, name: s.planetName, metalMine: 0, crystalMine: 0, deutMine: 0, lfMagma: 0, lfHuman: 0 });
        }
        const e = map.get(k);
        if (s.type === 'metal_mine') e.metalMine++;
        else if (s.type === 'crystal_mine') e.crystalMine++;
        else if (s.type === 'deuterium_synthesizer') e.deutMine++;
        else if (s.type === 'lf_magma') e.lfMagma++;
        else if (s.type === 'lf_human') e.lfHuman++;
    });
    const plasmaSteps = result.value.steps.filter(s => s.type === 'plasma_technology').length;
    const lfResearchCount = result.value.steps.filter(s => s.type === 'lf_research').length;
    return { planets: [...map.values()].sort((a, b) => a.idx - b.idx), plasma: plasmaSteps, lfResearch: lfResearchCount };
});

// ───── Riepilogo contributi per categoria ───────────────────────────────
const typeSummary = computed(() => {
    if (!result.value) return null;
    const steps = result.value.steps;
    const totalDelta = result.value.finalProd - result.value.initialProd;
    if (totalDelta <= 0) return null;

    const cats = {
        mine:       { delta: 0, count: 0, levels: 0 },
        crawler:    { delta: 0, count: 0, levels: 0 },
        plasma:     { delta: 0, count: 0, levels: 0 },
        lf_build:   { delta: 0, count: 0, levels: 0 },
        lf_research:{ delta: 0, count: 0, levels: 0 },
    };

    steps.forEach(s => {
        const lvls = (s.to || 0) - (s.from || 0);
        if (s.type === 'metal_mine')        { cats.mine.delta += s.deltaProd;        cats.mine.count++;        cats.mine.levels += lvls; }
        else if (s.type === 'crystal_mine' || s.type === 'deuterium_synthesizer') { cats.crawler.delta += s.deltaProd; cats.crawler.count++; cats.crawler.levels += lvls; }
        else if (s.type === 'plasma_technology') { cats.plasma.delta += s.deltaProd; cats.plasma.count++;      cats.plasma.levels += lvls; }
        else if (s.type === 'lf_magma' || s.type === 'lf_human') { cats.lf_build.delta += s.deltaProd; cats.lf_build.count++; cats.lf_build.levels += lvls; }
        else if (s.type === 'lf_research')  { cats.lf_research.delta += s.deltaProd; cats.lf_research.count++; cats.lf_research.levels += lvls; }
    });

    return Object.entries(cats)
        .map(([key, v]) => ({ key, ...v, pct: Math.round(v.delta / totalDelta * 100) }))
        .filter(c => c.count > 0)
        .sort((a, b) => b.delta - a.delta);
});

// ───── Selezione ricerche LF (pannello per-ricerca) ──────────────────────
const LF_SPECIES_CHIP = {
    humans:  { on: 'bg-blue-500/20 text-blue-200 border-blue-400/40',     off: 'bg-black/20 text-slate-600 border-slate-700/30 hover:text-slate-400' },
    rocktal: { on: 'bg-orange-500/20 text-orange-200 border-orange-400/40', off: 'bg-black/20 text-slate-600 border-slate-700/30 hover:text-slate-400' },
    mecha:   { on: 'bg-teal-500/20 text-teal-200 border-teal-400/40',     off: 'bg-black/20 text-slate-600 border-slate-700/30 hover:text-slate-400' },
    kaelesh: { on: 'bg-purple-500/20 text-purple-200 border-purple-400/40', off: 'bg-black/20 text-slate-600 border-slate-700/30 hover:text-slate-400' },
};
const isLfResSelected = (id) => lfResearchIds.value.includes(id);
const toggleLfRes = (id) => {
    lfResearchIds.value = isLfResSelected(id)
        ? lfResearchIds.value.filter(x => x !== id)
        : [...lfResearchIds.value, id];
};
const setLfResAll = (on) => { lfResearchIds.value = on ? [...ALL_LF_IDS] : []; };

// ───── Astrofisica: calcolo convenienza nuovo pianeta ────────────────────
// Confronta il costo totale (livelli astro necessari alla prossima colonia +
// costruzione da 0 di miniere ed edificio LF) con la produzione che il nuovo
// pianeta genererebbe. Regola OGame: colonie disponibili = ceil(astro / 2),
// quindi ogni colonia in più costa +1 livello (da pari) o +2 livelli (da dispari).
const astroLfOpts = [
    { v: 'none',    l: '—' },
    { v: 'humans',  l: 'U' },
    { v: 'rocktal', l: 'R' },
];
const astroPlan = computed(() => {
    const sim = currentSimState.value;
    if (!sim) return null;

    const cur        = Math.max(0, parseInt(astroCurrentLevel.value) || 0);
    const mineTarget = Math.max(0, parseInt(astroMineTarget.value) || 0);
    const pos        = parseInt(astroPlanetPos.value) || 8;
    const lfChoice   = astroLfChoice.value;
    const lfTarget   = lfChoice === 'none' ? 0 : Math.max(0, parseInt(astroLfTarget.value) || 0);
    const pack       = sim.pack;

    // Livelli di astrofisica per sbloccare la prossima colonia.
    const targetAstro   = cur % 2 === 0 ? cur + 1 : cur + 2;
    const levelsNeeded  = targetAstro - cur;
    const astroCost     = buildingCumulativeCost('astrophysics', cur, targetAstro, 0);

    // Costo costruzione da 0: 3 miniere + edificio LF (se scelto).
    const mMet = buildingCumulativeCost('metal_mine', 0, mineTarget, pack.minLevel);
    const mCry = buildingCumulativeCost('crystal_mine', 0, mineTarget, pack.minLevel);
    const mDeu = buildingCumulativeCost('deuterium_synthesizer', 0, mineTarget, pack.minLevel);
    let lfCost = [0, 0, 0];
    if (lfChoice === 'rocktal')     lfCost = lfBuildingCost('rocktal', 2006, 0, lfTarget, pack.lfRsrLabLevel);
    else if (lfChoice === 'humans') lfCost = lfBuildingCost('humans', 1006, 0, lfTarget, pack.lfRsrLabLevel);

    const total    = [0, 1, 2].map(i => astroCost[i] + mMet[i] + mCry[i] + mDeu[i] + lfCost[i]);
    const totalMSU = toMSU(total, pack);

    // Produzione del nuovo pianeta con le impostazioni account correnti
    // (plasma, classe, geologo, bonus ricerche LF globale, crawler al cap).
    const newPlanet = {
        name: 'astro', pos,
        metal: mineTarget, crystal: mineTarget, deuterium: mineTarget,
        crawlers: 0, item: 0, itemCustom: 0,
        lifeform: lfChoice === 'none' ? 'humans' : lfChoice,
        magma: lfChoice === 'rocktal' ? lfTarget : 0,
        human: lfChoice === 'humans' ? lfTarget : 0,
        lfResearch: {}, lfActive: {},
    };
    const dailyProd = Math.floor(calcPlanetMetalProduction(
        newPlanet, sim.settings, lfResearchPct.value,
        { lifeform: newPlanet.lifeform, useMaxCrawlers: true }
    ).total * 24);

    const roiDays = dailyProd > 0 ? totalMSU / dailyProd : Infinity;

    // Confronto con il piano: il passo meno efficiente (ROI peggiore) è la
    // soglia — l'astrofisica conviene se rientra prima di quel passo.
    let worstStepROI = null, worthwhile = null;
    if (result.value?.steps?.length) {
        worstStepROI = result.value.steps.reduce(
            (mx, s) => (s.deltaProd > 0 ? Math.max(mx, s.costMSU / s.deltaProd) : mx), 0);
        worthwhile = roiDays <= worstStepROI;
    }

    // Pacchetti/€ stimati (valore pacchetto = produzione attuale/giorno).
    const packValue = Math.max(1, currentProd.value);
    const packs = Math.ceil(totalMSU / packValue);
    const euro  = computeEuroCost(packs, { ...sim.shop, shopDiscount: shopDiscount.value, moBonus: moBonus.value });

    return { cur, targetAstro, levelsNeeded, total, totalMSU, dailyProd, roiDays, worstStepROI, worthwhile, packs, euro };
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 mt-6 md:mt-10 pb-12">
    <!-- Page Header -->
    <div class="mb-10 text-center relative">
        <h1 class="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">
            {{ t('strategy_title') }}
        </h1>
        <div class="mt-2 h-[3px] w-24 bg-gradient-to-r from-emerald-500 to-emerald-400 mx-auto rounded-full opacity-70"></div>
    </div>

    <!-- Intro -->
    <div class="card-glass mb-8 bg-emerald-500/[0.03] relative overflow-hidden">
        <button @click="showIntro = !showIntro" :aria-expanded="showIntro" aria-controls="strategy-intro-content" class="md:hidden w-full flex items-center justify-between px-4 py-3 text-emerald-400">
            <div class="flex items-center gap-2">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span class="text-xs font-black uppercase tracking-widest">{{ t('strategy_title') }}</span>
            </div>
            <svg class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': showIntro }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div id="strategy-intro-content" class="p-6 md:flex md:flex-row md:items-center md:gap-6 relative z-10" :class="showIntro ? 'block' : 'hidden md:flex'">
            <div class="hidden md:block p-4 rounded-2xl bg-emerald-500/[0.08] text-emerald-400 flex-shrink-0">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-3c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z"/></svg>
            </div>
            <div class="flex-grow">
                <p class="text-sm text-slate-300 leading-relaxed font-medium">{{ t('strategy_intro') }}</p>
            </div>
        </div>
    </div>

    <!-- Stato corrente -->
    <div v-if="!activeProfile || planets.length === 0" class="card-glass p-8 text-center">
        <p class="text-sm text-slate-400">{{ t('strategy_no_planets') }}</p>
        <router-link to="/metal" class="mt-3 inline-block px-4 py-2 rounded-lg bg-sky-600/80 hover:bg-sky-500 text-white text-xs font-semibold uppercase tracking-wider">
            {{ t('strategy_go_to_metal') }}
        </router-link>
    </div>

    <template v-else>
        <!-- ────── INPUT ────── -->
        <div class="card-glass p-5 mb-6">
            <h3 class="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2.5 uppercase tracking-wider">
                <span class="w-[2px] h-4 bg-emerald-400/60 rounded-full flex-shrink-0"></span>
                {{ t('strategy_input_title') }}
            </h3>

            <!-- Riga 1: statistiche + target + step + LF -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 items-start">
                <!-- Produzione attuale -->
                <div class="col-span-2 md:col-span-1 bg-ogame-surface rounded-xl p-4 border border-slate-700/15">
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">{{ t('strategy_current_prod') }}</div>
                    <div class="text-2xl font-black text-slate-200 font-mono">{{ formatNum(currentProd) }}</div>
                    <div class="text-[10px] text-slate-600 mt-1">{{ t('lbl_dm') }} / {{ t('strategy_per_day') }}</div>
                </div>
                <!-- Target + preset -->
                <div class="col-span-2 md:col-span-1 bg-ogame-surface rounded-xl p-4 border border-emerald-500/25">
                    <label for="strat-target" class="block text-[10px] text-emerald-400 uppercase tracking-wider font-semibold mb-1.5">{{ t('strategy_target') }}</label>
                    <input id="strat-target" type="text" v-model="formTarget" @focus="$event.target.select()"
                           class="input-glass w-full px-3 py-2 text-right font-mono text-emerald-300 text-lg bg-black/40">
                    <div v-if="profileDailyProd > 0" class="flex gap-1 mt-2">
                        <button v-for="m in [1.5, 2, 3, 5]" :key="m"
                                @click="target = Math.floor(profileDailyProd * m)"
                                class="flex-1 py-1 text-[9px] font-bold rounded-lg transition-all duration-150 text-center"
                                :class="target === Math.floor(profileDailyProd * m)
                                    ? 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-300'
                                    : 'text-slate-600 hover:text-slate-400 bg-black/20'">
                            ×{{ m }}
                        </button>
                    </div>
                </div>
                <!-- Step massimi -->
                <div class="bg-ogame-surface rounded-xl p-4 border border-slate-700/15">
                    <label for="strat-maxsteps" class="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">{{ t('strategy_max_steps') }}</label>
                    <input id="strat-maxsteps" type="number" v-model.number="maxSteps" @focus="$event.target.select()" min="1" max="2000"
                           class="input-glass w-full px-3 py-2 text-right font-mono">
                    <div class="text-[10px] text-slate-600 mt-1">{{ t('strategy_max_steps_desc') }}</div>
                </div>
                <!-- Bonus LF Research -->
                <div class="bg-ogame-surface rounded-xl p-4 border transition-colors"
                     :class="hasLfResearchData ? 'border-purple-500/25' : 'border-slate-700/15'">
                    <div class="text-[10px] uppercase tracking-wider font-semibold mb-1"
                         :class="hasLfResearchData ? 'text-purple-400/80' : 'text-slate-500'">
                        {{ t('lbl_lf_bonus') }}
                    </div>
                    <div v-if="hasLfResearchData" class="text-2xl font-black text-purple-300 font-mono">
                        +{{ lfResearchPct.metal.toFixed(2) }}%
                    </div>
                    <div v-else class="text-2xl font-black text-slate-400 font-mono">
                        +{{ (currentSimState?.settings?.lfBonus || 0).toFixed(1) }}%
                    </div>
                    <div class="text-[10px] mt-1" :class="hasLfResearchData ? 'text-purple-500/60' : 'text-slate-600'">
                        {{ hasLfResearchData ? t('lbl_auto') : t('strategy_per_day').replace('met / ', '') }}
                    </div>
                </div>
            </div>

            <!-- Riga 2: categorie / cap / pack mode / classe -->
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5 pt-4 border-t border-slate-700/20 items-start">
                <!-- Categorie upgrade -->
                <div class="bg-ogame-surface rounded-xl p-4 border border-slate-700/15">
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3">{{ t('strategy_categories') }}</div>
                    <div class="flex flex-col gap-2.5">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" v-model="includeMines" class="w-4 h-4 accent-sky-500 rounded flex-shrink-0">
                            <span class="text-[12px] text-slate-300">{{ t('lbl_mine_metal') }}</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" v-model="includeCrawlerMines" class="w-4 h-4 accent-cyan-500 rounded flex-shrink-0">
                            <span class="text-[12px] text-slate-300">{{ t('strategy_crawler_mines') }}</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" v-model="includePlasma" class="w-4 h-4 accent-violet-500 rounded flex-shrink-0">
                            <span class="text-[12px] text-slate-300">{{ t('plasma_technology') }}</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" v-model="includeLf" class="w-4 h-4 accent-orange-500 rounded flex-shrink-0">
                            <span class="text-[12px] text-slate-300">{{ t('strategy_lf_buildings') }}</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" v-model="includeLfResearch" class="w-4 h-4 accent-emerald-500 rounded flex-shrink-0">
                            <span class="text-[12px] text-slate-300">{{ t('strategy_lf_research') }}</span>
                        </label>
                        <p v-if="includeLfResearch" class="pl-6 text-[9px] text-slate-600 leading-tight">
                            {{ t('strategy_lf_research_select_hint') }}
                        </p>
                    </div>
                </div>
                <!-- Cap livello -->
                <div class="bg-ogame-surface rounded-xl p-4 border border-slate-700/15">
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3">
                        {{ t('strategy_caps') }} <span class="text-slate-700 normal-case font-normal text-[9px]">({{ t('strategy_caps_hint') }})</span>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <label class="block">
                            <span class="block text-[10px] text-sky-500/70 uppercase font-semibold mb-1.5 truncate">Min.</span>
                            <input type="number" v-model.number="capMine" min="0"
                                   class="input-glass w-full px-2 py-2 text-center font-mono text-sm">
                        </label>
                        <label class="block">
                            <span class="block text-[10px] text-violet-400/70 uppercase font-semibold mb-1.5 truncate">Plasma</span>
                            <input type="number" v-model.number="capPlasma" min="0"
                                   class="input-glass w-full px-2 py-2 text-center font-mono text-sm">
                        </label>
                        <label class="block">
                            <span class="block text-[10px] text-orange-400/70 uppercase font-semibold mb-1.5 truncate">LF</span>
                            <input type="number" v-model.number="capLf" min="0"
                                   class="input-glass w-full px-2 py-2 text-center font-mono text-sm">
                        </label>
                        <label class="block">
                            <span class="block text-[10px] text-emerald-500/70 uppercase font-semibold mb-1.5 truncate">Ric.LF</span>
                            <input type="number" v-model.number="capLfResearch" min="0"
                                   class="input-glass w-full px-2 py-2 text-center font-mono text-sm">
                        </label>
                    </div>
                </div>
                <!-- Valore pacchetto -->
                <div class="bg-ogame-surface rounded-xl p-4 border border-slate-700/15">
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3">{{ t('strategy_pack_mode') }}</div>
                    <div class="flex gap-1 bg-black/30 p-1 rounded-xl border border-slate-700/20">
                        <button @click="packMode = 'dynamic'"
                                class="flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-150"
                                :class="packMode === 'dynamic' ? 'bg-slate-700/70 text-slate-100' : 'text-slate-600 hover:text-slate-400'">
                            {{ t('strategy_pack_dynamic') }}
                        </button>
                        <button @click="packMode = 'fixed'"
                                class="flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-150"
                                :class="packMode === 'fixed' ? 'bg-emerald-500/20 border border-emerald-400/35 text-emerald-200' : 'text-slate-600 hover:text-slate-400'">
                            {{ t('strategy_pack_fixed') }}
                        </button>
                    </div>
                    <div v-if="packMode === 'dynamic'" class="mt-2 flex items-center gap-2">
                        <label for="strat-pack-batch" class="text-[9px] text-slate-600 uppercase tracking-wider font-semibold whitespace-nowrap">{{ t('strategy_pack_batch') }}</label>
                        <input id="strat-pack-batch" type="number" v-model.number="packBatch" min="1" max="500" @focus="$event.target.select()"
                               class="input-glass w-full px-2 py-1 text-center font-mono text-sm">
                    </div>
                    <p v-else class="text-[9px] text-slate-700 mt-2 leading-tight">{{ t('strategy_pack_fixed_desc') }}</p>
                </div>
                <!-- Classe giocatore -->
                <div class="bg-ogame-surface rounded-xl p-4 border border-slate-700/15">
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3">{{ t('lbl_player_class') }}</div>
                    <div class="flex gap-1 bg-black/30 p-1 rounded-xl border border-slate-700/20">
                        <button @click="playerClassOverride = 'inherit'"
                                class="flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-150"
                                :class="playerClassOverride === 'inherit' ? 'bg-slate-700/70 text-slate-100' : 'text-slate-600 hover:text-slate-400'">
                            {{ t('strategy_lf_inherit') }}
                        </button>
                        <button @click="playerClassOverride = 'collector'"
                                class="flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-150"
                                :class="playerClassOverride === 'collector' ? 'bg-amber-500/20 border border-amber-400/35 text-amber-200' : 'text-slate-600 hover:text-slate-400'">
                            Collezionista
                        </button>
                    </div>
                    <p class="text-[9px] text-slate-700 mt-2 leading-tight">
                        {{ playerClassOverride === 'inherit'
                            ? t('opt_' + (currentSimState?.settings?.playerClass || 'none'))
                            : t('opt_collector') }}
                    </p>
                </div>
            </div>

            <!-- Selezione ricerche LF da considerare (per-ricerca) -->
            <div v-if="includeLfResearch" class="pt-4 border-t border-slate-700/20">
                <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-2">
                        {{ t('strategy_lf_research_select') }}
                        <span class="text-slate-700 normal-case font-normal">({{ lfResearchIds.length }}/{{ ALL_LF_IDS.length }})</span>
                    </div>
                    <div class="flex gap-1">
                        <button @click="setLfResAll(true)"
                                class="px-2 py-1 text-[9px] font-bold rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 hover:bg-emerald-500/25 transition-colors">
                            {{ t('strategy_lf_activate_all') }}
                        </button>
                        <button @click="setLfResAll(false)"
                                class="px-2 py-1 text-[9px] font-bold rounded-md bg-black/20 text-slate-500 border border-slate-700/30 hover:text-slate-300 transition-colors">
                            {{ t('strategy_lf_deactivate_all') }}
                        </button>
                    </div>
                </div>
                <div class="bg-ogame-surface rounded-xl p-3 border border-slate-700/15">
                    <div class="flex flex-wrap gap-1.5">
                        <button v-for="r in LF_RESEARCH_ALL" :key="r.id"
                                @click="toggleLfRes(r.id)"
                                :title="r.name"
                                class="px-2 py-1 text-[10px] font-semibold rounded-md border transition-all duration-150 flex items-center gap-1"
                                :class="isLfResSelected(r.id) ? LF_SPECIES_CHIP[r.species].on : LF_SPECIES_CHIP[r.species].off">
                            <span class="font-mono font-bold">T{{ r.tier }}</span>
                            <span class="max-w-[9rem] truncate">{{ r.name }}</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- LF override per pianeta -->
            <div class="pt-4 border-t border-slate-700/20">
                <div class="flex items-center justify-between flex-wrap gap-3 mb-3">
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-2">
                        {{ t('strategy_lf_override') }}
                        <span class="text-slate-700 normal-case font-normal">({{ t('strategy_lf_override_hint') }})</span>
                    </div>
                    <!-- Modifica massiva -->
                    <div class="flex items-center gap-2">
                        <span class="text-[9px] text-slate-600 uppercase tracking-wider font-semibold">{{ t('strategy_lf_set_all') }}:</span>
                        <div class="flex gap-0.5">
                            <button v-for="opt in lfOpts" :key="opt.v"
                                    @click="lfChoice = planets.map(() => opt.v)"
                                    class="px-2 py-1 text-[9px] font-bold rounded-md transition-all duration-150"
                                    :class="opt.ac">
                                {{ opt.l }}
                            </button>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    <div v-for="(p, idx) in planets" :key="idx"
                         class="bg-ogame-surface rounded-xl border p-3 transition-colors"
                         :class="lfBorderColor(effectiveLf(p, idx))">
                        <!-- Nome pianeta + badge LF attiva -->
                        <div class="flex items-start justify-between gap-1 mb-1.5">
                            <span class="text-[11px] font-semibold text-slate-200 truncate leading-tight" :title="p.name">
                                {{ p.name || `#${idx+1}` }}
                            </span>
                            <span class="text-[10px] font-bold px-1 py-0.5 rounded tracking-wider uppercase flex-shrink-0 leading-tight"
                                  :class="lfBadgeClass(effectiveLf(p, idx))">
                                {{ t('opt_' + effectiveLf(p, idx)) }}
                            </span>
                        </div>
                        <!-- Livelli edifici: miniera + edificio LF -->
                        <div class="flex gap-1.5 mb-2.5 text-[9px] text-slate-700 font-mono">
                            <span>M.{{ p.metal || 0 }}</span>
                            <span v-if="p.magma" class="text-orange-800">FM.{{ p.magma }}</span>
                            <span v-if="p.human" class="text-blue-900">FAE.{{ p.human }}</span>
                        </div>
                        <!-- Toggle LF (≡=inherit, U=humans, R=rocktal, M=mecha, K=kaelesh) -->
                        <div class="flex gap-0.5">
                            <button v-for="opt in lfOpts" :key="opt.v"
                                    @click="lfChoice[idx] = opt.v"
                                    class="flex-1 py-1 text-[9px] font-bold rounded-md transition-all duration-150 text-center leading-none"
                                    :class="lfChoice[idx] === opt.v ? opt.ac : 'text-slate-700 hover:text-slate-400 bg-black/10'">
                                {{ opt.l }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottone calcolo -->
            <div class="mt-5 pt-4 border-t border-slate-700/20 flex justify-end gap-2">
                <button @click="computePlan" :disabled="isComputing || target <= profileDailyProd"
                        class="px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2"
                        :class="isComputing || target <= profileDailyProd
                                ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg'">
                    <svg v-if="isComputing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    {{ isComputing ? t('strategy_computing') : t('strategy_compute') }}
                </button>
            </div>
            <!-- Progresso calcolo (dal worker): % verso il target + step correnti -->
            <div v-if="isComputing && progress" class="mt-3">
                <div class="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span class="text-slate-500">{{ progress.step }} / {{ progress.maxSteps }} step</span>
                    <span class="text-emerald-400">{{ formatNum(progress.currentProd) }} · {{ computePct }}%</span>
                </div>
                <div class="h-1.5 bg-black/40 rounded-full overflow-hidden border border-slate-700/20"
                     role="progressbar" :aria-valuenow="computePct" aria-valuemin="0" aria-valuemax="100">
                    <div class="h-full bg-emerald-500/70 rounded-full transition-all duration-200" :style="{ width: computePct + '%' }"></div>
                </div>
            </div>
            <div v-if="target <= profileDailyProd && target > 0" class="mt-2 text-right text-[11px] text-amber-400/80">
                {{ t('strategy_target_too_low') }}
            </div>
            <div class="mt-2 flex items-start gap-1.5 text-[10px] text-slate-600">
                <svg class="w-3 h-3 mt-px shrink-0 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>{{ t('strategy_perf_hint') }}</span>
            </div>
        </div>

        <!-- ────── ASTROFISICA: convenienza nuovo pianeta ────── -->
        <div class="card-glass p-5 mb-6">
            <h3 class="text-sm font-semibold text-slate-200 mb-1 flex items-center gap-2.5 uppercase tracking-wider">
                <span class="w-[2px] h-4 bg-fuchsia-400/60 rounded-full flex-shrink-0"></span>
                {{ t('astro_title') }}
            </h3>
            <p class="text-[11px] text-slate-500 mb-4 leading-relaxed">{{ t('astro_desc') }}</p>

            <!-- Input -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div class="bg-ogame-surface rounded-xl p-3 border border-slate-700/15">
                    <label for="astro-lvl" class="block text-[10px] text-fuchsia-400/80 uppercase tracking-wider font-semibold mb-1.5">{{ t('astro_current_level') }}</label>
                    <input id="astro-lvl" type="number" v-model.number="astroCurrentLevel" min="0" @focus="$event.target.select()"
                           class="input-glass w-full px-2 py-2 text-center font-mono text-sm">
                </div>
                <div class="bg-ogame-surface rounded-xl p-3 border border-slate-700/15">
                    <label for="astro-pos" class="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">{{ t('astro_planet_pos') }}</label>
                    <input id="astro-pos" type="number" v-model.number="astroPlanetPos" min="1" max="15" @focus="$event.target.select()"
                           class="input-glass w-full px-2 py-2 text-center font-mono text-sm">
                </div>
                <div class="bg-ogame-surface rounded-xl p-3 border border-slate-700/15">
                    <label for="astro-mine" class="block text-[10px] text-sky-400/70 uppercase tracking-wider font-semibold mb-1.5">{{ t('astro_mine_target') }}</label>
                    <input id="astro-mine" type="number" v-model.number="astroMineTarget" min="0" max="50" @focus="$event.target.select()"
                           class="input-glass w-full px-2 py-2 text-center font-mono text-sm">
                </div>
                <div class="bg-ogame-surface rounded-xl p-3 border border-slate-700/15">
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">{{ t('astro_lf') }}</div>
                    <div class="flex gap-1 bg-black/30 p-1 rounded-lg border border-slate-700/20">
                        <button v-for="opt in astroLfOpts" :key="opt.v"
                                @click="astroLfChoice = opt.v"
                                class="flex-1 py-1 text-[11px] font-bold rounded-md transition-all duration-150"
                                :class="astroLfChoice === opt.v ? 'bg-slate-600/70 text-slate-100' : 'text-slate-600 hover:text-slate-400'">
                            {{ opt.l }}
                        </button>
                    </div>
                </div>
                <div class="bg-ogame-surface rounded-xl p-3 border border-slate-700/15" :class="astroLfChoice === 'none' ? 'opacity-40' : ''">
                    <label for="astro-lf-lvl" class="block text-[10px] text-orange-400/70 uppercase tracking-wider font-semibold mb-1.5">{{ t('astro_lf_level') }}</label>
                    <input id="astro-lf-lvl" type="number" v-model.number="astroLfTarget" min="0" :disabled="astroLfChoice === 'none'" @focus="$event.target.select()"
                           class="input-glass w-full px-2 py-2 text-center font-mono text-sm disabled:cursor-not-allowed">
                </div>
            </div>

            <!-- Risultato astro -->
            <div v-if="astroPlan" class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="bg-ogame-surface rounded-xl p-3 border border-slate-700/15 text-center">
                    <div class="text-[9px] text-slate-600 uppercase tracking-wider font-semibold mb-1">{{ t('astro_levels_needed') }}</div>
                    <div class="text-lg font-black text-fuchsia-300 font-mono">{{ astroPlan.cur }} → {{ astroPlan.targetAstro }}</div>
                    <div class="text-[9px] text-slate-600 mt-0.5">+{{ astroPlan.levelsNeeded }} {{ t('astro_levels_unit') }}</div>
                </div>
                <div class="bg-ogame-surface rounded-xl p-3 border border-emerald-500/25 text-center">
                    <div class="text-[9px] text-emerald-400 uppercase tracking-wider font-semibold mb-1">{{ t('astro_new_prod') }}</div>
                    <div class="text-lg font-black text-emerald-300 font-mono">+{{ formatNum(astroPlan.dailyProd) }}</div>
                    <div class="text-[9px] text-slate-600 mt-0.5">{{ t('lbl_dm') }} / {{ t('strategy_per_day') }}</div>
                </div>
                <div class="bg-ogame-surface rounded-xl p-3 border border-slate-700/15 text-center">
                    <div class="text-[9px] text-slate-600 uppercase tracking-wider font-semibold mb-1">{{ t('astro_total_cost') }}</div>
                    <div class="text-lg font-black text-slate-200 font-mono">{{ formatNum(astroPlan.totalMSU) }}</div>
                    <div class="text-[9px] text-amber-400/80 mt-0.5">{{ formatNum(astroPlan.packs) }} pack · €{{ formatNum(astroPlan.euro.totalEuro) }}</div>
                </div>
                <div class="bg-ogame-surface rounded-xl p-3 border text-center"
                     :class="astroPlan.worthwhile === null ? 'border-slate-700/15'
                             : astroPlan.worthwhile ? 'border-emerald-500/30' : 'border-red-500/30'">
                    <div class="text-[9px] text-slate-600 uppercase tracking-wider font-semibold mb-1">{{ t('astro_roi') }}</div>
                    <div class="text-lg font-black font-mono" :class="roiColor(astroPlan.totalMSU, astroPlan.dailyProd)">
                        {{ formatROI(astroPlan.totalMSU, astroPlan.dailyProd) }}
                    </div>
                    <div v-if="astroPlan.worthwhile === null" class="text-[9px] text-slate-600 mt-0.5">{{ t('astro_verdict_hint') }}</div>
                    <div v-else-if="astroPlan.worthwhile" class="text-[9px] text-emerald-400 mt-0.5 font-bold uppercase tracking-wide">{{ t('astro_verdict_worth') }}</div>
                    <div v-else class="text-[9px] text-red-400 mt-0.5 font-bold uppercase tracking-wide">{{ t('astro_verdict_not') }}</div>
                </div>
            </div>
            <p v-if="astroPlan && astroPlan.worstStepROI !== null" class="mt-3 text-[10px] text-slate-600 leading-tight">
                {{ t('astro_compare_note') }} <span class="font-mono text-slate-500">{{ formatROI(astroPlan.worstStepROI, 1) }}</span>
            </p>
        </div>

        <!-- ────── RISULTATI ────── -->
        <div v-if="result" class="space-y-6">

            <!-- Sommario top -->
            <div class="card-glass p-5">
                <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div class="bg-ogame-surface rounded-xl p-3 border border-slate-700/15 text-center">
                        <div class="text-[9px] text-slate-600 uppercase tracking-wider font-semibold mb-1">{{ t('strategy_initial') }}</div>
                        <div class="text-lg font-black text-slate-200 font-mono">{{ formatNum(result.initialProd) }}</div>
                    </div>
                    <div class="bg-ogame-surface rounded-xl p-3 border border-emerald-500/25 text-center">
                        <div class="text-[9px] text-emerald-400 uppercase tracking-wider font-semibold mb-1">{{ t('strategy_final') }}</div>
                        <div class="text-lg font-black text-emerald-300 font-mono">{{ formatNum(result.finalProd) }}</div>
                    </div>
                    <div class="bg-ogame-surface rounded-xl p-3 border border-slate-700/15 text-center">
                        <div class="text-[9px] text-slate-600 uppercase tracking-wider font-semibold mb-1">{{ t('strategy_total_packs') }}</div>
                        <div class="text-lg font-black text-amber-300 font-mono">{{ formatNum(result.cumulativePacks) }}</div>
                    </div>
                    <div class="bg-ogame-surface rounded-xl p-3 border border-slate-700/15 text-center">
                        <div class="text-[9px] text-slate-600 uppercase tracking-wider font-semibold mb-1">{{ t('strategy_total_mo') }}</div>
                        <div class="text-lg font-black text-purple-300 font-mono">{{ formatNum(result.euro.totalMO) }}</div>
                    </div>
                    <div class="bg-ogame-surface rounded-xl p-3 border border-slate-700/15 text-center">
                        <div class="text-[9px] text-slate-600 uppercase tracking-wider font-semibold mb-1">{{ t('strategy_total_euro') }}</div>
                        <div class="text-lg font-black text-green-300 font-mono">€{{ formatNum(result.euro.totalEuro) }}</div>
                    </div>
                </div>

                <!-- Selettori sconto pacchetti + bonus MO -->
                <div class="mt-4 pt-4 border-t border-slate-700/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- Sconto shop -->
                    <div>
                        <div class="text-[9px] text-slate-600 uppercase tracking-widest font-semibold mb-2">{{ t('lbl_shop_discount') }}</div>
                        <div class="flex gap-1 bg-ogame-bg/70 p-1 rounded-xl border border-slate-700/20">
                            <button @click="shopDiscount = 0; recomputeEuro()"
                                    class="flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-150"
                                    :class="shopDiscount === 0 ? 'bg-slate-700/70 text-slate-100' : 'text-slate-600 hover:text-slate-400'">
                                {{ t('opt_none') }}
                            </button>
                            <button @click="shopDiscount = 20; recomputeEuro()"
                                    class="flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-150"
                                    :class="shopDiscount === 20 ? 'bg-violet-500/20 border border-violet-400/35 text-violet-200' : 'text-slate-600 hover:text-slate-400'">
                                –20%
                            </button>
                            <button @click="shopDiscount = 30; recomputeEuro()"
                                    class="flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-150"
                                    :class="shopDiscount === 30 ? 'bg-violet-500/20 border border-violet-400/35 text-violet-200' : 'text-slate-600 hover:text-slate-400'">
                                –30%
                            </button>
                        </div>
                    </div>
                    <!-- Bonus MO evento -->
                    <div>
                        <div class="text-[9px] text-slate-600 uppercase tracking-widest font-semibold mb-2">{{ t('lbl_event_bonus') }}</div>
                        <div class="grid grid-cols-4 sm:grid-cols-7 gap-1 bg-ogame-bg/70 p-1 rounded-xl border border-slate-700/20">
                            <button v-for="b in [0, 30, 40, 50, 60, 100, 130]" :key="b"
                                    @click="moBonus = b; recomputeEuro()"
                                    class="py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-150 text-center"
                                    :class="moBonus === b ? 'bg-amber-500/15 border border-amber-400/35 text-amber-200' : 'text-slate-600 hover:text-slate-400'">
                                <template v-if="b === 0">–</template>
                                <template v-else>+{{ b }}%</template>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Reason chip -->
                <div class="mt-3 flex items-center justify-between flex-wrap gap-2">
                    <div class="text-[10px] uppercase tracking-wider">
                        <span v-if="result.reachedTarget" class="px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">{{ t('strategy_target_reached') }}</span>
                        <span v-else class="px-2 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">{{ t('strategy_stop_' + result.stoppedReason) }}</span>
                    </div>
                    <button @click="importToPackQueue"
                            class="px-3 py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white text-[11px] font-semibold uppercase tracking-wider transition-colors">
                        {{ t('strategy_import_to_pack') }}
                    </button>
                </div>
            </div>

            <!-- Riepilogo contributi per categoria -->
            <div v-if="typeSummary" class="card-glass p-5">
                <h3 class="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2.5 uppercase tracking-wider">
                    <span class="w-[2px] h-4 bg-emerald-400/60 rounded-full flex-shrink-0"></span>
                    {{ t('strategy_contrib_title') }}
                </h3>
                <div class="space-y-3">
                    <div v-for="cat in typeSummary" :key="cat.key" class="flex items-center gap-3">
                        <!-- Label + badge -->
                        <div class="w-36 flex-shrink-0 flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border flex-shrink-0"
                                  :class="{
                                      'bg-sky-500/10 text-sky-300 border-sky-500/30':       cat.key === 'mine',
                                      'bg-cyan-500/10 text-cyan-300 border-cyan-500/30':    cat.key === 'crawler',
                                      'bg-violet-500/10 text-violet-300 border-violet-500/30': cat.key === 'plasma',
                                      'bg-orange-500/10 text-orange-300 border-orange-500/30': cat.key === 'lf_build',
                                      'bg-emerald-500/10 text-emerald-300 border-emerald-500/30': cat.key === 'lf_research',
                                  }">
                                {{ t('strategy_contrib_' + cat.key) }}
                            </span>
                        </div>
                        <!-- Barra progresso -->
                        <div class="flex-1 bg-black/30 rounded-full h-2 overflow-hidden">
                            <div class="h-full rounded-full transition-all duration-500"
                                 :style="{ width: cat.pct + '%' }"
                                 :class="{
                                     'bg-sky-500/70':     cat.key === 'mine',
                                     'bg-cyan-500/70':    cat.key === 'crawler',
                                     'bg-violet-500/70':  cat.key === 'plasma',
                                     'bg-orange-500/70':  cat.key === 'lf_build',
                                     'bg-emerald-500/70': cat.key === 'lf_research',
                                 }">
                            </div>
                        </div>
                        <!-- Percentuale + dettaglio -->
                        <div class="w-28 flex-shrink-0 flex items-baseline gap-2 justify-end">
                            <span class="text-base font-black font-mono"
                                  :class="{
                                      'text-sky-300':     cat.key === 'mine',
                                      'text-cyan-300':    cat.key === 'crawler',
                                      'text-violet-300':  cat.key === 'plasma',
                                      'text-orange-300':  cat.key === 'lf_build',
                                      'text-emerald-300': cat.key === 'lf_research',
                                  }">
                                {{ cat.pct }}%
                            </span>
                            <span class="text-[10px] text-slate-600 font-mono whitespace-nowrap">
                                +{{ formatNum(cat.delta) }}
                                <template v-if="cat.key === 'mine'"> ({{ cat.levels }}↑)</template>
                                <template v-else-if="cat.key === 'plasma'"> (L+{{ cat.levels }})</template>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Riepilogo per pianeta -->
            <div class="card-glass p-5">
                <h3 class="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2.5 uppercase tracking-wider">
                    <span class="w-[2px] h-4 bg-sky-400/60 rounded-full flex-shrink-0"></span>
                    {{ t('strategy_summary_planet') }}
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div v-for="row in perPlanetSummary.planets" :key="row.idx"
                         class="bg-ogame-surface rounded-lg border border-slate-700/20 px-3 py-2 flex items-center justify-between text-[12px]">
                        <span class="font-mono text-slate-300 truncate">{{ row.name }}</span>
                        <div class="flex gap-2 flex-shrink-0">
                            <span v-if="row.metalMine" class="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-mono text-[10px]">M+{{ row.metalMine }}</span>
                            <span v-if="row.crystalMine" class="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono text-[10px]">C+{{ row.crystalMine }}</span>
                            <span v-if="row.deutMine" class="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono text-[10px]">D+{{ row.deutMine }}</span>
                            <span v-if="row.lfMagma" class="px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30 font-mono text-[10px]">FM+{{ row.lfMagma }}</span>
                            <span v-if="row.lfHuman" class="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono text-[10px]">FAE+{{ row.lfHuman }}</span>
                        </div>
                    </div>
                    <div v-if="perPlanetSummary.plasma" class="bg-ogame-surface rounded-lg border border-violet-500/30 px-3 py-2 flex items-center justify-between text-[12px]">
                        <span class="font-mono text-violet-300">{{ t('plasma_technology') }}</span>
                        <span class="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 font-mono text-[10px]">+{{ perPlanetSummary.plasma }}</span>
                    </div>
                    <div v-if="perPlanetSummary.lfResearch" class="bg-ogame-surface rounded-lg border border-emerald-500/30 px-3 py-2 flex items-center justify-between text-[12px]">
                        <span class="font-mono text-emerald-300">{{ t('strategy_lf_research') }}</span>
                        <span class="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-[10px]">+{{ perPlanetSummary.lfResearch }}</span>
                    </div>
                </div>
            </div>

            <!-- Roadmap step-by-step -->
            <div class="overflow-hidden rounded-xl border border-slate-700/25 bg-ogame-panel">
                <div class="px-5 py-3 border-b border-slate-700/25 bg-ogame-surface">
                    <div class="flex justify-between items-center flex-wrap gap-2">
                        <div class="flex items-center gap-2.5">
                            <span class="w-[2px] h-4 bg-emerald-400/60 rounded-full flex-shrink-0"></span>
                            <h3 class="text-sm font-semibold text-slate-200 uppercase tracking-wider">{{ t('strategy_roadmap') }}</h3>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-[10px] font-mono text-emerald-300 border border-emerald-500/25">
                                {{ doneCount }}/{{ groupedSteps.length }} {{ t('lbl_done') }}
                            </span>
                            <span class="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] font-mono text-slate-500 border border-slate-700/20">
                                {{ groupedSteps.length }} {{ t('lbl_blocks') }}
                                <span v-if="groupedSteps.length !== result.steps.length" class="text-slate-700">({{ result.steps.length }} step)</span>
                            </span>
                        </div>
                    </div>
                    <!-- Avanzamento esecuzione del piano (blocchi spuntati) -->
                    <div class="mt-2 h-1 bg-black/40 rounded-full overflow-hidden">
                        <div class="h-full bg-emerald-500/60 rounded-full transition-all duration-300"
                             :style="{ width: (groupedSteps.length ? Math.round(doneCount / groupedSteps.length * 100) : 0) + '%' }"></div>
                    </div>
                    <!-- Filtro per tipo -->
                    <div v-if="presentTypes.length > 1" class="mt-2.5 flex items-center gap-1 flex-wrap">
                        <button @click="typeFilter = 'all'"
                                class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border transition-colors duration-150"
                                :class="typeFilter === 'all' ? 'bg-slate-600/40 text-slate-100 border-slate-500/40' : 'bg-transparent text-slate-600 border-slate-700/30 hover:text-slate-400'">
                            {{ t('lbl_all') }}
                        </button>
                        <button v-for="tp in presentTypes" :key="tp"
                                @click="typeFilter = typeFilter === tp ? 'all' : tp"
                                class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border transition-colors duration-150"
                                :class="typeFilter === tp ? stepBadgeClass(tp) : 'bg-transparent text-slate-600 border-slate-700/30 hover:text-slate-400'">
                            {{ stepTypeLabel(tp) }}
                        </button>
                    </div>
                </div>

                <!-- Desktop table -->
                <div class="hidden md:block overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar">
                    <table class="w-full text-xs">
                        <thead class="sticky top-0 z-10 bg-ogame-surface text-slate-500 uppercase text-[9px] tracking-wider shadow-[0_1px_0_rgba(51,65,85,0.4)]">
                            <tr>
                                <th class="px-3 py-2 text-center font-semibold w-8"><span class="sr-only">{{ t('lbl_done') }}</span>✓</th>
                                <th class="px-3 py-2 text-left font-semibold">#</th>
                                <th class="px-3 py-2 text-left font-semibold">{{ t('strategy_th_type') }}</th>
                                <th class="px-3 py-2 text-left font-semibold">{{ t('strategy_th_planet') }}</th>
                                <th class="px-3 py-2 text-center font-semibold">{{ t('strategy_th_level') }}</th>
                                <th class="px-3 py-2 text-right font-semibold">{{ t('strategy_th_cost_msu') }}</th>
                                <th class="px-3 py-2 text-right font-semibold">{{ t('strategy_th_packs') }}</th>
                                <th class="px-3 py-2 text-right font-semibold">{{ t('strategy_th_delta') }}</th>
                                <th class="px-3 py-2 text-right font-semibold">ROI</th>
                                <th class="px-3 py-2 text-right font-semibold">{{ t('strategy_th_cum_prod') }}</th>
                                <th class="px-3 py-2 text-right font-semibold">{{ t('strategy_th_cum_packs') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="s in filteredSteps" :key="s.n"
                                class="border-t border-slate-700/15 hover:bg-white/[0.02] transition-colors duration-150 cursor-pointer"
                                :class="[
                                    doneSteps.has(s.n) ? 'opacity-40' : '',
                                    s.n === nextStepN ? 'bg-emerald-500/[0.06]' : (s.count > 1 ? 'bg-emerald-500/[0.02]' : '')
                                ]"
                                @click="toggleDone(s.n)">
                                <td class="px-3 py-2 text-center">
                                    <input type="checkbox" :checked="doneSteps.has(s.n)" @click.stop="toggleDone(s.n)"
                                           :aria-label="t('lbl_done') + ' #' + s.n"
                                           class="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer">
                                </td>
                                <td class="px-3 py-2 font-mono text-slate-600 text-[10px] whitespace-nowrap">
                                    {{ s.n }}
                                    <span v-if="s.n === nextStepN" class="ml-1 px-1 py-px rounded bg-emerald-500/15 text-emerald-300 text-[8px] font-bold uppercase tracking-wider">{{ t('lbl_next') }}</span>
                                </td>
                                <td class="px-3 py-2 whitespace-nowrap">
                                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border"
                                          :class="[stepBadgeClass(s), doneSteps.has(s.n) ? 'line-through' : '']">
                                        {{ stepTypeLabel(s) }}
                                    </span>
                                    <span v-if="s.count > 1" class="ml-1.5 text-[9px] text-slate-600 font-mono">×{{ s.count }}</span>
                                </td>
                                <td class="px-3 py-2 font-mono text-slate-400">
                                    <div v-if="s.type === 'lf_research' && s.researchName" class="text-[9px] text-slate-600 leading-tight mb-0.5 flex items-center gap-1">
                                        <span class="px-1 rounded bg-slate-700/50 text-slate-500 font-mono font-bold text-[10px]">T{{ parseInt(s.researchId) % 100 }}</span>
                                        {{ s.researchName }}
                                    </div>
                                    {{ s.planetName || '—' }}
                                </td>
                                <td class="px-3 py-2 text-center font-mono text-slate-300">{{ s.from }} → {{ s.to }}</td>
                                <td class="px-3 py-2 text-right font-mono text-slate-300">{{ formatNum(s.costMSU) }}</td>
                                <td class="px-3 py-2 text-right font-mono text-amber-300/90">{{ s.packs }}</td>
                                <td class="px-3 py-2 text-right font-mono text-emerald-300">+{{ formatNum(s.deltaProd) }}</td>
                                <td class="px-3 py-2 text-right font-mono font-semibold" :class="roiColor(s.costMSU, s.deltaProd)">{{ formatROI(s.costMSU, s.deltaProd) }}</td>
                                <td class="px-3 py-2 text-right font-mono text-slate-200 font-bold">
                                    {{ formatNum(s.cumulativeProd) }}
                                    <div class="mt-0.5 h-[3px] w-16 ml-auto bg-black/40 rounded-full overflow-hidden">
                                        <div class="h-full bg-emerald-500/50 rounded-full" :style="{ width: rowProgressPct(s.cumulativeProd) + '%' }"></div>
                                    </div>
                                </td>
                                <td class="px-3 py-2 text-right font-mono text-amber-400">{{ s.cumulativePacks }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Mobile cards -->
                <div class="md:hidden p-3 space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div v-for="s in filteredSteps" :key="s.n"
                         class="rounded-lg border p-3 transition-opacity duration-150"
                         :class="[
                             doneSteps.has(s.n) ? 'opacity-40' : '',
                             s.n === nextStepN
                                 ? 'bg-emerald-500/[0.06] border-emerald-500/30'
                                 : (s.count > 1 ? 'bg-emerald-500/[0.03] border-emerald-500/20' : 'bg-ogame-surface border-slate-700/20')
                         ]">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-1.5">
                                <input type="checkbox" :checked="doneSteps.has(s.n)" @change="toggleDone(s.n)"
                                       :aria-label="t('lbl_done') + ' #' + s.n"
                                       class="w-4 h-4 accent-emerald-500 rounded cursor-pointer">
                                <span class="text-[10px] font-mono text-slate-600">#{{ s.n }}</span>
                                <span v-if="s.count > 1" class="text-[9px] font-mono text-slate-700">×{{ s.count }}</span>
                                <span v-if="s.n === nextStepN" class="px-1 py-px rounded bg-emerald-500/15 text-emerald-300 text-[8px] font-bold uppercase tracking-wider">{{ t('lbl_next') }}</span>
                            </div>
                            <span class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border"
                                  :class="stepBadgeClass(s)">{{ stepTypeLabel(s) }}</span>
                        </div>
                        <div class="text-[12px] text-slate-400 mb-2">
                            <div v-if="s.type === 'lf_research' && s.researchName" class="text-[9px] text-slate-600 leading-tight mb-0.5">{{ s.researchName }}</div>
                            <span v-if="s.planetName" class="font-mono">{{ s.planetName }}</span>
                            <span class="ml-2 font-mono text-slate-500">L{{ s.from }} → L{{ s.to }}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                            <div class="flex justify-between"><span class="text-slate-600">MSU</span><span class="font-mono text-slate-300">{{ formatNum(s.costMSU) }}</span></div>
                            <div class="flex justify-between"><span class="text-slate-600">Pack</span><span class="font-mono text-amber-300">{{ s.packs }}</span></div>
                            <div class="flex justify-between"><span class="text-slate-600">Δ</span><span class="font-mono text-emerald-300">+{{ formatNum(s.deltaProd) }}</span></div>
                            <div class="flex justify-between"><span class="text-slate-600">ROI</span><span class="font-mono font-semibold" :class="roiColor(s.costMSU, s.deltaProd)">{{ formatROI(s.costMSU, s.deltaProd) }}</span></div>
                            <div class="flex justify-between col-span-2"><span class="text-slate-600">Tot</span><span class="font-mono text-slate-200 font-bold">{{ formatNum(s.cumulativeProd) }}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </template>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.2); border-radius: 3px; }

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
</style>
