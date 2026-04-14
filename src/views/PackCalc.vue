<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { OGAME_DB } from '../data/ogame_db';
import { useOgameFormulas } from '../composables/useOgameFormulas';

const { t, currentLang } = useLanguage();
const { getBuildCostLF } = useOgameFormulas();

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
    paymentBonus: true,
    smartRounding: false,
    bldCostRdc: 0, 
    lfRsrLabLevel: 0,
    minLevel: 0,
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
// --- BUILDER ---
const builder = reactive({ cat: 'resources', item: 'metal_mine', level: 1, startLevel: 0, mult: 1 });
const basePacks = [ { cost: 200, amount: 5100000 }, { cost: 100, amount: 2525000 }, { cost: 50, amount: 1140000 }, { cost: 25, amount: 480000 }, { cost: 10, amount: 150000 }, { cost: 5, amount: 60000 } ];

const currentItems = computed(() => { const catData = OGAME_DB[builder.cat]; return catData ? catData.items : {}; });
watch(() => builder.cat, (newCat) => { 
    const items = OGAME_DB[newCat].items; 
    const keys = Object.keys(items); 
    if (keys.length > 0) builder.item = keys[0]; 
    builder.level = 1; builder.startLevel = 0; builder.mult = 1; 
});
watch(() => builder.level, (newVal) => {
    if (newVal > 0) builder.startLevel = newVal - 1;
    else builder.startLevel = 0;
});

const addToQueue = () => {
    const itemData = OGAME_DB[builder.cat]?.items[builder.item]; 
    if (!itemData) return;
    
    let costM = 0, costC = 0, costD = 0; 
    const lvl = parseInt(builder.level) || 1; 
    let mult = parseInt(builder.mult) || 1; 
    
    const isLF = builder.cat.startsWith('lf_');
    const isResearch = builder.cat.endsWith('_res') || builder.cat === 'research';

    if (itemData.type === 'unit') { 
        costM = itemData.cost[0] * mult; 
        costC = itemData.cost[1] * mult; 
        costD = itemData.cost[2] * mult; 
    } else if (isLF) {
        const lfCosts = getBuildCostLF(builder.item, builder.startLevel, lvl, OGAME_DB[builder.cat].items, settings.lfRsrLabLevel, 0);
        costM = lfCosts[0] * mult;
        costC = lfCosts[1] * mult;
        costD = lfCosts[2] * mult;
    } else {
        costM = 0; costC = 0; costD = 0;
        const startLvl = parseInt(builder.startLevel) || 0;
        const endLvl = lvl;
        for (let i = startLvl + 1; i <= endLvl; i++) {
            const factor = Math.pow(itemData.factor, i - 1); 
            let curM = Math.floor(itemData.cost[0] * factor); 
            let curC = Math.floor(itemData.cost[1] * factor); 
            let curD = Math.floor(itemData.cost[2] * factor);
            
            if (['metal_mine', 'crystal_mine', 'deuterium_synthesizer'].includes(builder.item)) { 
                const minLvl = parseInt(settings.minLevel) || 0; 
                const discount = Math.min(0.5, minLvl * 0.005); 
                if (discount > 0) { 
                    curM = Math.floor(curM * (1 - discount)); 
                    curC = Math.floor(curC * (1 - discount)); 
                    curD = Math.floor(curD * (1 - discount)); 
                } 
            }
            costM += curM; costC += curC; costD += curD;
        }
        costM *= mult; costC *= mult; costD *= mult;
    }
    const displayLevel = (builder.cat !== 'fleet' && builder.startLevel < lvl - 1) ? `${builder.startLevel} → ${lvl}` : lvl;
    queue.value.push({ key: builder.item, cat: builder.cat, level: displayLevel, amount: mult, m: costM, c: costC, d: costD }); 
    updateInputsFromQueue();
};
const removeFromQueue = (index) => { queue.value.splice(index, 1); updateInputsFromQueue(); };
const updateInputsFromQueue = () => { 
    let m = 0, c = 0, d = 0; 
    queue.value.forEach(item => { m += item.m; c += item.c; d += item.d; }); 
    inputs.metal = m; 
    inputs.crystal = c; 
    inputs.deuterium = d; 
};

const removalInProgress = ref(false); // Dummy for cleaner removal

