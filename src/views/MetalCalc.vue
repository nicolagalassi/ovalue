<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useOgameFormulas } from '../composables/useOgameFormulas';
import { useProfiles } from '../composables/useProfiles';
import { useToast } from '../composables/useToast';
import { OGAME_DB } from '../data/ogame_db';
import PlanetCard from '../components/PlanetCard.vue';

const { t } = useLanguage();
const { show: showToast } = useToast();
const { calcPlanetMetalProduction, calcLFResearchBonus, formatNum } = useOgameFormulas();
const { activeProfile, saveProfiles } = useProfiles();

const settings = reactive({
    ecoSpeed: 8,
    playerClass: 'collector', 
    rocktalEnhancement: 0,
    allyClass: 'none',        
    plasma: 0,
    geologist: false,
    staff: false,
    lfBonus: 0
});

const planets = ref([]);
const bulkTarget = ref('metal');
const bulkValue = ref('');
const showAllLfResearch = ref(false);

// Sync with active profile
watch(activeProfile, (newP) => {
    if (newP && newP.production) {
        Object.assign(settings, JSON.parse(JSON.stringify(newP.production.settings)));
        planets.value = JSON.parse(JSON.stringify(newP.production.planets)).map(p => ({
            ...p,
            id: p.id || crypto.randomUUID()
        }));
    }
}, { immediate: true });

// Save changes back to profile — debounced to avoid blocking the main thread on every keystroke
let saveDebounce = null;
watch([settings, planets], () => {
    if (!activeProfile.value) return;
    clearTimeout(saveDebounce);
    saveDebounce = setTimeout(() => {
        if (!activeProfile.value) return;
        activeProfile.value.production.settings = JSON.parse(JSON.stringify(settings));
        activeProfile.value.production.planets = JSON.parse(JSON.stringify(planets.value));
        activeProfile.value.production.daily = totals.value.daily;
        saveProfiles();
        localStorage.setItem('ogameDailyMetal', totals.value.daily);
    }, 400);
}, { deep: true });

const createPlanet = () => ({
    id: crypto.randomUUID(),
    name: '',
    metal: 30, crystal: 25, deuterium: 20,
    pos: 8,
    item: 0, itemCustom: 0,
    magma: 0, human: 0,
    lifeform: 'humans',
    crawlers: 0, overload: false,
    lifeformLevel: 0,
    lfResearch: {},
    lfBuildings: {},
    lfActive: {}
});

const addPlanet = () => { planets.value.push(createPlanet()); };
const clonePlanet = (index) => {
    const clone = JSON.parse(JSON.stringify(planets.value[index]));
    clone.id = crypto.randomUUID();
    planets.value.splice(index + 1, 0, clone);
};
const removePlanet = (index) => { planets.value.splice(index, 1); };
const resetConfirmOpen = ref(false);
const resetAll = () => { resetConfirmOpen.value = true; };
const doResetAll = () => { planets.value = [createPlanet()]; resetConfirmOpen.value = false; };

const bulkConfirmOpen = ref(false);
const requestBulk = () => { if (bulkValue.value !== '' && planets.value.length > 1) { bulkConfirmOpen.value = true; } else { applyBulk(); } };
const doBulkApply = () => { applyBulk(); bulkConfirmOpen.value = false; };

