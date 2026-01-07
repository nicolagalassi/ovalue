<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { OGAME_DB } from '../data/ogame_db';

// Importiamo anche currentLang per gestire MO/DM
const { t, currentLang } = useLanguage();

// --- STATO ---
const queue = ref([]);
const isAutoLoaded = ref(false);

// Input Manuali (Risorse Totali)
const inputs = reactive({
    metal: 0,
    crystal: 0,
    deuterium: 0
});

// Impostazioni Calcolo
const settings = reactive({
    rateMet: 3,
    rateCry: 2,
    rateDeut: 1,
    packValue: 300000000, 
    shopDiscount: 0,      
    moBonus: 0            
});

// --- LABEL DINAMICA (MO vs DM) ---
const dmLabel = computed(() => currentLang.value === 'it' ? 'MO' : 'DM');

// --- HELPER FORMATTAZIONE INPUT ---
const createFormattedInput = (targetObj, key, isPackVal = false) => computed({
    get() {
        return new Intl.NumberFormat('it-IT').format(targetObj[key]);
    },
    set(newValue) {
        // Rimuove tutto ciò che non è numero
        const rawValue = newValue.replace(/[^0-9]/g, '');
        targetObj[key] = rawValue === '' ? 0 : parseInt(rawValue);
        
        // Se stiamo modificando il valore pacchetto, disattiviamo il flag "Auto Loaded"
        if (isPackVal) {
            isAutoLoaded.value = false;
        }
    }
});

// Computed properties per i campi input
const formPackVal = createFormattedInput(settings, 'packValue', true);
const formMet = createFormattedInput(inputs, 'metal');
const formCry = createFormattedInput(inputs, 'crystal');
const formDeu = createFormattedInput(inputs, 'deuterium');

// Builder
const builder = reactive({
    cat: 'resources',
    item: 'metal_mine',
    level: 1,
    amount: 1, 
    minLevel: 0 
});

// Parser
const parser = reactive({
    text: '',
    multiplier: 1
});

// Pacchetti
const basePacks = [
    { cost: 200, amount: 5100000 },
    { cost: 100, amount: 2525000 },
    { cost: 50, amount: 1140000 },
    { cost: 25, amount: 480000 },
    { cost: 10, amount: 150000 },
    { cost: 5, amount: 60000 }
];

// --- LOGICA BUILDER ---
const currentItems = computed(() => {
    const catData = OGAME_DB[builder.cat];
    if (!catData) return {};
    return catData.items;
});

watch(() => builder.cat, (newCat) => {
    const items = OGAME_DB[newCat].items;
    const keys = Object.keys(items);
    if (keys.length > 0) builder.item = keys[0];
    builder.level = 1;
    builder.amount = 1;
});

const addToQueue = () => {
    const itemData = OGAME_DB[builder.cat].items[builder.item];
    if (!itemData) return;

    let costM = 0, costC = 0, costD = 0;
    const lvl = parseInt(builder.level) || 1;
    let mult = parseInt(builder.amount) || 1;

    if (builder.cat === 'research') mult = 1;

    if (itemData.type === 'unit') {
        costM = itemData.b[0] * mult;
        costC = itemData.b[1] * mult;
        costD = itemData.b[2] * mult;
    } else {
        const factor = Math.pow(itemData.f, lvl - 1);
        costM = Math.floor(itemData.b[0] * factor);
        costC = Math.floor(itemData.b[1] * factor);
        costD = Math.floor(itemData.b[2] * factor);

        if (['metal_mine', 'crystal_mine', 'deuterium_synthesizer'].includes(builder.item)) {
            const minLvl = parseInt(builder.minLevel) || 0;
            const discount = Math.min(0.5, minLvl * 0.005); 
            if (discount > 0) {
                costM = Math.floor(costM * (1 - discount));
                costC = Math.floor(costC * (1 - discount));
                costD = Math.floor(costD * (1 - discount));
            }
        }

        costM *= mult;
        costC *= mult;
        costD *= mult;
    }

    queue.value.push({
        key: builder.item,
        cat: builder.cat,
        level: lvl,
        amount: mult,
        m: costM,
        c: costC,
        d: costD
    });

    updateInputsFromQueue();
};

