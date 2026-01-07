<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useOgameFormulas } from '../composables/useOgameFormulas';
import PlanetCard from '../components/PlanetCard.vue';

const { t } = useLanguage();
const { calcMineProduction, getPosMult, formatNum } = useOgameFormulas();

// STATO GLOBALE (Settings)
const settings = reactive({
    ecoSpeed: 8,
    playerClass: 'collector', 
    allyClass: 'none',        
    plasma: 0,
    geologist: false,
    staff: false,
    lfBonus: 0
});

// LISTA PIANETI
const planets = ref([]);

// BULK EDIT
const bulkTarget = ref('metal');
const bulkValue = ref('');

// --- LOGICA GESTIONE PIANETI ---

const createPlanet = () => ({
    metal: 30, crystal: 25, deuterium: 20,
    pos: 8,
    item: 0, itemCustom: 0,
    magma: 0, human: 0,
    crawlers: 0, overload: false
});

const addPlanet = () => {
    planets.value.push(createPlanet());
};

const clonePlanet = (index) => {
    const clone = JSON.parse(JSON.stringify(planets.value[index]));
    planets.value.splice(index + 1, 0, clone);
};

const removePlanet = (index) => {
    planets.value.splice(index, 1);
};

const resetAll = () => {
    if(confirm("Reset?")) {
        planets.value = [createPlanet()];
        localStorage.removeItem('ovalue_metal_data');
        localStorage.removeItem('ogameDailyMetal'); 
    }
};

// --- LOGICA BULK EDIT ---
const applyBulk = () => {
    const val = parseInt(bulkValue.value);
    if (isNaN(val)) return;

    planets.value.forEach(p => {
        if (bulkTarget.value === 'overload') {
            p.overload = (val === 1);
        } else if (bulkTarget.value === 'item') {
            if ([0,10,20,30,40].includes(val)) p.item = val;
        } else {
            if (p.hasOwnProperty(bulkTarget.value)) {
                p[bulkTarget.value] = val;
            }
        }
    });
};

// --- CALCOLI TOTALI (Computed) ---
const totals = computed(() => {
    let hourly = 0;
    
    planets.value.forEach(p => {
        // --- 1. Dati base ---
        const met = parseInt(p.metal) || 0;
        const posMult = getPosMult(p.pos);
        const natProd = 30 * settings.ecoSpeed * posMult;
        const mineBase = calcMineProduction(met, settings.ecoSpeed, posMult, 'metal');
        
        // --- 2. Percentuali ---
        let totPerc = 0;
        totPerc += settings.plasma * 1;
        if (settings.geologist) totPerc += 10;
        if (settings.staff) totPerc += 2;
        if (settings.playerClass === 'collector') totPerc += 25;
        if (settings.allyClass === 'trader') totPerc += 5;
        
        totPerc += (parseInt(p.item)||0) + (parseInt(p.itemCustom)||0);
        totPerc += (parseInt(p.magma)||0) * 2;
        totPerc += (parseInt(p.human)||0) * 1.5;
        totPerc += settings.lfBonus;

        // --- 3. Crawlers ---
        let maxCraw = (met + (parseInt(p.crystal)||0) + (parseInt(p.deuterium)||0)) * 8; 
        if (settings.playerClass === 'collector' && settings.geologist) maxCraw = Math.floor(maxCraw * 1.1);
        
        const actCraw = Math.min((parseInt(p.crawlers)||0), maxCraw);
        if (actCraw > 0) {
            let mult = 0.02;
            
            // Bonus Collector e Overload
            if (settings.playerClass === 'collector') {
                mult *= 1.5; 
                if (p.overload) mult *= 1.5;
            }
            
            totPerc += (actCraw * mult);
        }

        // --- 4. Somma ---
        const bonusProd = Math.floor(mineBase * (totPerc / 100));
        hourly += (natProd + mineBase + bonusProd);
    });

    return {
        hourly,
        daily: hourly * 24
    };
});

// --- PERSISTENZA ---
watch([planets, settings], () => {
    // 1. Salva configurazione pianeti
    const data = { settings, planets: planets.value };
    localStorage.setItem('ovalue_metal_data', JSON.stringify(data));
    
    // 2. SALVA IL TOTALE PER IL PACK EXCHANGE
    localStorage.setItem('ogameDailyMetal', totals.value.daily);

}, { deep: true });