const applyBulk = () => {
    const target = bulkTarget.value;
    const ids = lfRelevantResearchIds.value;

    if (target === 'lf_research_active') {
        const active = bulkValue.value !== '0' && bulkValue.value !== 0;
        planets.value.forEach(p => {
            if (!p.lfActive)   p.lfActive   = {};
            if (!p.lfResearch) p.lfResearch  = {};
            ids.forEach(id => { p.lfActive[id] = active; });
        });
        return;
    }

    if (target === 'lf_research_level') {
        const lvl = parseInt(bulkValue.value);
        if (isNaN(lvl) || lvl < 0) return;
        planets.value.forEach(p => {
            if (!p.lfResearch) p.lfResearch = {};
            if (!p.lfActive)   p.lfActive   = {};
            ids.forEach(id => {
                p.lfResearch[id] = lvl;
                // Attiva automaticamente se il livello è > 0, disattiva se 0
                if (lvl > 0) p.lfActive[id] = true;
                else delete p.lfActive[id];
            });
        });
        return;
    }

    const val = target === 'lifeform' ? bulkValue.value : parseInt(bulkValue.value);
    if (target !== 'lifeform' && isNaN(val)) return;
    planets.value.forEach(p => {
        if (target === 'overload') p.overload = (val === 1);
        else if (target === 'item') { if ([0,10,20,30,40].includes(val)) p.item = val; }
        else if (target === 'lifeform') p.lifeform = val;
        else if (p.hasOwnProperty(target)) p[target] = val;
    });
};

// ID ricerche LF rilevanti per metallo o bonus collezionista (usate nelle operazioni bulk)
const lfRelevantResearchIds = computed(() => {
    const ids = [];
    for (const lf of ['humans', 'rocktal', 'mecha', 'kaelesh']) {
        const cat = OGAME_DB[`lf_${lf}_res`];
        if (!cat) continue;
        for (const [id, item] of Object.entries(cat.items || {})) {
            const b = item.bonus;
            if (b && ((b[0] || 0) > 0 || (b[6] || 0) > 0)) ids.push(id);
        }
    }
    return ids;
});

// Bonus LF globale (somma di tutti i pianeti, applicato ugualmente a ciascuno)
const lfResearchPct = computed(() => calcLFResearchBonus(planets.value));

// True se almeno un pianeta ha dati di ricerca LF importati (anche non ancora attivati)
const hasLfResearchData = computed(() =>
    planets.value.some(p => Object.values(p.lfResearch || {}).some(v => v > 0))
);

const totals = computed(() => {
    const lfrPct = lfResearchPct.value;
    let hourly = 0;
    planets.value.forEach(p => {
        hourly += calcPlanetMetalProduction(p, settings, lfrPct).total;
    });
    return { hourly, daily: Math.floor(hourly * 24) };
});

const collBreakdown = computed(() => {
    const f = 1 + ((settings.rocktalEnhancement + (lfResearchPct.value.collectorBonus || 0)) / 100);
    return {
        mine: (25 * f).toFixed(2),
        crawler: (50 * f).toFixed(2),
        geo: (10 * f).toFixed(2)
    };
});

</script>

