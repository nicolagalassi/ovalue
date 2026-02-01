<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { OGAME_DB } from '../data/ogame_db';

const { t, currentLang } = useLanguage();

// --- STATO ---
const queue = ref([]);
const isAutoLoaded = ref(false);

// Input e Stock
const inputs = reactive({ metal: 0, crystal: 0, deuterium: 0 });
const stock = reactive({ metal: 0, crystal: 0, deuterium: 0 });

// Impostazioni Calcolo
const settings = reactive({
    rateMet: 3,
    rateCry: 2,
    rateDeut: 1,
    packValue: 300000000, 
    shopDiscount: 0,      
    moBonus: 0,
    smartRounding: false,
    // NUOVO: Gestione Mercanti
    merchantCount: 0,
    merchantPrice: 3500
});

// --- HELPER ---
const dmLabel = computed(() => currentLang.value === 'it' ? 'MO' : 'DM');
const formatNum = (n) => new Intl.NumberFormat('it-IT').format(Math.floor(n));

const createFormattedInput = (targetObj, key, isPackVal = false) => computed({
    get() { return new Intl.NumberFormat('it-IT').format(targetObj[key]); },
    set(newValue) {
        const rawValue = newValue.replace(/[^0-9-]/g, '');
        targetObj[key] = rawValue === '' ? 0 : parseInt(rawValue);
        if (isPackVal) isAutoLoaded.value = false;
    }
});

const formPackVal = createFormattedInput(settings, 'packValue', true);
const formMet = createFormattedInput(inputs, 'metal');
const formCry = createFormattedInput(inputs, 'crystal');
const formDeu = createFormattedInput(inputs, 'deuterium');
const stockMet = createFormattedInput(stock, 'metal');
const stockCry = createFormattedInput(stock, 'crystal');
const stockDeu = createFormattedInput(stock, 'deuterium');

// --- BUILDER & PARSER ---
const builder = reactive({ cat: 'resources', item: 'metal_mine', level: 1, amount: 1, minLevel: 0 });
const parser = reactive({ text: '', multiplier: 1 });
const basePacks = [ { cost: 200, amount: 5100000 }, { cost: 100, amount: 2525000 }, { cost: 50, amount: 1140000 }, { cost: 25, amount: 480000 }, { cost: 10, amount: 150000 }, { cost: 5, amount: 60000 } ];

const currentItems = computed(() => { const catData = OGAME_DB[builder.cat]; return catData ? catData.items : {}; });
watch(() => builder.cat, (newCat) => { 
    const items = OGAME_DB[newCat].items; 
    const keys = Object.keys(items); 
    if (keys.length > 0) builder.item = keys[0]; 
    builder.level = 1; builder.amount = 1; 
});

const addToQueue = () => {
    const itemData = OGAME_DB[builder.cat].items[builder.item]; if (!itemData) return;
    let costM = 0, costC = 0, costD = 0; const lvl = parseInt(builder.level) || 1; let mult = parseInt(builder.amount) || 1; if (builder.cat === 'research') mult = 1;
    if (itemData.type === 'unit') { costM = itemData.b[0] * mult; costC = itemData.b[1] * mult; costD = itemData.b[2] * mult; } 
    else {
        const factor = Math.pow(itemData.f, lvl - 1); 
        costM = Math.floor(itemData.b[0] * factor); costC = Math.floor(itemData.b[1] * factor); costD = Math.floor(itemData.b[2] * factor);
        if (['metal_mine', 'crystal_mine', 'deuterium_synthesizer'].includes(builder.item)) { 
            const minLvl = parseInt(builder.minLevel) || 0; 
            const discount = Math.min(0.5, minLvl * 0.005); 
            if (discount > 0) { costM = Math.floor(costM * (1 - discount)); costC = Math.floor(costC * (1 - discount)); costD = Math.floor(costD * (1 - discount)); } 
        }
        costM *= mult; costC *= mult; costD *= mult;
    }
    queue.value.push({ key: builder.item, cat: builder.cat, level: lvl, amount: mult, m: costM, c: costC, d: costD }); 
    updateInputsFromQueue();
};
const removeFromQueue = (index) => { queue.value.splice(index, 1); updateInputsFromQueue(); };
const updateInputsFromQueue = () => { let m = 0, c = 0, d = 0; queue.value.forEach(item => { m += item.m; c += item.c; d += item.d; }); if (queue.value.length > 0) { inputs.metal = m; inputs.crystal = c; inputs.deuterium = d; } };

