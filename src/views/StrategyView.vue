<script setup>
import PageHead from '../components/PageHead.vue';
import { ref, reactive, computed, watch, onMounted, onUnmounted, onBeforeUnmount, nextTick } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useProfiles } from '../composables/useProfiles';
import { useOgameFormulas, formatInt, formatPct } from '../composables/useOgameFormulas';
import { useStrategy, toMSU, isStepDoneInProfile, rewindPlanProgress, applyStepToState } from '../composables/useStrategy';
import { useToast } from '../composables/useToast';
import { usePurchaseSettings } from '../composables/usePurchaseSettings';
import { OGAME_DB, DM_EVENT_BONUSES, SHOP_PACK_DISCOUNTS, METAL_BOOSTER_PCTS, RES_AMP_PCTS } from '../data/ogame_db';

const { t } = useLanguage();
const { show: showToast } = useToast();
const { activeProfile, saveProfiles } = useProfiles();
const { formatNum, calcLFResearchBonus } = useOgameFormulas();
const { runPlanner, computeEuroCost, buildInitialState, simulateDailyProduction } = useStrategy();

const showIntro = ref(false);
const isComputing = ref(false);
const result = ref(null);
const progress = ref(null);        // { step, maxSteps, currentProd, initialProd, target } dal worker
const doneSteps = ref(new Set());  // blocchi spuntati come "fatto" nella roadmap
const typeFilter = ref('all');     // filtro tipo nella roadmap
// Risorse già possedute, sconto shop e bonus MO: condivisi con Pack Exchange e
// Shopping List (vivono nel profilo), si inseriscono una volta sola.
const { stock, shopDiscount, moBonus } = usePurchaseSettings();

// Form
const target = ref(0);             // Δ goal in metallo/giorno
// Obiettivo: 'production' (raggiungere una produzione) oppure 'spend' (fare un
// acquisto, es. Astro 31, con meno pacchi totali alzando prima la produzione).
const goalMode = ref('production');
const goalMSU = ref(0);
// Ripartizione [metallo, cristallo, deuterio] dell'obiettivo, nota solo se preso
// dalla coda di Pack Exchange (inserendo gli MSU a mano non la si conosce).
const goalRes = ref(null);
const maxSteps = ref(2000);

// Impostazioni del valore dei pacchetti (locali a questa view)
const packMode = ref('dynamic');           // 'dynamic' | 'fixed'
const packBatch = ref(10);                 // pacchi per aggiornamento valore dinamico
const playerClassOverride = ref('inherit'); // 'inherit' | 'collector'

// Ipotesi di simulazione. Con tutte su 'profile' la produzione di partenza del
// planner coincide con quella del Production Core.
//   crawlerMode:    'max' | 'profile'          (sempre al cap, oppure solo i posseduti)
//   overloadMode:   'profile' | 'all' | 'none' (sovraccarico 150%, solo Collezionista)
//   itemMode:       'profile' | 0 | 10..40     (amplificatore metallo per pianeta)
//   itemCustomMode: 'profile' | 0 | 15..40     (amplificatore di risorse per pianeta)
// Crawler al massimo di default: alzando le miniere sale anche il cap e il planner
// deve poter contare i crawler in più, altrimenti sottostima miniere e cap crawler.
// La card mostra comunque il valore del Production Core e lo scarto.
const crawlerMode = ref('max');
const overloadMode = ref('profile');
const itemMode = ref('profile');
const itemCustomMode = ref('profile');
const ITEM_STEPS = METAL_BOOSTER_PCTS;
const ITEM_CUSTOM_STEPS = RES_AMP_PCTS;
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
            capMine: capMine.value,
            capPlasma: capPlasma.value,
            capLf: capLf.value,
            capLfResearch: capLfResearch.value,
            maxSteps: maxSteps.value,
            crawlerMode: crawlerMode.value,
            overloadMode: overloadMode.value,
            itemMode: itemMode.value,
            itemCustomMode: itemCustomMode.value,
        }));
    } catch {}
};

// Input target formattato con separatore migliaia
const formTarget = computed({
    get() {
        return isNaN(target.value) || target.value === 0
            ? ''
            : formatInt(target.value);
    },
    set(newValue) {
        const rawValue = String(newValue).replace(/[^0-9]/g, '');
        const parsed = parseInt(rawValue);
        target.value = isNaN(parsed) ? 0 : parsed;
    }
});
// Input obiettivo di spesa (MSU) con separatore migliaia
const formGoalMSU = computed({
    get() { return goalMSU.value ? formatInt(goalMSU.value) : ''; },
    set(v) { const n = parseInt(String(v).replace(/[^0-9]/g, '')); goalMSU.value = isNaN(n) ? 0 : n; goalRes.value = null; }
});

// Input risorse possedute con separatore migliaia
const stockInput = (key) => computed({
    get() {
        const v = stock.value[key] || 0;
        return v ? formatInt(v) : '';
    },
    set(newValue) {
        const parsed = parseInt(String(newValue).replace(/[^0-9]/g, ''));
        stock.value = { ...stock.value, [key]: isNaN(parsed) ? 0 : parsed };
    }
});
const stockMet = stockInput('metal');
const stockCry = stockInput('crystal');
const stockDeu = stockInput('deuterium');
const includeMines = ref(true);
const includeCrawlerMines = ref(false);
const includePlasma = ref(true);
const includeLf = ref(true);
const includeLfResearch = ref(false);
// Livello massimo per categoria (0 = nessun limite)
const capMine = ref(0);
const capPlasma = ref(0);
const capLf = ref(0);
const capLfResearch = ref(0);
const capModels = { capMine, capPlasma, capLf, capLfResearch };

// Elenco delle ricerche LF candidabili dal planner: quelle con bonus metallo
// diretto, più quelle che alzano il Potenziamento Collezionista (bonus[6]), che
// non danno metallo ma amplificano bonus di classe e crawler. Queste ultime sono
// marcate `indirect` per segnalarlo in UI e rendono solo da Collezionista.
const LF_RESEARCH_ALL = (() => {
    const out = [];
    for (const sp of ['humans', 'rocktal', 'mecha', 'kaelesh']) {
        const cat = OGAME_DB[`lf_${sp}_res`];
        if (!cat) continue;
        for (const [id, item] of Object.entries(cat.items || {})) {
            if (!item.bonus) continue;
            const metal     = (item.bonus[0] || 0) > 0;
            const collector = (item.bonus[6] || 0) > 0;
            if (!metal && !collector) continue;
            out.push({ id, name: item.name || id, species: sp, tier: parseInt(id) % 100, indirect: !metal });
        }
    }
    return out.sort((a, b) => a.tier - b.tier);
})();
const ALL_LF_IDS = LF_RESEARCH_ALL.map(r => r.id);
const lfResearchIds = ref([...ALL_LF_IDS]);   // ID ricerca LF abilitati
// ID delle ricerche LF (con bonus metallo/collezionista) attive su almeno un pianeta
const activeLfIdsOf = (planetList) => {
    const ids = new Set();
    (planetList || []).forEach(p => {
        const active = p.lfActive || {};
        const levels = p.lfResearch || {};
        Object.keys(active).forEach(id => {
            if (active[id] === true && (parseInt(levels[id]) || 0) > 0 && ALL_LF_IDS.includes(id))
                ids.add(id);
        });
    });
    return [...ids];
};

// Ricerche attive su cui si basa la selezione corrente (per aggiungere le nuove)
let activeLfBasis = { profileId: null, ids: [] };

const lfChoice = ref([]);          // per pianeta: 'inherit' | 'rocktal' | 'humans' | 'mecha'


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
        if (cfg.capMine !== undefined)               capMine.value = cfg.capMine;
        if (cfg.capPlasma !== undefined)             capPlasma.value = cfg.capPlasma;
        if (cfg.capLf !== undefined)                 capLf.value = cfg.capLf;
        if (cfg.capLfResearch !== undefined)         capLfResearch.value = cfg.capLfResearch;
        // 500 era il vecchio default: chi non l'ha mai cambiato passa al nuovo (2000)
        if (cfg.maxSteps !== undefined && cfg.maxSteps !== 500) maxSteps.value = cfg.maxSteps;
        if (cfg.crawlerMode !== undefined)           crawlerMode.value = cfg.crawlerMode;
        if (cfg.overloadMode !== undefined)          overloadMode.value = cfg.overloadMode;
        if (cfg.itemMode !== undefined)              itemMode.value = cfg.itemMode;
        if (cfg.itemCustomMode !== undefined)        itemCustomMode.value = cfg.itemCustomMode;
    } catch {}
});
watch(
    [packMode, packBatch, playerClassOverride, includeMines, includeCrawlerMines, includePlasma, includeLf, includeLfResearch,
     capMine, capPlasma, capLf, capLfResearch, maxSteps,
     crawlerMode, overloadMode, itemMode, itemCustomMode],
    _saveConfig
);
// Simulare il Collezionista partendo da un'altra classe: in pratica lo si gioca col
// sovraccarico dei crawler, quindi lo si propone attivo (resta modificabile).
// Solo sul click dell'utente, non al caricamento della configurazione salvata.
const chooseClassOverride = (v) => {
    if (v === 'collector' && playerClassOverride.value !== 'collector' && overloadMode.value === 'profile') {
        overloadMode.value = 'all';
    }
    playerClassOverride.value = v;
};

// Opzioni del riquadro "Ipotesi di simulazione" (model = ref da impostare)
const simOptions = computed(() => {
    const profile = { value: 'profile', text: t('strategy_sim_profile') };
    const none = { value: 0, text: t('opt_none') };
    return [
        { key: 'crawler', label: 'strategy_sim_crawlers', model: crawlerMode,
          choices: [{ value: 'max', text: t('strategy_sim_crawlers_max') }, profile],
          hint: t(crawlerMode.value === 'max' ? 'strategy_sim_crawlers_max_hint' : 'strategy_sim_crawlers_profile_hint') },
        { key: 'overload', label: 'strategy_sim_overload', model: overloadMode,
          choices: [{ value: 'all', text: t('strategy_sim_on') }, { value: 'none', text: t('strategy_sim_off') }, profile],
          // Senza Collezionista il sovraccarico non cambia nulla: lo si dice invece di tacere
          hint: t(currentSimState.value?.settings?.playerClass === 'collector'
              ? 'strategy_sim_overload_hint' : 'strategy_sim_overload_noeffect') },
        { key: 'item', label: 'lbl_item', model: itemMode,
          choices: [profile, none, ...ITEM_STEPS.map(v => ({ value: v, text: `+${v}%` }))] },
        { key: 'itemCustom', label: 'lbl_item_additional', model: itemCustomMode,
          choices: [profile, none, ...ITEM_CUSTOM_STEPS.map(v => ({ value: v, text: `+${v}%` }))] },
    ];
});

// ───── Stato del planner per profilo ─────────────────────────────────────
// La configurazione sopra è globale (preferenze di calcolo). Target, selezioni
// e risultato dipendono invece dai dati del profilo, quindi vivono in una cache
// per profilo: cambiando pagina il piano non va più perso.
//
// Insieme al risultato si salva un'impronta del Production Core usato per
// calcolarlo: se il core cambia dopo il calcolo, il piano resta visibile ma
// viene segnalato come non più allineato — non si cancella da solo.
const STRATEGY_STATE_KEY = 'ovalue_strategy_state';
const MAX_CACHED_PROFILES = 5;

// Hash stabile (djb2) sulla serializzazione dello stato iniziale, escludendo
// gli override locali del planner: cambia solo se cambiano davvero i dati
// del profilo (impostazioni account, pianeti, tassi di cambio).
// Con `steps` l'avanzamento del piano viene "riavvolto" prima dell'impronta:
// gli upgrade previsti dal piano e già fatti non contano come cambiamento.
const coreFingerprint = (profile, steps = null) => {
    if (!profile) return null;
    let str;
    try {
        str = JSON.stringify(rewindPlanProgress(buildInitialState(profile, []), steps));
    } catch { return null; }
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return `${str.length}:${h}`;
};

const coreHashAtPlan = ref(null);   // impronta del core al momento del calcolo

const readStateStore = () => {
    try { return JSON.parse(localStorage.getItem(STRATEGY_STATE_KEY)) || {}; }
    catch { return {}; }
};

