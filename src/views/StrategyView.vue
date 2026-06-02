<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useProfiles } from '../composables/useProfiles';
import { useOgameFormulas } from '../composables/useOgameFormulas';
import { useStrategy } from '../composables/useStrategy';

const { t } = useLanguage();
const { activeProfile, saveProfiles } = useProfiles();
const { formatNum, calcLFResearchBonus } = useOgameFormulas();
const { runPlanner, computeEuroCost, buildInitialState, simulateDailyProduction } = useStrategy();

const showIntro = ref(false);
const isComputing = ref(false);
const result = ref(null);

// Form
const target = ref(0);             // Δ goal in metallo/giorno
const maxSteps = ref(500);

// Impostazioni costo pacchetti / MO (locali a questa view)
const shopDiscount = ref(0);
const moBonus = ref(0);
const packMode = ref('dynamic');           // 'dynamic' | 'fixed'
const playerClassOverride = ref('inherit'); // 'inherit' | 'collector'

// ───── Persistenza configurazione ────────────────────────────────────────
const STRATEGY_CFG_KEY = 'ovalue_strategy_config';
const _saveConfig = () => {
    try {
        localStorage.setItem(STRATEGY_CFG_KEY, JSON.stringify({
            packMode: packMode.value,
            playerClassOverride: playerClassOverride.value,
            includeMines: includeMines.value,
            includePlasma: includePlasma.value,
            includeLf: includeLf.value,
            includeLfResearch: includeLfResearch.value,
            activateAllLfResearch: activateAllLfResearch.value,
            capMine: capMine.value,
            capPlasma: capPlasma.value,
            capLf: capLf.value,
            capLfResearch: capLfResearch.value,
            maxSteps: maxSteps.value,
            shopDiscount: shopDiscount.value,
            moBonus: moBonus.value,
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
const includePlasma = ref(true);
const includeLf = ref(true);
const includeLfResearch = ref(false);
const activateAllLfResearch = ref(false);
const capMine = ref(0);            // 0 = nessun cap
const capPlasma = ref(0);
const capLf = ref(0);
const capLfResearch = ref(0);
const lfChoice = ref([]);          // per pianeta: 'inherit' | 'rocktal' | 'humans' | 'mecha'

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
        if (cfg.playerClassOverride !== undefined)   playerClassOverride.value = cfg.playerClassOverride;
        if (cfg.includeMines !== undefined)          includeMines.value = cfg.includeMines;
        if (cfg.includePlasma !== undefined)         includePlasma.value = cfg.includePlasma;
        if (cfg.includeLf !== undefined)             includeLf.value = cfg.includeLf;
        if (cfg.includeLfResearch !== undefined)     includeLfResearch.value = cfg.includeLfResearch;
        if (cfg.activateAllLfResearch !== undefined) activateAllLfResearch.value = cfg.activateAllLfResearch;
        if (cfg.capMine !== undefined)               capMine.value = cfg.capMine;
        if (cfg.capPlasma !== undefined)             capPlasma.value = cfg.capPlasma;
        if (cfg.capLf !== undefined)                 capLf.value = cfg.capLf;
        if (cfg.capLfResearch !== undefined)         capLfResearch.value = cfg.capLfResearch;
        if (cfg.maxSteps !== undefined)              maxSteps.value = cfg.maxSteps;
        if (cfg.shopDiscount !== undefined)          shopDiscount.value = cfg.shopDiscount;
        if (cfg.moBonus !== undefined)               moBonus.value = cfg.moBonus;
    } catch {}
});
watch(
    [packMode, playerClassOverride, includeMines, includePlasma, includeLf, includeLfResearch,
     activateAllLfResearch, capMine, capPlasma, capLf, capLfResearch, maxSteps, shopDiscount, moBonus],
    _saveConfig
);

// Applica gli override locali (LF + classe) allo stato iniziale.
const applyOverrides = (state) => {
    if (!state) return state;
    if (playerClassOverride.value && playerClassOverride.value !== 'inherit') {
        state.settings.playerClass = playerClassOverride.value;
    }
    if (activateAllLfResearch.value) {
        state.planets.forEach(p => {
            Object.keys(p.lfResearch || {}).forEach(id => {
                if ((parseInt(p.lfResearch[id]) || 0) > 0) {
                    if (!p.lfActive) p.lfActive = {};
                    p.lfActive[id] = true;
                }
            });
        });
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
    if (eff === 'humans')  return 'border-l-blue-400';
    if (eff === 'rocktal') return 'border-l-orange-500';
    if (eff === 'mecha')   return 'border-l-teal-400';
    if (eff === 'kaelesh') return 'border-l-purple-400';
    return 'border-l-slate-600';
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
const computePlan = async () => {
    if (!activeProfile.value) return;
    isComputing.value = true;
    result.value = null;

    // Yield al browser così l'utente vede il loading se il calcolo è pesante.
    await new Promise(r => setTimeout(r, 30));

    try {
        const initialState = applyOverrides(buildInitialState(activeProfile.value, lfChoice.value));
        const planRes = runPlanner(initialState, {
            target: parseInt(target.value) || 0,
            maxSteps: parseInt(maxSteps.value) || 80,
            includeMines: includeMines.value,
            includePlasma: includePlasma.value,
            includeLf: includeLf.value,
            includeLfResearch: includeLfResearch.value,
            packMode: packMode.value,
            caps: {
                metalMine: capMine.value > 0 ? capMine.value : Infinity,
                plasma:    capPlasma.value > 0 ? capPlasma.value : Infinity,
                lfBuilding: capLf.value > 0 ? capLf.value : Infinity,
                lfResearch: capLfResearch.value > 0 ? capLfResearch.value : Infinity
            }
        });
        const euro = computeEuroCost(planRes.cumulativePacks, {
            ...initialState.shop,
            shopDiscount: shopDiscount.value,
            moBonus: moBonus.value,
        });
        result.value = { ...planRes, euro, lfChoiceSnapshot: [...lfChoice.value] };
    } finally {
        isComputing.value = false;
    }
};

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
    if (type === 'plasma_technology') return t('strategy_step_plasma');
    if (type === 'lf_magma') return t('strategy_step_lf_magma');
    if (type === 'lf_human') return t('strategy_step_lf_human');
    if (type === 'lf_research') return LF_RESEARCH_SPECIES[s.species]?.label ?? t('strategy_step_lf_research');
    return type;
};
const stepTypeColor = (s) => {
    const type = typeof s === 'string' ? s : s.type;
    if (type === 'metal_mine') return 'sky';
    if (type === 'plasma_technology') return 'violet';
    if (type === 'lf_magma') return 'orange';
    if (type === 'lf_human') return 'blue';
    if (type === 'lf_research') return LF_RESEARCH_SPECIES[s.species]?.color ?? 'emerald';
    return 'slate';
};

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
    alert(t('strategy_imported_to_pack'));
};

// ───── Riassunto per pianeta degli upgrade ──────────────────────────────
const perPlanetSummary = computed(() => {
    if (!result.value) return [];
    const map = new Map();
    result.value.steps.forEach(s => {
        if (s.planetIdx == null) return;
        const k = s.planetIdx;
        if (!map.has(k)) {
            map.set(k, { idx: k, name: s.planetName, metalMine: 0, lfMagma: 0, lfHuman: 0 });
        }
        const e = map.get(k);
        if (s.type === 'metal_mine') e.metalMine++;
        else if (s.type === 'lf_magma') e.lfMagma++;
        else if (s.type === 'lf_human') e.lfHuman++;
    });
    const plasmaSteps = result.value.steps.filter(s => s.type === 'plasma_technology').length;
    const lfResearchCount = result.value.steps.filter(s => s.type === 'lf_research').length;
    return { planets: [...map.values()].sort((a, b) => a.idx - b.idx), plasma: plasmaSteps, lfResearch: lfResearchCount };
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 mt-6 md:mt-10 pb-12">
    <!-- Page Header -->
    <div class="mb-10 text-center relative">
        <h1 class="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            {{ t('strategy_title') }}
        </h1>
        <div class="mt-2 h-[3px] w-24 bg-gradient-to-r from-emerald-500 to-emerald-400 mx-auto rounded-full opacity-70"></div>
    </div>

    <!-- Intro -->
    <div class="card-glass mb-8 border-l-4 border-l-emerald-500/40 bg-emerald-500/[0.03] relative overflow-hidden">
        <button @click="showIntro = !showIntro" class="md:hidden w-full flex items-center justify-between px-4 py-3 text-emerald-400">
            <div class="flex items-center gap-2">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span class="text-xs font-black uppercase tracking-widest">{{ t('strategy_title') }}</span>
            </div>
            <svg class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': showIntro }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="p-6 md:flex md:flex-row md:items-center md:gap-6 relative z-10" :class="showIntro ? 'block' : 'hidden md:flex'">
            <div class="hidden md:block p-4 rounded-2xl bg-emerald-500/[0.08] text-emerald-400 flex-shrink-0">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-3c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z"/></svg>
            </div>
            <div class="flex-grow">
                <p class="text-sm text-gray-300 leading-relaxed font-medium">{{ t('strategy_intro') }}</p>
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
        <div class="card-glass p-5 mb-6 border-l-2 border-l-emerald-500/40">
            <h3 class="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2.5 uppercase tracking-wider">
                <span class="w-[2px] h-4 bg-emerald-400/60 rounded-full flex-shrink-0"></span>
                {{ t('strategy_input_title') }}
            </h3>

            <!-- Riga 1: statistiche + target + step + LF -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 items-start">
                <!-- Produzione attuale -->
                <div class="col-span-2 md:col-span-1 bg-[#0a101e] rounded-xl p-4 border border-slate-700/15">
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">{{ t('strategy_current_prod') }}</div>
                    <div class="text-2xl font-black text-slate-200 font-mono">{{ formatNum(currentProd) }}</div>
                    <div class="text-[10px] text-slate-600 mt-1">{{ t('lbl_dm') }} / {{ t('strategy_per_day') }}</div>
                </div>
                <!-- Target + preset -->
                <div class="col-span-2 md:col-span-1 bg-[#0a101e] rounded-xl p-4 border border-emerald-500/25">
                    <label class="block text-[10px] text-emerald-400 uppercase tracking-wider font-semibold mb-1.5">{{ t('strategy_target') }}</label>
                    <input type="text" v-model="formTarget" @focus="$event.target.select()"
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
                <div class="bg-[#0a101e] rounded-xl p-4 border border-slate-700/15">
                    <label class="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">{{ t('strategy_max_steps') }}</label>
                    <input type="number" v-model.number="maxSteps" @focus="$event.target.select()" min="1" max="2000"
                           class="input-glass w-full px-3 py-2 text-right font-mono">
                    <div class="text-[10px] text-slate-600 mt-1">{{ t('strategy_max_steps_desc') }}</div>
                </div>
                <!-- Bonus LF Research -->
                <div class="bg-[#0a101e] rounded-xl p-4 border transition-colors"
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
                <div class="bg-[#0a101e] rounded-xl p-4 border border-slate-700/15">
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3">{{ t('strategy_categories') }}</div>
                    <div class="flex flex-col gap-2.5">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" v-model="includeMines" class="w-4 h-4 accent-sky-500 rounded flex-shrink-0">
                            <span class="text-[12px] text-slate-300">{{ t('lbl_mine_metal') }}</span>
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
                        <label v-if="hasLfResearchData" class="flex items-center gap-2 cursor-pointer pl-6">
                            <input type="checkbox" v-model="activateAllLfResearch" class="w-3.5 h-3.5 accent-purple-500 rounded flex-shrink-0">
                            <span class="text-[11px] text-slate-500">{{ t('strategy_lf_activate_all') }}</span>
                        </label>
                    </div>
                </div>
                <!-- Cap livello -->
                <div class="bg-[#0a101e] rounded-xl p-4 border border-slate-700/15">
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3">
                        {{ t('strategy_caps') }} <span class="text-slate-700 normal-case font-normal text-[9px]">({{ t('strategy_caps_hint') }})</span>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[9px] text-sky-500/70 uppercase font-semibold mb-1.5 truncate">Min.</label>
                            <input type="number" v-model.number="capMine" min="0"
                                   class="input-glass w-full px-2 py-2 text-center font-mono text-sm">
                        </div>
                        <div>
                            <label class="block text-[9px] text-violet-400/70 uppercase font-semibold mb-1.5 truncate">Plasma</label>
                            <input type="number" v-model.number="capPlasma" min="0"
                                   class="input-glass w-full px-2 py-2 text-center font-mono text-sm">
                        </div>
                        <div>
                            <label class="block text-[9px] text-orange-400/70 uppercase font-semibold mb-1.5 truncate">LF</label>
                            <input type="number" v-model.number="capLf" min="0"
                                   class="input-glass w-full px-2 py-2 text-center font-mono text-sm">
                        </div>
                        <div>
                            <label class="block text-[9px] text-emerald-500/70 uppercase font-semibold mb-1.5 truncate">Ric.LF</label>
                            <input type="number" v-model.number="capLfResearch" min="0"
                                   class="input-glass w-full px-2 py-2 text-center font-mono text-sm">
                        </div>
                    </div>
                </div>
                <!-- Valore pacchetto -->
                <div class="bg-[#0a101e] rounded-xl p-4 border border-slate-700/15">
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
                    <p class="text-[9px] text-slate-700 mt-2 leading-tight">
                        {{ packMode === 'dynamic' ? t('strategy_pack_dynamic_desc') : t('strategy_pack_fixed_desc') }}
                    </p>
                </div>
                <!-- Classe giocatore -->
                <div class="bg-[#0a101e] rounded-xl p-4 border border-slate-700/15">
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
                         class="bg-[#0a101e] rounded-xl border border-slate-700/20 border-l-2 p-3 transition-colors"
                         :class="lfBorderColor(effectiveLf(p, idx))">
                        <!-- Nome pianeta + badge LF attiva -->
                        <div class="flex items-start justify-between gap-1 mb-1.5">
                            <span class="text-[11px] font-semibold text-slate-200 truncate leading-tight" :title="p.name">
                                {{ p.name || `#${idx+1}` }}
                            </span>
                            <span class="text-[8px] font-bold px-1 py-0.5 rounded tracking-wider uppercase flex-shrink-0 leading-tight"
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
            <div v-if="target <= profileDailyProd && target > 0" class="mt-2 text-right text-[11px] text-amber-400/80">
                {{ t('strategy_target_too_low') }}
            </div>
        </div>

        <!-- ────── RISULTATI ────── -->
        <div v-if="result" class="space-y-6">

            <!-- Sommario top -->
            <div class="card-glass p-5 border-l-2 border-l-emerald-500/40">
                <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div class="bg-[#0a101e] rounded-xl p-3 border border-slate-700/15 text-center">
                        <div class="text-[9px] text-slate-600 uppercase tracking-wider font-semibold mb-1">{{ t('strategy_initial') }}</div>
                        <div class="text-lg font-black text-slate-200 font-mono">{{ formatNum(result.initialProd) }}</div>
                    </div>
                    <div class="bg-[#0a101e] rounded-xl p-3 border border-emerald-500/25 text-center">
                        <div class="text-[9px] text-emerald-400 uppercase tracking-wider font-semibold mb-1">{{ t('strategy_final') }}</div>
                        <div class="text-lg font-black text-emerald-300 font-mono">{{ formatNum(result.finalProd) }}</div>
                    </div>
                    <div class="bg-[#0a101e] rounded-xl p-3 border border-slate-700/15 text-center">
                        <div class="text-[9px] text-slate-600 uppercase tracking-wider font-semibold mb-1">{{ t('strategy_total_packs') }}</div>
                        <div class="text-lg font-black text-amber-300 font-mono">{{ formatNum(result.cumulativePacks) }}</div>
                    </div>
                    <div class="bg-[#0a101e] rounded-xl p-3 border border-slate-700/15 text-center">
                        <div class="text-[9px] text-slate-600 uppercase tracking-wider font-semibold mb-1">{{ t('strategy_total_mo') }}</div>
                        <div class="text-lg font-black text-purple-300 font-mono">{{ formatNum(result.euro.totalMO) }}</div>
                    </div>
                    <div class="bg-[#0a101e] rounded-xl p-3 border border-slate-700/15 text-center">
                        <div class="text-[9px] text-slate-600 uppercase tracking-wider font-semibold mb-1">{{ t('strategy_total_euro') }}</div>
                        <div class="text-lg font-black text-green-300 font-mono">€{{ formatNum(result.euro.totalEuro) }}</div>
                    </div>
                </div>

                <!-- Selettori sconto pacchetti + bonus MO -->
                <div class="mt-4 pt-4 border-t border-slate-700/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- Sconto shop -->
                    <div>
                        <div class="text-[9px] text-slate-600 uppercase tracking-widest font-semibold mb-2">{{ t('lbl_shop_discount') }}</div>
                        <div class="flex gap-1 bg-[#070c18]/70 p-1 rounded-xl border border-slate-700/20">
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
                        <div class="grid grid-cols-4 sm:grid-cols-7 gap-1 bg-[#070c18]/70 p-1 rounded-xl border border-slate-700/20">
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

            <!-- Riepilogo per pianeta -->
            <div class="card-glass p-5 border-l-2 border-l-sky-500/40">
                <h3 class="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2.5 uppercase tracking-wider">
                    <span class="w-[2px] h-4 bg-sky-400/60 rounded-full flex-shrink-0"></span>
                    {{ t('strategy_summary_planet') }}
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div v-for="row in perPlanetSummary.planets" :key="row.idx"
                         class="bg-[#0a101e] rounded-lg border border-slate-700/20 px-3 py-2 flex items-center justify-between text-[12px]">
                        <span class="font-mono text-slate-300 truncate">{{ row.name }}</span>
                        <div class="flex gap-2 flex-shrink-0">
                            <span v-if="row.metalMine" class="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-mono text-[10px]">M+{{ row.metalMine }}</span>
                            <span v-if="row.lfMagma" class="px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30 font-mono text-[10px]">FM+{{ row.lfMagma }}</span>
                            <span v-if="row.lfHuman" class="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono text-[10px]">FAE+{{ row.lfHuman }}</span>
                        </div>
                    </div>
                    <div v-if="perPlanetSummary.plasma" class="bg-[#0a101e] rounded-lg border border-violet-500/30 px-3 py-2 flex items-center justify-between text-[12px]">
                        <span class="font-mono text-violet-300">{{ t('plasma_technology') }}</span>
                        <span class="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 font-mono text-[10px]">+{{ perPlanetSummary.plasma }}</span>
                    </div>
                    <div v-if="perPlanetSummary.lfResearch" class="bg-[#0a101e] rounded-lg border border-emerald-500/30 px-3 py-2 flex items-center justify-between text-[12px]">
                        <span class="font-mono text-emerald-300">{{ t('strategy_lf_research') }}</span>
                        <span class="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-[10px]">+{{ perPlanetSummary.lfResearch }}</span>
                    </div>
                </div>
            </div>

            <!-- Roadmap step-by-step -->
            <div class="overflow-hidden rounded-xl border border-slate-700/25 bg-[#0d1525]">
                <div class="px-5 py-3 border-b border-slate-700/25 flex justify-between items-center bg-[#0a101e]">
                    <div class="flex items-center gap-2.5">
                        <span class="w-[2px] h-4 bg-emerald-400/60 rounded-full flex-shrink-0"></span>
                        <h3 class="text-sm font-semibold text-slate-200 uppercase tracking-wider">{{ t('strategy_roadmap') }}</h3>
                    </div>
                    <span class="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] font-mono text-slate-500 border border-slate-700/20">
                        {{ groupedSteps.length }} blocchi
                        <span v-if="groupedSteps.length !== result.steps.length" class="text-slate-700">({{ result.steps.length }} step)</span>
                    </span>
                </div>

                <!-- Desktop table -->
                <div class="hidden md:block overflow-x-auto custom-scrollbar">
                    <table class="w-full text-xs">
                        <thead class="bg-[#0a101e] text-slate-500 uppercase text-[9px] tracking-wider">
                            <tr>
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
                            <tr v-for="s in groupedSteps" :key="s.n"
                                class="border-t border-slate-700/15 hover:bg-white/[0.02]"
                                :class="s.count > 1 ? 'bg-emerald-500/[0.02]' : ''">
                                <td class="px-3 py-2 font-mono text-slate-600 text-[10px] whitespace-nowrap">{{ s.n }}</td>
                                <td class="px-3 py-2 whitespace-nowrap">
                                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border"
                                          :class="{
                                              'bg-sky-500/10 text-sky-300 border-sky-500/30':    stepTypeColor(s) === 'sky',
                                              'bg-violet-500/10 text-violet-300 border-violet-500/30': stepTypeColor(s) === 'violet',
                                              'bg-orange-500/10 text-orange-300 border-orange-500/30': stepTypeColor(s) === 'orange',
                                              'bg-blue-500/10 text-blue-300 border-blue-500/30':   stepTypeColor(s) === 'blue',
                                              'bg-teal-500/10 text-teal-300 border-teal-500/30':   stepTypeColor(s) === 'teal',
                                              'bg-purple-500/10 text-purple-300 border-purple-500/30': stepTypeColor(s) === 'purple',
                                              'bg-emerald-500/10 text-emerald-300 border-emerald-500/30': stepTypeColor(s) === 'emerald'
                                          }">
                                        {{ stepTypeLabel(s) }}
                                    </span>
                                    <span v-if="s.count > 1" class="ml-1.5 text-[9px] text-slate-600 font-mono">×{{ s.count }}</span>
                                </td>
                                <td class="px-3 py-2 font-mono text-slate-400">
                                    <div v-if="s.type === 'lf_research' && s.researchName" class="text-[9px] text-slate-600 leading-tight mb-0.5">{{ s.researchName }}</div>
                                    {{ s.planetName || '—' }}
                                </td>
                                <td class="px-3 py-2 text-center font-mono text-slate-300">{{ s.from }} → {{ s.to }}</td>
                                <td class="px-3 py-2 text-right font-mono text-slate-300">{{ formatNum(s.costMSU) }}</td>
                                <td class="px-3 py-2 text-right font-mono text-amber-300/90">{{ s.packs }}</td>
                                <td class="px-3 py-2 text-right font-mono text-emerald-300">+{{ formatNum(s.deltaProd) }}</td>
                                <td class="px-3 py-2 text-right font-mono font-semibold" :class="roiColor(s.costMSU, s.deltaProd)">{{ formatROI(s.costMSU, s.deltaProd) }}</td>
                                <td class="px-3 py-2 text-right font-mono text-slate-200 font-bold">{{ formatNum(s.cumulativeProd) }}</td>
                                <td class="px-3 py-2 text-right font-mono text-amber-400">{{ s.cumulativePacks }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Mobile cards -->
                <div class="md:hidden p-3 space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div v-for="s in groupedSteps" :key="s.n"
                         class="rounded-lg border p-3"
                         :class="s.count > 1 ? 'bg-emerald-500/[0.03] border-emerald-500/20' : 'bg-[#0a101e] border-slate-700/20'">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-1.5">
                                <span class="text-[10px] font-mono text-slate-600">#{{ s.n }}</span>
                                <span v-if="s.count > 1" class="text-[9px] font-mono text-slate-700">×{{ s.count }}</span>
                            </div>
                            <span class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border"
                                  :class="{
                                      'bg-sky-500/10 text-sky-300 border-sky-500/30':    stepTypeColor(s) === 'sky',
                                      'bg-violet-500/10 text-violet-300 border-violet-500/30': stepTypeColor(s) === 'violet',
                                      'bg-orange-500/10 text-orange-300 border-orange-500/30': stepTypeColor(s) === 'orange',
                                      'bg-blue-500/10 text-blue-300 border-blue-500/30':   stepTypeColor(s) === 'blue',
                                      'bg-teal-500/10 text-teal-300 border-teal-500/30':   stepTypeColor(s) === 'teal',
                                      'bg-purple-500/10 text-purple-300 border-purple-500/30': stepTypeColor(s) === 'purple',
                                      'bg-emerald-500/10 text-emerald-300 border-emerald-500/30': stepTypeColor(s) === 'emerald'
                                  }">{{ stepTypeLabel(s) }}</span>
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
</style>