const parseString = () => {
    const text = parser.text; const mult = parseInt(parser.multiplier) || 1; let m = 0, c = 0, d = 0; let foundAny = false; 
    let parts = text.includes('|') ? text.split('|') : (text.includes('\n') ? text.split('\n') : [text]);
    parts.forEach(part => { 
        const numMatch = part.match(/[\d\.]+/); if (!numMatch) return; 
        const val = parseInt(numMatch[0].replace(/\./g, '')) || 0; if (val === 0) return; 
        const label = part.replace(/[\d\.\s]/g, '').toLowerCase(); 
        if (label.startsWith('d')) d += val; else if (label.startsWith('c') || label.startsWith('k')) c += val; else m += val; 
        foundAny = true; 
    });
    m *= mult; c *= mult; d *= mult; 
    if (foundAny) { queue.value.push({ key: 'imported_data', cat: 'import', level: 0, amount: mult, m, c, d }); updateInputsFromQueue(); parser.text = ''; } else { alert("Nessuna risorsa riconosciuta."); }
};

// --- CORE CALCULATION LOGIC ---
const calculation = computed(() => {
    const rM = parseFloat(settings.rateMet) || 3;
    const rC = parseFloat(settings.rateCry) || 2;
    const rD = parseFloat(settings.rateDeut) || 1;

    const needM = Math.max(0, inputs.metal - stock.metal);
    const needC = Math.max(0, inputs.crystal - stock.crystal);
    const needD = Math.max(0, inputs.deuterium - stock.deuterium);

    const mseM = needM;
    const mseC = needC * (rM / rC);
    const mseD = needD * (rM / rD);
    const totalMSE = Math.ceil(mseM + mseC + mseD);

    const packVal = parseInt(settings.packValue) || 1;
    let packsNeeded = 0;
    if (totalMSE > 0 && packVal > 0) packsNeeded = Math.ceil(totalMSE / packVal);

    const basePackPrice = 60000;
    const discountFactor = 1 - (parseInt(settings.shopDiscount) / 100);
    const moPerPack = basePackPrice * discountFactor;
    
    // MO per i pacchetti
    let packsMO = packsNeeded * moPerPack;

    // MO per i Mercanti (Manuale)
    const merchantCost = settings.merchantCount * settings.merchantPrice;

    // Totale MO Necessaria (Target)
    const totalMO = packsMO + merchantCost;

    return { needM, needC, needD, totalMSE, packsNeeded, totalMO, moPerPack, merchantCost };
});

const tradePlan = computed(() => {
    const c = calculation.value;
    if (c.totalMSE <= 0) return null;
    const tradeForCry = c.needC * (settings.rateMet / settings.rateCry);
    const tradeForDeut = c.needD * (settings.rateMet / settings.rateDeut);
    return {
        keepMetal: c.needM,
        tradeMetToCry: tradeForCry,
        tradeMetToDeut: tradeForDeut,
        totalMetalRequired: c.needM + tradeForCry + tradeForDeut
    };
});