// Il piano serializzato pesa ~150 KB con qualche centinaio di step: la scrittura
// è posticipata per non serializzarlo ad ogni spunta della roadmap.
// L'id del profilo viene catturato al momento della richiesta, non alla scadenza
// del timer: altrimenti un cambio profilo in mezzo scriverebbe lo stato del
// vecchio profilo sotto l'id del nuovo.
let saveStateDebounce = null;
let pendingSaveId = null;
const saveProfileState = () => {
    const id = activeProfile.value?.id;
    if (!id) return;
    pendingSaveId = id;
    clearTimeout(saveStateDebounce);
    saveStateDebounce = setTimeout(() => flushProfileState(), 400);
};
// Scrive subito l'eventuale salvataggio in sospeso. Va chiamata prima di
// perdere lo stato corrente (smontaggio, chiusura pagina, cambio profilo),
// altrimenti una modifica fatta meno di 400ms prima andrebbe persa — cioè
// esattamente il bug che questa cache deve risolvere.
const flushProfileState = (id = pendingSaveId) => {
    clearTimeout(saveStateDebounce);
    saveStateDebounce = null;
    pendingSaveId = null;
    if (id) writeProfileState(id);
};
// Costruisce la voce di cache dallo stato corrente. `withResult: false` produce
// la versione leggera (solo target/selezioni) usata quando il piano non entra
// nella quota di localStorage.
const buildStateEntry = (withResult) => ({
    savedAt: Date.now(),
    target: target.value,
    lfResearchIds: [...lfResearchIds.value],
    // Ricerche attive nel profilo quando la selezione è stata salvata: al
    // ripristino, quelle attivate dopo (es. con un import) si aggiungono.
    lfActiveBasis: [...activeLfBasis.ids],
    lfChoice: [...lfChoice.value],
    doneSteps: withResult ? [...doneSteps.value] : [],
    typeFilter: typeFilter.value,
    goalMode: goalMode.value,
    goalMSU: goalMSU.value,
    goalRes: goalRes.value,
    coreHash: withResult ? coreHashAtPlan.value : null,
    result: withResult ? result.value : null
});

const persistStore = (store) => {
    // Pruning: si tengono solo i profili usati più di recente.
    Object.keys(store)
        .sort((a, b) => (store[b]?.savedAt || 0) - (store[a]?.savedAt || 0))
        .slice(MAX_CACHED_PROFILES)
        .forEach(k => delete store[k]);
    localStorage.setItem(STRATEGY_STATE_KEY, JSON.stringify(store));
};

const writeProfileState = (id) => {
    if (!id) return;
    try {
        const store = readStateStore();
        store[id] = buildStateEntry(true);
        persistStore(store);
    } catch {
        // Quota superata (piani lunghi). Si riscrive la voce CORRENTE senza il
        // piano: tenere quella vecchia letta da storage conserverebbe target e
        // selezioni obsoleti, che è il contrario di quel che serve.
        try {
            const store = readStateStore();
            store[id] = buildStateEntry(false);
            persistStore(store);
        } catch {
            // Ancora piena: si sacrificano le cache degli altri profili.
            try {
                localStorage.setItem(STRATEGY_STATE_KEY, JSON.stringify({ [id]: buildStateEntry(false) }));
            } catch {}
        }
    }
};

const restoreProfileState = (profile) => {
    const saved = profile?.id ? readStateStore()[profile.id] : null;
    const planets = profile?.production?.planets || [];

    if (!saved) {
        goalMode.value = 'production';
        goalMSU.value = 0;
        goalRes.value = null;
        lfChoice.value = planets.map(() => 'inherit');
        target.value = Math.floor((profile?.production?.daily || 0) * 1.5);
        // Prima volta per questo profilo: pre-seleziona le ricerche già attive
        const active = activeLfIdsOf(planets);
        lfResearchIds.value = active.length ? active : [...ALL_LF_IDS];
        activeLfBasis = { profileId: profile?.id ?? null, ids: active };
        doneSteps.value = new Set();
        typeFilter.value = 'all';
        result.value = null;
        coreHashAtPlan.value = null;
        return;
    }

    // lfChoice è posizionale: se il numero di pianeti è cambiato non è più
    // interpretabile e si riparte da 'inherit'.
    lfChoice.value = Array.isArray(saved.lfChoice) && saved.lfChoice.length === planets.length
        ? [...saved.lfChoice]
        : planets.map(() => 'inherit');
    target.value = saved.target || Math.floor((profile?.production?.daily || 0) * 1.5);
    const activeNow = activeLfIdsOf(planets);
    if (Array.isArray(saved.lfResearchIds)) {
        const basis = Array.isArray(saved.lfActiveBasis) ? saved.lfActiveBasis : activeNow;
        const added = activeNow.filter(id => !basis.includes(id));
        lfResearchIds.value = [...new Set([...saved.lfResearchIds, ...added])];
    } else {
        lfResearchIds.value = activeNow.length ? activeNow : [...ALL_LF_IDS];
    }
    activeLfBasis = { profileId: profile.id, ids: activeNow };
    doneSteps.value = new Set(Array.isArray(saved.doneSteps) ? saved.doneSteps : []);
    typeFilter.value = saved.typeFilter || 'all';
    goalMode.value = saved.goalMode === 'spend' ? 'spend' : 'production';
    goalMSU.value = saved.goalMSU || 0;
    goalRes.value = Array.isArray(saved.goalRes) ? saved.goalRes : null;
    result.value = saved.result || null;
    coreHashAtPlan.value = saved.coreHash || null;
};

// Il piano è disallineato se il core è cambiato dopo il calcolo, oppure se sono
// cambiate le ipotesi con cui è stato calcolato (classe, crawler, item, ricerche…).
// I piani salvati prima che esistesse simKey non hanno ipotesi da confrontare.
const simAssumptionsKey = computed(() => JSON.stringify({
    cls: playerClassOverride.value,
    craw: crawlerMode.value,
    ovl: overloadMode.value,
    item: itemMode.value,
    amp: itemCustomMode.value,
    lf: includeLfResearch.value ? [...lfResearchIds.value].map(String).sort() : null,
    lfc: lfChoice.value
}));
const staleReason = computed(() => {
    if (!result.value) return null;
    if (coreHashAtPlan.value && coreFingerprint(activeProfile.value, result.value.steps) !== coreHashAtPlan.value) return 'core';
    if (result.value.simKey && result.value.simKey !== simAssumptionsKey.value) return 'sim';
    return null;
});
const planIsStale = computed(() => staleReason.value !== null);

// Sync con profilo attivo: ripristina lo stato salvato per quel profilo.
// `activeProfile` ri-emette anche a ogni salvataggio del profilo (sync, modifiche
// altrove): ripristinare in quei casi sovrascriverebbe il piano appena calcolato,
// quindi si agisce solo quando cambia davvero l'id. Prima di cambiare profilo si
// forza la scrittura di quello vecchio, altrimenti il timer in sospeso perderebbe
// le sue ultime modifiche.
let lastProfileId = null;
watch(activeProfile, (newP) => {
    if (!newP || newP.id === lastProfileId) return;
    if (lastProfileId) flushProfileState(lastProfileId);
    lastProfileId = newP.id;
    restoreProfileState(newP);
}, { immediate: true });

// Smontaggio / chiusura pagina: scrittura immediata di quanto è in sospeso.
onBeforeUnmount(() => {
    window.removeEventListener('pagehide', onPageHide);
    flushProfileState();
});
const onPageHide = () => flushProfileState();
onMounted(() => window.addEventListener('pagehide', onPageHide));

// Persistenza dello stato per profilo. `result` e `doneSteps` sono sempre
// riassegnati per intero, quindi non serve il deep watch (che su un piano da
// centinaia di step costerebbe caro); solo lfChoice viene mutato in posizione.
watch([target, lfResearchIds, doneSteps, typeFilter, result, goalMode, goalMSU], saveProfileState);
watch(lfChoice, saveProfileState, { deep: true });

// Applica le ipotesi di simulazione allo stato iniziale (copia: il profilo non
// viene mai toccato). Con tutte le opzioni su "come nel profilo" lo stato resta
// identico a quello del Production Core.
const applyOverrides = (state) => {
    if (!state) return state;
    if (playerClassOverride.value && playerClassOverride.value !== 'inherit') {
        state.settings.playerClass = playerClassOverride.value;
    }
    // Ricerche LF selezionate: se hanno livelli su un pianeta contano come attive.
    // Così "attivale tutte" alza la produzione di partenza invece di valere solo
    // per gli upgrade futuri. Solo con la categoria Ricerche LF accesa (la lista
    // è visibile solo lì) e senza mai spegnere quelle già attive nel profilo.
    const activateIds = includeLfResearch.value ? new Set(lfResearchIds.value.map(String)) : null;
    state.planets.forEach(p => {
        // Crawler al massimo: tanti da arrivare sempre al cap, che cresce con le miniere
        if (crawlerMode.value === 'max') p.crawlers = Number.MAX_SAFE_INTEGER;
        if (overloadMode.value === 'all') p.overload = true;
        else if (overloadMode.value === 'none') p.overload = false;
        if (itemMode.value !== 'profile') p.item = Number(itemMode.value) || 0;
        if (itemCustomMode.value !== 'profile') p.itemCustom = Number(itemCustomMode.value) || 0;
        if (activateIds) {
            Object.entries(p.lfResearch || {}).forEach(([id, lvl]) => {
                if ((parseInt(lvl) || 0) > 0 && activateIds.has(String(id))) {
                    if (!p.lfActive) p.lfActive = {};
                    p.lfActive[id] = true;
                }
            });
        }
    });
    return state;
};

// Stato simulato corrente (read-only: solo per mostrare la produzione di partenza).
const currentSimState = computed(() => {
    if (!activeProfile.value) return null;
    return applyOverrides(buildInitialState(activeProfile.value, lfChoice.value));
});

// Valore in MSU delle risorse possedute, ai tassi di cambio di Pack Exchange
// (stessa conversione di PackCalc: le risorse in eccesso si scambiano al tasso MSU).
const stockMSU = computed(() => {
    const pack = currentSimState.value?.pack;
    if (!pack) return 0;
    return toMSU([stock.value.metal || 0, stock.value.crystal || 0, stock.value.deuterium || 0], pack);
});

// Pacchetti totali tenendo conto delle risorse possedute. Ripete la stessa
// contabilità del planner (credito MSU che avanza da uno step al successivo),
// partendo con lo stock come credito iniziale: con stock 0 coincide esattamente
// con result.cumulativePacks. Ricalcolato al volo, senza rieseguire il planner.
const packAccounting = computed(() => {
    if (!result.value) return { packs: 0, credit: 0 };
    let credit = stockMSU.value;
    let packs = 0;
    const done = stepDone.value;
    for (const [i, st] of result.value.steps.entries()) {
        if (done[i]) continue;   // già fatto: non si compra più
        const pv = Math.max(1, st.packValue || 1);
        const net = Math.max(0, st.costMSU - credit);
        const need = Math.ceil(net / pv);
        credit = need > 0 ? need * pv - net : credit - st.costMSU;
        packs += need;
    }
    // credit: MSU avanzati (stock non usato + eccedenza dell'ultimo pacco aperto)
    return { packs, credit };
});
const totalPacks = computed(() => packAccounting.value.packs);

const euroOf = (packs) => computeEuroCost(packs, {
    ...currentSimState.value.shop,
    shopDiscount: shopDiscount.value,
    moBonus: moBonus.value,
});

// Obiettivo di spesa con la stessa contabilità del riepilogo (pacchi interi,
// stock e step già fatti): gli upgrade si pagano per primi, quel che avanza va
// sull'obiettivo, che si compra alla produzione finale del piano. Il confronto
// "diretto" compra l'obiettivo subito, alla produzione iniziale, con lo stesso stock.
const goalSummary = computed(() => {
    const g = result.value?.goal;
    if (!g || !currentSimState.value) return null;
    const { packs: upgradePacks, credit } = packAccounting.value;
    const direct     = Math.ceil(Math.max(0, g.msu - stockMSU.value) / Math.max(1, result.value.initialProd));
    const goalAfter  = Math.ceil(Math.max(0, g.msu - credit) / Math.max(1, result.value.finalProd));
    const total      = upgradePacks + goalAfter;
    const r = g.res;   // ripartizione obiettivo, se nota
    const up = planCost.value;
    return {
        msu: g.msu, res: r, direct, upgradePacks, goalAfter, total,
        upgradeEuro: euroOf(upgradePacks),
        goalEuro: euroOf(goalAfter),
        totalMSU: (up?.msu || 0) + g.msu,
        totalRes: r && up ? [up.metal + r[0], up.crystal + r[1], up.deuterium + r[2]] : null,
        saving: direct - total,
        savingPct: direct > 0 ? (1 - total / direct) * 100 : 0,
        directEuro: euroOf(direct),
        totalEuro: euroOf(total)
    };
});