onMounted(() => {
    const saved = localStorage.getItem('ovalue_metal_data');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.assign(settings, parsed.settings);
            planets.value = parsed.planets;
        } catch(e) { console.error("Errore load", e); addPlanet(); }
    } else {
        addPlanet();
    }
});

// Export/Import
const exportData = () => {
    const blob = new Blob([JSON.stringify({ settings, planets: planets.value }, null, 2)], {type: "application/json"});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ovalue_metal.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
};
const triggerImport = () => document.getElementById('fileInput').click();
const importData = (e) => {
    const r = new FileReader(); 
    r.onload = ev => { 
        try { 
            const d = JSON.parse(ev.target.result); 
            Object.assign(settings, d.settings); 
            planets.value = d.planets; 
        } catch(err){ alert("File non valido"); } 
    }; 
    r.readAsText(e.target.files[0]); e.target.value='';
};
</script>

<template>
  <Teleport to="#header-actions">
      <button @click="exportData" class="flex flex-col items-center justify-center w-12 h-12 md:w-16 md:h-14 rounded-lg hover:bg-gray-800 transition text-gray-400 hover:text-white group" :title="t('btn_save')">
          <svg class="w-5 h-5 mb-1 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
          <span class="text-[9px] uppercase font-bold">{{ t('btn_save') }}</span>
      </button>
      <div class="w-px bg-gray-700 my-2"></div>
      <button @click="triggerImport" class="flex flex-col items-center justify-center w-12 h-12 md:w-16 md:h-14 rounded-lg hover:bg-gray-800 transition text-gray-400 hover:text-white group" :title="t('btn_load')">
          <svg class="w-5 h-5 mb-1 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          <span class="text-[9px] uppercase font-bold">{{ t('btn_load') }}</span>
      </button>
      <input type="file" id="fileInput" accept=".json" @change="importData" class="hidden">
      <div class="w-px bg-gray-700 my-2"></div>
      <button @click="resetAll" class="flex flex-col items-center justify-center w-12 h-12 md:w-16 md:h-14 rounded-lg hover:bg-red-900/20 transition text-gray-400 hover:text-ogame-danger group" :title="t('btn_reset')">
          <svg class="w-5 h-5 mb-1 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          <span class="text-[9px] uppercase font-bold">{{ t('btn_reset') }}</span>
      </button>
  </Teleport>

  <div class="max-w-7xl mx-auto px-4 md:px-6 mt-6 md:mt-10">
    
    <div class="bg-ogame-panel border border-ogame-border rounded-xl p-6 shadow-xl mb-8 relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1 h-full bg-ogame-accent"></div>
        <h3 class="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-ogame-accent"></span> {{ t('settings_title') }}
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-4">
                <div>
                    <label class="block text-xs uppercase font-bold text-gray-500 mb-2">{{ t('lbl_eco_speed') }}</label>
                    <input type="number" v-model.number="settings.ecoSpeed" class="w-full bg-[#0d1014] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-ogame-accent outline-none">
                </div>
                <div>
                    <label class="block text-xs uppercase font-bold text-gray-500 mb-2">{{ t('lbl_player_class') }}</label>
                    <select v-model="settings.playerClass" class="w-full bg-[#0d1014] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-ogame-accent outline-none">
                        <option value="collector">{{ t('opt_collector') }}</option>
                        <option value="other">{{ t('opt_general') }}</option>
                    </select>
                </div>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-xs uppercase font-bold text-gray-500 mb-2">{{ t('lbl_plasma') }}</label>
                    <input type="number" v-model.number="settings.plasma" class="w-full bg-[#0d1014] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-ogame-accent outline-none">
                </div>
                <div>
                    <label class="block text-xs uppercase font-bold text-gray-500 mb-2">{{ t('lbl_lf_bonus') }}</label>
                    <input type="number" v-model.number="settings.lfBonus" class="w-full bg-[#0d1014] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-ogame-accent outline-none">
                </div>
            </div>
            <div class="space-y-4 pt-1">
                <label class="flex items-center p-3 rounded-lg border border-gray-700/50 bg-[#0d1014]/50 cursor-pointer">
                    <input type="checkbox" v-model="settings.geologist" class="w-5 h-5 accent-ogame-accent rounded bg-gray-800 border-gray-600">
                    <span class="ml-3 font-medium text-gray-300">{{ t('lbl_geo') }}</span>
                </label>
                <label class="flex items-center p-3 rounded-lg border border-gray-700/50 bg-[#0d1014]/50 cursor-pointer">
                    <input type="checkbox" v-model="settings.staff" class="w-5 h-5 accent-ogame-accent rounded bg-gray-800 border-gray-600">
                    <span class="ml-3 font-medium text-gray-300">{{ t('lbl_staff') }}</span>
                </label>
                <div>
                    <label class="block text-xs uppercase font-bold text-gray-500 mb-2">{{ t('lbl_ally_class') }}</label>
                    <select v-model="settings.allyClass" class="w-full bg-[#0d1014] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none">
                        <option value="none">{{ t('opt_none') }}</option>
                        <option value="trader">{{ t('opt_trader') }}</option>
                    </select>
                </div>
            </div>
        </div>
    </div>

    <div class="bg-[#11161d] border border-ogame-accent/30 rounded-xl p-4 mb-8 shadow-lg flex flex-col md:flex-row items-center gap-4">
        <div class="flex items-center gap-2 text-ogame-accent whitespace-nowrap">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            <span class="font-bold text-sm uppercase tracking-wide">{{ t('bulk_title') }}</span>
        </div>
        <div class="flex-grow grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
            <select v-model="bulkTarget" class="w-full bg-[#0d1014] border border-gray-700 rounded px-3 py-2 text-white text-sm outline-none">
                <option value="metal">{{ t('lbl_mine_metal') }}</option>
                <option value="crystal">{{ t('lbl_mine_crystal') }}</option>
                <option value="deuterium">{{ t('lbl_mine_deuterium') }}</option>
                <option value="item">{{ t('lbl_item') }} (%)</option>
                <option value="pos">{{ t('lbl_position') }}</option>
                <option value="magma">{{ t('lbl_magma') }}</option>
                <option value="human">{{ t('lbl_human') }}</option>
                <option value="crawlers">{{ t('lbl_crawlers') }}</option>
                <option value="overload">{{ t('lbl_overload') }} (1=Si,0=No)</option>
            </select>
            <input type="number" v-model="bulkValue" :placeholder="t('bulk_placeholder')" class="w-full bg-[#0d1014] border border-gray-700 rounded px-3 py-2 text-white text-sm outline-none font-mono">
            <button @click="applyBulk" class="w-full bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm transition shadow-md">
                {{ t('btn_bulk_apply') }}
            </button>
        </div>
    </div>

    <div class="flex flex-row justify-between items-center mb-6 gap-4">
        <h2 class="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <span>{{ t('planet_mgmt') }}</span>
            <span class="text-xs md:text-sm font-normal text-gray-400 bg-gray-800 px-2 py-1 rounded-md border border-gray-700">
                {{ planets.length }}
            </span>
        </h2>
        <button @click="addPlanet" class="px-4 py-2 md:px-6 md:py-2 bg-ogame-success hover:bg-green-600 text-white text-sm md:text-base font-bold rounded-lg shadow-lg transition flex items-center gap-2">
            <span class="text-lg leading-none">+</span> 
            <span class="hidden md:inline">{{ t('btn_add_planet') }}</span>
            <span class="md:hidden">Nuovo</span>
        </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-24">
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

    <div class="fixed bottom-0 left-0 w-full bg-[#161b22]/95 backdrop-blur-lg border-t border-ogame-accent/50 py-3 md:py-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div class="max-w-7xl mx-auto flex flex-row justify-around items-center px-4 gap-2 md:gap-4">
            <div class="text-center w-1/2">
                <div class="text-[9px] md:text-[10px] text-gray-400 uppercase tracking-widest mb-1 font-bold">{{ t('footer_prod_hour') }}</div>
                <div class="text-2xl md:text-3xl font-bold text-ogame-accent drop-shadow-[0_0_15px_rgba(51,153,255,0.4)] font-mono">
                    {{ formatNum(totals.hourly) }}
                </div>
            </div>
            <div class="h-10 w-px bg-gray-700/50"></div>
            <div class="text-center w-1/2 flex flex-col items-center">
                <div class="text-[9px] md:text-[10px] text-gray-400 uppercase tracking-widest mb-1 font-bold text-ogame-warning">{{ t('footer_pack_day') }}</div>
                <div class="text-2xl md:text-3xl font-bold text-white drop-shadow-[0_0_15px_rgba(210,153,34,0.4)] font-mono">
                    {{ formatNum(totals.daily) }}
                </div>
            </div>
        </div>
    </div>

  </div>
</template>