// --- CORE CALCULATION LOGIC ---
const calculation = computed(() => {
    const rM = parseFloat(settings.rateMet) || 3;
    const rC = parseFloat(settings.rateCry) || 2;
    const rD = parseFloat(settings.rateDeut) || 1;

    // Total MSU of required resources
    const totalInputsMSU = inputs.metal + (inputs.crystal * (rM / rC)) + (inputs.deuterium * (rM / rD));
    
    // Total MSU of held resources
    const totalStockMSU = stock.metal + (stock.crystal * (rM / rC)) + (stock.deuterium * (rM / rD));

    // Net MSU needed
    const totalMSU = Math.max(0, Math.ceil(totalInputsMSU - totalStockMSU));

    // For individual resource missing display (purely visual, but helpful)
    const needM = Math.max(0, inputs.metal - stock.metal);
    const needC = Math.max(0, inputs.crystal - stock.crystal);
    const needD = Math.max(0, inputs.deuterium - stock.deuterium);

    const packVal = parseInt(settings.packValue) || 1;
    let packsNeeded = 0;
    if (totalMSU > 0 && packVal > 0) packsNeeded = Math.ceil(totalMSU / packVal);

    const basePackPrice = 60000;
    const discountFactor = 1 - (parseInt(settings.shopDiscount) / 100);
    const moPerPack = basePackPrice * discountFactor;
    
    let packsMO = packsNeeded * moPerPack;
    const totalMO = packsMO;

    return { needM, needC, needD, totalMSU, packsNeeded, totalMO, moPerPack, totalInputsMSU, totalStockMSU };
});