const planEuro = computed(() => {
    if (!result.value || !currentSimState.value) return { totalMO: 0, totalEuro: 0, packList: [] };
    return euroOf(totalPacks.value);
});

// Coda di Pack Exchange come obiettivo di spesa (es. Astro 31 composta col builder)
const packQueue = computed(() => activeProfile.value?.packExchange?.queue || []);
const useQueueAsGoal = () => {
    const pack = currentSimState.value?.pack;
    if (!pack) return;
    const res = packQueue.value.reduce((a, it) => [a[0] + (it.m || 0), a[1] + (it.c || 0), a[2] + (it.d || 0)], [0, 0, 0]);
    goalMSU.value = Math.round(toMSU(res, pack));
    goalRes.value = res;
};
// Il calcolo si può lanciare se c'è un obiettivo valido per la modalità scelta
const canCompute = computed(() => goalMode.value === 'spend'
    ? goalMSU.value > 0
    : target.value > profileDailyProd.value);

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

// Doppio conteggio: il campo manuale "Potenziamento Collezionista" di Production
// Core e le ricerche con bonus[6] si sommano nello stesso collFactor. Se l'utente
// ha compilato il campo a mano E lascia candidabile la ricerca, il bonus vale due
// volte. Scelta: li sommiamo comunque (stesso comportamento di Production Core) e
// lo segnaliamo, invece di ignorare in silenzio un dato già inserito dall'utente.
const collectorDoubleCount = computed(() =>
    includeLfResearch.value
    && (currentSimState.value?.settings?.playerClass === 'collector')
    && (parseFloat(currentSimState.value?.settings?.rocktalEnhancement) || 0) > 0
    && LF_RESEARCH_ALL.some(r => r.indirect && lfResearchIds.value.includes(r.id))
);

// La classe "other" del profilo (Generale/Esploratore) non ha una chiave `opt_other`:
// in MetalCalc la stessa opzione usa `opt_general`. Senza la mappa qui veniva
// stampata la chiave grezza.
const playerClassLabelKey = computed(() => {
    const cls = currentSimState.value?.settings?.playerClass || 'none';
    return cls === 'other' ? 'opt_general' : `opt_${cls}`;
});

// ID delle ricerche LF (con bonus metallo) già ATTIVE nel profilo corrente:
// attive su almeno un pianeta (lfActive === true) e con livello > 0.
const profileActiveLfIds = computed(() => activeLfIdsOf(planets.value));
// La selezione è dell'utente e viene salvata per profilo (restoreProfileState);
// le ricerche attive servono solo a pre-selezionare la prima volta. Dopo un
// import, quelle diventate attive nel frattempo si AGGIUNGONO alla selezione:
// non si toglie mai una ricerca scelta a mano.
watch(profileActiveLfIds, (ids) => {
    const pid = activeProfile.value?.id ?? null;
    if (activeLfBasis.profileId !== pid) {          // cambio profilo: solo nuova base
        activeLfBasis = { profileId: pid, ids };
        return;
    }
    const added = ids.filter(id => !activeLfBasis.ids.includes(id));
    activeLfBasis = { profileId: pid, ids };
    if (added.length) lfResearchIds.value = [...new Set([...lfResearchIds.value, ...added])];
}, { immediate: true });

// ───── LF per-pianeta: helpers per il toggle ────────────────────────────
const lfOpts = [
    { v: 'inherit', l: '=', ac: 'bg-slate-700/70 text-slate-200' },
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
const planBlocks = computed(() => {
    if (!result.value) return [];
    const steps = result.value.steps;
    const blocks = [];
    let i = 0;

    while (i < steps.length) {
        const s = steps[i];
        const packVal = Math.max(1, s.packValue || 1);
        const cheap = s.costMSU < packVal;

        if (cheap) {
            // Raccogli step consecutivi economici dello stesso tipo E dello stesso
            // salto di livello. Unire livelli diversi (es. 15→16 con 16→17) produce
            // un range aggregato 15→17 che non corrisponde a nessun upgrade reale:
            // si raggruppa solo ciò che è identico.
            const sameGroup = (a, b) => {
                if (a.type !== b.type) return false;
                if (!!a.fromPrevPlan !== !!b.fromPrevPlan) return false;
                if (a.from !== b.from || a.to !== b.to) return false;
                if (a.type === 'lf_research') return a.researchId === b.researchId;
                return true;
            };
            let j = i + 1;
            while (j < steps.length &&
                   sameGroup(s, steps[j]) &&
                   steps[j].costMSU < Math.max(1, steps[j].packValue || 1)) j++;

            const grp = steps.slice(i, j);
            const last = grp[grp.length - 1];
            const totalCost = grp.reduce((a, b) => a + b.costMSU, 0);

            // Pianeti del blocco: tutti fanno lo stesso salto (garantito da sameGroup),
            // quindi basta il nome — il livello sta nella colonna Livello.
            const planetDetails = [];
            const seenPlanets = new Set();
            grp.forEach(x => {
                if (x.planetIdx == null || seenPlanets.has(x.planetIdx)) return;
                seenPlanets.add(x.planetIdx);
                planetDetails.push({
                    idx: x.planetIdx,
                    name: x.planetName || `#${x.planetIdx + 1}`
                });
            });
            const planetLabel = s.planetIdx == null
                ? null
                : planetDetails.length === 1
                    ? planetDetails[0].name
                    : `${planetDetails.length} ${t('strategy_planets_plural')}`;

            blocks.push({
                type:        s.type,
                species:     s.species     ?? null,
                researchId:  s.researchId  ?? null,
                researchName: s.researchName ?? null,
                indirectBonus: s.indirectBonus === true,
                from:       s.from,
                to:         s.to,
                planetName: planetLabel,
                planetDetails,
                cost:       grp.reduce((a, b) => [a[0]+b.cost[0], a[1]+b.cost[1], a[2]+b.cost[2]], [0,0,0]),
                costMSU:    totalCost,
                packs:      Math.ceil(totalCost / packVal),
                packVal,
                deltaProd:  grp.reduce((a, b) => a + b.deltaProd, 0),
                cumulativeProd: last.cumulativeProd,
                count:  grp.length,
                isBlock: grp.length > 1,
                stepIdxs: grp.map((_, k) => i + k)
            });
            i = j;

        } else {
            // Step costoso: mostralo singolarmente, ricalcola pack senza credit
            blocks.push({
                ...s,
                planetDetails: s.planetIdx == null
                    ? []
                    : [{ idx: s.planetIdx, name: s.planetName || `#${s.planetIdx + 1}` }],
                packs:   Math.ceil(s.costMSU / packVal),
                packVal,
                isBlock: false,
                count:   1,
                stepIdxs: [i]
            });
            i++;
        }
    }

    return blocks.map((b, idx) => ({ ...b, n: idx + 1 }));
});

// ───── Avanzamento del piano ────────────────────────────────────────────
// Il piano resta quello calcolato; i dati del Production Core dicono quali step
// sono già fatti (livello attuale >= livello "to"). La spunta manuale resta per
// gli upgrade fatti ma non ancora importati.
const autoDoneSteps = computed(() => {
    if (!result.value) return [];
    const production = activeProfile.value?.production;
    return result.value.steps.map(st => isStepDoneInProfile(st, production));
});

// Step da non contare più nei costi: completati nel profilo o in un blocco spuntato a mano.
const stepDone = computed(() => {
    const done = autoDoneSteps.value.map((d, i) => d || result.value.steps[i].doneManual === true);
    planBlocks.value.forEach(b => {
        if (doneSteps.value.has(b.n)) b.stepIdxs.forEach(i => { done[i] = true; });
    });
    return done;
});

// Blocchi con stato di avanzamento e pacchetti RIMANENTI: le risorse possedute
// coprono i primi blocchi ancora da fare (come in Pack Exchange), quelli fatti
// valgono 0 pacchetti.
const groupedSteps = computed(() => {
    const auto = autoDoneSteps.value;
    const done = stepDone.value;
    let stockLeft = stockMSU.value;
    let cumPacks = 0;
    return planBlocks.value.map(b => {
        const autoCount   = b.stepIdxs.filter(i => auto[i] || result.value.steps[i].doneManual === true).length;
        // Pianeti del blocco già completati nel profilo (per evidenziarli nei chip)
        const donePlanets = new Set(
            b.stepIdxs.filter(i => auto[i]).map(i => result.value.steps[i].planetIdx)
        );
        const planetDetails = b.planetDetails.map(pd => ({ ...pd, done: donePlanets.has(pd.idx) }));
        const autoDone    = autoCount === b.count;
        const isDone      = autoDone || doneSteps.value.has(b.n);
        const remainingMSU = b.stepIdxs.reduce((a, i) => a + (done[i] ? 0 : result.value.steps[i].costMSU), 0);
        const covered = Math.min(stockLeft, remainingMSU);
        stockLeft -= covered;
        const packs = Math.ceil((remainingMSU - covered) / b.packVal);
        cumPacks += packs;
        return { ...b, planetDetails, autoCount, autoDone, isDone, remainingMSU, packs, cumulativePacks: cumPacks };
    });
});

// ───── Esecuzione planner ───────────────────────────────────────────────
// Il calcolo gira in un Web Worker: la UI resta fluida e mostra il progresso
// reale. Se il worker non è disponibile (browser/ambiente particolare) si
// ricade sul calcolo sincrono nel main thread.
let plannerWorker = null;

const buildPlannerOptions = () => ({
    target: parseInt(target.value) || 0,
    goalMSU: goalMode.value === 'spend' ? (goalMSU.value || 0) : 0,
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
        metalMine:  capMine.value       > 0 ? capMine.value       : Infinity,
        plasma:     capPlasma.value     > 0 ? capPlasma.value     : Infinity,
        lfBuilding: capLf.value         > 0 ? capLf.value         : Infinity,
        lfResearch: capLfResearch.value > 0 ? capLfResearch.value : Infinity,
    }
});

