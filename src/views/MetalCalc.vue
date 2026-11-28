<script setup>
import PageHead from '../components/PageHead.vue';
import { ref, reactive, computed, watch } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useOgameFormulas, formatPct } from '../composables/useOgameFormulas';
import { useProfiles } from '../composables/useProfiles';
import { useToast } from '../composables/useToast';
import { useOverlay } from '../composables/useOverlay';
import { OGAME_DB, METAL_BOOSTER_PCTS, RES_AMP_PCTS } from '../data/ogame_db';
import PlanetCard from '../components/PlanetCard.vue';
import NumStepper from '../components/NumStepper.vue';

const { t } = useLanguage();
const { show: showToast } = useToast();
const { calcPlanetMetalProduction, calcLFResearchBonus, formatNum } = useOgameFormulas();
const { activeProfile, saveProfiles } = useProfiles();
// Impostazioni account: chiuse di default (arrivano dall'Exporter), aperte se mancano i dati
const settingsOpen = ref(!activeProfile.value?.lastSync);
const bulkOpen = ref(false);

// Valori letti dal gioco all'ultimo import: se l'utente li ha cambiati a mano,
// "Ripristina dal gioco" li rimette. Assenti nei profili sincronizzati prima di questa versione.
const gameSettings = computed(() => activeProfile.value?.production?.gameSettings || null);
const settingsModified = computed(() => !!gameSettings.value &&
    Object.entries(gameSettings.value).some(([k, v]) => settings[k] !== v));