const euroOptimization = computed(() => {
    const targetMO = calculation.value.totalMO;
    if (targetMO <= 0) return { totalCost: 0, packList: [], totalPurchasedMO: 0 };

    const bonusMult = 1 + (parseInt(settings.moBonus) / 100);
    const currentPacks = basePacks.map(p => ({ cost: p.cost, amount: Math.floor(p.amount * bonusMult) }));

    const findBest = (target, packs) => {
        if (target <= 0) return { totalCost: 0, packList: [] };
        let currentPack = packs[0];
        let countA = Math.ceil(target / currentPack.amount);
        let costA = countA * currentPack.cost;
        if (packs.length === 1) return { totalCost: costA, packList: [{ count: countA, pack: currentPack }] };
        let countB = Math.floor(target / currentPack.amount);
        let subResult = findBest(target - (countB * currentPack.amount), packs.slice(1));
        let costB = (countB * currentPack.cost) + subResult.totalCost;
        if (costA <= costB) return { totalCost: costA, packList: [{ count: countA, pack: currentPack }] };
        else { let listB = [...subResult.packList]; if (countB > 0) listB.push({ count: countB, pack: currentPack }); return { totalCost: costB, packList: listB }; }
    };

    let optimalResult = findBest(targetMO, currentPacks);
    
    if (settings.smartRounding) {
        const threshold = 20; let improved = true; 
        let flatList = []; optimalResult.packList.forEach(item => { for(let i=0; i<item.count; i++) flatList.push(item.pack); });
        while (improved) { 
            improved = false; flatList.sort((a,b) => b.cost - a.cost); 
            for (let candidatePack of currentPacks) { 
                const smallerPacks = flatList.filter(p => p.cost < candidatePack.cost); 
                if (smallerPacks.length > 0) { 
                    const sumCostSmallers = smallerPacks.reduce((acc, p) => acc + p.cost, 0); 
                    const diff = candidatePack.cost - sumCostSmallers; 
                    if (diff > -5 && diff <= threshold) { flatList = flatList.filter(p => p.cost >= candidatePack.cost); flatList.push(candidatePack); improved = true; break; } 
                } 
            } 
        }
        const groupedMap = new Map(); let totalCost = 0; 
        flatList.forEach(p => { totalCost += p.cost; if (!groupedMap.has(p.cost)) groupedMap.set(p.cost, { count: 0, pack: p }); groupedMap.get(p.cost).count++; }); 
        optimalResult.packList = Array.from(groupedMap.values()); optimalResult.totalCost = totalCost;
    }
    
    optimalResult.packList.sort((a,b) => b.pack.cost - a.pack.cost); 
    const totalPurchasedMO = optimalResult.packList.reduce((acc, item) => acc + (item.count * item.pack.amount), 0);
    return { totalCost: optimalResult.totalCost, packList: optimalResult.packList, totalPurchasedMO };
});

const resetFields = () => { 
    queue.value = []; inputs.metal = 0; inputs.crystal = 0; inputs.deuterium = 0; stock.metal = 0; stock.crystal = 0; stock.deuterium = 0;
    settings.shopDiscount = 0; settings.moBonus = 0; settings.smartRounding = false; settings.merchantCount = 0; settings.merchantPrice = 3500;
    parser.text = ''; parser.multiplier = 1; 
};

onMounted(() => { 
    const cachedMetal = localStorage.getItem('ogameDailyMetal'); 
    if (cachedMetal) { const val = parseInt(cachedMetal); if (val > 0) { settings.packValue = val; isAutoLoaded.value = true; } } 
});
</script>