<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 mt-6 md:mt-10 pb-32">
    <!-- Page Header -->
    <div class="mb-10 text-center relative">
        <h1 class="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">
            {{ t('metal_calc_title') }}
        </h1>
        <div class="mt-2 h-[3px] w-24 bg-gradient-to-r from-sky-500 to-sky-400 mx-auto rounded-full opacity-70"></div>
    </div>



    <!-- ── IMPOSTAZIONI GLOBALI ──────────────────────────────────────── -->
    <div class="card-glass p-5 mb-6">

        <h3 class="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2 uppercase tracking-wider">
            <svg class="w-3.5 h-3.5 text-sky-400/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
            {{ t('settings_title') }}
        </h3>

        <!-- Riga 1: controlli principali -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
            <div>
                <label for="mc-eco-speed" class="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">{{ t('lbl_eco_speed') }}</label>
                <input id="mc-eco-speed" type="number" v-model.number="settings.ecoSpeed" @focus="$event.target.select()" class="input-glass w-full px-3 py-2 text-center font-mono">
            </div>
            <div class="col-span-2">
                <label for="mc-player-class" class="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">{{ t('lbl_player_class') }}</label>
                <div class="flex gap-2">
                    <select id="mc-player-class" v-model="settings.playerClass" class="input-glass flex-grow px-3 py-2 text-sm h-10">
                        <option value="collector">{{ t('opt_collector') }}</option>
                        <option value="other">{{ t('opt_general') }}</option>
                    </select>
                    <template v-if="settings.playerClass === 'collector'">
                        <!-- Auto da T18 LF: stessa altezza del select (h-10), colore viola -->
                        <div v-if="lfResearchPct.collectorBonus > 0"
                             class="input-glass h-10 w-24 px-2 flex items-center justify-center gap-1 font-mono text-sm cursor-default select-none"
                             :title="t('lbl_lf_collector_bonus')">
                            <span class="text-violet-300">+{{ lfResearchPct.collectorBonus.toFixed(2) }}%</span>
                            <span class="text-[10px] text-violet-500/60 uppercase tracking-wider font-bold">{{ t('lbl_auto') }}</span>
                        </div>
                        <!-- Manuale: nessun dato T18 importato -->
                        <input v-else type="number" step="0.1"
                               v-model.number="settings.rocktalEnhancement" @focus="$event.target.select()"
                               class="input-glass h-10 w-20 px-2 py-2 text-center font-mono" placeholder="0.0"
                               :title="t('lbl_rocktal_collector_bonus')">
                    </template>
                </div>
            </div>
            <div>
                <label for="mc-plasma" class="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">{{ t('lbl_plasma') }}</label>
                <input id="mc-plasma" type="number" v-model.number="settings.plasma" @focus="$event.target.select()" class="input-glass w-full px-3 py-2 text-center font-mono">
            </div>
            <div>
                <label for="mc-lf-bonus" class="block text-[10px] uppercase tracking-wider font-semibold mb-1.5"
                    :class="hasLfResearchData ? 'text-ogame-success/70' : 'text-slate-500'">
                    {{ t('lbl_lf_bonus') }} %
                    <span v-if="hasLfResearchData" class="normal-case tracking-normal text-[9px] text-ogame-success/50 ml-1">{{ t('lbl_auto') }}</span>
                </label>
                <!-- Computed: mostra il totale calcolato dalle ricerche reali -->
                <div v-if="hasLfResearchData"
                    class="input-glass w-full px-3 py-2 text-center font-mono text-ogame-success cursor-default select-none"
                    :title="t('lbl_lf_bonus_computed')">
                    +{{ lfResearchPct.metal.toFixed(2) }}
                </div>
                <!-- Manuale: nessun dato LF importato -->
                <input v-else id="mc-lf-bonus" type="number" v-model.number="settings.lfBonus"
                    @focus="$event.target.select()" class="input-glass w-full px-3 py-2 text-center font-mono">
            </div>
        </div>

        <!-- Riga 2: flag e classe alleanza -->
        <div class="flex items-center gap-4 flex-wrap border-t border-slate-700/20 pt-3">
            <label class="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" v-model="settings.geologist" class="w-4 h-4 accent-sky-500 rounded cursor-pointer">
                <span class="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{{ t('lbl_geo') }}</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" v-model="settings.staff" class="w-4 h-4 accent-sky-500 rounded cursor-pointer">
                <span class="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{{ t('lbl_staff') }}</span>
            </label>
            <div class="flex items-center gap-2 ml-auto">
                <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{{ t('lbl_ally_class') }}</span>
                <select v-model="settings.allyClass" class="input-glass px-3 py-1.5 text-sm">
                    <option value="none">{{ t('opt_none') }}</option>
                    <option value="trader">{{ t('opt_trader') }}</option>
                </select>
            </div>
        </div>

        <!-- Collector bonus detail (condizionale) -->
        <div v-if="settings.playerClass === 'collector'" class="mt-3 pt-3 border-t border-slate-700/20 flex items-center gap-x-6 gap-y-1.5 flex-wrap">
            <div class="flex items-baseline gap-1.5">
                <span class="text-xs text-slate-400">{{ t('lbl_mine_prod_ext') }}</span>
                <span class="text-sm font-black text-sky-300 font-mono">+{{ collBreakdown.mine }}%</span>
            </div>
            <div class="flex items-baseline gap-1.5">
                <span class="text-xs text-slate-400">{{ t('lbl_crawler_prod_ext') }}</span>
                <span class="text-sm font-black text-amber-300 font-mono">+{{ collBreakdown.crawler }}%</span>
            </div>
            <div class="flex items-baseline gap-1.5">
                <span class="text-xs text-slate-400">{{ t('lbl_max_crawlers_geo_ext') }}</span>
                <span class="text-sm font-black text-emerald-300 font-mono">+{{ collBreakdown.geo }}%</span>
            </div>
        </div>
    </div>

    <!-- ── MODIFICA MASSIVA ───────────────────────────────────────── -->
    <div class="bg-ogame-panel border border-slate-700/20 rounded-xl p-3 mb-6 flex items-center gap-3 flex-wrap">
        <div class="flex items-center gap-1.5 text-violet-400/70 flex-shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            <span class="text-[11px] font-semibold uppercase tracking-wider">{{ t('bulk_title') }}</span>
        </div>
        <select v-model="bulkTarget" class="input-glass px-2 py-1.5 text-sm flex-shrink-0">
            <option value="metal">{{ t('lbl_mine_metal') }}</option>
            <option value="crystal">{{ t('lbl_mine_crystal') }}</option>
            <option value="deuterium">{{ t('lbl_mine_deuterium') }}</option>
            <option value="item">{{ t('lbl_item') }} (%)</option>
            <option value="pos">{{ t('lbl_position') }}</option>
            <option value="magma">{{ t('lbl_magma') }}</option>
            <option value="human">{{ t('lbl_human') }}</option>
            <option value="lifeform">{{ t('lbl_lifeform') }}</option>
            <option value="crawlers">{{ t('lbl_crawlers') }}</option>
            <option value="overload">{{ t('lbl_overload') }}</option>
            <option value="lf_research_active">{{ t('bulk_lf_active') }}</option>
            <option value="lf_research_level">{{ t('bulk_lf_level') }}</option>
        </select>

        <!-- Selezione valore in base al target -->
        <select v-if="bulkTarget === 'lifeform'" v-model="bulkValue" class="input-glass px-2 py-1.5 text-sm flex-shrink-0">
            <option value="humans">{{ t('opt_humans') }}</option>
            <option value="rocktal">{{ t('opt_rocktal') }}</option>
            <option value="mecha">{{ t('opt_mecha') }}</option>
        </select>
        <select v-else-if="bulkTarget === 'item'" v-model="bulkValue" class="input-glass px-2 py-1.5 text-sm flex-shrink-0">
            <option value="0">&ndash;</option>
            <option value="10">+10%</option>
            <option value="20">+20%</option>
            <option value="30">+30%</option>
            <option value="40">+40%</option>
        </select>
        <select v-else-if="bulkTarget === 'lf_research_active' || bulkTarget === 'overload'" v-model="bulkValue" class="input-glass px-2 py-1.5 text-sm flex-shrink-0">
            <option value="1">{{ t('bulk_lf_enable') }}</option>
            <option value="0">{{ t('bulk_lf_disable') }}</option>
        </select>
        <input v-else type="number" v-model="bulkValue" @focus="$event.target.select()"
               :placeholder="t('bulk_placeholder')" class="input-glass px-3 py-1.5 text-sm font-mono w-28 flex-shrink-0">

        <button @click="requestBulk"
                class="bg-violet-600/80 hover:bg-violet-500 text-white font-semibold px-4 py-1.5 rounded-lg text-sm transition flex-shrink-0">
            {{ t('btn_bulk_apply') }}
        </button>
    </div>

    <div class="flex flex-row justify-between items-center mb-6 gap-4">
        <h2 class="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 font-mono">
            <svg class="w-3.5 h-3.5 text-sky-400/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>{{ t('planet_mgmt') }}</span>
            <span class="text-xs font-bold text-sky-400 bg-sky-900/20 px-2 py-1 rounded border border-sky-500/20">
                {{ planets.length }}
            </span>
        </h2>
        <div class="flex items-center gap-2">
            <button @click="resetAll" :aria-label="t('btn_reset')" class="flex items-center justify-center w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-200 transition border border-red-500/20" :title="t('btn_reset')">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
            <button @click="addPlanet" class="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center gap-2">
                <span class="text-lg leading-none">+</span>
                <span class="hidden md:inline">{{ t('btn_add_planet') }}</span>
            </button>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <PlanetCard
            v-for="(planet, index) in planets"
            :key="planet.id"
            :planet="planet"
            :index="index"
            :global="settings"
            :lf-research-pct="lfResearchPct"
            :show-lf-research="showAllLfResearch"
            @toggle-lf-research="showAllLfResearch = !showAllLfResearch"
            @clone="clonePlanet(index)"
            @remove="removePlanet(index)"
        />
    </div>