const restoreGameSettings = () => { if (gameSettings.value) Object.assign(settings, gameSettings.value); };

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
useOverlay(bulkConfirmOpen);
useOverlay(resetConfirmOpen);
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
        else if (target === 'item') { if (val === 0 || METAL_BOOSTER_PCTS.includes(val)) p.item = val; }
        // Amplificatore di risorse: tagli fissi come nella scheda pianeta
        else if (target === 'itemCustom') { if (val === 0 || RES_AMP_PCTS.includes(val)) p.itemCustom = val; }
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
  <div class="w-full min-w-0 max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-8">
    <PageHead tool="metal" :title="t('metal_calc_title')" :sub="t('card_metal_desc')" />

    <!-- ── IMPOSTAZIONI GLOBALI ──────────────────────────────────────── -->
    <div class="ov-panel p-5 mb-4" style="--tc:#38bdf8">

        <h2 class="ov-sh" :class="settingsOpen ? 'mb-4' : 'mb-3'">
            {{ t('settings_title') }}
            <span class="ov-sh-r flex items-center gap-2">
                <template v-if="settingsModified">
                    <span class="ov-tag ov-tag-warn">{{ t('settings_modified') }}</span>
                    <button type="button" @click="restoreGameSettings" class="ov-btn ov-btn-ghost ov-btn-sm">{{ t('btn_restore_game') }}</button>
                </template>
                <span v-else-if="activeProfile?.lastSync" class="ov-tag ov-tag-ok">{{ t('settings_from_game') }}</span>
                <button type="button" @click="settingsOpen = !settingsOpen" :aria-expanded="settingsOpen" aria-controls="mc-settings-form"
                        class="ov-btn ov-btn-ghost ov-btn-sm">{{ settingsOpen ? t('pc_close') : t('btn_edit') }}</button>
            </span>
        </h2>

        <!-- Riepilogo: i valori arrivano dall'Exporter, di solito non serve toccarli -->
        <dl v-if="!settingsOpen" class="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
            <div class="flex items-baseline gap-1.5"><dt class="text-slate-400">{{ t('lbl_eco_short') }}</dt><dd class="font-semibold text-slate-100 tabular-nums">×{{ settings.ecoSpeed }}</dd></div>
            <div class="flex items-baseline gap-1.5"><dt class="text-slate-400">{{ t('lbl_player_class') }}</dt>
                <dd class="font-semibold text-slate-100">{{ settings.playerClass === 'collector' ? t('opt_collector') : t('opt_general') }}<span v-if="settings.playerClass === 'collector' && lfResearchPct.collectorBonus > 0" class="text-violet-300 font-medium"> +{{ formatPct(lfResearchPct.collectorBonus, 2) }}%</span></dd></div>
            <div class="flex items-baseline gap-1.5"><dt class="text-slate-400">{{ t('lbl_plasma_short') }}</dt><dd class="font-semibold text-slate-100 tabular-nums">{{ settings.plasma }}</dd></div>
            <div class="flex items-baseline gap-1.5"><dt class="text-slate-400">LF</dt><dd class="font-semibold text-emerald-300 tabular-nums">+{{ formatPct(hasLfResearchData ? lfResearchPct.metal : settings.lfBonus, 2) }}%</dd></div>
            <div class="flex items-baseline gap-1.5"><dt class="text-slate-400">{{ t('lbl_geo_short') }}</dt><dd class="font-semibold" :class="settings.geologist ? 'text-emerald-300' : 'text-slate-500'">{{ settings.geologist ? '✓' : '–' }}</dd></div>
            <div class="flex items-baseline gap-1.5"><dt class="text-slate-400">{{ t('lbl_staff_short') }}</dt><dd class="font-semibold" :class="settings.staff ? 'text-emerald-300' : 'text-slate-500'">{{ settings.staff ? '✓' : '–' }}</dd></div>
            <div class="flex items-baseline gap-1.5"><dt class="text-slate-400">{{ t('lbl_ally_short') }}</dt><dd class="font-semibold text-slate-100">{{ settings.allyClass === 'trader' ? t('opt_trader') : t('opt_none') }}</dd></div>
        </dl>

        <div v-show="settingsOpen" id="mc-settings-form">
        <!-- Riga 1: controlli principali (campi larghi quanto il valore che contengono) -->
        <div class="flex flex-wrap items-end gap-x-5 gap-y-3 mb-4">
            <div>
                <label for="mc-eco-speed" class="ov-label mb-1.5">{{ t('lbl_eco_speed') }}</label>
                <NumStepper id="mc-eco-speed" v-model="settings.ecoSpeed" :min="1" :max="10" class="w-24" input-class="h-10" />
            </div>
            <div class="min-w-[16rem] flex-1 max-w-sm">
                <label for="mc-player-class" class="ov-label mb-1.5">{{ t('lbl_player_class') }}</label>
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
                            <span class="text-violet-300">+{{ formatPct(lfResearchPct.collectorBonus, 2) }}%</span>
                            <span class="ov-tag ov-tag-ok">{{ t('lbl_auto') }}</span>
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
                <label for="mc-plasma" class="ov-label mb-1.5">{{ t('lbl_plasma') }}</label>
                <NumStepper id="mc-plasma" v-model="settings.plasma" class="w-28" input-class="h-10" />
            </div>
            <div class="w-44">
                <label for="mc-lf-bonus" class="ov-label mb-1.5 whitespace-nowrap">
                    {{ t('lbl_lf_bonus') }} %
                    <span v-if="hasLfResearchData" class="ov-tag ov-tag-ok ml-1">{{ t('lbl_auto') }}</span>
                </label>
                <!-- Computed: mostra il totale calcolato dalle ricerche reali -->
                <div v-if="hasLfResearchData"
                    class="input-glass w-full h-10 px-3 flex items-center justify-center tabular-nums text-emerald-300 !border-dashed cursor-default select-none"
                    :title="t('lbl_lf_bonus_computed')">
                    +{{ formatPct(lfResearchPct.metal, 2) }}
                </div>
                <!-- Manuale: nessun dato LF importato -->
                <input v-else id="mc-lf-bonus" type="number" v-model.number="settings.lfBonus"
                    @focus="$event.target.select()" class="input-glass w-full h-10 px-2 text-center tabular-nums">
            </div>
        </div>

        <!-- Riga 2: flag e classe alleanza -->
        <div class="flex items-center gap-4 flex-wrap border-t border-ogame-line pt-3">
            <label class="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" v-model="settings.geologist" class="w-4 h-4 accent-cyan-400 rounded cursor-pointer">
                <span class="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{{ t('lbl_geo') }}</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" v-model="settings.staff" class="w-4 h-4 accent-cyan-400 rounded cursor-pointer">
                <span class="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{{ t('lbl_staff') }}</span>
            </label>
            <div class="flex items-center gap-2 ml-auto">
                <span class="ov-label">{{ t('lbl_ally_class') }}</span>
                <select v-model="settings.allyClass" class="input-glass px-3 py-1.5 text-sm">
                    <option value="none">{{ t('opt_none') }}</option>
                    <option value="trader">{{ t('opt_trader') }}</option>
                </select>
            </div>
        </div>

        <!-- Collector bonus detail (condizionale) -->
        <div v-if="settings.playerClass === 'collector'" class="mt-3 pt-3 border-t border-ogame-line flex items-center gap-x-6 gap-y-1.5 flex-wrap">
            <div class="flex items-baseline gap-1.5">
                <span class="text-xs text-slate-400">{{ t('lbl_mine_prod_ext') }}</span>
                <span class="text-sm font-bold text-sky-300 tabular-nums">+{{ collBreakdown.mine }}%</span>
            </div>
            <div class="flex items-baseline gap-1.5">
                <span class="text-xs text-slate-400">{{ t('lbl_crawler_prod_ext') }}</span>
                <span class="text-sm font-bold text-amber-300 tabular-nums">+{{ collBreakdown.crawler }}%</span>
            </div>
            <div class="flex items-baseline gap-1.5">
                <span class="text-xs text-slate-400">{{ t('lbl_max_crawlers_geo_ext') }}</span>
                <span class="text-sm font-bold text-emerald-300 tabular-nums">+{{ collBreakdown.geo }}%</span>
            </div>
        </div>
        </div>
    </div>

    <div class="flex flex-row justify-between items-center mb-4 gap-4">
        <h2 class="ov-sh flex-grow" style="--tc:#38bdf8">
            {{ t('planet_mgmt') }} <span class="text-slate-100">· {{ planets.length }}</span>
        </h2>
        <div class="flex items-center gap-2">
            <button @click="resetAll" :aria-label="t('btn_reset')" class="ov-btn ov-btn-ghost w-9 px-0 hover:!text-rose-300 hover:!border-rose-500/40" :title="t('btn_reset')">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
            <button type="button" @click="bulkOpen = !bulkOpen" :aria-expanded="bulkOpen" aria-controls="mc-bulk"
                    class="ov-btn ov-btn-ghost" :class="bulkOpen && '!text-slate-100 !border-slate-500'">
                <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h10M4 12h16M4 18h7m9-12h-2m-6 12h8"/><circle cx="16" cy="6" r="2"/><circle cx="13" cy="18" r="2"/></svg>
                <span class="hidden sm:inline">{{ t('btn_bulk_edit') }}</span>
            </button>
            <button @click="addPlanet" class="ov-btn ov-btn-primary">
                <span class="text-lg leading-none">+</span>
                <span class="hidden md:inline">{{ t('btn_add_planet') }}</span>
            </button>
        </div>
    </div>

    <!-- Modifica massiva: si apre da "Modifica tutti" -->
    <div v-if="bulkOpen" id="mc-bulk" class="ov-panel p-3 mb-4 flex items-center gap-3 flex-wrap" style="--tc:#38bdf8">
        <span class="ov-sh ov-sh-noline flex-shrink-0">{{ t('bulk_title') }}</span>
        <select v-model="bulkTarget" class="input-glass px-2 py-1.5 text-sm flex-shrink-0">
            <option value="metal">{{ t('lbl_mine_metal') }}</option>
            <option value="crystal">{{ t('lbl_mine_crystal') }}</option>
            <option value="deuterium">{{ t('lbl_mine_deuterium') }}</option>
            <option value="item">{{ t('lbl_item') }} (%)</option>
            <option value="itemCustom">{{ t('lbl_item_additional') }} (%)</option>
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
            <option v-for="pct in METAL_BOOSTER_PCTS" :key="pct" :value="pct">+{{ pct }}%</option>
        </select>
        <select v-else-if="bulkTarget === 'itemCustom'" v-model="bulkValue" class="input-glass px-2 py-1.5 text-sm flex-shrink-0">
            <option value="0">&ndash;</option>
            <option v-for="pct in RES_AMP_PCTS" :key="pct" :value="pct">+{{ pct }}%</option>
        </select>
        <select v-else-if="bulkTarget === 'lf_research_active' || bulkTarget === 'overload'" v-model="bulkValue" class="input-glass px-2 py-1.5 text-sm flex-shrink-0">
            <option value="1">{{ t('bulk_lf_enable') }}</option>
            <option value="0">{{ t('bulk_lf_disable') }}</option>
        </select>
        <input v-else type="number" v-model="bulkValue" @focus="$event.target.select()"
               :placeholder="t('bulk_placeholder')" class="input-glass px-3 py-1.5 text-sm tabular-nums w-36 flex-shrink-0">

        <button @click="requestBulk" class="ov-btn ov-btn-tint flex-shrink-0">
            {{ t('btn_bulk_apply') }}
        </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
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

  </div>

  <!-- Barra fissa dei risultati -->
  <div class="ov-resultbar">
    <div class="ov-resultbar-in">
      <div class="ov-stat"><span class="ov-stat-k">{{ t('footer_prod_hour') }}</span><span class="ov-stat-v md:text-2xl">{{ formatNum(totals.hourly) }}</span></div>
      <div class="ov-stat"><span class="ov-stat-k">{{ t('footer_pack_day') }}</span><span class="ov-stat-v md:text-2xl text-amber-300">{{ formatNum(totals.daily) }}</span></div>
    </div>
  </div>

  <!-- Confirm bulk apply dialog -->
  <Transition name="fade">
    <div v-if="bulkConfirmOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div class="absolute inset-0 bg-black/70" @click="bulkConfirmOpen = false"></div>
      <div class="ov-dialog bg-ogame-panel border border-slate-700 rounded-xl w-full max-w-sm p-6 relative z-10 shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
        <p class="text-white font-semibold text-base mb-2 leading-snug">{{ t('btn_bulk_apply') }}?</p>
        <p class="text-slate-400 text-sm mb-7">{{ t('msg_bulk_confirm') }}</p>
        <div class="flex justify-end gap-3">
          <button @click="bulkConfirmOpen = false" class="ov-btn ov-btn-ghost">
            {{ t('btn_cancel') }}
          </button>
          <button @click="doBulkApply" class="ov-btn ov-btn-primary">
            {{ t('btn_confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Confirm reset dialog -->
  <Transition name="fade">
    <div v-if="resetConfirmOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" :aria-label="t('btn_reset')">
      <div class="absolute inset-0 bg-black/70" @click="resetConfirmOpen = false"></div>
      <div class="ov-dialog bg-ogame-panel border border-slate-700 rounded-xl w-full max-w-sm p-6 relative z-10 shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
        <p class="text-white font-semibold text-base mb-2 leading-snug">{{ t('btn_reset') }}?</p>
        <p class="text-slate-400 text-sm mb-7">{{ t('msg_reset_confirm') }}</p>
        <div class="flex justify-end gap-3">
          <button @click="resetConfirmOpen = false" class="ov-btn ov-btn-ghost">
            {{ t('btn_cancel') }}
          </button>
          <button @click="doResetAll" class="ov-btn ov-btn-danger">
            {{ t('btn_confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>

</template>

<style scoped>
</style>