const tradePlan = computed(() => {
    const c = calculation.value;
    if (c.totalMSU <= 0) return null;
    const rateM = parseFloat(settings.rateMet) || 3;
    const rateC = parseFloat(settings.rateCry) || 2;
    const rateD = parseFloat(settings.rateDeut) || 1;
    const tradeForCry = c.needC * (rateM / rateC);
    const tradeForDeut = c.needD * (rateM / rateD);
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
    const hasPaymentBonus = settings.paymentBonus;
    const currentPacks = basePacks.map(p => {
        let baseAmount = p.amount;
        if (hasPaymentBonus) {
            baseAmount += (p.cost * 1000);
        }
        return { cost: p.cost, amount: Math.floor(baseAmount * bonusMult) };
    });

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
    settings.shopDiscount = 0; settings.moBonus = 0; settings.smartRounding = false;
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
    <!-- Page Header -->
    <div class="mb-10 text-center relative">
        <h1 class="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            {{ t('pack_calc_title') }}
        </h1>
        <div class="mt-2 h-1 w-24 bg-ogame-warning mx-auto rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
    </div>

    <!-- Intro Section -->
    <div class="card-glass p-6 mb-8 border-l-4 border-l-ogame-warning/50 bg-ogame-warning/5 backdrop-blur-md">
        <div class="flex items-start gap-4">
            <div class="p-3 rounded-xl bg-ogame-warning/10 text-ogame-warning">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
                <p class="text-sm text-gray-300 leading-relaxed font-medium">{{ t('pack_calc_intro') }}</p>
            </div>
        </div>
    </div>

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
                        <select v-model="builder.cat" class="input-glass w-full px-2 py-2 text-sm bg-black/40">
                            <option value="resources" class="bg-[#11141d] text-white">{{ t('cat_resources') }}</option>
                            <option value="facilities" class="bg-[#11141d] text-white">{{ t('cat_facilities') }}</option>
                            <option value="research" class="bg-[#11141d] text-white">{{ t('cat_research') }}</option>
                            <option value="fleet" class="bg-[#11141d] text-white">{{ t('cat_fleet') }}</option>
                            
                            <!-- LifeForms -->
                            <option value="lf_humans" class="bg-[#11141d] text-blue-300 font-bold">{{ t('cat_lf_humans') }} - {{ t('cat_facilities') }}</option>
                            <option value="lf_humans_res" class="bg-[#11141d] text-blue-300">{{ t('cat_lf_humans') }} - {{ t('cat_research') }}</option>
                            
                            <option value="lf_rocktal" class="bg-[#11141d] text-orange-400 font-bold">{{ t('cat_lf_rocktal') }} - {{ t('cat_facilities') }}</option>
                            <option value="lf_rocktal_res" class="bg-[#11141d] text-orange-400">{{ t('cat_lf_rocktal') }} - {{ t('cat_research') }}</option>
                            
                            <option value="lf_mecha" class="bg-[#11141d] text-gray-300 font-bold">{{ t('cat_lf_mecha') }} - {{ t('cat_facilities') }}</option>
                            <option value="lf_mecha_res" class="bg-[#11141d] text-gray-300">{{ t('cat_lf_mecha') }} - {{ t('cat_research') }}</option>
                            
                            <option value="lf_kaelesh" class="bg-[#11141d] text-purple-400 font-bold">{{ t('cat_lf_kaelesh') }} - {{ t('cat_facilities') }}</option>
                            <option value="lf_kaelesh_res" class="bg-[#11141d] text-purple-400">{{ t('cat_lf_kaelesh') }} - {{ t('cat_research') }}</option>
                        </select>
                    </div>
                    <div class="md:col-span-1">
                        <label class="block text-[10px] uppercase font-bold text-gray-400 mb-1">{{ t('lbl_element') }}</label>
                        <select v-model="builder.item" class="input-glass w-full px-2 py-2 text-sm bg-black/40">
                            <option v-for="(val, key) in currentItems" :key="key" :value="key" class="bg-[#11141d] text-white">{{ t(key) }}</option>
                        </select>
                    </div>
                    <div class="md:col-span-1" v-if="builder.cat !== 'fleet'">
                        <label class="block text-[10px] uppercase font-bold text-gray-400 mb-1 lg:truncate" :title="t('lbl_target_level')">{{ t('lbl_target_level') }}</label>
                        <input type="number" v-model.number="builder.level" @focus="$event.target.select()" min="1" class="input-glass w-full px-2 py-2 text-sm font-mono">
                    </div>
                    <div class="md:col-span-1" v-if="builder.cat !== 'fleet'">
                        <label class="block text-[10px] uppercase font-bold text-gray-400 mb-1 lg:truncate" :title="t('lbl_start_level')">{{ t('lbl_start_level') }}</label>
                        <input type="number" v-model.number="builder.startLevel" @focus="$event.target.select()" min="0" class="input-glass w-full px-2 py-2 text-sm font-mono">
                    </div>
                    <div class="md:col-span-1 relative">
                        <label class="block text-[10px] uppercase font-bold text-gray-400 mb-1">{{ builder.cat === 'fleet' ? t('lbl_quantity') : t('lbl_planets') }}</label>
                        <div class="flex items-center">
                            <span v-if="builder.cat !== 'fleet'" class="absolute left-3 text-gray-500 text-sm font-bold">x</span>
                            <input type="number" v-model.number="builder.mult" @focus="$event.target.select()" min="1" class="input-glass w-full px-2 py-2 text-sm font-mono" :class="{'pl-6': builder.cat !== 'fleet'}">
                        </div>
                    </div>
                </div>
                <div class="col-span-full">
                    <button @click="addToQueue" class="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(234,88,12,0.3)] transition-all hover:scale-[1.02] flex items-center justify-center gap-3 active:scale-95 group uppercase tracking-widest text-sm">
                        <svg class="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        {{ t('btn_add_queue') }}
                    </button>
                </div>                <div class="col-span-full border-t border-white/5 pt-6 mt-4">
                    <div class="flex items-center gap-2 mb-4">
                        <div class="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                        <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest">{{ t('lf_settings_title') }}</h3>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Centro Mineralogia -->
                        <div>
                            <div class="flex items-center gap-3 mb-2">
                                <div class="w-8 h-8 rounded-lg bg-ogame-warning/20 flex items-center justify-center border border-ogame-warning/30">
                                    <svg class="w-5 h-5 text-ogame-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-7h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                </div>
                                <div>
                                    <label class="block text-[11px] uppercase font-black text-ogame-warning tracking-wider leading-none">{{ t('lbl_min_level_settings') }}</label>
                                    <span class="text-[10px] text-gray-500 font-medium">{{ t('lbl_min_desc_settings') }}</span>
                                </div>
                            </div>
                            <div class="relative">
                                <input type="number" v-model.number="settings.minLevel" @focus="$event.target.select()" placeholder="0" min="0" class="input-glass w-full px-3 py-2 text-sm font-mono border-ogame-warning/30 focus:border-ogame-warning bg-black/20 pr-10">
                                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-ogame-warning/50">LVL</span>
                            </div>
                            <p class="text-[10px] text-ogame-warning/60 mt-1 italic">Bonus: -{{ Math.min(50, settings.minLevel * 0.5).toFixed(1) }}% (solo miniere)</p>
                        </div>

                        <!-- Lab Ricerca LF -->
                        <div>
                            <div class="flex items-center gap-3 mb-2">
                                <div class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                    <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.288a2 2 0 01-2.071 0l-.628-.288a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547V21a1 1 0 001.25.97l2.427-.607a6 6 0 013.623.504l.107.054a2 2 0 001.764 0l.107-.054a6 6 0 013.623-.504l2.427.607A1 1 0 0021 21v-5.572z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                </div>
                                <div>
                                    <label class="block text-[11px] uppercase font-black text-blue-400 tracking-wider leading-none">{{ t('lbl_lf_rsr_lab') }}</label>
                                    <span class="text-[10px] text-gray-500 font-medium">{{ t('lbl_lf_rsr_lab_desc') }}</span>
                                </div>
                            </div>
                            <div class="relative">
                                <input type="number" v-model.number="settings.lfRsrLabLevel" @focus="$event.target.select()" placeholder="0" min="0" max="100" class="input-glass w-full px-3 py-2 text-sm font-mono border-blue-500/30 focus:border-blue-500 bg-black/20 pr-10">
                                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-500/50">LVL</span>
                            </div>
                            <p class="text-[10px] text-blue-400/60 mt-1 italic">Bonus: -{{ Math.min(25, settings.lfRsrLabLevel * 0.25).toFixed(2) }}% (solo ricerche LF)</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Queue List (Section Separata) -->
            <div class="card-glass p-0 overflow-hidden border-l-4 border-l-blue-500 shadow-xl shadow-blue-500/5">
                <div class="bg-gradient-to-r from-blue-900/40 to-transparent px-6 py-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                        </div>
                        <h3 class="text-sm font-black text-white uppercase tracking-widest">{{ t('lbl_queue_list') }}</h3>
                    </div>
                    <div class="flex items-center gap-2">
                         <span class="px-2 py-1 rounded-md bg-white/5 text-[10px] font-mono text-blue-300 border border-white/5">{{ queue.length }} Elementi</span>
                         <button v-if="queue.length > 0" @click="queue = []; updateInputsFromQueue()" class="text-[10px] font-bold text-red-500/70 hover:text-red-400 transition-colors uppercase tracking-tighter">{{ t('shop_cart_clear') || 'Svuota' }}</button>
                    </div>
                </div>
                
                <div class="p-4 bg-black/20 min-h-[120px] max-h-[400px] overflow-y-auto custom-scrollbar">
                    <div v-if="queue.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-600 italic">
                        <div class="w-16 h-16 rounded-full border-2 border-dashed border-white/5 flex items-center justify-center mb-4">
                            <svg class="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        </div>
                        <span class="text-xs uppercase tracking-widest font-black opacity-30">{{ t('queue_empty') }}</span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div v-for="(item, index) in queue" :key="index" class="group/item relative flex flex-col gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-300">
                            <!-- Background Accent -->
                            <div class="absolute inset-y-0 left-0 w-1 rounded-full transition-all" :class="item.cat === 'fleet' ? 'bg-blue-500' : 'bg-ogame-warning'"></div>
                            
                            <div class="flex justify-between items-start pl-2">
                                <div class="flex flex-col">
                                    <span class="text-[15px] font-black text-white leading-tight uppercase tracking-tight">{{ t(item.key) }}</span>
                                    <div class="flex items-center gap-2 mt-1.5">
                                        <span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-black/60 text-blue-300 border border-blue-500/20 uppercase tracking-widest">
                                            {{ t('cat_' + item.cat) || item.cat }}
                                        </span>
                                        <div class="h-1 w-1 rounded-full bg-white/20"></div>
                                        <span class="text-[10px] font-black text-ogame-warning italic uppercase">
                                            <template v-if="item.cat === 'fleet'">{{ t('lbl_quantity') }}: <span class="text-white not-italic font-mono text-xs">{{ formatNum(item.amount) }}</span></template>
                                            <template v-else>{{ t('lbl_level') }}: <span class="text-white not-italic font-mono text-xs">{{ item.level }}</span> <span class="opacity-30 mx-1">|</span> {{ item.amount }}x</template>
                                        </span>
                                    </div>
                                </div>
                                <button @click="removeFromQueue(index)" class="p-2 rounded-xl text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-500/20" title="Rimuovi">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                            
                            <div class="flex flex-col gap-2 mt-2 bg-black/30 rounded-lg p-3 border border-white/5">
                                <div class="flex flex-row justify-between items-center gap-2">
                                    <div class="flex items-center gap-2 shrink-0">
                                        <div class="w-1.5 h-1.5 rounded-full bg-gray-500 shadow-[0_0_5px_rgba(107,114,128,0.5)]"></div>
                                        <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Metal</span>
                                    </div>
                                    <span class="text-[13px] md:text-sm font-mono font-black text-white truncate">{{ formatNum(item.m) }}</span>
                                </div>
                                <div class="flex flex-row justify-between items-center gap-2">
                                    <div class="flex items-center gap-2 shrink-0">
                                        <div class="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]"></div>
                                        <span class="text-[10px] font-black text-blue-500 uppercase tracking-widest">Crystal</span>
                                    </div>
                                    <span class="text-[13px] md:text-sm font-mono font-black text-blue-300 truncate">{{ formatNum(item.c) }}</span>
                                </div>
                                <div class="flex flex-row justify-between items-center gap-2">
                                    <div class="flex items-center gap-2 shrink-0">
                                        <div class="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                                        <span class="text-[10px] font-black text-green-500 uppercase tracking-widest">Deut</span>
                                    </div>
                                    <span class="text-[13px] md:text-sm font-mono font-black text-green-300 truncate">{{ formatNum(item.d) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card-glass p-6 border-l-4 border-l-blue-600">

                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-bold text-white">{{ t('lbl_costs') }} & {{ t('lbl_stock') }}</h3>
                    <span class="text-[10px] bg-blue-900/40 text-blue-300 px-2 py-1 rounded border border-blue-500/20">{{ t('lbl_stock') }}</span>
                </div>
                
                <div class="flex flex-col gap-4 mt-6">
                    <!-- Metal -->
                    <div class="bg-black/20 rounded-xl p-3 md:p-4 border border-white/5 relative overflow-hidden group">
                        <div class="absolute inset-0 bg-gradient-to-r from-gray-500/0 via-gray-500/5 to-gray-500/0 opacity-0 group-hover:opacity-100 transition duration-500"></div>
                        <div class="flex items-center justify-between mb-3 relative z-10">
                            <div class="flex items-center gap-2">
                                <div class="w-5 h-5 md:w-6 md:h-6 rounded bg-gray-600/50 flex items-center justify-center text-[10px] text-white shadow-inner font-bold">M</div>
                                <span class="font-bold text-[13px] md:text-sm text-gray-300 uppercase">{{ t('res_metal') }}</span>
                            </div>
                            <span v-if="calculation.needM > 0" class="text-[9px] md:text-[10px] font-bold text-red-400 bg-red-900/30 px-2 py-0.5 rounded border border-red-500/20 whitespace-nowrap">{{ t('msg_missing') }}: {{ formatNum(calculation.needM) }}</span>
                            <span v-else class="text-[9px] md:text-[10px] font-bold text-green-500 bg-green-900/30 px-2 py-0.5 rounded border border-green-500/20 whitespace-nowrap">{{ t('msg_covered') }}</span>
                        </div>
                        <div class="flex flex-col sm:grid sm:grid-cols-2 gap-2.5 sm:gap-4 relative z-10">
                            <div>
                                <label class="block text-[9px] uppercase font-bold text-gray-500 mb-1 lg:mb-1.5">{{ t('lbl_cost_list') }}</label>
                                <input type="text" v-model="formMet" @focus="$event.target.select()" class="input-glass w-full py-1.5 md:py-2 px-3 text-right font-mono text-gray-200 text-[13px] md:text-sm bg-black/40">
                            </div>
                            <div>
                                <label class="block text-[9px] uppercase font-bold text-green-500/70 mb-1 lg:mb-1.5">{{ t('lbl_stock_avail') }}</label>
                                <input type="text" v-model="stockMet" @focus="$event.target.select()" class="input-glass w-full py-1.5 md:py-2 px-3 text-right font-mono text-gray-400 border-green-900/30 focus:border-green-500 text-[13px] md:text-sm bg-black/40">
                            </div>
                        </div>
                    </div>

                    <!-- Crystal -->
                    <div class="bg-black/20 rounded-xl p-3 md:p-4 border border-white/5 relative overflow-hidden group">
                        <div class="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition duration-500"></div>
                        <div class="flex items-center justify-between mb-3 relative z-10">
                            <div class="flex items-center gap-2">
                                <div class="w-5 h-5 md:w-6 md:h-6 rounded bg-blue-600/50 flex items-center justify-center text-[10px] text-white shadow-inner font-bold">C</div>
                                <span class="font-bold text-[13px] md:text-sm text-gray-300 uppercase">{{ t('res_crystal') }}</span>
                            </div>
                            <span v-if="calculation.needC > 0 && calculation.totalMSU <= 0" class="text-[9px] md:text-[10px] font-bold text-amber-500 bg-amber-900/30 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">{{ t('msg_covered_surplus') }}</span>
                            <span v-else-if="calculation.needC > 0" class="text-[9px] md:text-[10px] font-bold text-red-400 bg-red-900/30 px-2 py-0.5 rounded border border-red-500/20 whitespace-nowrap">{{ t('msg_missing') }}: {{ formatNum(calculation.needC) }}</span>
                            <span v-else class="text-[9px] md:text-[10px] font-bold text-green-500 bg-green-900/30 px-2 py-0.5 rounded border border-green-500/20 whitespace-nowrap">{{ t('msg_covered') }}</span>
                        </div>
                        <div class="flex flex-col sm:grid sm:grid-cols-2 gap-2.5 sm:gap-4 relative z-10">
                            <div>
                                <label class="block text-[9px] uppercase font-bold text-gray-500 mb-1 lg:mb-1.5">{{ t('lbl_cost_list') }}</label>
                                <input type="text" v-model="formCry" @focus="$event.target.select()" class="input-glass w-full py-1.5 md:py-2 px-3 text-right font-mono text-blue-200 text-[13px] md:text-sm bg-black/40">
                            </div>
                            <div>
                                <label class="block text-[9px] uppercase font-bold text-green-500/70 mb-1 lg:mb-1.5">{{ t('lbl_stock_avail') }}</label>
                                <input type="text" v-model="stockCry" @focus="$event.target.select()" class="input-glass w-full py-1.5 md:py-2 px-3 text-right font-mono text-gray-400 border-green-900/30 focus:border-green-500 text-[13px] md:text-sm bg-black/40">
                            </div>
                        </div>
                    </div>

                    <!-- Deuterium -->
                    <div class="bg-black/20 rounded-xl p-3 md:p-4 border border-white/5 relative overflow-hidden group">
                        <div class="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 opacity-0 group-hover:opacity-100 transition duration-500"></div>
                        <div class="flex items-center justify-between mb-3 relative z-10">
                            <div class="flex items-center gap-2">
                                <div class="w-5 h-5 md:w-6 md:h-6 rounded bg-green-600/50 flex items-center justify-center text-[10px] text-white shadow-inner font-bold">D</div>
                                <span class="font-bold text-[13px] md:text-sm text-gray-300 uppercase">{{ t('res_deuterium') }}</span>
                            </div>
                            <span v-if="calculation.needD > 0 && calculation.totalMSU <= 0" class="text-[9px] md:text-[10px] font-bold text-amber-500 bg-amber-900/30 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">{{ t('msg_covered_surplus') }}</span>
                            <span v-else-if="calculation.needD > 0" class="text-[9px] md:text-[10px] font-bold text-red-400 bg-red-900/30 px-2 py-0.5 rounded border border-red-500/20 whitespace-nowrap">{{ t('msg_missing') }}: {{ formatNum(calculation.needD) }}</span>
                            <span v-else class="text-[9px] md:text-[10px] font-bold text-green-500 bg-green-900/30 px-2 py-0.5 rounded border border-green-500/20 whitespace-nowrap">{{ t('msg_covered') }}</span>
                        </div>
                        <div class="flex flex-col sm:grid sm:grid-cols-2 gap-2.5 sm:gap-4 relative z-10">
                            <div>
                                <label class="block text-[9px] uppercase font-bold text-gray-500 mb-1 lg:mb-1.5">{{ t('lbl_cost_list') }}</label>
                                <input type="text" v-model="formDeu" @focus="$event.target.select()" class="input-glass w-full py-1.5 md:py-2 px-3 text-right font-mono text-green-200 text-[13px] md:text-sm bg-black/40">
                            </div>
                            <div>
                                <label class="block text-[9px] uppercase font-bold text-green-500/70 mb-1 lg:mb-1.5">{{ t('lbl_stock_avail') }}</label>
                                <input type="text" v-model="stockDeu" @focus="$event.target.select()" class="input-glass w-full py-1.5 md:py-2 px-3 text-right font-mono text-gray-400 border-green-900/30 focus:border-green-500 text-[13px] md:text-sm bg-black/40">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <div class="lg:col-span-1 space-y-6">
            
            <!-- Pack Value (Moved to Top for Visibility) -->
            <div class="card-glass p-6 border-b-4 border-b-ogame-warning bg-gradient-to-t from-ogame-warning/10 to-transparent relative overflow-hidden shadow-lg shadow-ogame-warning/10">
                <h3 class="text-sm font-black text-ogame-warning uppercase mb-3 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {{ t('lbl_pack_val') }}
                </h3>
                <div class="relative z-10">
                    <input type="text" v-model="formPackVal" @focus="$event.target.select()" class="input-glass w-full p-4 text-white font-black text-center text-3xl border-ogame-warning/50 focus:border-ogame-warning bg-black/60 shadow-inner">
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ogame-warning font-bold font-mono bg-ogame-warning/20 px-2 py-1 rounded">MET</div>
                </div>
                <p class="text-[10px] uppercase font-bold text-gray-400 mt-3 text-center">
                    <span v-if="isAutoLoaded" class="text-green-400 flex items-center justify-center gap-1"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>{{ t('pack_source_auto') }}</span>
                    <span v-else>{{ t('pack_source_manual') }}</span>
                </p>
                <div class="absolute inset-0 bg-ogame-warning/5 animate-pulse-slow pointer-events-none"></div>
            </div>

            <div class="card-glass p-8 flex flex-col justify-center min-h-[220px] relative overflow-hidden border-t-4 border-t-amber-500">
                <div class="text-center mb-8 relative z-10">
                    <div class="text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold">{{ t('lbl_msu_needed') }}</div>
                    <div class="text-3xl font-mono font-bold text-white break-all">{{ formatNum(calculation.totalMSU) }}</div>
                </div>
                <div class="w-full h-px bg-white/10 mb-8"></div>
                <div class="text-center relative z-10">
                    <div class="text-sm text-amber-500 uppercase tracking-widest mb-2 font-bold">{{ t('lbl_packs_needed') }}</div>
                    <div class="text-6xl font-bold text-white drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">{{ formatNum(calculation.packsNeeded) }}</div>
                </div>
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-amber-500/10 blur-[50px] rounded-full"></div>
            </div>

            <!-- Tassi di scambio posizionati qui come richiesto -->
            <div class="card-glass p-6 border-t-4 border-t-blue-500/50">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-sm font-bold text-gray-300 uppercase">{{ t('lbl_rates') }}</h3>
                    <button @click="settings.rateMet=3; settings.rateCry=2; settings.rateDeut=1" class="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/10 text-gray-400">Default 3:2:1</button>
                </div>
                <div class="flex items-center gap-2">
                    <input type="number" value="3" readonly class="w-full bg-black/40 border border-white/5 rounded p-2 text-center text-gray-600 font-bold focus:outline-none cursor-not-allowed">
                    <span class="text-gray-600">:</span>
                    <input type="number" v-model.number="settings.rateCry" @focus="$event.target.select()" class="input-glass w-full p-2 text-center text-blue-400 font-bold">
                    <span class="text-gray-600">:</span>
                    <input type="number" v-model.number="settings.rateDeut" @focus="$event.target.select()" class="input-glass w-full p-2 text-center text-green-400 font-bold">
                </div>
            </div>

            <div v-if="tradePlan && (tradePlan.tradeMetToCry > 0 || tradePlan.tradeMetToDeut > 0)" class="card-glass p-5 border-t-4 border-t-cyan-600 bg-cyan-900/10">
                <h3 class="text-sm font-bold text-cyan-400 uppercase mb-3 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                    {{ t('lbl_trade_plan') }}
                </h3>
                <div class="space-y-2 text-xs font-mono text-gray-300">
                    <div class="flex justify-between border-b border-white/5 pb-1">
                        <span>{{ t('lbl_buy_metal') }}</span>
                        <span class="text-white font-bold">{{ formatNum(tradePlan.totalMetalRequired) }}</span>
                    </div>
                    <div class="flex justify-between text-blue-300" v-if="tradePlan.tradeMetToCry > 0">
                        <span>{{ t('lbl_trade_cry') }}</span>
                        <span>- {{ formatNum(tradePlan.tradeMetToCry) }} Met</span>
                    </div>
                    <div class="flex justify-between text-green-300" v-if="tradePlan.tradeMetToDeut > 0">
                        <span>{{ t('lbl_trade_deut') }}</span>
                        <span>- {{ formatNum(tradePlan.tradeMetToDeut) }} Met</span>
                    </div>
                </div>
            </div>

            <div class="card-glass p-6 border-t-4 border-t-purple-600">
                <div class="flex flex-col gap-4 mb-6">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h3 class="text-sm font-bold text-gray-300 uppercase flex items-center gap-2">
                            <svg class="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path d="M13 7H7v6h6V7z"/><path fill-rule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1v-2H2a1 1 0 110-2h1V7a2 2 0 012-2h2V2zM5 7v6h10V7H5z" clip-rule="evenodd"/></svg>
                            <span>{{ t('lbl_cost_dm') }}</span>
                        </h3>
                        <div class="flex flex-col gap-2 w-full sm:w-auto">
                             <span class="text-[10px] text-gray-400 uppercase font-bold">OFFERTA PACCHETTI</span>
                             <div class="flex flex-1 sm:flex-none items-center gap-1 bg-black/40 p-1.5 rounded-lg border border-white/5">
                                 <button @click="settings.shopDiscount = 0" :class="settings.shopDiscount === 0 ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'" class="px-3 py-1.5 text-xs font-bold rounded-md transition-all flex-1 sm:flex-none">0%</button>
                                 <button @click="settings.shopDiscount = 20" :class="settings.shopDiscount === 20 ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'" class="px-3 py-1.5 text-xs font-bold rounded-md transition-all flex-1 sm:flex-none">-20%</button>
                                 <button @click="settings.shopDiscount = 30" :class="settings.shopDiscount === 30 ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'" class="px-3 py-1.5 text-xs font-bold rounded-md transition-all flex-1 sm:flex-none">-30%</button>
                             </div>
                        </div>
                    </div>
                    
                    <div class="flex flex-col gap-3">
                         <div class="flex flex-col gap-2">
                             <span class="text-[10px] text-gray-400 uppercase font-bold">{{ t('lbl_event_bonus') }}</span>
                             <div class="grid grid-cols-4 gap-1 bg-black/40 p-1.5 rounded-lg border border-white/5">
                                 <button v-for="b in [0, 30, 40, 50, 60, 100, 130]" :key="b" @click="settings.moBonus = b" 
                                    :class="settings.moBonus === b ? 'bg-purple-600 text-white font-black shadow-md' : 'text-gray-400 hover:text-gray-200 font-bold'" 
                                    class="py-1 text-[11px] rounded transition-all text-center">
                                    <template v-if="b === 0">{{ t('opt_none') }}</template>
                                    <template v-else>+{{ b }}%</template>
                                 </button>
                             </div>
                         </div>
                         <div class="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-white/5 shadow-inner">
                             <label class="flex items-center cursor-pointer group">
                                 <input type="checkbox" v-model="settings.paymentBonus" class="w-4 h-4 accent-purple-500 rounded border-gray-600 bg-gray-700 cursor-pointer focus:ring-purple-500/50">
                                 <span class="ml-2 text-[10px] uppercase font-bold text-gray-300 group-hover:text-white transition-colors">{{ t('lbl_payment_bonus') }}</span>
                             </label>
                             <span class="text-[9px] text-gray-500 font-mono italic">(PayPal, Card, Amazon)</span>
                         </div>
                    </div>
                </div>
                <div class="text-center py-4 bg-purple-900/10 rounded-xl border border-purple-500/20">
                    <div class="text-[10px] text-purple-300 uppercase tracking-widest">{{ t('lbl_mo_needed') }}</div>
                    <div class="text-3xl font-bold text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] mb-1">{{ formatNum(calculation.totalMO) }}</div>
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
                         <span>{{ t('lbl_mo_needed') }}:</span> 
                         <span>-{{ formatNum(calculation.totalMO) }}</span>
                     </div>
                     <div class="flex justify-between text-gray-300">
                         <span>{{ t('lbl_mo_bought') }}:</span> 
                         <span>+{{ formatNum(euroOptimization.totalPurchasedMO) }}</span>
                     </div>
                     <div class="flex justify-between font-bold text-sm pt-1 border-t border-white/5" 
                          :class="(euroOptimization.totalPurchasedMO - calculation.totalMO) >= 0 ? 'text-green-400' : 'text-red-400'">
                         <span>{{ t('lbl_diff') }}:</span>
                         <span>{{ (euroOptimization.totalPurchasedMO - calculation.totalMO) >= 0 ? '+' : '' }}{{ formatNum(euroOptimization.totalPurchasedMO - calculation.totalMO) }} {{ dmLabel }}</span>
                     </div>
                </div>

            </div>
        </div>
    </div>
  </div>
</template>