const removeFromQueue = (index) => {
    queue.value.splice(index, 1);
    updateInputsFromQueue();
};

const updateInputsFromQueue = () => {
    let m = 0, c = 0, d = 0;
    queue.value.forEach(item => {
        m += item.m;
        c += item.c;
        d += item.d;
    });
    // Sovrascrive gli input manuali se c'è coda
    if (queue.value.length > 0) {
        inputs.metal = m;
        inputs.crystal = c;
        inputs.deuterium = d;
    }
};

// --- LOGICA PARSER INTELLIGENTE ---
const parseString = () => {
    const text = parser.text;
    const mult = parseInt(parser.multiplier) || 1;
    
    let m = 0, c = 0, d = 0;
    let foundAny = false;

    let parts = [];
    if (text.includes('|')) {
        parts = text.split('|');
    } else if (text.includes('\n')) {
        parts = text.split('\n');
    } else {
        parts = [text];
    }

    parts.forEach(part => {
        const numMatch = part.match(/[\d\.]+/);
        if (!numMatch) return;
        const val = parseInt(numMatch[0].replace(/\./g, '')) || 0;
        if (val === 0) return;
        const label = part.replace(/[\d\.\s]/g, '').toLowerCase();

        if (label.startsWith('d')) {
            d += val;
        } else if (label.startsWith('c') || label.startsWith('k')) {
            c += val;
        } else {
            m += val;
        }
        foundAny = true;
    });

    m *= mult; c *= mult; d *= mult;

    if (foundAny) {
        queue.value.push({
            key: 'imported_data', 
            cat: 'import',
            level: 0,
            amount: mult,
            m, c, d
        });
        updateInputsFromQueue();
        parser.text = ''; 
    } else {
        alert("Nessuna risorsa riconosciuta.");
    }
};

// --- CALCOLI FINANZIARI ---
const results = computed(() => {
    const m = inputs.metal || 0;
    const c = inputs.crystal || 0;
    const d = inputs.deuterium || 0;
    
    const rM = parseFloat(settings.rateMet) || 3;
    const rC = parseFloat(settings.rateCry) || 2;
    const rD = parseFloat(settings.rateDeut) || 1;

    const totalMSE = Math.ceil(m + (c * (rM/rC)) + (d * (rM/rD)));
    
    const packVal = parseInt(settings.packValue) || 1;
    let packsNeeded = 0;
    if (totalMSE > 0 && packVal > 0) packsNeeded = Math.ceil(totalMSE / packVal);

    const basePackPrice = 60000; 
    const discountFactor = 1 - (parseInt(settings.shopDiscount) / 100);
    const moPerPack = basePackPrice * discountFactor;
    const totalMO = packsNeeded * moPerPack;

    return { totalMSE, packsNeeded, totalMO, moPerPack };
});

const euroOptimization = computed(() => {
    const targetMO = results.value.totalMO;
    if (targetMO <= 0) return { totalCost: 0, packList: [] };

    const bonusMult = 1 + (parseInt(settings.moBonus) / 100);
    const currentPacks = basePacks.map(p => ({
        cost: p.cost, amount: Math.floor(p.amount * bonusMult)
    }));

    const findBest = (target, packs) => {
        if (target <= 0) return { totalCost: 0, packList: [] };
        let currentPack = packs[0];
        let countA = Math.ceil(target / currentPack.amount);
        let costA = countA * currentPack.cost;
        
        if (packs.length === 1) return { totalCost: costA, packList: [{ count: countA, pack: currentPack }] };

        let countB = Math.floor(target / currentPack.amount);
        let remainder = target - (countB * currentPack.amount);
        let subResult = findBest(remainder, packs.slice(1));
        let costB = (countB * currentPack.cost) + subResult.totalCost;

        if (costA <= costB) return { totalCost: costA, packList: [{ count: countA, pack: currentPack }] };
        else {
            let listB = [...subResult.packList];
            if (countB > 0) listB.push({ count: countB, pack: currentPack });
            return { totalCost: costB, packList: listB };
        }
    };

    const result = findBest(targetMO, currentPacks);
    result.packList.sort((a,b) => b.pack.cost - a.pack.cost);
    return result;
});

