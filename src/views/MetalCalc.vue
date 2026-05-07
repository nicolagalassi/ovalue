<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useOgameFormulas } from '../composables/useOgameFormulas';
import { useProfiles } from '../composables/useProfiles';
import PlanetCard from '../components/PlanetCard.vue';

const { t } = useLanguage();
const { calcMineProduction, getPosMult, calcCrawlerCap, formatNum } = useOgameFormulas();
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
const showIntro = ref(false);

// Sync with active profile
watch(activeProfile, (newP) => {
    if (newP && newP.production) {
        Object.assign(settings, JSON.parse(JSON.stringify(newP.production.settings)));
        planets.value = JSON.parse(JSON.stringify(newP.production.planets));
    }
}, { immediate: true });

// Save changes back to profile
watch([settings, planets], () => {
    if (activeProfile.value) {
        activeProfile.value.production.settings = JSON.parse(JSON.stringify(settings));
        activeProfile.value.production.planets = JSON.parse(JSON.stringify(planets.value));
        activeProfile.value.production.daily = totals.value.daily;
        saveProfiles();
        localStorage.setItem('ogameDailyMetal', totals.value.daily);
    }
}, { deep: true });

const createPlanet = () => ({
    name: '',
    metal: 30, crystal: 25, deuterium: 20,
    pos: 8,
    item: 0, itemCustom: 0,
    magma: 0, human: 0,
    lifeform: 'humans',
    crawlers: 0, overload: false
});

const addPlanet = () => { planets.value.push(createPlanet()); };
const clonePlanet = (index) => { planets.value.splice(index + 1, 0, JSON.parse(JSON.stringify(planets.value[index]))); };
const removePlanet = (index) => { planets.value.splice(index, 1); };
const resetAll = () => { 
    if(confirm(t('btn_reset') + "?")) { 
        planets.value = [createPlanet()]; 
    } 
};

const applyBulk = () => {
    const val = bulkTarget.value === 'lifeform' ? bulkValue.value : parseInt(bulkValue.value);
    if (bulkTarget.value !== 'lifeform' && isNaN(val)) return;
    planets.value.forEach(p => {
        if (bulkTarget.value === 'overload') p.overload = (val === 1);
        else if (bulkTarget.value === 'item') { if ([0,10,20,30,40].includes(val)) p.item = val; } 
        else if (bulkTarget.value === 'lifeform') p.lifeform = val;
        else if (p.hasOwnProperty(bulkTarget.value)) p[bulkTarget.value] = val;
    });
};

const totals = computed(() => {
    let hourly = 0;
    const collFactor = 1 + (settings.rocktalEnhancement / 100);
    
    planets.value.forEach(p => {
        const met = parseInt(p.metal) || 0;
        const posMult = getPosMult(p.pos);
        const natProd = Math.floor(30 * settings.ecoSpeed * posMult);
        const mineBase = calcMineProduction(met, settings.ecoSpeed, posMult);
        
        let totPerc = 0;
        totPerc += settings.plasma * 1;
        if (settings.geologist) totPerc += 10;
        if (settings.staff) totPerc += 2;
        
        if (settings.playerClass === 'collector') {
            totPerc += 25 * collFactor;
        }
        
        if (settings.allyClass === 'trader') totPerc += 5;
        
        totPerc += (parseInt(p.item)||0) + (parseInt(p.itemCustom)||0);
        
        if (p.lifeform === 'rocktal') {
            totPerc += (parseInt(p.magma)||0) * 2;
        } else if (p.lifeform === 'humans') {
            totPerc += (parseInt(p.human)||0) * 1.5;
        }
        
        totPerc += settings.lfBonus;

        const isCollector = settings.playerClass === 'collector';
        const maxCraw = calcCrawlerCap(met, p.crystal, p.deuterium, isCollector, settings.geologist, settings.rocktalEnhancement);
        
        const actCraw = Math.min((parseInt(p.crawlers)||0), maxCraw);
        if (actCraw > 0) {
            let mult = 0.02;
            if (settings.playerClass === 'collector') { 
                const crawlerBonusPercentage = 50 * collFactor;
                mult *= (1 + crawlerBonusPercentage / 100); 
                if (p.overload) mult *= 1.5; 
            }
            totPerc += (actCraw * mult);
        }

        const bonusProd = Math.floor(mineBase * (totPerc / 100));
        hourly += (natProd + mineBase + bonusProd);
    });
    return { hourly, daily: Math.floor(hourly * 24) };
});