<template>
  <Teleport to="#header-actions">
      <button @click="resetFields" class="flex flex-col items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-200 transition group border border-red-500/20" :title="t('btn_reset')">
          <svg class="w-5 h-5 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
  </Teleport>

  <div class="max-w-7xl mx-auto px-4 md:px-6 mt-6 md:mt-10 pb-12">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div class="lg:col-span-2 space-y-8">
            
            <div class="card-glass p-6 relative overflow-hidden group border-l-4 border-l-green-500">
                <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    <span>{{ t('builder_title') }}</span>
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                    <div class="md:col-span-1">
                        <label class="block text-[10px] uppercase font-bold text-gray-400 mb-1">{{ t('lbl_category') }}</label>
                        <select v-model="builder.cat" class="input-glass w-full px-2 py-2 text-sm">
                            <option value="resources">{{ t('cat_resources') }}</option>
                            <option value="facilities">{{ t('cat_facilities') }}</option>
                            <option value="research">{{ t('cat_research') }}</option>
                            <option value="fleet">{{ t('cat_fleet') }}</option>
                            <option value="lf_rock">{{ t('cat_lf_rock') }}</option>
                        </select>
                    </div>
                    <div class="md:col-span-1">
                        <label class="block text-[10px] uppercase font-bold text-gray-400 mb-1">{{ t('lbl_element') }}</label>
                        <select v-model="builder.item" class="input-glass w-full px-2 py-2 text-sm">
                            <option v-for="(val, key) in currentItems" :key="key" :value="key">{{ t(key) }}</option>
                        </select>
                    </div>
                    <div class="md:col-span-1" v-if="builder.cat !== 'fleet'">
                        <label class="block text-[10px] uppercase font-bold text-gray-400 mb-1">{{ t('lbl_level') }}</label>
                        <input type="number" v-model.number="builder.level" @focus="$event.target.select()" min="1" class="input-glass w-full px-2 py-2 text-sm font-mono">
                    </div>
                    <div class="md:col-span-1 relative" v-if="builder.cat !== 'research'">
                        <label class="block text-[10px] uppercase font-bold text-gray-400 mb-1">{{ builder.cat === 'fleet' ? t('lbl_quantity') : t('lbl_planets') }}</label>
                        <div class="flex items-center">
                            <span v-if="builder.cat !== 'fleet'" class="absolute left-3 text-gray-500 text-sm font-bold">x</span>
                            <input type="number" v-model.number="builder.amount" @focus="$event.target.select()" min="1" class="input-glass w-full px-2 py-2 text-sm font-mono" :class="{'pl-6': builder.cat !== 'fleet'}">
                        </div>
                    </div>
                </div>
                <div class="mb-4">
                    <label class="block text-[10px] uppercase font-bold text-ogame-warning mb-1">{{ t('lbl_min_level') }}</label>
                    <input type="number" v-model.number="builder.minLevel" @focus="$event.target.select()" placeholder="0" min="0" class="input-glass w-24 px-2 py-1 text-xs font-mono border-ogame-warning/30 focus:border-ogame-warning">
                </div>
                <button @click="addToQueue" class="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition shadow-[0_0_15px_rgba(21,128,61,0.3)] mb-4">{{ t('btn_add_queue') }}</button>
                <div class="bg-black/30 border border-white/5 rounded-lg p-3 min-h-[50px] max-h-[150px] overflow-y-auto space-y-1 text-xs font-mono backdrop-blur-sm">
                    <div v-if="queue.length === 0" class="text-center text-gray-600 italic">{{ t('queue_empty') }}</div>
                    <div v-for="(item, index) in queue" :key="index" class="flex justify-between items-center text-gray-300 border-b border-gray-700/50 pb-1 last:border-0 hover:bg-white/5 px-1 rounded transition">
                        <div class="flex items-center gap-2">
                            <button @click="removeFromQueue(index)" class="text-red-500 hover:text-red-400 font-bold">✕</button>
                            <div><span class="text-white font-bold">{{ t(item.key) }}</span> <span class="text-[10px] text-gray-500 ml-1"><span v-if="item.cat === 'fleet'">({{ t('lbl_quantity') }}: {{ item.amount }})</span><span v-else-if="item.cat === 'import'"></span><span v-else>(Lvl: {{ item.level }} - {{ item.amount }}x)</span></span></div>
                        </div>
                        <div class="text-[10px] text-gray-400 font-mono text-right"><span class="text-gray-600">M:</span>{{ formatNum(item.m) }} <span class="text-green-600">C:</span>{{ formatNum(item.c) }} <span class="text-blue-600">D:</span>{{ formatNum(item.d) }}</div>
                    </div>
                </div>
            </div>

            <div class="card-glass p-6 relative overflow-hidden group border-l-4 border-l-cyan-500">
                <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <svg class="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                    <span>{{ t('import_title') }}</span>
                </h3>
                <div class="relative">
                    <textarea v-model="parser.text" rows="3" :placeholder="t('import_placeholder')" class="input-glass w-full p-4 text-sm font-mono resize-none"></textarea>
                    <div class="absolute bottom-3 right-3 flex items-center gap-2 bg-black/80 p-1 rounded-lg border border-white/10 shadow-lg">
                        <div class="flex items-center px-2 py-1" title="Moltiplicatore"><span class="text-xs text-gray-500 font-bold mr-1">x</span>
                        <input type="number" v-model.number="parser.multiplier" @focus="$event.target.select()" min="1" class="w-8 bg-transparent text-white text-xs font-bold focus:outline-none text-right font-mono"></div>
                        <button @click="parseString" class="px-4 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold rounded shadow transition">{{ t('btn_extract') }}</button>
                    </div>
                </div>
            </div>

            <div class="card-glass p-6 border-l-4 border-l-blue-600">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-bold text-white">{{ t('lbl_costs') }} & Stock</h3>
                    <span class="text-[10px] bg-blue-900/40 text-blue-300 px-2 py-1 rounded border border-blue-500/20">Inserisci quello che hai già in stock</span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="space-y-2">
                        <label class="flex justify-between text-xs uppercase font-bold text-gray-500">
                            <span>{{ t('res_metal') }}</span>
                            <span v-if="calculation.needM > 0" class="text-red-400">Mancano: {{ formatNum(calculation.needM) }}</span>
                            <span v-else class="text-green-500">Coperto</span>
                        </label>
                        <div class="relative">
                            <span class="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-bold">COST</span>
                            <input type="text" v-model="formMet" @focus="$event.target.select()" class="input-glass w-full py-2 pl-10 pr-3 text-right font-mono text-gray-200">
                        </div>
                        <div class="relative">
                            <span class="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-green-600 font-bold">HELD</span>
                            <input type="text" v-model="stockMet" @focus="$event.target.select()" class="input-glass w-full py-2 pl-10 pr-3 text-right font-mono text-gray-400 border-green-900/30 focus:border-green-500">
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label class="flex justify-between text-xs uppercase font-bold text-gray-500">
                            <span>{{ t('res_crystal') }}</span>
                            <span v-if="calculation.needC > 0" class="text-red-400">Mancano: {{ formatNum(calculation.needC) }}</span>
                            <span v-else class="text-green-500">Coperto</span>
                        </label>
                        <div class="relative">
                            <span class="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-bold">COST</span>
                            <input type="text" v-model="formCry" @focus="$event.target.select()" class="input-glass w-full py-2 pl-10 pr-3 text-right font-mono text-blue-200">
                        </div>
                        <div class="relative">
                            <span class="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-green-600 font-bold">HELD</span>
                            <input type="text" v-model="stockCry" @focus="$event.target.select()" class="input-glass w-full py-2 pl-10 pr-3 text-right font-mono text-gray-400 border-green-900/30 focus:border-green-500">
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label class="flex justify-between text-xs uppercase font-bold text-gray-500">
                            <span>{{ t('res_deuterium') }}</span>
                            <span v-if="calculation.needD > 0" class="text-red-400">Mancano: {{ formatNum(calculation.needD) }}</span>
                            <span v-else class="text-green-500">Coperto</span>
                        </label>
                        <div class="relative">
                            <span class="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-bold">COST</span>
                            <input type="text" v-model="formDeu" @focus="$event.target.select()" class="input-glass w-full py-2 pl-10 pr-3 text-right font-mono text-green-200">
                        </div>
                        <div class="relative">
                            <span class="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-green-600 font-bold">HELD</span>
                            <input type="text" v-model="stockDeu" @focus="$event.target.select()" class="input-glass w-full py-2 pl-10 pr-3 text-right font-mono text-gray-400 border-green-900/30 focus:border-green-500">
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="card-glass p-6">
                    <div class="flex justify-between items-center mb-4"><h3 class="text-sm font-bold text-gray-400 uppercase">{{ t('lbl_rates') }}</h3><button @click="settings.rateMet=3; settings.rateCry=2; settings.rateDeut=1" class="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/10 text-gray-400">Default 3:2:1</button></div>
                    <div class="flex items-center gap-2">
                        <input type="number" value="3" readonly class="w-full bg-black/40 border border-white/5 rounded p-2 text-center text-gray-600 font-bold focus:outline-none cursor-not-allowed">
                        <span class="text-gray-600">:</span>
                        <input type="number" v-model.number="settings.rateCry" @focus="$event.target.select()" class="input-glass w-full p-2 text-center text-blue-400 font-bold">
                        <span class="text-gray-600">:</span>
                        <input type="number" v-model.number="settings.rateDeut" @focus="$event.target.select()" class="input-glass w-full p-2 text-center text-green-400 font-bold">
                    </div>
                </div>
                <div class="card-glass p-6">
                    <h3 class="text-sm font-bold text-gray-400 uppercase mb-4">{{ t('lbl_pack_val') }}</h3>
                    <div class="relative">
                        <input type="text" v-model="formPackVal" @focus="$event.target.select()" class="input-glass w-full p-3 text-ogame-warning font-bold text-center text-lg border-ogame-warning/30 focus:border-ogame-warning">
                        <div class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-mono">MET</div>
                    </div>
                    <p class="text-[10px] text-gray-500 mt-2 text-center"><span v-if="isAutoLoaded" class="text-green-400">{{ t('pack_source_auto') }}</span><span v-else>{{ t('pack_source_manual') }}</span></p>
                </div>
            </div>
        </div>

        <div class="lg:col-span-1 space-y-6">
            
            <div class="card-glass p-8 flex flex-col justify-center min-h-[220px] relative overflow-hidden border-t-4 border-t-amber-500">
                <div class="text-center mb-8 relative z-10">
                    <div class="text-xs text-gray-500 uppercase tracking-widest mb-2">Net MSE Necessario</div>
                    <div class="text-3xl font-mono font-bold text-white break-all">{{ formatNum(calculation.totalMSE) }}</div>
                </div>
                <div class="w-full h-px bg-white/10 mb-8"></div>
                <div class="text-center relative z-10">
                    <div class="text-sm text-amber-500 uppercase tracking-widest mb-2 font-bold">{{ t('lbl_packs_needed') }}</div>
                    <div class="text-6xl font-bold text-white drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">{{ formatNum(calculation.packsNeeded) }}</div>
                </div>
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-amber-500/10 blur-[50px] rounded-full"></div>
            </div>

            <div v-if="tradePlan && (tradePlan.tradeMetToCry > 0 || tradePlan.tradeMetToDeut > 0)" class="card-glass p-5 border-t-4 border-t-cyan-600 bg-cyan-900/10">
                <h3 class="text-sm font-bold text-cyan-400 uppercase mb-3 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                    Piano di Scambio
                </h3>
                <div class="space-y-2 text-xs font-mono text-gray-300">
                    <div class="flex justify-between border-b border-white/5 pb-1">
                        <span>Compra Metallo</span>
                        <span class="text-white font-bold">{{ formatNum(tradePlan.totalMetalRequired) }}</span>
                    </div>
                    <div class="flex justify-between text-blue-300" v-if="tradePlan.tradeMetToCry > 0">
                        <span>Scambia in Cris</span>
                        <span>- {{ formatNum(tradePlan.tradeMetToCry) }} Met</span>
                    </div>
                    <div class="flex justify-between text-green-300" v-if="tradePlan.tradeMetToDeut > 0">
                        <span>Scambia in Deut</span>
                        <span>- {{ formatNum(tradePlan.tradeMetToDeut) }} Met</span>
                    </div>
                </div>
            </div>

            <div class="card-glass p-6 border-t-4 border-t-purple-600">
                <div class="flex flex-col gap-4 mb-6">
                    <div class="flex justify-between items-center">
                        <h3 class="text-sm font-bold text-gray-300 uppercase flex items-center gap-2">
                            <svg class="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path d="M13 7H7v6h6V7z"/><path fill-rule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1v-2H2a1 1 0 110-2h1V7a2 2 0 012-2h2V2zM5 7v6h10V7H5z" clip-rule="evenodd"/></svg>
                            <span>{{ t('lbl_cost_dm') }}</span>
                        </h3>
                        <div class="flex items-center justify-between bg-black/40 px-2 py-1 rounded border border-white/10">
                             <span class="text-[10px] text-gray-400 uppercase font-bold mr-2">{{ t('lbl_shop_discount') }}</span>
                             <select v-model.number="settings.shopDiscount" class="bg-transparent text-xs text-white outline-none text-right font-bold cursor-pointer w-16">
                                 <option value="0">0%</option>
                                 <option value="20">-20%</option>
                                 <option value="30">-30%</option>
                             </select>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between bg-black/40 px-2 py-1 rounded border border-white/10">
                         <span class="text-[10px] text-gray-400 uppercase font-bold">{{ t('lbl_event_bonus') }}</span>
                         <select v-model.number="settings.moBonus" class="bg-transparent text-xs text-white outline-none text-right font-bold cursor-pointer w-24">
                             <option value="0">{{ t('opt_none') || 'None' }}</option>
                             <option value="30">+30% {{ dmLabel }}</option>
                             <option value="40">+40% {{ dmLabel }}</option>
                             <option value="50">+50% {{ dmLabel }}</option>
                             <option value="60">+60% {{ dmLabel }}</option>
                             <option value="100">+100% {{ dmLabel }}</option>
                             <option value="130">+130% {{ dmLabel }}</option>
                         </select>
                    </div>

                    <div class="flex flex-col gap-2 bg-black/40 p-2 rounded border border-white/10">
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] text-gray-400 uppercase font-bold">Mercanti</span>
                            <span class="text-xs text-purple-300 font-mono">{{ formatNum(calculation.merchantCost) }} {{ dmLabel }}</span>
                        </div>
                        <div class="flex gap-2">
                             <input type="number" v-model.number="settings.merchantCount" @focus="$event.target.select()" min="0" placeholder="#" class="input-glass w-12 px-1 py-1 text-center text-xs">
                             <select v-model.number="settings.merchantPrice" class="input-glass flex-grow px-1 py-1 text-xs">
                                 <option value="3500">3.500 {{ dmLabel }}</option>
                                 <option value="2000">2.000 {{ dmLabel }}</option>
                             </select>
                        </div>
                    </div>

                </div>
                <div class="text-center py-4 bg-purple-900/10 rounded-xl border border-purple-500/20">
                    <div class="text-[10px] text-purple-300 uppercase tracking-widest">Totale {{ dmLabel }} Necessaria</div>
                    <div class="text-3xl font-bold text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] mb-1">{{ formatNum(calculation.totalMO) }}</div>
                    <div class="text-[9px] text-gray-400">{{ formatNum(calculation.moPerPack) }} {{ dmLabel }} / pack</div>
                </div>
            </div>

            <div class="card-glass p-6 border-t-4 border-t-green-600">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-sm font-bold text-gray-300 uppercase flex items-center gap-2 mt-1">
                        <span class="text-green-500 text-lg">€</span> <span>{{ t('lbl_opt_cost') }}</span>
                    </h3>
                    <label class="flex items-center cursor-pointer bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/10 hover:border-green-500 transition group">
                        <input type="checkbox" v-model="settings.smartRounding" class="w-3 h-3 accent-green-500 rounded border-gray-600 bg-gray-700 cursor-pointer">
                        <span class="ml-2 text-[10px] uppercase font-bold text-gray-400 group-hover:text-white">Smart (+20€)</span>
                    </label>
                </div>

                <div class="space-y-2 text-xs text-gray-400 font-mono mb-4 min-h-[40px] max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    <div v-if="euroOptimization.totalCost === 0" class="text-center italic opacity-50">{{ t('shop_list_empty') }}</div>
                    <div v-for="(item, index) in euroOptimization.packList" :key="index" class="flex justify-between items-center border-b border-white/5 pb-2 last:border-0">
                        <div class="flex flex-col">
                            <span class="text-gray-200 font-bold">{{ item.count }}x {{ t('shop_list_pack') }} {{ item.pack.cost }} €</span>
                            <span class="text-[10px] text-gray-500">{{ t('shop_list_contains') }}: {{ formatNum(item.pack.amount) }} {{ t('shop_list_each') }}</span>
                        </div>
                        <span class="text-green-400 font-mono font-bold">{{ item.count * item.pack.cost }} €</span>
                    </div>
                </div>
                
                <div class="flex justify-between items-end pt-4 border-t border-white/10">
                     <span class="text-xs text-gray-500 uppercase font-bold">{{ t('lbl_total') }}</span>
                     <span class="text-3xl font-bold text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.4)]">{{ euroOptimization.totalCost }} €</span>
                </div>

                <div class="mt-4 pt-3 border-t border-white/10 text-xs font-mono space-y-1">
                     <div class="flex justify-between text-gray-400">
                         <span>MO Necessaria:</span> 
                         <span>-{{ formatNum(calculation.totalMO) }}</span>
                     </div>
                     <div class="flex justify-between text-gray-300">
                         <span>MO Acquistata:</span> 
                         <span>+{{ formatNum(euroOptimization.totalPurchasedMO) }}</span>
                     </div>
                     <div class="flex justify-between font-bold text-sm pt-1 border-t border-white/5" 
                          :class="(euroOptimization.totalPurchasedMO - calculation.totalMO) >= 0 ? 'text-green-400' : 'text-red-400'">
                         <span>Differenza:</span>
                         <span>{{ (euroOptimization.totalPurchasedMO - calculation.totalMO) >= 0 ? '+' : '' }}{{ formatNum(euroOptimization.totalPurchasedMO - calculation.totalMO) }} {{ dmLabel }}</span>
                     </div>
                </div>

            </div>
        </div>
    </div>
  </div>
</template>