// --- UTILS ---
const formatNum = (n) => new Intl.NumberFormat('it-IT').format(Math.floor(n));

const resetFields = () => {
    queue.value = [];
    inputs.metal = 0; inputs.crystal = 0; inputs.deuterium = 0;
    settings.shopDiscount = 0; settings.moBonus = 0;
    parser.text = ''; parser.multiplier = 1;
};

// CHECK LOCALSTORAGE ON LOAD
onMounted(() => {
    const cachedMetal = localStorage.getItem('ogameDailyMetal');
    if (cachedMetal) {
        const val = parseInt(cachedMetal);
        if (val > 0) {
            settings.packValue = val;
            isAutoLoaded.value = true;
        }
    }
});
</script>

<template>
  <Teleport to="#header-actions">
      <button @click="resetFields" class="flex flex-col items-center justify-center w-12 h-12 md:w-16 md:h-14 rounded-lg hover:bg-red-900/20 transition text-gray-400 hover:text-ogame-danger group" :title="t('btn_reset')">
          <svg class="w-5 h-5 mb-1 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          <span class="text-[9px] uppercase font-bold">{{ t('btn_reset') }}</span>
      </button>
  </Teleport>

  <div class="max-w-7xl mx-auto px-4 md:px-6 mt-6 md:mt-10">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div class="lg:col-span-2 space-y-8">
            
            <div class="bg-ogame-panel border border-ogame-border rounded-xl p-6 shadow-xl relative overflow-hidden group">
                <div class="absolute top-0 left-0 w-1 h-full bg-green-600"></div>
                <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    <span>{{ t('builder_title') }}</span>
                </h3>
                
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                    <div class="md:col-span-1">
                        <label class="block text-[10px] uppercase font-bold text-gray-500 mb-1">{{ t('lbl_category') }}</label>
                        <select v-model="builder.cat" class="w-full bg-[#0d1014] border border-gray-700 rounded px-2 py-2 text-white text-sm focus:border-green-500 outline-none">
                            <option value="resources">{{ t('cat_resources') }}</option>
                            <option value="facilities">{{ t('cat_facilities') }}</option>
                            <option value="research">{{ t('cat_research') }}</option>
                            <option value="fleet">{{ t('cat_fleet') }}</option>
                            <option value="lf_rock">{{ t('cat_lf_rock') }}</option>
                        </select>
                    </div>
                    <div class="md:col-span-1">
                        <label class="block text-[10px] uppercase font-bold text-gray-500 mb-1">{{ t('lbl_element') }}</label>
                        <select v-model="builder.item" class="w-full bg-[#0d1014] border border-gray-700 rounded px-2 py-2 text-white text-sm focus:border-green-500 outline-none">
                            <option v-for="(val, key) in currentItems" :key="key" :value="key">{{ t(key) }}</option>
                        </select>
                    </div>
                    <div class="md:col-span-1" v-if="builder.cat !== 'fleet'">
                        <label class="block text-[10px] uppercase font-bold text-gray-500 mb-1">{{ t('lbl_level') }}</label>
                        <input type="number" v-model.number="builder.level" min="1" class="w-full bg-[#0d1014] border border-gray-700 rounded px-2 py-2 text-white text-sm focus:border-green-500 outline-none font-mono">
                    </div>
                    <div class="md:col-span-1 relative" v-if="builder.cat !== 'research'">
                        <label class="block text-[10px] uppercase font-bold text-gray-500 mb-1">{{ builder.cat === 'fleet' ? t('lbl_quantity') : t('lbl_planets') }}</label>
                        <div class="flex items-center">
                            <span v-if="builder.cat !== 'fleet'" class="absolute left-3 text-gray-500 text-sm font-bold">x</span>
                            <input type="number" v-model.number="builder.amount" min="1" class="w-full bg-[#0d1014] border border-gray-700 rounded px-2 py-2 text-white text-sm focus:border-green-500 outline-none font-mono" :class="{'pl-6': builder.cat !== 'fleet'}">
                        </div>
                    </div>
                </div>

                <div class="mb-4">
                    <label class="block text-[10px] uppercase font-bold text-ogame-warning mb-1">{{ t('lbl_min_level') }}</label>
                    <input type="number" v-model.number="builder.minLevel" placeholder="0" min="0" class="w-24 bg-[#0d1014] border border-ogame-warning/50 rounded px-2 py-1 text-white text-xs focus:border-ogame-warning outline-none font-mono">
                </div>
                
                <button @click="addToQueue" class="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded text-sm transition shadow-md mb-4">{{ t('btn_add_queue') }}</button>

                <div class="bg-[#0d1014]/50 border border-gray-700 rounded-lg p-3 min-h-[50px] max-h-[150px] overflow-y-auto space-y-1 text-xs font-mono">
                    <div v-if="queue.length === 0" class="text-center text-gray-600 italic">{{ t('queue_empty') }}</div>
                    <div v-for="(item, index) in queue" :key="index" class="flex justify-between items-center text-gray-300 border-b border-gray-700/50 pb-1 last:border-0">
                        <div class="flex items-center gap-2">
                            <button @click="removeFromQueue(index)" class="text-red-500 hover:text-red-400 font-bold px-1">✕</button>
                            <div>
                                <span class="text-white font-bold">{{ t(item.key) }}</span> 
                                <span class="text-[10px] text-gray-500 ml-1">
                                    <span v-if="item.cat === 'fleet'">({{ t('lbl_quantity') }}: {{ item.amount }})</span>
                                    <span v-else-if="item.cat === 'import'"></span>
                                    <span v-else>(Lvl: {{ item.level }} - {{ item.amount }}x)</span>
                                </span>
                            </div>
                        </div>
                        <div class="text-[10px] text-gray-400 font-mono text-right">
                            <span class="text-gray-500">M:</span>{{ formatNum(item.m) }} <span class="text-green-900">C:</span>{{ formatNum(item.c) }} <span class="text-blue-900">D:</span>{{ formatNum(item.d) }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-ogame-panel border border-ogame-border rounded-xl p-6 shadow-xl relative overflow-hidden group">
                <div class="absolute top-0 left-0 w-1 h-full bg-ogame-accent"></div>
                <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <svg class="w-5 h-5 text-ogame-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                    <span>{{ t('import_title') }}</span>
                </h3>
                
                <div class="relative">
                    <textarea v-model="parser.text" rows="4" :placeholder="t('import_placeholder')" 
                        class="w-full bg-[#0d1014] border border-gray-700 rounded-lg p-4 text-sm text-gray-300 focus:border-ogame-accent focus:ring-1 focus:ring-ogame-accent outline-none transition font-mono resize-none"></textarea>
                    
                    <div class="absolute bottom-3 right-3 flex items-center gap-2 bg-[#161b22] p-1 rounded-lg border border-gray-700/50 shadow-lg">
                        <div class="flex items-center bg-[#0d1014] rounded border border-gray-700 px-2 py-1" title="Moltiplicatore">
                            <span class="text-xs text-gray-500 font-bold mr-1">x</span>
                            <input type="number" v-model.number="parser.multiplier" min="1" 
                                class="w-8 bg-transparent text-white text-xs font-bold focus:outline-none text-right font-mono">
                        </div>
                        <button @click="parseString" class="px-4 py-1.5 bg-ogame-accent hover:bg-blue-600 text-white text-xs font-bold rounded shadow transition">
                            {{ t('btn_extract') }}
                        </button>
                    </div>
                </div>
            </div>

            <div class="bg-ogame-panel border border-ogame-border rounded-xl p-6 shadow-xl relative">
                <h3 class="text-lg font-bold text-white mb-6">{{ t('lbl_costs') }}</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="relative group">
                        <label class="block text-xs uppercase font-bold text-gray-500 mb-2">{{ t('res_metal') }}</label>
                        <input type="text" v-model="formMet" class="w-full bg-[#0d1014] border border-gray-700 rounded-lg p-3 text-white focus:border-ogame-accent outline-none font-mono text-lg">
                    </div>
                    <div class="relative group">
                        <label class="block text-xs uppercase font-bold text-gray-500 mb-2">{{ t('res_crystal') }}</label>
                        <input type="text" v-model="formCry" class="w-full bg-[#0d1014] border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 outline-none font-mono text-lg">
                    </div>
                    <div class="relative group">
                        <label class="block text-xs uppercase font-bold text-gray-500 mb-2">{{ t('res_deuterium') }}</label>
                        <input type="text" v-model="formDeu" class="w-full bg-[#0d1014] border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none font-mono text-lg">
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-ogame-panel border border-ogame-border rounded-xl p-6 shadow-xl">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-sm font-bold text-gray-400 uppercase">{{ t('lbl_rates') }}</h3>
                        <button @click="settings.rateMet=3; settings.rateCry=2; settings.rateDeut=1" class="text-[10px] bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded border border-gray-600 text-gray-300">Default 3:2:1</button>
                    </div>
                    <div class="flex items-center gap-2">
                        <input type="number" value="3" readonly class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-center text-gray-500 font-bold focus:outline-none cursor-not-allowed">
                        <span class="text-gray-500">:</span>
                        <input type="number" v-model.number="settings.rateCry" class="w-full bg-[#0d1014] border border-gray-700 rounded p-2 text-center text-green-400 font-bold focus:border-green-500 outline-none">
                        <span class="text-gray-500">:</span>
                        <input type="number" v-model.number="settings.rateDeut" class="w-full bg-[#0d1014] border border-gray-700 rounded p-2 text-center text-blue-400 font-bold focus:border-blue-500 outline-none">
                    </div>
                </div>

                <div class="bg-ogame-panel border border-ogame-border rounded-xl p-6 shadow-xl">
                    <h3 class="text-sm font-bold text-gray-400 uppercase mb-4">{{ t('lbl_pack_val') }}</h3>
                    <div class="relative">
                        <input 
                            type="text" 
                            v-model="formPackVal" 
                            class="w-full bg-[#0d1014] border border-ogame-warning/50 rounded-lg p-3 text-ogame-warning font-bold focus:border-ogame-warning outline-none text-center text-lg shadow-[0_0_10px_rgba(210,153,34,0.1)]"
                        >
                        <div class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-mono">MET</div>
                    </div>
                    <p class="text-[10px] text-gray-500 mt-2 text-center">
                        <span v-if="isAutoLoaded" class="text-ogame-success">{{ t('pack_source_auto') }}</span>
                        <span v-else>{{ t('pack_source_manual') }}</span>
                    </p>
                </div>
            </div>
        </div>

        <div class="lg:col-span-1 space-y-4">
            
            <div class="bg-ogame-panel border border-ogame-border rounded-xl p-6 shadow-xl flex flex-col justify-center min-h-[220px] relative overflow-hidden">
                <div class="absolute top-0 right-0 w-1 h-full bg-ogame-warning"></div>
                <div class="text-center mb-6">
                    <div class="text-xs text-gray-500 uppercase tracking-widest mb-2">{{ t('lbl_cost_mse') }}</div>
                    <div class="text-3xl font-mono font-bold text-white break-all">{{ formatNum(results.totalMSE) }}</div>
                </div>
                <div class="border-t border-gray-700/50 my-6"></div>
                <div class="text-center">
                    <div class="text-sm text-ogame-warning uppercase tracking-widest mb-2 font-bold">{{ t('lbl_packs_needed') }}</div>
                    <div class="text-6xl font-bold text-white drop-shadow-[0_0_15px_rgba(210,153,34,0.5)]">{{ formatNum(results.packsNeeded) }}</div>
                </div>
            </div>

            <div class="bg-ogame-panel border border-ogame-dm/50 rounded-xl p-6 shadow-xl relative overflow-hidden">
                <div class="absolute top-0 right-0 w-1 h-full bg-ogame-dm"></div>
                <div class="flex flex-col gap-3 mb-4">
                    <div class="flex justify-between items-center">
                        <h3 class="text-sm font-bold text-gray-300 uppercase flex items-center gap-2">
                            <svg class="w-4 h-4 text-ogame-dm" fill="currentColor" viewBox="0 0 20 20"><path d="M13 7H7v6h6V7z"/><path fill-rule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1v-2H2a1 1 0 110-2h1V7a2 2 0 012-2h2V2zM5 7v6h10V7H5z" clip-rule="evenodd"/></svg>
                            <span>{{ t('lbl_cost_dm') }}</span>
                        </h3>
                        <div class="flex items-center justify-between bg-[#0d1014] p-2 rounded border border-gray-700">
                             <span class="text-[10px] text-gray-400 uppercase font-bold mr-2">{{ t('lbl_shop_discount') }}</span>
                             <select v-model.number="settings.shopDiscount" class="bg-[#0d1014] text-xs text-white outline-none text-right font-bold cursor-pointer border-none focus:ring-0 w-24">
                                 <option value="0">0%</option>
                                 <option value="20">-20%</option>
                                 <option value="30">-30%</option>
                             </select>
                        </div>
                    </div>
                    <div class="flex items-center justify-between bg-[#0d1014] p-2 rounded border border-gray-700">
                         <span class="text-[10px] text-gray-400 uppercase font-bold">{{ t('lbl_event_bonus') }}</span>
                         <select v-model.number="settings.moBonus" class="bg-[#0d1014] text-xs text-white outline-none text-right font-bold cursor-pointer border-none focus:ring-0 w-24">
                             <option value="0">{{ t('opt_none') || 'None' }}</option>
                             <option value="30">+30% {{ dmLabel }}</option>
                             <option value="40">+40% {{ dmLabel }}</option>
                             <option value="50">+50% {{ dmLabel }}</option>
                             <option value="60">+60% {{ dmLabel }}</option>
                             <option value="100">+100% {{ dmLabel }}</option>
                             <option value="130">+130% {{ dmLabel }}</option>
                         </select>
                    </div>
                </div>
                <div class="text-center">
                    <div class="text-[10px] text-gray-500 uppercase tracking-widest">{{ t('lbl_cost_dm') }}</div>
                    <div class="text-3xl font-bold text-white drop-shadow-[0_0_15px_rgba(120,52,188,0.5)] mb-1">{{ formatNum(results.totalMO) }}</div>
                    <div class="text-[9px] text-gray-400">{{ formatNum(results.moPerPack) }} {{ dmLabel }} / pack</div>
                </div>
            </div>

            <div class="bg-ogame-panel border border-ogame-money/50 rounded-xl p-6 shadow-xl relative overflow-hidden">
                <div class="absolute top-0 right-0 w-1 h-full bg-ogame-money"></div>
                <h3 class="text-sm font-bold text-gray-300 uppercase mb-4 flex items-center gap-2">
                    <span class="text-ogame-money text-lg">€</span> <span>{{ t('lbl_opt_cost') }}</span>
                </h3>
                <div class="space-y-2 text-xs text-gray-400 font-mono mb-4 min-h-[40px]">
                    <div v-if="euroOptimization.totalCost === 0" class="text-center italic opacity-50">{{ t('shop_list_empty') }}</div>
                    <div v-for="(item, index) in euroOptimization.packList" :key="index" class="flex justify-between items-center border-b border-gray-800 pb-2 last:border-0">
                        <div class="flex flex-col">
                            <span class="text-white font-bold">{{ item.count }}x {{ t('shop_list_pack') }} {{ item.pack.cost }} €</span>
                            <span class="text-[10px] text-gray-500">{{ t('shop_list_contains') }}: {{ formatNum(item.pack.amount) }} {{ t('shop_list_each') }}</span>
                        </div>
                        <span class="text-ogame-money font-mono font-bold">{{ item.count * item.pack.cost }} €</span>
                    </div>
                </div>
                <div class="border-t border-gray-700/50 my-3"></div>
                <div class="flex justify-between items-end">
                     <span class="text-xs text-gray-500 uppercase font-bold">{{ t('lbl_total') }}</span>
                     <span class="text-2xl font-bold text-ogame-money">{{ euroOptimization.totalCost }} €</span>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>