// `kept`: step già fatti del piano precedente ("Ricalcola il resto"). Restano in
// testa alla roadmap come fatti e il piano nuovo prosegue da lì.
const finalizePlan = (planRes, initialState, kept = null) => {
    let res = planRes;
    if (kept) {
        const steps = [...kept, ...planRes.steps].map((st, i) => ({ ...st, n: i + 1 }));
        res = {
            ...planRes,
            steps,
            initialProd: result.value?.initialProd ?? planRes.initialProd,
            cumulativeMSU: steps.reduce((a, st) => a + (st.costMSU || 0), 0),
            cumulativePacks: steps.reduce((a, st) => a + (st.packs || 0), 0)
        };
    }
    if (res.goal) res = { ...res, goal: { ...res.goal, res: goalRes.value ? [...goalRes.value] : null } };
    result.value = {
        ...res,
        lfChoiceSnapshot: [...lfChoice.value],
        targetSnapshot: parseInt(target.value) || 0,
        simKey: simAssumptionsKey.value
    };
    // Impronta del core usata per questo calcolo: se cambia, il piano va segnalato.
    // Con step tenuti si riavvolge anche il loro avanzamento, come fa planIsStale.
    coreHashAtPlan.value = coreFingerprint(activeProfile.value, kept ? res.steps : null);
    doneSteps.value = new Set();
    typeFilter.value = 'all';
    isComputing.value = false;
    progress.value = null;
    // I risultati compaiono sotto la configurazione: li si porta in vista
    nextTick(() => {
        const el = document.getElementById('strategy-results');
        if (!el) return;
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
};

const runPlannerSync = (initialState, options, kept = null) => {
    try {
        finalizePlan(runPlanner(initialState, options), initialState, kept);
    } catch {
        isComputing.value = false;
        progress.value = null;
    }
};

// mode 'new'  → piano da zero (sostituisce quello in corso, con conferma).
// mode 'rest' → "Ricalcola il resto": tiene gli step già fatti e ripianifica il
//               resto dai dati attuali (pianeti nuovi, classe, item, …).
const computePlan = (mode = 'new') => {
    if (!activeProfile.value || isComputing.value) return;
    const isRest = mode === 'rest' && !!result.value;
    // Un nuovo piano sostituisce quello in corso: avanzamento e spunte vanno persi.
    if (!isRest && result.value && !window.confirm(t('strategy_new_plan_confirm'))) return;

    const initialState = applyOverrides(buildInitialState(activeProfile.value, lfChoice.value));
    const options = buildPlannerOptions();

    let kept = null;
    if (isRest) {
        const auto = autoDoneSteps.value;
        const done = stepDone.value;
        kept = result.value.steps.flatMap((st, i) => {
            if (!done[i]) return [];
            // Spuntato a mano ma non ancora importato: per il planner è già fatto,
            // altrimenti lo riproporrebbe.
            const manual = !auto[i];
            if (manual) applyStepToState(initialState, st);
            return [{ ...st, fromPrevPlan: true, doneManual: manual || st.doneManual === true }];
        });
    }

    isComputing.value = true;
    // Il piano precedente resta visibile finché il nuovo calcolo non è pronto.
    if (!isRest) result.value = null;
    progress.value = null;

    try {
        plannerWorker?.terminate();
        plannerWorker = new Worker(new URL('../workers/planner.worker.js', import.meta.url), { type: 'module' });
        plannerWorker.onmessage = ({ data }) => {
            if (data.type === 'progress')   progress.value = data.progress;
            else if (data.type === 'done')  finalizePlan(data.result, initialState, kept);
            else                            runPlannerSync(initialState, options, kept);
        };
        plannerWorker.onerror = (e) => {
            e.preventDefault();
            runPlannerSync(initialState, options, kept);
        };
        plannerWorker.postMessage({ initialState, options });
    } catch {
        runPlannerSync(initialState, options, kept);
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
    // Un blocco completato nel profilo non si può "despuntare": lo dicono i dati.
    if (groupedSteps.value.find(b => b.n === n)?.autoDone) return;
    const next = new Set(doneSteps.value);
    next.has(n) ? next.delete(n) : next.add(n);
    doneSteps.value = next;
};
const doneCount = computed(() => groupedSteps.value.filter(b => b.isDone).length);
// Primo blocco non ancora spuntato (in ordine di piano, ignora il filtro)
const nextStepN = computed(() => {
    const blk = groupedSteps.value.find(b => !b.isDone);
    return blk ? blk.n : null;
});
// Costo totale del piano: MSU e risorse grezze (somma dei costi dei singoli step)
// Esclude gli step già fatti: mostra quanto manca, con il totale del piano a fianco.
const planCost = computed(() => {
    if (!result.value) return null;
    const done = stepDone.value;
    const res = [0, 0, 0];
    let msu = 0, doneCount = 0;
    result.value.steps.forEach((st, i) => {
        if (done[i]) { doneCount++; return; }
        res[0] += st.cost?.[0] || 0; res[1] += st.cost?.[1] || 0; res[2] += st.cost?.[2] || 0;
        msu += st.costMSU || 0;
    });
    return {
        msu, metal: res[0], crystal: res[1], deuterium: res[2],
        totalMSU: result.value.cumulativeMSU || 0,
        hasProgress: doneCount > 0
    };
});
// Avanzamento della produzione: quota del salto iniziale → finale già raggiunta
const planProgressPct = computed(() => {
    if (!result.value) return 0;
    const start = result.value.initialProd, end = result.value.finalProd;
    if (end <= start) return 0;
    return Math.max(0, Math.min(100, Math.round((currentProd.value - start) / (end - start) * 100)));
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
    humans:  { on: 'bg-blue-500/20 text-blue-200 border-blue-400/40',     off: 'bg-transparent text-slate-400 border-ogame-line hover:text-slate-200 hover:border-slate-600' },
    rocktal: { on: 'bg-orange-500/20 text-orange-200 border-orange-400/40', off: 'bg-transparent text-slate-400 border-ogame-line hover:text-slate-200 hover:border-slate-600' },
    mecha:   { on: 'bg-teal-500/20 text-teal-200 border-teal-400/40',     off: 'bg-transparent text-slate-400 border-ogame-line hover:text-slate-200 hover:border-slate-600' },
    kaelesh: { on: 'bg-purple-500/20 text-purple-200 border-purple-400/40', off: 'bg-transparent text-slate-400 border-ogame-line hover:text-slate-200 hover:border-slate-600' },
};
const isLfResSelected = (id) => lfResearchIds.value.includes(id);
const toggleLfRes = (id) => {
    lfResearchIds.value = isLfResSelected(id)
        ? lfResearchIds.value.filter(x => x !== id)
        : [...lfResearchIds.value, id];
};
const setLfResAll = (on) => { lfResearchIds.value = on ? [...ALL_LF_IDS] : []; };

// Ref raggruppati per i v-for compatti della configurazione
const categoryModels = { includeMines, includeCrawlerMines, includePlasma, includeLf, includeLfResearch };
const stockModels = { stockMet, stockCry, stockDeu };

// ───── Riassunti dei gruppi di configurazione (visibili anche da chiusi) ─────
const buildSummary = computed(() => {
    const parts = [
        includeMines.value && t('lbl_mine_metal'),
        includeCrawlerMines.value && t('strategy_crawler_mines'),
        includePlasma.value && t('plasma_technology'),
        includeLf.value && t('strategy_lf_buildings'),
        includeLfResearch.value && t('strategy_lf_research'),
    ].filter(Boolean);
    return parts.join(' · ');
});
const simSummary = computed(() => [
    packMode.value === 'dynamic' ? `${t('strategy_pack_dynamic')} (${packBatch.value})` : t('strategy_pack_fixed'),
    playerClassOverride.value === 'inherit' ? t(playerClassLabelKey.value) : t('opt_collector'),
    ...simOptions.value.map(o => `${t(o.label)}: ${o.choices.find(c => c.value === o.model.value)?.text ?? '–'}`),
].join(' · '));
const lfOverrideSummary = computed(() => {
    const n = lfChoice.value.filter(v => v && v !== 'inherit').length;
    return n === 0 ? t('strategy_lf_inherit') : `${n} / ${planets.value.length}`;
});
const resourcesSummary = computed(() => [
    `${t('lbl_stock')}: ${stockMSU.value > 0 ? formatNum(stockMSU.value) + ' MSU' : '0'}`,
    `${t('lbl_shop_discount')} ${shopDiscount.value ? '–' + shopDiscount.value + '%' : t('opt_none')}`,
    `${t('lbl_event_bonus')} ${moBonus.value ? '+' + moBonus.value + '%' : '–'}`,
].join(' · '));
</script>

<template>
  <div class="w-full min-w-0 max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-8" style="--tc:#34d399">
    <!-- Titolo compatto -->
    <PageHead tool="strategy" :title="t('strategy_title')" :sub="t('card_strategy_desc')">
        <template #title>
            <button type="button" @click="showIntro = !showIntro" :aria-expanded="showIntro" aria-controls="strategy-intro-content"
                    :aria-label="t('strategy_intro')"
                    class="w-5 h-5 rounded-full border border-slate-600 text-slate-400 hover:text-slate-200 text-[11px] font-bold inline-flex items-center justify-center">?</button>
        </template>
    </PageHead>

    <!-- Spiegazione: si apre dal "?" -->
    <div v-if="showIntro" id="strategy-intro-content" class="ov-panel px-5 py-4 mb-5 text-sm text-slate-300 leading-relaxed max-w-[75ch]">
        {{ t('strategy_intro') }}
    </div>

    <!-- Stato corrente -->
    <div v-if="!activeProfile || planets.length === 0" class="ov-panel p-8 text-center">
        <p class="text-sm text-slate-400">{{ t('strategy_no_planets') }}</p>
        <router-link to="/metal" class="mt-3 ov-btn ov-btn-tint" style="--tc:#38bdf8">
            {{ t('strategy_go_to_metal') }}
        </router-link>
    </div>

    <template v-else>
        <!-- ────── INPUT ────── -->
        <div class="grid grid-cols-1 gap-3 mb-6">

        <!-- Obiettivo: una riga -->
        <div class="ov-panel p-5 grid grid-cols-1 md:grid-cols-[1fr_1.5fr_.65fr_.75fr] gap-5 items-start">
            <!-- Produzione di partenza -->
            <div class="ov-stat">
                <span class="ov-stat-k">{{ currentProd !== profileDailyProd && profileDailyProd > 0 ? t('strategy_sim_start_prod') : t('strategy_current_prod') }}</span>
                <span class="text-3xl font-bold text-slate-100 tabular-nums leading-tight">{{ formatNum(currentProd) }}</span>
                <span class="text-[11px] text-slate-400">{{ t('strategy_per_day') }}</span>
                <!-- Con ipotesi attive la partenza differisce dal Production Core: si mostrano entrambi -->
                <span v-if="currentProd !== profileDailyProd && profileDailyProd > 0" class="text-[11px] text-slate-400 mt-1 tabular-nums">
                    Production Core: {{ formatNum(profileDailyProd) }}
                    <span :class="currentProd > profileDailyProd ? 'text-emerald-400' : 'text-rose-400'">
                        ({{ currentProd > profileDailyProd ? '+' : '' }}{{ formatPct((currentProd / profileDailyProd - 1) * 100, 1) }}%)
                    </span>
                </span>
            </div>

            <!-- Obiettivo: produzione da raggiungere oppure spesa da fare -->
            <div class="grid gap-2 min-w-0">
                <div class="flex items-center justify-between gap-3">
                    <label :for="goalMode === 'production' ? 'strat-target' : 'strat-goal-msu'" class="ov-label">
                        {{ goalMode === 'production' ? t('strategy_target') : t('strategy_goal_msu') }}
                    </label>
                    <div class="ov-seg">
                        <button type="button" @click="goalMode = 'production'" :aria-pressed="goalMode === 'production'">{{ t('strategy_goal_mode_production') }}</button>
                        <button type="button" @click="goalMode = 'spend'" :title="t('strategy_goal_mode_spend_hint')" :aria-pressed="goalMode === 'spend'">{{ t('strategy_goal_mode_spend') }}</button>
                    </div>
                </div>
                <template v-if="goalMode === 'production'">
                    <input id="strat-target" type="text" v-model="formTarget" @focus="$event.target.select()"
                           class="input-glass w-full h-10 px-3 text-right tabular-nums text-lg">
                    <div v-if="profileDailyProd > 0" class="ov-seg ov-seg-full">
                        <button v-for="m in [1.5, 2, 3, 5]" :key="m" type="button"
                                @click="target = Math.floor(profileDailyProd * m)"
                                :aria-pressed="target === Math.floor(profileDailyProd * m)">×{{ m }}</button>
                    </div>
                    <p v-if="target <= profileDailyProd && target > 0" class="text-[11px] text-amber-400">{{ t('strategy_target_too_low') }}</p>
                </template>
                <template v-else>
                    <input id="strat-goal-msu" type="text" inputmode="numeric" v-model="formGoalMSU" @focus="$event.target.select()" placeholder="0"
                           class="input-glass w-full h-10 px-3 text-right tabular-nums text-lg">
                    <div class="flex items-center justify-between gap-2">
                        <button type="button" @click="useQueueAsGoal" :disabled="packQueue.length === 0" class="ov-btn ov-btn-tint ov-btn-sm" style="--tc:#fbbf24">
                            {{ t('strategy_goal_use_queue').replace('{n}', packQueue.length) }}
                        </button>
                        <span v-if="goalMSU > 0 && currentProd > 0" class="text-[11px] text-slate-400 tabular-nums">
                            ≈ {{ formatNum(Math.ceil(goalMSU / currentProd)) }} {{ t('strategy_goal_packs_today') }}
                        </span>
                    </div>
                </template>
            </div>

            <!-- Step massimi -->
            <div class="grid gap-2 min-w-0">
                <label for="strat-maxsteps" class="ov-label">{{ t('strategy_max_steps') }}</label>
                <input id="strat-maxsteps" type="number" inputmode="numeric" v-model.number="maxSteps" @focus="$event.target.select()" min="1" max="2000"
                       class="input-glass w-24 h-10 px-3 text-center tabular-nums">
                <span class="text-[11px] text-slate-400">{{ t('strategy_max_steps_desc') }}</span>
            </div>

            <!-- Bonus LifeForms (letto dal profilo) -->
            <div class="grid gap-2 min-w-0">
                <span class="ov-label">{{ t('lbl_lf_bonus') }}</span>
                <div class="input-glass h-10 px-3 flex items-center justify-between !border-dashed cursor-default">
                    <span class="tabular-nums text-emerald-300 font-semibold">
                        +{{ hasLfResearchData ? formatPct(lfResearchPct.metal, 2) : formatPct(currentSimState?.settings?.lfBonus || 0, 1) }}%
                    </span>
                    <span v-if="hasLfResearchData" class="ov-tag ov-tag-ok">{{ t('lbl_auto') }}</span>
                </div>
            </div>
        </div>

        <!-- Gruppo: cosa può costruire (categorie + cap di livello) -->
        <details class="ov-acc" open>
            <summary><b>{{ t('strategy_categories') }}</b><span class="ov-acc-sum">{{ buildSummary }}</span></summary>
            <div class="grid gap-4">
                <div class="flex flex-wrap gap-x-6 gap-y-2.5">
                    <label v-for="c in [['includeMines', 'lbl_mine_metal'], ['includeCrawlerMines', 'strategy_crawler_mines'], ['includePlasma', 'plasma_technology'], ['includeLf', 'strategy_lf_buildings'], ['includeLfResearch', 'strategy_lf_research']]"
                           :key="c[0]" class="flex items-center gap-2 cursor-pointer text-[13px] text-slate-200">
                        <input type="checkbox" v-model="categoryModels[c[0]].value" class="w-4 h-4 accent-cyan-400 rounded flex-shrink-0">
                        {{ t(c[1]) }}
                    </label>
                </div>
                <p v-if="includeLfResearch" class="text-[11px] text-slate-400 -mt-2">{{ t('strategy_lf_research_select_hint') }}</p>
                <div class="grid gap-1.5">
                    <span class="ov-label">{{ t('strategy_caps') }} <span class="text-slate-500 font-normal">({{ t('strategy_caps_hint') }})</span></span>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <label v-for="c in [['capMine', 'lbl_mine_metal'], ['capPlasma', 'plasma_technology'], ['capLf', 'strategy_lf_buildings'], ['capLfResearch', 'strategy_lf_research']]"
                               :key="c[0]" class="grid gap-1 min-w-0">
                            <span class="text-[11px] text-slate-400 truncate">{{ t(c[1]) }}</span>
                            <input type="number" v-model.number="capModels[c[0]].value" min="0" @focus="$event.target.select()"
                                   class="input-glass w-full h-9 px-2 text-center tabular-nums text-sm">
                        </label>
                    </div>
                </div>
            </div>
        </details>

        <!-- Gruppo: ipotesi di simulazione -->
        <details class="ov-acc" open>
            <summary><b>{{ t('strategy_sim_title') }}</b><span class="ov-acc-sum">{{ simSummary }}</span></summary>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <!-- Valore pacchetto -->
                <div class="grid gap-1.5 content-start">
                    <span class="ov-label">{{ t('strategy_pack_mode') }}</span>
                    <div class="flex flex-wrap items-center gap-2">
                        <div class="ov-seg">
                            <button type="button" @click="packMode = 'dynamic'" :aria-pressed="packMode === 'dynamic'">{{ t('strategy_pack_dynamic') }}</button>
                            <button type="button" @click="packMode = 'fixed'" :aria-pressed="packMode === 'fixed'">{{ t('strategy_pack_fixed') }}</button>
                        </div>
                        <template v-if="packMode === 'dynamic'">
                            <label for="strat-pack-batch" class="text-xs text-slate-400 whitespace-nowrap">{{ t('strategy_pack_batch') }}</label>
                            <input id="strat-pack-batch" type="number" v-model.number="packBatch" min="1" max="500" @focus="$event.target.select()"
                                   class="input-glass w-16 h-8 px-2 text-center tabular-nums text-sm">
                        </template>
                    </div>
                    <p v-if="packMode === 'fixed'" class="text-[11px] text-slate-400 leading-snug">{{ t('strategy_pack_fixed_desc') }}</p>
                </div>
                <!-- Classe giocatore -->
                <div class="grid gap-1.5 content-start">
                    <span class="ov-label">{{ t('lbl_player_class') }}</span>
                    <div class="ov-seg self-start justify-self-start max-w-full [&>button]:whitespace-normal [&>button]:text-left">
                        <button type="button" @click="chooseClassOverride('inherit')" :aria-pressed="playerClassOverride === 'inherit'">
                            {{ t('strategy_lf_inherit') }} · {{ t(playerClassLabelKey) }}
                        </button>
                        <button type="button" @click="chooseClassOverride('collector')" :aria-pressed="playerClassOverride === 'collector'">{{ t('opt_collector') }}</button>
                    </div>
                </div>
                <!-- Crawler, sovraccarico, item, amplificatore: su "Profilo" la partenza coincide col Production Core -->
                <div v-for="opt in simOptions" :key="opt.key" class="grid gap-1.5 content-start">
                    <span class="ov-label">{{ t(opt.label) }}</span>
                    <div class="ov-seg self-start justify-self-start">
                        <button v-for="c in opt.choices" :key="String(c.value)" type="button"
                                @click="opt.model.value = c.value" :aria-pressed="opt.model.value === c.value">{{ c.text }}</button>
                    </div>
                    <p v-if="opt.hint" class="text-[11px] text-slate-400 leading-snug">{{ opt.hint }}</p>
                </div>
            </div>
        </details>

        <!-- Gruppo: ricerche LF da considerare -->
        <details v-if="includeLfResearch" class="ov-acc">
            <summary><b>{{ t('strategy_lf_research_select') }}</b><span class="ov-acc-sum">{{ lfResearchIds.length }} / {{ ALL_LF_IDS.length }}</span></summary>
            <div class="grid gap-3">
                <div class="flex items-center justify-between flex-wrap gap-2">
                    <p class="text-[11px] text-slate-400 leading-snug max-w-[70ch]">{{ t('strategy_lf_activate_hint') }}</p>
                    <div class="flex gap-1.5">
                        <button type="button" @click="setLfResAll(true)" class="ov-btn ov-btn-tint ov-btn-sm" style="--tc:#34d399">{{ t('strategy_lf_activate_all') }}</button>
                        <button type="button" @click="setLfResAll(false)" class="ov-btn ov-btn-ghost ov-btn-sm">{{ t('strategy_lf_deactivate_all') }}</button>
                    </div>
                </div>
                <!-- Griglia a colonne fisse invece di flex-wrap: i nomi hanno
                     lunghezze molto diverse e a capo libero le chip risultavano
                     sfalsate. Le colonne allineano sia i tagliandi T che i nomi. -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-1.5">
                    <button v-for="r in LF_RESEARCH_ALL" :key="r.id" type="button"
                            @click="toggleLfRes(r.id)"
                            :title="r.indirect ? r.name + ' — ' + t('strategy_lf_indirect_hint') : r.name"
                            class="w-full min-w-0 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors duration-150 flex items-center gap-1.5 text-left"
                            :class="isLfResSelected(r.id) ? LF_SPECIES_CHIP[r.species].on : LF_SPECIES_CHIP[r.species].off">
                        <span class="font-mono font-bold text-[11px] w-7 shrink-0">T{{ r.tier }}</span>
                        <span class="flex-1 min-w-0 truncate">{{ r.name }}</span>
                        <!-- Nessun bonus metallo diretto: rende solo amplificando
                             la classe Collezionista (bonus classe + crawler). -->
                        <span v-if="r.indirect" class="shrink-0 ov-tag ov-tag-warn">%</span>
                    </button>
                </div>
                <!-- Il campo manuale "Potenziamento Collezionista" di Production Core e
                     questa ricerca si sommano nello stesso collFactor: se sono entrambi
                     valorizzati il bonus viene contato due volte. -->
                <p v-if="collectorDoubleCount" class="text-[11px] text-amber-400 leading-snug">{{ t('strategy_collector_double_warn') }}</p>
            </div>
        </details>

        <!-- Gruppo: lifeform per pianeta (cambia solo la simulazione) -->
        <details class="ov-acc">
            <summary><b>{{ t('strategy_lf_override') }}</b><span class="ov-acc-sum">{{ lfOverrideSummary }}</span></summary>
            <div class="grid gap-3">
                <div class="flex items-center justify-between flex-wrap gap-3">
                    <p class="text-[11px] text-slate-400">{{ t('strategy_lf_override_hint') }} · <b class="text-slate-300">=</b> {{ t('strategy_lf_inherit') }} · U R M K = {{ t('opt_humans') }}, {{ t('opt_rocktal') }}, {{ t('opt_mecha') }}, {{ t('opt_kaelesh') }}</p>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-slate-400">{{ t('strategy_lf_set_all') }}</span>
                        <div class="ov-seg">
                            <button v-for="opt in lfOpts" :key="opt.v" type="button" @click="lfChoice = planets.map(() => opt.v)"
                                    :title="opt.v === 'inherit' ? t('strategy_lf_inherit') : t('opt_' + opt.v)"
                                    :aria-label="opt.v === 'inherit' ? t('strategy_lf_inherit') : t('opt_' + opt.v)"
                                    :aria-pressed="lfChoice.length > 0 && lfChoice.every(v => v === opt.v)" class="!px-2 min-w-[1.75rem]">{{ opt.l }}</button>
                        </div>
                    </div>
                </div>
                <!-- Una riga per pianeta: nome, livelli, forma di vita attuale → simulata.
                     "=" mantiene quella del profilo; U/R/M/K la sostituiscono nella simulazione. -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-6 border-t border-ogame-line">
                    <div v-for="(p, idx) in planets" :key="idx"
                         class="flex items-center gap-3 py-1.5 border-b border-ogame-line min-w-0">
                        <span class="w-5 text-right text-[11px] text-slate-500 tabular-nums flex-none">{{ idx + 1 }}</span>
                        <span class="flex-1 min-w-0 truncate text-[13px] font-semibold text-slate-100" :title="p.name">{{ p.name || `#${idx+1}` }}</span>
                        <span class="hidden sm:flex gap-1.5 text-[11px] text-slate-400 tabular-nums flex-none w-24">
                            <span>M.{{ p.metal || 0 }}</span>
                            <span v-if="p.magma">FM.{{ p.magma }}</span>
                            <span v-else-if="p.human">FAE.{{ p.human }}</span>
                        </span>
                        <span class="text-[11px] font-medium px-1.5 py-0.5 rounded flex-none w-16 text-center"
                              :class="[lfBadgeClass(effectiveLf(p, idx)), lfChoice[idx] && lfChoice[idx] !== 'inherit' ? '' : 'opacity-70']">{{ t('opt_' + effectiveLf(p, idx)) }}</span>
                        <div class="ov-seg flex-none">
                            <button v-for="opt in lfOpts" :key="opt.v" type="button" @click="lfChoice[idx] = opt.v"
                                    :aria-pressed="(lfChoice[idx] || 'inherit') === opt.v"
                                    :title="opt.v === 'inherit' ? t('strategy_lf_inherit') : t('opt_' + opt.v)"
                                    :aria-label="opt.v === 'inherit' ? t('strategy_lf_inherit') : t('opt_' + opt.v)"
                                    class="!px-2 min-w-[1.75rem]">{{ opt.l }}</button>
                        </div>
                    </div>
                </div>
            </div>
        </details>

        <!-- Gruppo: risorse possedute + sconto shop + bonus MO. Scalano i pacchetti come in
             Pack Exchange; il piano non cambia, pacchetti/MO/euro si ricalcolano al volo. -->
        <details class="ov-acc">
            <summary><b>{{ t('lbl_stock') }} · {{ t('lbl_cost_dm') }}</b><span class="ov-acc-sum">{{ resourcesSummary }}</span></summary>
            <div class="grid gap-4">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label v-for="r in [['stockMet', 'res_metal'], ['stockCry', 'res_crystal'], ['stockDeu', 'res_deuterium']]" :key="r[0]" class="grid gap-1">
                        <span class="ov-label">{{ t(r[1]) }}</span>
                        <input type="text" inputmode="numeric" v-model="stockModels[r[0]].value" @focus="$event.target.select()" placeholder="0"
                               class="input-glass w-full h-9 px-3 text-right tabular-nums text-sm">
                    </label>
                </div>
                <p v-if="stockMSU > 0" class="text-[11px] text-emerald-400 tabular-nums -mt-2">–{{ formatNum(stockMSU) }} MSU</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="grid gap-1.5">
                        <span class="ov-label">{{ t('lbl_shop_discount') }}</span>
                        <div class="ov-seg ov-seg-full">
                            <button v-for="d in SHOP_PACK_DISCOUNTS" :key="d" type="button" @click="shopDiscount = d" :aria-pressed="shopDiscount === d">{{ d === 0 ? t('opt_none') : '–' + d + '%' }}</button>
                        </div>
                    </div>
                    <div class="grid gap-1.5">
                        <span class="ov-label">{{ t('lbl_event_bonus') }}</span>
                        <div class="ov-seg ov-seg-full !grid grid-cols-4">
                            <button v-for="b in DM_EVENT_BONUSES" :key="b" type="button" @click="moBonus = b" :aria-pressed="moBonus === b">{{ b === 0 ? '–' : '+' + b + '%' }}</button>
                        </div>
                    </div>
                </div>
                <p class="text-[11px] text-slate-400 flex items-center gap-1.5"><svg class="w-3 h-3 flex-none" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.8 10.2a4 4 0 00-5.6 0l-3 3a4 4 0 005.6 5.6l1.1-1.1m-.7-4.5a4 4 0 005.6 0l3-3a4 4 0 00-5.6-5.6l-1.1 1.1"/></svg>{{ t('shared_purchase_hint') }}</p>
            </div>
        </details>

        <!-- Calcolo -->
        <div class="flex flex-wrap items-center justify-end gap-2 pt-1">
            <p class="flex-1 min-w-[16rem] text-[11px] text-slate-400">{{ t('strategy_perf_hint') }}</p>
            <!-- Con un piano in corso: "Nuovo piano" (secondario, con conferma) e
                 "Ricalcola il resto" (tiene gli step fatti). Senza piano: "Calcola". -->
            <button v-if="result" @click="computePlan('new')" :disabled="isComputing || !canCompute"
                    :title="t('strategy_new_plan_hint')" class="ov-btn ov-btn-ghost">
                {{ t('strategy_new_plan') }}
            </button>
            <button @click="computePlan(result ? 'rest' : 'new')" :disabled="isComputing || !canCompute"
                    :title="result ? t('strategy_recompute_rest_hint') : null" class="ov-btn ov-btn-primary">
                <svg v-if="isComputing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                {{ isComputing ? t('strategy_computing') : (result ? t('strategy_recompute_rest') : t('strategy_compute')) }}
            </button>
        </div>
        <!-- Progresso calcolo (dal worker): % verso il target + step correnti -->
        <div v-if="isComputing && progress">
            <div class="flex items-center justify-between text-[11px] tabular-nums mb-1">
                <span class="text-slate-400">{{ progress.step }} / {{ progress.maxSteps }} step</span>
                <span class="text-emerald-400">{{ formatNum(progress.currentProd) }} · {{ computePct }}%</span>
            </div>
            <div class="h-1.5 bg-ogame-line rounded-full overflow-hidden"
                 role="progressbar" :aria-valuenow="computePct" aria-valuemin="0" aria-valuemax="100">
                <div class="h-full bg-emerald-500/70 rounded-full transition-[width] duration-200" :style="{ width: computePct + '%' }"></div>
            </div>
        </div>
        </div>

        <!-- ────── RISULTATI ────── -->
        <div v-if="result" id="strategy-results" class="space-y-6 scroll-mt-20">

            <!-- Il piano resta visibile anche se il Production Core è cambiato:
                 si avvisa soltanto, senza cancellare il lavoro dell'utente. -->
            <div v-if="planIsStale"
                 class="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3">
                <svg class="w-5 h-5 text-amber-400 shrink-0 mt-px" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
                <div class="flex-1 min-w-0">
                    <div class="text-[12px] font-bold text-amber-200 leading-snug">{{ t(staleReason === 'sim' ? 'strategy_stale_sim_title' : 'strategy_stale_title') }}</div>
                    <div class="text-[11px] text-amber-400/70 leading-snug mt-0.5">{{ t('strategy_stale_hint') }}</div>
                </div>
                <button @click="computePlan('rest')" :disabled="isComputing"
                        :title="t('strategy_recompute_rest_hint')"
                        class="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-200 border border-amber-400/35 hover:bg-amber-500/30 transition-colors disabled:opacity-40">
                    {{ t('strategy_recompute_rest') }}
                </button>
            </div>

            <!-- Sommario top -->
            <div class="ov-panel p-5">
                <!-- ═══ Modalità SPESA: tutto ruota attorno al costo complessivo dell'obiettivo ═══ -->
                <template v-if="goalSummary">
                    <!-- 1) Quanto costa in tutto, contro comprarlo subito -->
                    <div class="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
                        <div class="flex items-baseline justify-between gap-2 mb-3 flex-wrap">
                            <h2 class="ov-sh ov-sh-noline" style="--tc:#fbbf24">{{ t('strategy_goal_title') }}</h2>
                            <div class="text-[11px] font-mono text-amber-200/80">{{ formatNum(goalSummary.msu) }} MSU</div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div class="rounded-lg bg-black/25 p-3 text-center">
                                <div class="ov-stat-k">{{ t('strategy_goal_direct_title') }}</div>
                                <div class="text-xl font-bold font-mono text-slate-300">{{ formatNum(goalSummary.direct) }} <span class="text-[11px] font-semibold text-slate-400">{{ t('strategy_goal_packs_unit') }}</span></div>
                                <div class="text-[11px] font-mono text-slate-400 mt-0.5">{{ formatNum(goalSummary.directEuro.totalMO) }} MO · {{ formatNum(goalSummary.directEuro.totalEuro) }} €</div>
                            </div>
                            <div class="rounded-lg bg-amber-500/10 border border-amber-400/30 p-3 text-center">
                                <div class="text-[11px] text-amber-300 uppercase tracking-wider font-bold mb-1">{{ t('strategy_goal_total') }}</div>
                                <div class="text-2xl font-bold font-mono text-amber-100">{{ formatNum(goalSummary.total) }} <span class="text-[11px] font-semibold text-amber-300/70">{{ t('strategy_goal_packs_unit') }}</span></div>
                                <div class="text-[11px] font-mono text-amber-200/80 mt-0.5">{{ formatNum(goalSummary.totalEuro.totalMO) }} MO · {{ formatNum(goalSummary.totalEuro.totalEuro) }} €</div>
                            </div>
                            <div class="rounded-lg bg-emerald-500/[0.07] border border-emerald-500/25 p-3 text-center">
                                <div class="text-[11px] text-emerald-400 uppercase tracking-wider font-bold mb-1">{{ t('strategy_goal_saving') }}</div>
                                <div class="text-xl font-bold font-mono text-emerald-300">{{ formatNum(Math.max(0, goalSummary.saving)) }} <span class="text-[11px] font-semibold text-emerald-400/70">{{ t('strategy_goal_packs_unit') }}</span></div>
                                <div class="text-[11px] font-mono text-emerald-300/80 mt-0.5">
                                    −{{ formatPct(Math.max(0, goalSummary.savingPct), 1) }}% · {{ formatNum(Math.max(0, goalSummary.directEuro.totalEuro - goalSummary.totalEuro.totalEuro)) }}
                                </div>
                            </div>
                        </div>
                        <div v-if="!result.steps.some(st => !st.fromPrevPlan)" class="mt-3 text-[11px] text-slate-400">
                            {{ t('strategy_goal_no_upgrade') }}
                        </div>
                    </div>

                    <!-- 2) Le due fasi: prima gli upgrade, poi l'obiettivo -->
                    <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="bg-ogame-surface rounded-xl p-4 border border-sky-500/20">
                            <div class="ov-sh ov-sh-noline mb-2" style="--tc:#38bdf8">1 · {{ t('strategy_goal_phase_upgrade') }}</div>
                            <div class="flex items-baseline justify-between gap-2">
                                <span class="text-xl font-bold font-mono text-sky-200">{{ formatNum(goalSummary.upgradePacks) }} <span class="text-[11px] font-semibold text-sky-400/70">{{ t('strategy_goal_packs_unit') }}</span></span>
                                <span class="text-[11px] font-mono text-slate-400">{{ formatNum(goalSummary.upgradeEuro.totalEuro) }} €</span>
                            </div>
                            <div class="mt-2 text-[11px] font-mono text-slate-400 space-y-0.5">
                                <div class="flex justify-between"><span class="text-slate-400">MSU<template v-if="planCost?.hasProgress"> ({{ t('strategy_goal_remaining') }})</template></span><span class="text-amber-200">{{ formatNum(planCost?.msu || 0) }}</span></div>
                                <div class="flex justify-between"><span class="text-slate-400">{{ t('res_metal') }}</span><span>{{ formatNum(planCost?.metal || 0) }}</span></div>
                                <div class="flex justify-between"><span class="text-slate-400">{{ t('res_crystal') }}</span><span class="text-sky-300">{{ formatNum(planCost?.crystal || 0) }}</span></div>
                                <div class="flex justify-between"><span class="text-slate-400">{{ t('res_deuterium') }}</span><span class="text-ogame-success">{{ formatNum(planCost?.deuterium || 0) }}</span></div>
                                <!-- Lo stock paga per primo gli upgrade: senza questa riga "MSU > 0 ma 0 pacchi" sembra un errore -->
                                <div v-if="stockMSU > 0" class="flex justify-between text-emerald-400/80">
                                    <span>{{ t('strategy_goal_stock_covers') }}</span>
                                    <span>−{{ formatNum(Math.min(stockMSU, planCost?.msu || 0)) }}</span>
                                </div>
                            </div>
                            <div class="mt-2 pt-2 border-t border-slate-700/20 text-[11px] font-mono text-slate-400 flex justify-between gap-2 flex-wrap">
                                <span class="text-slate-400">{{ t('strategy_goal_prod_change') }}</span>
                                <span>{{ formatNum(result.initialProd) }} → <span class="text-emerald-300">{{ formatNum(result.finalProd) }}</span></span>
                            </div>
                        </div>
                        <div class="bg-ogame-surface rounded-xl p-4 border border-amber-500/20">
                            <div class="ov-sh ov-sh-noline mb-2" style="--tc:#fbbf24">2 · {{ t('strategy_goal_phase_goal') }}</div>
                            <div class="flex items-baseline justify-between gap-2">
                                <span class="text-xl font-bold font-mono text-amber-200">{{ formatNum(goalSummary.goalAfter) }} <span class="text-[11px] font-semibold text-amber-400/70">{{ t('strategy_goal_packs_unit') }}</span></span>
                                <span class="text-[11px] font-mono text-slate-400">{{ formatNum(goalSummary.goalEuro.totalEuro) }} €</span>
                            </div>
                            <div class="mt-2 text-[11px] font-mono text-slate-400 space-y-0.5">
                                <div class="flex justify-between"><span class="text-slate-400">MSU</span><span class="text-amber-200">{{ formatNum(goalSummary.msu) }}</span></div>
                                <template v-if="goalSummary.res">
                                    <div class="flex justify-between"><span class="text-slate-400">{{ t('res_metal') }}</span><span>{{ formatNum(goalSummary.res[0]) }}</span></div>
                                    <div class="flex justify-between"><span class="text-slate-400">{{ t('res_crystal') }}</span><span class="text-sky-300">{{ formatNum(goalSummary.res[1]) }}</span></div>
                                    <div class="flex justify-between"><span class="text-slate-400">{{ t('res_deuterium') }}</span><span class="text-ogame-success">{{ formatNum(goalSummary.res[2]) }}</span></div>
                                </template>
                                <div v-else class="text-[11px] text-slate-400 italic pt-1">{{ t('strategy_goal_res_unknown') }}</div>
                            </div>
                            <div class="mt-2 pt-2 border-t border-slate-700/20 text-[11px] font-mono text-slate-400 flex justify-between gap-2 flex-wrap">
                                <span class="text-slate-400">{{ t('strategy_goal_pack_value') }}</span>
                                <span>{{ formatNum(result.finalProd) }} {{ t('strategy_goal_per_pack') }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- 3) Totale risorse da procurare (upgrade + obiettivo) -->
                    <div class="mt-2 grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-4 gap-2">
                        <div class="min-w-0 rounded-lg px-3 py-2.5 bg-ogame-surface">
                            <div class="ov-stat-k">{{ t('strategy_goal_total_msu') }}</div>
                            <div class="text-sm sm:text-base font-bold tabular-nums text-slate-100">{{ formatNum(goalSummary.totalMSU) }}</div>
                        </div>
                        <template v-if="goalSummary.totalRes">
                            <div class="min-w-0 rounded-lg px-3 py-2.5 bg-ogame-surface">
                                <div class="ov-stat-k">{{ t('res_metal') }}</div>
                                <div class="text-sm sm:text-base font-bold tabular-nums text-slate-100">{{ formatNum(goalSummary.totalRes[0]) }}</div>
                            </div>
                            <div class="min-w-0 rounded-lg px-3 py-2.5 bg-ogame-surface">
                                <div class="ov-stat-k">{{ t('res_crystal') }}</div>
                                <div class="text-sm sm:text-base font-bold tabular-nums text-slate-100">{{ formatNum(goalSummary.totalRes[1]) }}</div>
                            </div>
                            <div class="min-w-0 rounded-lg px-3 py-2.5 bg-ogame-surface">
                                <div class="ov-stat-k">{{ t('res_deuterium') }}</div>
                                <div class="text-sm sm:text-base font-bold tabular-nums text-slate-100">{{ formatNum(goalSummary.totalRes[2]) }}</div>
                            </div>
                        </template>
                    </div>

                    <!-- 4) Produzione: dove sei rispetto al piano -->
                    <div class="mt-3 grid grid-cols-3 gap-3">
                        <div class="min-w-0 rounded-lg px-3 py-2.5 bg-ogame-surface">
                            <div class="ov-stat-k">{{ t('strategy_initial') }}</div>
                            <div class="text-sm sm:text-base font-bold tabular-nums text-slate-100">{{ formatNum(result.initialProd) }}</div>
                        </div>
                        <div class="min-w-0 rounded-lg px-3 py-2.5 bg-ogame-surface">
                            <div class="ov-stat-k">{{ t('strategy_current_prod') }}</div>
                            <div class="text-sm sm:text-base font-bold tabular-nums text-slate-100">{{ formatNum(currentProd) }}</div>
                            <div v-if="planProgressPct > 0" class="text-[11px] font-mono text-sky-300/70 mt-0.5">{{ t('strategy_progress_pct').replace('{n}', planProgressPct) }}</div>
                        </div>
                        <div class="min-w-0 rounded-lg px-3 py-2.5 bg-ogame-surface">
                            <div class="ov-stat-k">{{ t('strategy_final') }}</div>
                            <div class="text-sm sm:text-base font-bold tabular-nums text-slate-100">{{ formatNum(result.finalProd) }}</div>
                        </div>
                    </div>
                    <div class="mt-3 text-[11px] text-slate-400 leading-snug">{{ t('strategy_goal_check_hint') }}</div>
                </template>

                <!-- ═══ Modalità PRODUZIONE: riepilogo classico ═══ -->
                <template v-else>
                <div class="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    <div class="min-w-0 rounded-lg px-3 py-2.5 bg-ogame-surface">
                        <div class="ov-stat-k">{{ t('strategy_initial') }}</div>
                        <div class="text-base sm:text-lg font-bold tabular-nums text-slate-100">{{ formatNum(result.initialProd) }}</div>
                    </div>
                    <!-- Produzione attuale (dati del core di adesso) e avanzamento verso la finale -->
                    <div class="min-w-0 rounded-lg px-3 py-2.5 bg-ogame-surface">
                        <div class="ov-stat-k">{{ t('strategy_current_prod') }}</div>
                        <div class="text-base sm:text-lg font-bold tabular-nums text-slate-100">{{ formatNum(currentProd) }}</div>
                        <div v-if="planProgressPct > 0" class="text-[11px] font-mono text-sky-300/70 mt-0.5">
                            {{ t('strategy_progress_pct').replace('{n}', planProgressPct) }}
                        </div>
                    </div>
                    <div class="min-w-0 rounded-lg px-3 py-2.5 bg-ogame-surface">
                        <div class="ov-stat-k">{{ t('strategy_final') }}</div>
                        <div class="text-base sm:text-lg font-bold tabular-nums text-slate-100">{{ formatNum(result.finalProd) }}</div>
                    </div>
                    <div class="min-w-0 rounded-lg px-3 py-2.5 bg-ogame-surface">
                        <div class="ov-stat-k">{{ planCost?.hasProgress ? t('strategy_remaining_packs') : t('strategy_total_packs') }}</div>
                        <div class="text-base sm:text-lg font-bold tabular-nums text-slate-100">{{ formatNum(totalPacks) }}</div>
                    </div>
                    <div class="min-w-0 rounded-lg px-3 py-2.5 bg-ogame-surface">
                        <div class="ov-stat-k">{{ planCost?.hasProgress ? t('strategy_remaining_mo') : t('strategy_total_mo') }}</div>
                        <div class="text-base sm:text-lg font-bold tabular-nums text-slate-100">{{ formatNum(planEuro.totalMO) }}</div>
                    </div>
                    <div class="min-w-0 rounded-lg px-3 py-2.5 bg-ogame-surface">
                        <div class="ov-stat-k">{{ planCost?.hasProgress ? t('strategy_remaining_euro') : t('strategy_total_euro') }}</div>
                        <div class="text-base sm:text-lg font-bold tabular-nums text-slate-100">{{ formatNum(planEuro.totalEuro) }} €</div>
                    </div>
                </div>

                <!-- Costo del piano: MSU totali e ripartizione per risorsa -->
                <div v-if="planCost" class="mt-2 grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-4 gap-2">
                    <div class="min-w-0 rounded-lg px-3 py-2.5 bg-ogame-surface">
                        <div class="ov-stat-k">
                            {{ planCost.hasProgress ? t('strategy_remaining_msu') : t('strategy_total_msu') }}
                        </div>
                        <div class="text-sm sm:text-base font-bold tabular-nums text-slate-100">{{ formatNum(planCost.msu) }}</div>
                        <div v-if="planCost.hasProgress" class="text-[11px] font-mono text-amber-300/70 mt-0.5">
                            {{ t('strategy_of_total').replace('{n}', formatNum(planCost.totalMSU)) }}
                        </div>
                    </div>
                    <div class="min-w-0 rounded-lg px-3 py-2.5 bg-ogame-surface">
                        <div class="ov-stat-k">{{ t('res_metal') }}</div>
                        <div class="text-sm sm:text-base font-bold tabular-nums text-slate-100">{{ formatNum(planCost.metal) }}</div>
                    </div>
                    <div class="min-w-0 rounded-lg px-3 py-2.5 bg-ogame-surface">
                        <div class="ov-stat-k">{{ t('res_crystal') }}</div>
                        <div class="text-sm sm:text-base font-bold tabular-nums text-slate-100">{{ formatNum(planCost.crystal) }}</div>
                    </div>
                    <div class="min-w-0 rounded-lg px-3 py-2.5 bg-ogame-surface">
                        <div class="ov-stat-k">{{ t('res_deuterium') }}</div>
                        <div class="text-sm sm:text-base font-bold tabular-nums text-slate-100">{{ formatNum(planCost.deuterium) }}</div>
                    </div>
                </div>

                </template>

                <!-- Reason chip -->
                <div class="mt-3 flex items-center justify-between flex-wrap gap-2">
                    <div class="text-[11px] uppercase tracking-wider">
                        <span v-if="result.reachedTarget" class="ov-tag ov-tag-ok !text-[11px] !px-2 !py-1">{{ result.goal ? t('strategy_goal_done') : t('strategy_target_reached') }}</span>
                        <span v-else class="ov-tag ov-tag-warn !text-[11px] !px-2 !py-1">{{ t('strategy_stop_' + result.stoppedReason) }}</span>
                    </div>
                    <button @click="importToPackQueue" class="ov-btn ov-btn-tint ov-btn-sm" style="--tc:#fbbf24">
                        {{ t('strategy_import_to_pack') }}
                    </button>
                </div>
            </div>

            <!-- Riepilogo contributi per categoria -->
            <div v-if="typeSummary" class="ov-panel p-5">
                <h2 class="ov-sh mb-4">
                    {{ t('strategy_contrib_title') }}
                </h2>
                <div class="space-y-3">
                    <div v-for="cat in typeSummary" :key="cat.key" class="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <!-- Label + badge -->
                        <div class="w-28 sm:w-36 flex-shrink-0 flex items-center gap-2">
                            <span class="text-[13px] text-slate-200">{{ t('strategy_contrib_' + cat.key) }}</span>
                        </div>
                        <!-- Barra progresso -->
                        <div class="order-last basis-full sm:order-none sm:basis-0 flex-1 bg-ogame-line rounded-full h-1.5 overflow-hidden">
                            <div class="h-full rounded-full"
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
                        <div class="ml-auto sm:ml-0 sm:w-56 flex-shrink-0 flex items-baseline gap-2 justify-end">
                            <span class="text-sm font-semibold tabular-nums"
                                  :class="{
                                      'text-sky-300':     cat.key === 'mine',
                                      'text-cyan-300':    cat.key === 'crawler',
                                      'text-violet-300':  cat.key === 'plasma',
                                      'text-orange-300':  cat.key === 'lf_build',
                                      'text-emerald-300': cat.key === 'lf_research',
                                  }">
                                {{ cat.pct }}%
                            </span>
                            <span class="text-xs text-slate-400 tabular-nums whitespace-nowrap">
                                +{{ formatNum(cat.delta) }}
                                <template v-if="cat.key === 'mine'"> ({{ cat.levels }}↑)</template>
                                <template v-else-if="cat.key === 'plasma'"> (L+{{ cat.levels }})</template>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Riepilogo per pianeta -->
            <div class="ov-panel p-5">
                <h2 class="ov-sh mb-4">
                    {{ t('strategy_summary_planet') }}
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div v-for="row in perPlanetSummary.planets" :key="row.idx"
                         class="rounded-md border border-ogame-line px-3 py-2 flex items-center justify-between text-[13px]">
                        <span class="text-slate-200 truncate">{{ row.name }}</span>
                        <div class="flex gap-2 flex-shrink-0">
                            <span v-if="row.metalMine" class="text-xs font-semibold tabular-nums text-sky-300">M+{{ row.metalMine }}</span>
                            <span v-if="row.crystalMine" class="text-xs font-semibold tabular-nums text-cyan-300">C+{{ row.crystalMine }}</span>
                            <span v-if="row.deutMine" class="text-xs font-semibold tabular-nums text-indigo-300">D+{{ row.deutMine }}</span>
                            <span v-if="row.lfMagma" class="text-xs font-semibold tabular-nums text-orange-300">FM+{{ row.lfMagma }}</span>
                            <span v-if="row.lfHuman" class="text-xs font-semibold tabular-nums text-blue-300">FAE+{{ row.lfHuman }}</span>
                        </div>
                    </div>
                    <div v-if="perPlanetSummary.plasma" class="rounded-md border border-ogame-line px-3 py-2 flex items-center justify-between text-[13px]">
                        <span class="text-slate-200">{{ t('plasma_technology') }}</span>
                        <span class="text-xs font-semibold tabular-nums text-violet-300">+{{ perPlanetSummary.plasma }}</span>
                    </div>
                    <div v-if="perPlanetSummary.lfResearch" class="rounded-md border border-ogame-line px-3 py-2 flex items-center justify-between text-[13px]">
                        <span class="text-slate-200">{{ t('strategy_lf_research') }}</span>
                        <span class="text-xs font-semibold tabular-nums text-emerald-300">+{{ perPlanetSummary.lfResearch }}</span>
                    </div>
                </div>
            </div>

            <!-- Roadmap step-by-step -->
            <div class="overflow-hidden rounded-xl border border-ogame-line bg-ogame-panel">
                <div class="px-5 py-3 border-b border-ogame-line">
                    <div class="flex justify-between items-center flex-wrap gap-2">
                        <div class="flex items-center gap-2.5">
                            <h2 class="ov-sh ov-sh-noline">{{ t('strategy_roadmap') }}</h2>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-[11px] tabular-nums text-emerald-300 border border-emerald-500/25">
                                {{ doneCount }}/{{ groupedSteps.length }} {{ t('lbl_done') }}
                            </span>
                            <span class="px-2 py-0.5 rounded bg-white/[0.04] text-[11px] tabular-nums text-slate-400 border border-slate-700/20">
                                {{ groupedSteps.length }} {{ t('lbl_blocks') }}
                                <span v-if="groupedSteps.length !== result.steps.length" class="text-slate-400">({{ result.steps.length }} step)</span>
                            </span>
                        </div>
                    </div>
                    <!-- Avanzamento esecuzione del piano (blocchi spuntati) -->
                    <div class="mt-2 h-1 bg-black/40 rounded-full overflow-hidden">
                        <div class="h-full bg-emerald-500/60 rounded-full "
                             :style="{ width: (groupedSteps.length ? Math.round(doneCount / groupedSteps.length * 100) : 0) + '%' }"></div>
                    </div>
                    <!-- Filtro per tipo -->
                    <div v-if="presentTypes.length > 1" class="mt-2.5 flex items-center gap-1 flex-wrap">
                        <button @click="typeFilter = 'all'"
                                class="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border transition-colors duration-150"
                                :class="typeFilter === 'all' ? 'bg-slate-600/40 text-slate-100 border-slate-500/40' : 'bg-transparent text-slate-400 border-slate-700/30 hover:text-slate-400'">
                            {{ t('lbl_all') }}
                        </button>
                        <button v-for="tp in presentTypes" :key="tp"
                                @click="typeFilter = typeFilter === tp ? 'all' : tp"
                                class="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border transition-colors duration-150"
                                :class="typeFilter === tp ? stepBadgeClass(tp) : 'bg-transparent text-slate-400 border-slate-700/30 hover:text-slate-400'">
                            {{ stepTypeLabel(tp) }}
                        </button>
                    </div>
                </div>

                <!-- Desktop table -->
                <div class="hidden md:block overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar">
                    <table class="w-full text-xs">
                        <thead class="sticky top-0 z-10 bg-ogame-surface text-slate-400 uppercase text-[11px] tracking-wider shadow-[0_1px_0_rgba(51,65,85,0.4)]">
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
                                    s.isDone ? 'opacity-40' : '',
                                    s.n === nextStepN ? 'bg-emerald-500/[0.06]' : (s.count > 1 ? 'bg-emerald-500/[0.02]' : '')
                                ]"
                                @click="toggleDone(s.n)">
                                <td class="px-3 py-2 text-center">
                                    <input type="checkbox" :checked="s.isDone" @click.stop="toggleDone(s.n)"
                                           :disabled="s.autoDone"
                                           :title="s.autoDone ? t('strategy_auto_done_hint') : null"
                                           :aria-label="t('lbl_done') + ' #' + s.n"
                                           class="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer disabled:cursor-default">
                                    <div v-if="s.autoCount > 0 && !s.autoDone"
                                         :title="t('strategy_partial_done_hint')"
                                         class="mt-0.5 text-[11px] font-mono font-bold text-emerald-400/80">{{ s.autoCount }}/{{ s.count }}</div>
                                </td>
                                <td class="px-3 py-2 tabular-nums text-slate-400 text-[11px] whitespace-nowrap">
                                    {{ s.n }}
                                    <span v-if="s.n === nextStepN" class="ml-1 px-1 py-px rounded bg-emerald-500/15 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">{{ t('lbl_next') }}</span>
                                </td>
                                <td class="px-3 py-2 whitespace-nowrap">
                                    <span class="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border"
                                          :class="[stepBadgeClass(s), s.isDone ? 'line-through' : '']">
                                        {{ stepTypeLabel(s) }}
                                    </span>
                                    <span v-if="s.count > 1" class="ml-1.5 text-[11px] text-slate-400 font-mono font-bold">&times;{{ s.count }}</span>
                                </td>
                                <td class="px-3 py-2 tabular-nums text-slate-400 align-top min-w-[180px] whitespace-normal">
                                    <div v-if="s.type === 'lf_research' && s.researchName" class="text-[11px] text-slate-400 leading-snug mb-1 flex items-center gap-1.5 flex-wrap">
                                        <span class="px-1.5 py-px rounded bg-slate-700/60 text-slate-300 tabular-nums font-bold text-[11px]">T{{ parseInt(s.researchId) % 100 }}</span>
                                        <span class="font-semibold">{{ s.researchName }}</span>
                                        <!-- Δ positivo senza bonus metallo diretto: senza questo
                                             badge la riga sembra un errore del planner. -->
                                        <span v-if="s.indirectBonus"
                                              :title="t('strategy_lf_indirect_hint')"
                                              class="px-1 rounded bg-amber-500/15 text-amber-300/90 text-[11px] font-bold uppercase tracking-wider">
                                            {{ t('strategy_lf_indirect_badge') }}
                                        </span>
                                    </div>
                                    <template v-if="s.planetDetails && s.planetDetails.length > 1">
                                        <div class="text-[11px] text-slate-400 mb-1">{{ s.planetName }}</div>
                                        <!-- Elenco esplicito: senza i nomi un blocco raggruppato
                                             non dice su quali pianeti vada fatto l'upgrade. -->
                                        <div class="flex flex-wrap gap-1">
                                            <span v-for="pd in s.planetDetails" :key="pd.idx"
                                                  :title="pd.done ? t('strategy_planet_done_hint') : null"
                                                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[12px] leading-snug whitespace-nowrap max-w-full truncate"
                                                  :class="pd.done
                                                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                                      : 'border-slate-700/50 bg-black/30 text-slate-200'">
                                                <span v-if="pd.done" aria-hidden="true">✓</span>{{ pd.name }}
                                            </span>
                                        </div>
                                    </template>
                                    <template v-else><span class="text-[12px] text-slate-200">{{ s.planetName || '—' }}</span></template>
                                </td>
                                <td class="px-3 py-2 text-center tabular-nums text-slate-300 whitespace-nowrap">{{ s.from }} &rarr; {{ s.to }}</td>
                                <td class="px-3 py-2 text-right tabular-nums text-slate-300">{{ formatNum(s.costMSU) }}</td>
                                <td class="px-3 py-2 text-right tabular-nums text-amber-300/90">{{ s.packs }}</td>
                                <td class="px-3 py-2 text-right tabular-nums text-emerald-300">+{{ formatNum(s.deltaProd) }}</td>
                                <td class="px-3 py-2 text-right tabular-nums font-semibold" :class="roiColor(s.costMSU, s.deltaProd)">{{ formatROI(s.costMSU, s.deltaProd) }}</td>
                                <td class="px-3 py-2 text-right tabular-nums text-slate-200 font-bold">
                                    {{ formatNum(s.cumulativeProd) }}
                                    <div class="mt-0.5 h-[3px] w-16 ml-auto bg-black/40 rounded-full overflow-hidden">
                                        <div class="h-full bg-emerald-500/50 rounded-full" :style="{ width: rowProgressPct(s.cumulativeProd) + '%' }"></div>
                                    </div>
                                </td>
                                <td class="px-3 py-2 text-right tabular-nums text-amber-400">{{ s.cumulativePacks }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Mobile cards -->
                <div class="md:hidden p-3 space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div v-for="s in filteredSteps" :key="s.n"
                         class="rounded-lg border p-3 transition-opacity duration-150"
                         :class="[
                             s.isDone ? 'opacity-40' : '',
                             s.n === nextStepN
                                 ? 'bg-emerald-500/[0.06] border-emerald-500/30'
                                 : (s.count > 1 ? 'bg-emerald-500/[0.03] border-emerald-500/20' : 'bg-ogame-surface border-slate-700/20')
                         ]">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-1.5">
                                <input type="checkbox" :checked="s.isDone" @change="toggleDone(s.n)"
                                       :disabled="s.autoDone"
                                       :title="s.autoDone ? t('strategy_auto_done_hint') : null"
                                       :aria-label="t('lbl_done') + ' #' + s.n"
                                       class="w-4 h-4 accent-emerald-500 rounded cursor-pointer disabled:cursor-default">
                                <span class="text-[11px] tabular-nums text-slate-400">#{{ s.n }}</span>
                                <span v-if="s.autoCount > 0 && !s.autoDone" :title="t('strategy_partial_done_hint')"
                                      class="text-[11px] font-mono font-bold text-emerald-400/80">{{ s.autoCount }}/{{ s.count }}</span>
                                <span v-if="s.count > 1" class="text-[11px] font-mono font-bold text-slate-400">&times;{{ s.count }}</span>
                                <span v-if="s.n === nextStepN" class="px-1 py-px rounded bg-emerald-500/15 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">{{ t('lbl_next') }}</span>
                            </div>
                            <span class="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border"
                                  :class="stepBadgeClass(s)">{{ stepTypeLabel(s) }}</span>
                        </div>
                        <div class="text-[12px] text-slate-400 mb-2">
                            <div v-if="s.type === 'lf_research' && s.researchName" class="text-[11px] text-slate-400 font-semibold leading-snug mb-1 flex items-center gap-1.5 flex-wrap">
                                <span class="px-1.5 py-px rounded bg-slate-700/60 text-slate-300 tabular-nums font-bold text-[11px]">T{{ parseInt(s.researchId) % 100 }}</span>
                                <span>{{ s.researchName }}</span>
                            </div>
                            <span v-if="s.planetName" class="tabular-nums">{{ s.planetName }}</span>
                            <span class="ml-2 tabular-nums text-slate-400">L{{ s.from }} → L{{ s.to }}</span>
                            <!-- Elenco esplicito dei pianeti del blocco raggruppato -->
                            <div v-if="s.planetDetails && s.planetDetails.length > 1" class="flex flex-wrap gap-1 mt-1.5">
                                <span v-for="pd in s.planetDetails" :key="pd.idx"
                                      :title="pd.done ? t('strategy_planet_done_hint') : null"
                                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[12px] tabular-nums leading-snug whitespace-nowrap max-w-full truncate"
                                      :class="pd.done
                                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                          : 'border-slate-700/50 bg-black/30 text-slate-200'">
                                    <span v-if="pd.done" aria-hidden="true">✓</span>{{ pd.name }}
                                </span>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                            <div class="flex justify-between"><span class="text-slate-400">MSU</span><span class="tabular-nums text-slate-300">{{ formatNum(s.costMSU) }}</span></div>
                            <div class="flex justify-between"><span class="text-slate-400">Pack</span><span class="tabular-nums text-amber-300">{{ s.packs }}</span></div>
                            <div class="flex justify-between"><span class="text-slate-400">Δ</span><span class="text-slate-200">+{{ formatNum(s.deltaProd) }}</span></div>
                            <div class="flex justify-between"><span class="text-slate-400">ROI</span><span class="tabular-nums font-semibold" :class="roiColor(s.costMSU, s.deltaProd)">{{ formatROI(s.costMSU, s.deltaProd) }}</span></div>
                            <div class="flex justify-between col-span-2"><span class="text-slate-400">Tot</span><span class="tabular-nums text-slate-200 font-bold">{{ formatNum(s.cumulativeProd) }}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </template>
  </div>

  <!-- Barra fissa dei risultati -->
  <div v-if="result && activeProfile && planets.length" class="ov-resultbar">
    <div class="ov-resultbar-in">
      <div class="ov-stat"><span class="ov-stat-k">{{ t('strategy_current_prod') }} → {{ t('strategy_final') }}</span><span class="ov-stat-v !text-base sm:!text-xl">{{ formatNum(currentProd) }} <span class="text-slate-400 font-medium">→</span> <span class="text-emerald-300">{{ formatNum(result.finalProd) }}</span></span></div>
      <div class="ov-stat hidden sm:grid"><span class="ov-stat-k">{{ planCost?.hasProgress ? t('strategy_remaining_packs') : t('strategy_total_packs') }}</span><span class="ov-stat-v text-amber-300">{{ formatNum(totalPacks) }}</span></div>
      <div class="ov-stat hidden sm:grid"><span class="ov-stat-k">{{ planCost?.hasProgress ? t('strategy_remaining_euro') : t('strategy_total_euro') }}</span><span class="ov-stat-v">{{ formatNum(planEuro.totalEuro) }} €</span></div>
      <button @click="computePlan('rest')" :disabled="isComputing || !canCompute" class="ov-btn ov-btn-primary ov-btn-sm ml-auto">
        {{ isComputing ? t('strategy_computing') : t('strategy_recompute_rest') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.2); border-radius: 3px; }

</style>