const collBreakdown = computed(() => {
    const f = 1 + (settings.rocktalEnhancement / 100);
    return {
        mine: (25 * f).toFixed(2),
        crawler: (50 * f).toFixed(2),
        geo: (10 * f).toFixed(2)
    };
});

</script>

<template>
  <Teleport to="#header-actions">
      <button @click="resetAll" class="flex items-center justify-center w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-200 transition group border border-red-500/20" :title="t('btn_reset')">
          <svg class="w-4 h-4 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
  </Teleport>

  <div class="max-w-7xl mx-auto px-4 md:px-6 mt-6 md:mt-10 pb-32">
    <!-- Page Header -->
    <div class="mb-10 text-center relative">
        <h1 class="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            {{ t('metal_calc_title') }}
        </h1>
        <div class="mt-2 h-1 w-24 bg-cyan-500 mx-auto rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
    </div>

    <!-- Intro Section -->
    <div class="card-glass mb-8 border-l-4 border-l-cyan-500/50 bg-cyan-500/5 backdrop-blur-md relative overflow-hidden">

        <!-- Mobile: collapsed header -->
        <button @click="showIntro = !showIntro" class="md:hidden w-full flex items-center justify-between px-4 py-3 text-cyan-400">
            <div class="flex items-center gap-2">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span class="text-xs font-black uppercase tracking-widest">{{ t('metal_calc_title') }}</span>
            </div>
            <svg class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': showIntro }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>

        <!-- Collapsible body on mobile, always visible on desktop -->
        <div class="p-6 md:flex md:flex-row md:items-center md:gap-6 relative z-10 group" :class="showIntro ? 'block' : 'hidden md:flex'">
            <div class="hidden md:block p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.1)] flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div class="flex-grow">
                <p class="text-sm text-gray-300 leading-relaxed font-medium mb-4">{{ t('metal_calc_intro') }}</p>
                <a href="https://update.greasyfork.org/scripts/574448/OValue%20Exporter.user.js" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest border border-cyan-500/20 transition-all">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    {{ t('btn_download_script') }}
                </a>
            </div>
        </div>
        <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl"></div>
    </div>
    


    <div class="card-glass p-6 mb-8 relative overflow-hidden group border-t border-white/5">
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-600 group-hover:w-2 transition-all"></div>
        <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <span class="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span> 
            {{ t('settings_title') }}
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-4">
                <div>
                    <label class="block text-xs uppercase font-bold text-gray-400 mb-2">{{ t('lbl_eco_speed') }}</label>
                    <input type="number" v-model.number="settings.ecoSpeed" @focus="$event.target.select()" class="input-glass w-full px-4 py-2">
                </div>
                <div>
                    <label class="block text-xs uppercase font-bold text-gray-400 mb-2">{{ t('lbl_player_class') }}</label>
                    <div class="flex gap-2">
                        <select v-model="settings.playerClass" class="input-glass w-full px-4 py-2">
                            <option value="collector">{{ t('opt_collector') }}</option>
                            <option value="other">{{ t('opt_general') }}</option>
                        </select>
                        <input v-if="settings.playerClass === 'collector'" type="number" step="0.1" v-model.number="settings.rocktalEnhancement" @focus="$event.target.select()" class="input-glass w-24 px-2 py-2 text-center" placeholder="0.0">
                    </div>
                    <label v-if="settings.playerClass === 'collector'" class="block text-[10px] text-cyan-400 mt-1 uppercase font-bold">{{ t('lbl_rocktal_collector_bonus') }}</label>
                </div>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-xs uppercase font-bold text-gray-400 mb-2">{{ t('lbl_plasma') }}</label>
                    <input type="number" v-model.number="settings.plasma" @focus="$event.target.select()" class="input-glass w-full px-4 py-2">
                </div>
                <div>
                    <label class="block text-xs uppercase font-bold text-gray-400 mb-2">{{ t('lbl_lf_bonus') }}</label>
                    <input type="number" v-model.number="settings.lfBonus" @focus="$event.target.select()" class="input-glass w-full px-4 py-2">
                </div>
            </div>
            <div class="space-y-4 pt-1">
                <label class="flex items-center p-3 rounded-lg border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition">
                    <input type="checkbox" v-model="settings.geologist" class="w-5 h-5 accent-cyan-500 rounded bg-gray-800 border-gray-600">
                    <span class="ml-3 font-medium text-gray-300">{{ t('lbl_geo') }}</span>
                </label>
                <label class="flex items-center p-3 rounded-lg border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition">
                    <input type="checkbox" v-model="settings.staff" class="w-5 h-5 accent-cyan-500 rounded bg-gray-800 border-gray-600">
                    <span class="ml-3 font-medium text-gray-300">{{ t('lbl_staff') }}</span>
                </label>
                <div>
                    <label class="block text-xs uppercase font-bold text-gray-400 mb-2">{{ t('lbl_ally_class') }}</label>
                    <select v-model="settings.allyClass" class="input-glass w-full px-3 py-2 text-sm">
                        <option value="none">{{ t('opt_none') }}</option>
                        <option value="trader">{{ t('opt_trader') }}</option>
                    </select>
                </div>
            </div>
        </div>

        <div v-if="settings.playerClass === 'collector'" class="mt-8 pt-6 border-t border-white/5">
            <h4 class="text-xs uppercase font-bold text-cyan-400 mb-4 tracking-wider flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                {{ t('lbl_collector_detail') }}
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div class="text-[10px] text-gray-500 uppercase font-bold mb-1">{{ t('lbl_mine_prod_ext') }}</div>
                    <div class="text-xl font-bold text-white font-mono">+{{ collBreakdown.mine }}%</div>
                </div>
                <div class="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div class="text-[10px] text-gray-500 uppercase font-bold mb-1">{{ t('lbl_crawler_prod_ext') }}</div>
                    <div class="text-xl font-bold text-white font-mono">+{{ collBreakdown.crawler }}%</div>
                </div>
                <div class="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div class="text-[10px] text-gray-500 uppercase font-bold mb-1">{{ t('lbl_max_crawlers_geo_ext') }}</div>
                    <div class="text-xl font-bold text-white font-mono">+{{ collBreakdown.geo }}%</div>
                </div>
            </div>
        </div>
    </div>

    <div class="card-glass p-4 mb-8 flex flex-col md:flex-row items-center gap-4 border-l-4 border-l-purple-500">
        <div class="flex items-center gap-2 text-purple-400 whitespace-nowrap">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            <span class="font-bold text-sm uppercase tracking-wide">{{ t('bulk_title') }}</span>
        </div>
        <div class="flex-grow grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
            <select v-model="bulkTarget" class="input-glass w-full px-3 py-2 text-sm">
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
            </select>
            <select v-if="bulkTarget === 'lifeform'" v-model="bulkValue" class="input-glass w-full px-3 py-2 text-sm">
                <option value="humans">{{ t('opt_humans') }}</option>
                <option value="rocktal">{{ t('opt_rocktal') }}</option>
                <option value="mecha">{{ t('opt_mecha') }}</option>
            </select>
            <input v-else type="number" v-model="bulkValue" @focus="$event.target.select()" :placeholder="t('bulk_placeholder')" class="input-glass w-full px-3 py-2 text-sm font-mono">
            <button @click="applyBulk" class="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                {{ t('btn_bulk_apply') }}
            </button>
        </div>
    </div>

    <div class="flex flex-row justify-between items-center mb-6 gap-4">
        <h2 class="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <span>{{ t('planet_mgmt') }}</span>
            <span class="text-xs font-bold text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded border border-cyan-500/30">
                {{ planets.length }}
            </span>
        </h2>
        <button @click="addPlanet" class="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2 border border-white/10">
            <span class="text-lg leading-none">+</span> 
            <span class="hidden md:inline">{{ t('btn_add_planet') }}</span>
        </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <PlanetCard 
            v-for="(planet, index) in planets" 
            :key="index"
            :planet="planet"
            :index="index"
            :global="settings"
            @clone="clonePlanet(index)"
            @remove="removePlanet(index)"
        />
    </div>

    <div class="fixed bottom-0 left-0 w-full bg-[#050505]/80 backdrop-blur-xl border-t border-white/10 py-4 z-40 shadow-[0_-5px_30px_rgba(0,0,0,0.8)]">
        <div class="max-w-7xl mx-auto flex flex-row justify-around items-center px-4 gap-4">
            <div class="text-center w-1/2 group cursor-default">
                <div class="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-1 font-bold">{{ t('footer_prod_hour') }}</div>
                <div class="text-2xl md:text-4xl font-bold text-white font-mono tracking-tight">
                    {{ formatNum(totals.hourly) }}
                </div>
            </div>
            <div class="h-12 w-px bg-white/10"></div>
            <div class="text-center w-1/2 group cursor-default">
                <div class="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-1 font-bold">{{ t('footer_pack_day') }}</div>
                <div class="text-2xl md:text-4xl font-bold text-white font-mono tracking-tight">
                    {{ formatNum(totals.daily) }}
                </div>
            </div>
        </div>
    </div>
  </div>

</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>