<div class="fixed bottom-0 left-0 w-full bg-ogame-bg/95 backdrop-blur-xl border-t border-slate-700/25 py-3 z-40">
        <div class="max-w-7xl mx-auto flex flex-row items-center px-4 md:px-6 gap-0">
            <div class="text-center flex-1 cursor-default">
                <div class="text-[9px] text-slate-600 uppercase tracking-widest font-semibold mb-0.5">{{ t('footer_prod_hour') }}</div>
                <div class="text-xl md:text-3xl font-black text-slate-100 font-mono tracking-tight">
                    {{ formatNum(totals.hourly) }}
                </div>
            </div>
            <div class="h-10 w-px bg-slate-700/30 mx-4"></div>
            <div class="text-center flex-1 cursor-default">
                <div class="text-[9px] text-amber-400/50 uppercase tracking-widest font-semibold mb-0.5">{{ t('footer_pack_day') }}</div>
                <div class="text-xl md:text-3xl font-black text-amber-300 font-mono tracking-tight">
                    {{ formatNum(totals.daily) }}
                </div>
            </div>
        </div>
    </div>
  </div>

  <!-- Confirm bulk apply dialog -->
  <Transition name="fade">
    <div v-if="bulkConfirmOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="bulkConfirmOpen = false"></div>
      <div class="bg-ogame-panel border border-white/10 rounded-xl w-full max-w-sm p-7 relative z-10 shadow-2xl">
        <p class="text-white font-semibold text-base mb-2 leading-snug">{{ t('btn_bulk_apply') }}?</p>
        <p class="text-slate-400 text-sm mb-7">{{ t('msg_bulk_confirm') }}</p>
        <div class="flex justify-end gap-3">
          <button @click="bulkConfirmOpen = false" class="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition text-sm">
            {{ t('btn_cancel') }}
          </button>
          <button @click="doBulkApply" class="px-6 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-black uppercase tracking-wider transition text-sm">
            {{ t('btn_confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Confirm reset dialog -->
  <Transition name="fade">
    <div v-if="resetConfirmOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" :aria-label="t('btn_reset')">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="resetConfirmOpen = false"></div>
      <div class="bg-ogame-panel border border-white/10 rounded-xl w-full max-w-sm p-7 relative z-10 shadow-2xl">
        <p class="text-white font-semibold text-base mb-2 leading-snug">{{ t('btn_reset') }}?</p>
        <p class="text-slate-400 text-sm mb-7">{{ t('msg_reset_confirm') }}</p>
        <div class="flex justify-end gap-3">
          <button @click="resetConfirmOpen = false" class="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition text-sm">
            {{ t('btn_cancel') }}
          </button>
          <button @click="doResetAll" class="px-6 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-black uppercase tracking-wider transition text-sm">
            {{ t('btn_confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>

</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active, .fade-leave-active { transition: none; }
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
</style>