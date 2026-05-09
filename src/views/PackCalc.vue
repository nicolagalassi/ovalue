<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { OGAME_DB } from '../data/ogame_db';
import { useOgameFormulas } from '../composables/useOgameFormulas';
import { useProfiles } from '../composables/useProfiles';

const { t, currentLang } = useLanguage();
const { getBuildCostLF } = useOgameFormulas();
const { activeProfile, saveProfiles } = useProfiles();

// --- STATO ---
const queue = ref([]);
const isAutoLoaded = ref(true);
const showIntro = ref(false);

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

// Sync with profile
watch(activeProfile, (newP) => {
    if (newP && newP.packExchange) {
        Object.assign(settings, JSON.parse(JSON.stringify(newP.packExchange.settings)));
        Object.assign(stock, JSON.parse(JSON.stringify(newP.packExchange.stock)));
        queue.value = JSON.parse(JSON.stringify(newP.packExchange.queue));
        
        // Auto-load pack value if enabled
        if (isAutoLoaded.value && newP.production?.daily) {
            settings.packValue = newP.production.daily;
        }
    }
}, { immediate: true });

// Auto-update pack value if production changes and auto-load is on
watch(() => activeProfile.value?.production?.daily, (newVal) => {
    if (newVal && isAutoLoaded.value) {
        settings.packValue = newVal;
    }
});

// Save changes back to profile — debounced to avoid blocking the main thread on every keystroke
let saveDebounce = null;
watch([settings, stock, queue], () => {
    if (!activeProfile.value) return;
    clearTimeout(saveDebounce);
    saveDebounce = setTimeout(() => {
        if (!activeProfile.value) return;
        activeProfile.value.packExchange.settings = JSON.parse(JSON.stringify(settings));
        activeProfile.value.packExchange.stock = JSON.parse(JSON.stringify(stock));
        activeProfile.value.packExchange.queue = JSON.parse(JSON.stringify(queue.value));
        saveProfiles();
    }, 400);
}, { deep: true });
// --- HELPER ---
const dmLabel = computed(() => t('lbl_dm'));
const formatNum = (n) => new Intl.NumberFormat('it-IT').format(Math.floor(n));

const createFormattedInput = (targetObj, key, isPackVal = false) => computed({
    get() { 
        return isNaN(targetObj[key]) ? '0' : new Intl.NumberFormat('it-IT').format(Math.floor(targetObj[key])); 
    },
    set(newValue) {
        const rawValue = String(newValue).replace(/[^0-9-]/g, '');
        const parsed = parseInt(rawValue);
        targetObj[key] = isNaN(parsed) ? 0 : parsed;
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
        const maxPackCost = Math.max(...currentPacks.map(p => p.cost));
        
        let flatList = []; 
        let largePacksCount = 0;
        let largePack = null;

        optimalResult.packList.forEach(item => { 
            if (item.pack.cost === maxPackCost) {
                largePacksCount += item.count;
                largePack = item.pack;
            } else {
                for(let i=0; i<item.count; i++) flatList.push(item.pack); 
            }
        });

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
        if (largePacksCount > 0 && largePack) {
            groupedMap.set(largePack.cost, { count: largePacksCount, pack: largePack });
            totalCost += largePack.cost * largePacksCount;
        }
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
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 md:px-6 mt-6 md:mt-10 pb-12">
    <!-- Page Header -->
    <div class="mb-10 text-center relative">
        <h1 class="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            {{ t('pack_calc_title') }}
        </h1>
        <div class="mt-2 h-[3px] w-24 bg-gradient-to-r from-amber-500 to-amber-400 mx-auto rounded-full opacity-70"></div>
    </div>

    <!-- Intro Section -->
    <div class="card-glass mb-8 border-l-4 border-l-amber-500/40 bg-amber-500/[0.03]">

        <!-- Mobile: collapsed header -->
        <button @click="showIntro = !showIntro" class="md:hidden w-full flex items-center justify-between px-4 py-3 text-amber-400">
            <div class="flex items-center gap-2">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span class="text-xs font-black uppercase tracking-widest">{{ t('pack_calc_title') }}</span>
            </div>
            <svg class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': showIntro }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>

        <!-- Collapsible body on mobile, always visible on desktop -->
        <div class="p-6 flex items-start gap-4" :class="showIntro ? 'block' : 'hidden md:flex'">
            <div class="hidden md:block p-3 rounded-xl bg-amber-500/[0.08] text-amber-400 flex-shrink-0">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
                <p class="text-sm text-gray-300 leading-relaxed font-medium">{{ t('pack_calc_intro') }}</p>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div class="lg:col-span-2 space-y-8">
            
            <div class="card-glass p-6 relative overflow-hidden group border-l-2 border-l-emerald-500/50">
                <h3 class="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2.5 uppercase tracking-wider">
                    <span class="w-[2px] h-4 bg-emerald-400/60 rounded-full flex-shrink-0"></span>
                    {{ t('builder_title') }}
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                    <div class="md:col-span-1">
                        <label class="block text-[10px] uppercase font-bold text-gray-400 mb-1">{{ t('lbl_category') }}</label>
                        <select v-model="builder.cat" class="input-glass w-full px-2 py-2 text-sm bg-black/40">
                            <option value="resources" class="bg-[#0d1525] text-white">{{ t('cat_resources') }}</option>
                            <option value="facilities" class="bg-[#0d1525] text-white">{{ t('cat_facilities') }}</option>
                            <option value="research" class="bg-[#0d1525] text-white">{{ t('cat_research') }}</option>
                            <option value="fleet" class="bg-[#0d1525] text-white">{{ t('cat_fleet') }}</option>
                            
                            <!-- LifeForms -->
                            <option value="lf_humans" class="bg-[#0d1525] text-blue-300 font-bold">{{ t('cat_lf_humans') }} - {{ t('cat_facilities') }}</option>
                            <option value="lf_humans_res" class="bg-[#0d1525] text-blue-300">{{ t('cat_lf_humans') }} - {{ t('cat_research') }}</option>
                            
                            <option value="lf_rocktal" class="bg-[#0d1525] text-orange-400 font-bold">{{ t('cat_lf_rocktal') }} - {{ t('cat_facilities') }}</option>
                            <option value="lf_rocktal_res" class="bg-[#0d1525] text-orange-400">{{ t('cat_lf_rocktal') }} - {{ t('cat_research') }}</option>
                            
                            <option value="lf_mecha" class="bg-[#0d1525] text-gray-300 font-bold">{{ t('cat_lf_mecha') }} - {{ t('cat_facilities') }}</option>
                            <option value="lf_mecha_res" class="bg-[#0d1525] text-gray-300">{{ t('cat_lf_mecha') }} - {{ t('cat_research') }}</option>
                            
                            <option value="lf_kaelesh" class="bg-[#0d1525] text-purple-400 font-bold">{{ t('cat_lf_kaelesh') }} - {{ t('cat_facilities') }}</option>
                            <option value="lf_kaelesh_res" class="bg-[#0d1525] text-purple-400">{{ t('cat_lf_kaelesh') }} - {{ t('cat_research') }}</option>
                        </select>
                    </div>
                    <div class="md:col-span-1">
                        <label class="block text-[10px] uppercase font-bold text-gray-400 mb-1">{{ t('lbl_element') }}</label>
                        <select v-model="builder.item" class="input-glass w-full px-2 py-2 text-sm bg-black/40">
                            <option v-for="(val, key) in currentItems" :key="key" :value="key" class="bg-[#0d1525] text-white">{{ t(key) }}</option>
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
                    <button @click="addToQueue" class="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2.5 uppercase tracking-wider text-sm">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        {{ t('btn_add_queue') }}
                    </button>
                </div>                <div class="col-span-full border-t border-slate-700/20 pt-6 mt-4">
                    <div class="flex items-center gap-2.5 mb-4">
                        <span class="w-[2px] h-3 bg-amber-500/60 rounded-full flex-shrink-0"></span>
                        <h3 class="text-[11px] font-black text-gray-400 uppercase tracking-wider font-mono">{{ t('lf_settings_title') }}</h3>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Centro Mineralogia -->
                        <div>
                            <div class="flex items-center gap-3 mb-2">
                                <div class="w-8 h-8 rounded-lg bg-amber-500/[0.12] flex items-center justify-center border border-amber-500/25">
                                    <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-7h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                </div>
                                <div>
                                    <label class="block text-[11px] uppercase font-black text-amber-400 tracking-wider leading-none">{{ t('lbl_min_level_settings') }}</label>
                                    <span class="text-[10px] text-gray-500 font-medium">{{ t('lbl_min_desc_settings') }}</span>
                                </div>
                            </div>
                            <div class="relative">
                                <input type="number" v-model.number="settings.minLevel" @focus="$event.target.select()" placeholder="0" min="0" class="input-glass w-full px-3 py-2 text-sm font-mono border-amber-500/25 focus:border-amber-400 bg-black/20 pr-10">
                                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-400/50">LVL</span>
                            </div>
                            <p class="text-[10px] text-amber-400/60 mt-1 italic">–{{ Math.min(50, settings.minLevel * 0.5).toFixed(1) }}% {{ t('lbl_bonus_mines_only') }}</p>
                        </div>

                        <!-- Lab Ricerca LF -->
                        <div>
                            <div class="flex items-center gap-3 mb-2">
                                <div class="w-8 h-8 rounded-lg bg-sky-500/[0.12] flex items-center justify-center border border-sky-500/25">
                                    <svg class="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.288a2 2 0 01-2.071 0l-.628-.288a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547V21a1 1 0 001.25.97l2.427-.607a6 6 0 013.623.504l.107.054a2 2 0 001.764 0l.107-.054a6 6 0 013.623-.504l2.427.607A1 1 0 0021 21v-5.572z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                </div>
                                <div>
                                    <label class="block text-[11px] uppercase font-semibold text-sky-400 tracking-wider leading-none">{{ t('lbl_lf_rsr_lab') }}</label>
                                    <span class="text-[10px] text-gray-500 font-medium">{{ t('lbl_lf_rsr_lab_desc') }}</span>
                                </div>
                            </div>
                            <div class="relative">
                                <input type="number" v-model.number="settings.lfRsrLabLevel" @focus="$event.target.select()" placeholder="0" min="0" max="100" class="input-glass w-full px-3 py-2 text-sm font-mono border-sky-500/25 focus:border-sky-500/50 bg-black/20 pr-10">
                                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-sky-500/50">LVL</span>
                            </div>
                            <p class="text-[10px] text-sky-400/60 mt-1 italic">–{{ Math.min(25, settings.lfRsrLabLevel * 0.25).toFixed(2) }}% {{ t('lbl_bonus_lf_res_only') }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Lista Costruzioni -->
            <div class="overflow-hidden rounded-xl border border-slate-700/25 bg-[#0d1525]">

                <!-- Header -->
                <div class="px-5 py-3 border-b border-slate-700/25 flex justify-between items-center bg-[#0a101e]">
                    <div class="flex items-center gap-2.5">
                        <span class="w-[2px] h-4 bg-sky-400/60 rounded-full flex-shrink-0"></span>
                        <h3 class="text-sm font-semibold text-slate-200 uppercase tracking-wider">{{ t('lbl_queue_list') }}</h3>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] font-mono text-slate-500 border border-slate-700/20">{{ queue.length }}</span>
                        <button v-if="queue.length > 0" @click="queue = []; updateInputsFromQueue()"
                                class="text-[10px] font-medium text-rose-500/60 hover:text-rose-400 transition-colors uppercase tracking-wider">
                            {{ t('shop_cart_clear') }}
                        </button>
                    </div>
                </div>

                <!-- Content -->
                <div class="p-4 min-h-[120px] max-h-[400px] overflow-y-auto custom-scrollbar">

                    <!-- Empty state -->
                    <div v-if="queue.length === 0" class="flex flex-col items-center justify-center py-12 gap-3">
                        <svg class="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                        <span class="text-xs text-slate-700 uppercase tracking-widest">{{ t('queue_empty') }}</span>
                    </div>

                    <!-- Items grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div v-for="(item, index) in queue" :key="index"
                             class="group/item relative rounded-xl bg-[#0a101e] border border-slate-700/20 hover:border-slate-600/40 transition-all duration-200 overflow-hidden">

                            <!-- Left accent bar -->
                            <div class="absolute inset-y-0 left-0 w-[2px] rounded-l-xl"
                                 :class="item.cat === 'fleet' ? 'bg-sky-500/60' : 'bg-amber-500/60'"></div>

                            <div class="pl-4 pr-3 py-3">
                                <!-- Name + remove -->
                                <div class="flex justify-between items-start gap-2 mb-2.5">
                                    <div class="min-w-0">
                                        <span class="text-[13px] font-bold text-slate-200 uppercase tracking-tight leading-tight line-clamp-1 block">{{ t(item.key) }}</span>
                                        <div class="flex items-center gap-2 mt-1 flex-wrap">
                                            <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-sky-500/[0.08] text-sky-400/80 border border-sky-500/15 uppercase tracking-wider">
                                                {{ t('cat_' + item.cat) || item.cat }}
                                            </span>
                                            <span class="text-[10px] text-slate-600 font-mono">
                                                <template v-if="item.cat === 'fleet'">×{{ formatNum(item.amount) }}</template>
                                                <template v-else>{{ t('lbl_level_abbr') }}&nbsp;{{ item.level }}&thinsp;·&thinsp;{{ item.amount }}×</template>
                                            </span>
                                        </div>
                                    </div>
                                    <button @click="removeFromQueue(index)"
                                            class="flex-shrink-0 p-1.5 rounded-lg text-slate-700 hover:text-rose-400 hover:bg-rose-500/[0.08] transition-all">
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                    </button>
                                </div>

                                <!-- Resources -->
                                <div class="space-y-1.5 bg-[#070c18]/50 rounded-lg p-2.5 border border-slate-700/15">
                                    <div class="flex justify-between items-center">
                                        <span class="flex items-center gap-1.5 text-[11px] text-slate-500">
                                            <span class="w-1.5 h-1.5 rounded-full bg-slate-500 flex-shrink-0"></span>
                                            {{ t('res_metal') }}
                                        </span>
                                        <span class="text-[12px] font-mono font-semibold text-slate-300">{{ formatNum(item.m) }}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="flex items-center gap-1.5 text-[11px] text-sky-400/70">
                                            <span class="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0"></span>
                                            {{ t('res_crystal') }}
                                        </span>
                                        <span class="text-[12px] font-mono font-semibold text-sky-300/80">{{ formatNum(item.c) }}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="flex items-center gap-1.5 text-[11px] text-emerald-400/70">
                                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                                            {{ t('res_deuterium') }}
                                        </span>
                                        <span class="text-[12px] font-mono font-semibold text-emerald-300/80">{{ formatNum(item.d) }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card-glass p-6 border-l-2 border-l-sky-500/40">

                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2.5">
                        <span class="w-[2px] h-4 bg-sky-400/60 rounded-full flex-shrink-0"></span>
                        {{ t('lbl_costs') }} / {{ t('lbl_stock') }}
                    </h3>
                    <span class="text-[10px] bg-sky-900/20 text-sky-400/70 px-2 py-1 rounded border border-sky-500/15">{{ t('lbl_stock') }}</span>
                </div>
                
                <div class="flex flex-col gap-4 mt-6">
                    <!-- Metal -->
                    <div class="bg-[#0a101e] rounded-xl p-3 md:p-4 border border-slate-700/20 relative overflow-hidden group">
                        <div class="absolute inset-0 bg-gradient-to-r from-gray-500/0 via-gray-500/5 to-gray-500/0 opacity-0 group-hover:opacity-100 transition duration-500"></div>
                        <div class="flex items-center justify-between mb-3 relative z-10">
                            <div class="flex items-center gap-2">
                                <div class="w-5 h-5 md:w-6 md:h-6 rounded bg-slate-600/40 flex items-center justify-center text-[10px] text-white shadow-inner font-bold">M</div>
                                <span class="font-bold text-[13px] md:text-sm text-slate-300 uppercase">{{ t('res_metal') }}</span>
                            </div>
                            <span v-if="calculation.needM > 0" class="text-[9px] md:text-[10px] font-bold text-red-400 bg-red-900/30 px-2 py-0.5 rounded border border-red-500/20 whitespace-nowrap">{{ t('msg_missing') }}: {{ formatNum(calculation.needM) }}</span>
                            <span v-else class="text-[9px] md:text-[10px] font-bold text-green-500 bg-green-900/30 px-2 py-0.5 rounded border border-green-500/20 whitespace-nowrap">{{ t('msg_covered') }}</span>
                        </div>
                        <div class="flex flex-col sm:grid sm:grid-cols-2 gap-2.5 sm:gap-4 relative z-10">
                            <div>
                                <label class="block text-[10px] font-semibold text-slate-500 mb-1.5">{{ t('lbl_cost_list') }}</label>
                                <input type="text" v-model="formMet" @focus="$event.target.select()" class="input-glass w-full py-1.5 md:py-2 px-3 text-right font-mono text-gray-200 text-[13px] md:text-sm bg-black/40">
                            </div>
                            <div>
                                <label class="block text-[10px] font-semibold text-emerald-500/60 mb-1.5">{{ t('lbl_stock_avail') }}</label>
                                <input type="text" v-model="stockMet" @focus="$event.target.select()" class="input-glass w-full py-1.5 md:py-2 px-3 text-right font-mono text-emerald-300/70 border-emerald-900/20 focus:border-emerald-500/50 text-[13px] md:text-sm bg-black/40">
                            </div>
                        </div>
                    </div>

                    <!-- Crystal -->
                    <div class="bg-[#0a101e] rounded-xl p-3 md:p-4 border border-slate-700/20 relative overflow-hidden group">
                        <div class="absolute inset-0 bg-gradient-to-r from-sky-500/0 via-sky-500/5 to-sky-500/0 opacity-0 group-hover:opacity-100 transition duration-500"></div>
                        <div class="flex items-center justify-between mb-3 relative z-10">
                            <div class="flex items-center gap-2">
                                <div class="w-5 h-5 md:w-6 md:h-6 rounded bg-sky-600/40 flex items-center justify-center text-[10px] text-white shadow-inner font-bold">C</div>
                                <span class="font-bold text-[13px] md:text-sm text-slate-300 uppercase">{{ t('res_crystal') }}</span>
                            </div>
                            <span v-if="calculation.needC > 0 && calculation.totalMSU <= 0" class="text-[9px] md:text-[10px] font-bold text-amber-500 bg-amber-900/30 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">{{ t('msg_covered_surplus') }}</span>
                            <span v-else-if="calculation.needC > 0" class="text-[9px] md:text-[10px] font-bold text-red-400 bg-red-900/30 px-2 py-0.5 rounded border border-red-500/20 whitespace-nowrap">{{ t('msg_missing') }}: {{ formatNum(calculation.needC) }}</span>
                            <span v-else class="text-[9px] md:text-[10px] font-bold text-green-500 bg-green-900/30 px-2 py-0.5 rounded border border-green-500/20 whitespace-nowrap">{{ t('msg_covered') }}</span>
                        </div>
                        <div class="flex flex-col sm:grid sm:grid-cols-2 gap-2.5 sm:gap-4 relative z-10">
                            <div>
                                <label class="block text-[10px] font-semibold text-slate-500 mb-1.5">{{ t('lbl_cost_list') }}</label>
                                <input type="text" v-model="formCry" @focus="$event.target.select()" class="input-glass w-full py-1.5 md:py-2 px-3 text-right font-mono text-sky-200 text-[13px] md:text-sm bg-black/40">
                            </div>
                            <div>
                                <label class="block text-[10px] font-semibold text-emerald-500/60 mb-1.5">{{ t('lbl_stock_avail') }}</label>
                                <input type="text" v-model="stockCry" @focus="$event.target.select()" class="input-glass w-full py-1.5 md:py-2 px-3 text-right font-mono text-emerald-300/70 border-emerald-900/20 focus:border-emerald-500/50 text-[13px] md:text-sm bg-black/40">
                            </div>
                        </div>
                    </div>

                    <!-- Deuterium -->
                    <div class="bg-[#0a101e] rounded-xl p-3 md:p-4 border border-slate-700/20 relative overflow-hidden group">
                        <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition duration-500"></div>
                        <div class="flex items-center justify-between mb-3 relative z-10">
                            <div class="flex items-center gap-2">
                                <div class="w-5 h-5 md:w-6 md:h-6 rounded bg-emerald-600/40 flex items-center justify-center text-[10px] text-white shadow-inner font-bold">D</div>
                                <span class="font-bold text-[13px] md:text-sm text-slate-300 uppercase">{{ t('res_deuterium') }}</span>
                            </div>
                            <span v-if="calculation.needD > 0 && calculation.totalMSU <= 0" class="text-[9px] md:text-[10px] font-bold text-amber-500 bg-amber-900/30 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">{{ t('msg_covered_surplus') }}</span>
                            <span v-else-if="calculation.needD > 0" class="text-[9px] md:text-[10px] font-bold text-red-400 bg-red-900/30 px-2 py-0.5 rounded border border-red-500/20 whitespace-nowrap">{{ t('msg_missing') }}: {{ formatNum(calculation.needD) }}</span>
                            <span v-else class="text-[9px] md:text-[10px] font-bold text-green-500 bg-green-900/30 px-2 py-0.5 rounded border border-green-500/20 whitespace-nowrap">{{ t('msg_covered') }}</span>
                        </div>
                        <div class="flex flex-col sm:grid sm:grid-cols-2 gap-2.5 sm:gap-4 relative z-10">
                            <div>
                                <label class="block text-[10px] font-semibold text-slate-500 mb-1.5">{{ t('lbl_cost_list') }}</label>
                                <input type="text" v-model="formDeu" @focus="$event.target.select()" class="input-glass w-full py-1.5 md:py-2 px-3 text-right font-mono text-emerald-200 text-[13px] md:text-sm bg-black/40">
                            </div>
                            <div>
                                <label class="block text-[10px] font-semibold text-emerald-500/60 mb-1.5">{{ t('lbl_stock_avail') }}</label>
                                <input type="text" v-model="stockDeu" @focus="$event.target.select()" class="input-glass w-full py-1.5 md:py-2 px-3 text-right font-mono text-emerald-300/70 border-emerald-900/20 focus:border-emerald-500/50 text-[13px] md:text-sm bg-black/40">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <div class="lg:col-span-1 space-y-6">
            
            <!-- Pack Value (Moved to Top for Visibility) -->
            <div class="card-glass p-6 border-l-2 border-l-amber-500/50 bg-amber-500/[0.02] relative overflow-hidden">
                <h3 class="text-[10px] font-black text-amber-400/80 uppercase mb-3 flex items-center gap-2 font-mono tracking-widest">
                    <span class="w-[2px] h-3 bg-amber-400/60 rounded-full flex-shrink-0"></span>
                    {{ t('lbl_pack_val') }}
                </h3>
                <div class="relative z-10">
                    <input type="text" v-model="formPackVal" @focus="$event.target.select()" class="input-glass w-full p-4 text-white font-black text-center text-3xl border-amber-500/40 focus:border-amber-400 bg-black/60 shadow-inner">
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-amber-400 font-bold font-mono bg-amber-500/[0.12] px-2 py-1 rounded">MET</div>
                </div>
                <p class="text-[10px] uppercase font-bold text-gray-400 mt-3 text-center">
                    <span v-if="isAutoLoaded" class="text-green-400 flex items-center justify-center gap-1"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>{{ t('pack_source_auto') }}</span>
                    <span v-else>{{ t('pack_source_manual') }}</span>
                </p>
                <div class="absolute inset-0 bg-amber-500/[0.03] pointer-events-none"></div>
            </div>

            <div class="card-glass p-8 flex flex-col justify-center min-h-[220px] relative overflow-hidden border-t-2 border-t-amber-500/50">
                <div class="text-center mb-8 relative z-10">
                    <div class="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-black font-mono">{{ t('lbl_msu_needed') }}</div>
                    <div class="text-3xl font-mono font-bold text-white/80 break-all">{{ formatNum(calculation.totalMSU) }}</div>
                </div>
                <div class="w-full h-px bg-white/[0.06] mb-8"></div>
                <div class="text-center relative z-10">
                    <div class="text-[10px] text-amber-400/80 uppercase tracking-wider mb-3 font-black font-mono">{{ t('lbl_packs_needed') }}</div>
                    <div class="text-6xl font-black font-mono text-white drop-shadow-[0_0_25px_rgba(245,158,11,0.5)]">{{ formatNum(calculation.packsNeeded) }}</div>
                </div>
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-amber-500/10 blur-[50px] rounded-full"></div>
            </div>

            <!-- Tassi di scambio -->
            <div class="card-glass p-5 border-l-2 border-l-slate-500/40">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <span class="w-[2px] h-4 bg-slate-400/50 rounded-full flex-shrink-0"></span>
                        {{ t('lbl_rates') }} MSU
                    </h3>
                    <button @click="settings.rateMet=3; settings.rateCry=2; settings.rateDeut=1"
                            class="text-[9px] font-medium bg-white/[0.03] hover:bg-white/[0.06] px-2 py-1 rounded border border-slate-700/30 text-slate-600 hover:text-slate-400 transition-colors">
                        Reset 3:2:1
                    </button>
                </div>
                <!-- Rates labels -->
                <div class="grid grid-cols-3 gap-2 mb-2">
                    <div class="text-center text-[9px] text-slate-500 uppercase font-semibold">{{ t('res_metal') }}</div>
                    <div class="text-center text-[9px] text-sky-400/70 uppercase font-semibold">{{ t('res_crystal') }}</div>
                    <div class="text-center text-[9px] text-emerald-400/70 uppercase font-semibold">{{ t('res_deuterium') }}</div>
                </div>
                <div class="flex items-center gap-1.5">
                    <input type="number" value="3" readonly class="w-full bg-[#0a101e] border border-slate-700/20 rounded-lg p-2 text-center text-slate-600 font-mono font-bold focus:outline-none cursor-not-allowed text-sm">
                    <span class="text-slate-700 font-light flex-shrink-0">:</span>
                    <input type="number" v-model.number="settings.rateCry" @focus="$event.target.select()" class="input-glass w-full p-2 text-center text-sky-400 font-mono font-bold text-sm">
                    <span class="text-slate-700 font-light flex-shrink-0">:</span>
                    <input type="number" v-model.number="settings.rateDeut" @focus="$event.target.select()" class="input-glass w-full p-2 text-center text-emerald-400 font-mono font-bold text-sm">
                </div>
            </div>

            <!-- Piano di Acquisto / Scambio -->
            <div v-if="tradePlan && (tradePlan.tradeMetToCry > 0 || tradePlan.tradeMetToDeut > 0)"
                 class="card-glass p-5 border-l-2 border-l-sky-500/40">

                <h3 class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                    <span class="w-[2px] h-4 bg-sky-400/60 rounded-full flex-shrink-0"></span>
                    {{ t('lbl_trade_plan') }}
                </h3>

                <!-- Step 1: Totale -->
                <div class="bg-[#0a101e] rounded-xl border border-slate-700/20 px-4 py-3 mb-3">
                    <div class="text-[9px] text-slate-600 uppercase tracking-widest font-semibold mb-1">{{ t('lbl_trade_total') }}</div>
                    <div class="flex items-baseline gap-2">
                        <span class="text-lg font-black font-mono text-slate-100">{{ formatNum(tradePlan.totalMetalRequired) }}</span>
                        <span class="text-xs text-slate-500 font-mono">{{ t('res_metal') }}</span>
                    </div>
                </div>

                <!-- Step 2: Distribuzione -->
                <div class="text-[9px] text-slate-600 uppercase tracking-widest font-semibold mb-2 pl-1">{{ t('lbl_trade_distribute') }}</div>
                <div class="space-y-1.5">

                    <!-- Tieni come metallo -->
                    <div class="flex items-center justify-between bg-[#0a101e] rounded-lg px-3 py-2.5 border border-slate-700/15">
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-slate-500 flex-shrink-0"></span>
                            <span class="text-[11px] text-slate-400">{{ t('lbl_trade_keep_metal') }} <span class="text-slate-200 font-medium">{{ t('res_metal') }}</span></span>
                        </div>
                        <span class="text-[12px] font-mono font-semibold text-slate-300">{{ formatNum(tradePlan.keepMetal) }}</span>
                    </div>

                    <!-- Converti in Cristallo -->
                    <div v-if="tradePlan.tradeMetToCry > 0"
                         class="flex items-center justify-between bg-[#0a101e] rounded-lg px-3 py-2.5 border border-sky-500/15">
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0"></span>
                            <span class="text-[11px] text-slate-400">{{ t('lbl_trade_convert') }} <span class="text-sky-300 font-medium">{{ t('res_crystal') }}</span></span>
                        </div>
                        <span class="text-[12px] font-mono font-semibold text-sky-300/80">{{ formatNum(tradePlan.tradeMetToCry) }}</span>
                    </div>

                    <!-- Converti in Deuterio -->
                    <div v-if="tradePlan.tradeMetToDeut > 0"
                         class="flex items-center justify-between bg-[#0a101e] rounded-lg px-3 py-2.5 border border-emerald-500/15">
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                            <span class="text-[11px] text-slate-400">{{ t('lbl_trade_convert') }} <span class="text-emerald-300 font-medium">{{ t('res_deuterium') }}</span></span>
                        </div>
                        <span class="text-[12px] font-mono font-semibold text-emerald-300/80">{{ formatNum(tradePlan.tradeMetToDeut) }}</span>
                    </div>

                </div>
            </div>

            <!-- ── COSTO MATERIA OSCURA ────────────────────────────────── -->
            <div class="card-glass p-5 border-l-2 border-l-violet-500/40">

                <h3 class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2.5 mb-5">
                    <span class="w-[2px] h-4 bg-violet-400/60 rounded-full flex-shrink-0"></span>
                    {{ t('lbl_cost_dm') }}
                </h3>

                <!-- Sconto Shop -->
                <div class="mb-4">
                    <div class="text-[9px] text-slate-600 uppercase tracking-widest font-semibold mb-2">{{ t('lbl_shop_discount') }}</div>
                    <div class="flex gap-1 bg-[#070c18]/70 p-1 rounded-xl border border-slate-700/20">
                        <button @click="settings.shopDiscount = 0"
                                class="flex-1 py-2 text-[11px] font-semibold rounded-lg transition-all duration-150"
                                :class="settings.shopDiscount === 0
                                    ? 'bg-slate-700/70 text-slate-100'
                                    : 'text-slate-600 hover:text-slate-400'">
                            {{ t('opt_none') }}
                        </button>
                        <button @click="settings.shopDiscount = 20"
                                class="flex-1 py-2 text-[11px] font-semibold rounded-lg transition-all duration-150"
                                :class="settings.shopDiscount === 20
                                    ? 'bg-violet-500/20 border border-violet-400/35 text-violet-200'
                                    : 'text-slate-600 hover:text-slate-400'">
                            –20%
                        </button>
                        <button @click="settings.shopDiscount = 30"
                                class="flex-1 py-2 text-[11px] font-semibold rounded-lg transition-all duration-150"
                                :class="settings.shopDiscount === 30
                                    ? 'bg-violet-500/20 border border-violet-400/35 text-violet-200'
                                    : 'text-slate-600 hover:text-slate-400'">
                            –30%
                        </button>
                    </div>
                </div>

                <!-- Evento Bonus MO -->
                <div class="mb-4">
                    <div class="text-[9px] text-slate-600 uppercase tracking-widest font-semibold mb-2">{{ t('lbl_event_bonus') }}</div>
                    <div class="grid grid-cols-4 gap-1 bg-[#070c18]/70 p-1 rounded-xl border border-slate-700/20">
                        <button v-for="b in [0, 30, 40, 50, 60, 100, 130]" :key="b"
                                @click="settings.moBonus = b"
                                class="py-2 text-[11px] font-semibold rounded-lg transition-all duration-150 text-center"
                                :class="settings.moBonus === b
                                    ? 'bg-amber-500/15 border border-amber-400/35 text-amber-200'
                                    : 'text-slate-600 hover:text-slate-400'">
                            <template v-if="b === 0">–</template>
                            <template v-else>+{{ b }}%</template>
                        </button>
                    </div>
                </div>

                <!-- Bonus metodo di pagamento -->
                <label class="flex items-center gap-3 p-3 rounded-xl bg-[#070c18]/60 border border-slate-700/20 cursor-pointer group hover:border-slate-600/40 transition-all mb-5">
                    <input type="checkbox" v-model="settings.paymentBonus" class="w-4 h-4 accent-violet-500 flex-shrink-0 cursor-pointer rounded">
                    <div class="flex-grow min-w-0">
                        <div class="text-[11px] font-medium text-slate-300 group-hover:text-slate-100 transition-colors leading-tight">{{ t('lbl_payment_bonus') }}</div>
                        <div class="text-[9px] text-slate-600 mt-0.5 font-mono">PayPal · Carta · Amazon</div>
                    </div>
                    <div class="text-[9px] text-violet-400/50 font-mono flex-shrink-0 whitespace-nowrap">+1.000 / €</div>
                </label>

                <!-- Totale MO -->
                <div class="rounded-2xl bg-[#070c18]/80 border border-violet-500/15 px-5 py-5 text-center">
                    <div class="text-[9px] text-violet-400/50 uppercase tracking-[0.2em] font-semibold mb-2">{{ t('lbl_mo_needed') }}</div>
                    <div class="text-5xl font-black font-mono text-slate-100 leading-none">{{ formatNum(calculation.totalMO) }}</div>
                    <div class="text-[9px] text-violet-400/30 uppercase tracking-widest mt-2 font-mono">{{ dmLabel }}</div>
                </div>

            </div>

            <!-- ── OTTIMIZZAZIONE EURO ──────────────────────────────────── -->
            <div class="card-glass p-5 border-l-2 border-l-emerald-500/40">

                <div class="flex items-center justify-between mb-5">
                    <h3 class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2.5">
                        <span class="w-[2px] h-4 bg-emerald-400/60 rounded-full flex-shrink-0"></span>
                        {{ t('lbl_opt_cost') }}
                    </h3>
                    <!-- Smart rounding toggle -->
                    <label class="flex items-center gap-2 cursor-pointer group">
                        <div class="relative">
                            <input type="checkbox" v-model="settings.smartRounding" class="sr-only peer">
                            <div class="w-8 h-4 bg-slate-800 rounded-full border border-slate-700/40 peer-checked:bg-emerald-600/30 peer-checked:border-emerald-500/40 transition-all"></div>
                            <div class="absolute top-0.5 left-0.5 w-3 h-3 bg-slate-500 rounded-full peer-checked:translate-x-4 peer-checked:bg-emerald-400 transition-all duration-200"></div>
                        </div>
                        <span class="text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors whitespace-nowrap">Smart <span class="text-slate-700">(+20€)</span></span>
                    </label>
                </div>

                <!-- Lista pacchetti -->
                <div class="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1 mb-4">
                    <div v-if="euroOptimization.totalCost === 0"
                         class="py-8 flex flex-col items-center gap-2 text-center">
                        <svg class="w-7 h-7 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                        <span class="text-[11px] text-slate-700 italic">{{ t('shop_list_empty') }}</span>
                    </div>

                    <div v-for="(item, index) in euroOptimization.packList" :key="index"
                         class="flex items-center gap-3 px-3 py-3 bg-[#0a101e] rounded-xl border border-slate-700/15 hover:border-slate-600/30 transition-colors">
                        <!-- Badge pack -->
                        <div class="w-11 h-11 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/20 flex flex-col items-center justify-center flex-shrink-0">
                            <span class="text-[11px] font-black text-emerald-400 leading-none">{{ item.pack.cost }}</span>
                            <span class="text-[8px] text-emerald-700 leading-none mt-0.5 font-mono">EUR</span>
                        </div>
                        <!-- Info -->
                        <div class="flex-grow min-w-0">
                            <div class="text-[12px] font-semibold text-slate-200 leading-tight">
                                {{ item.count }} × {{ t('shop_list_pack') }} {{ item.pack.cost }} €
                            </div>
                            <div class="text-[10px] text-slate-600 font-mono mt-0.5">
                                {{ formatNum(item.pack.amount) }} {{ t('shop_list_each') }}
                            </div>
                        </div>
                        <!-- Subtotale -->
                        <span class="text-sm font-black font-mono text-emerald-400 flex-shrink-0">
                            {{ item.count * item.pack.cost }} €
                        </span>
                    </div>
                </div>

                <!-- Totale euro -->
                <div class="rounded-2xl bg-[#070c18]/80 border border-emerald-500/15 px-5 py-4 mb-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-[9px] text-emerald-400/50 uppercase tracking-[0.2em] font-semibold">{{ t('lbl_total') }}</div>
                        </div>
                        <div>
                            <span class="text-4xl font-black font-mono text-emerald-400 leading-none">{{ euroOptimization.totalCost }}</span>
                            <span class="text-lg font-bold text-emerald-700 ml-1">€</span>
                        </div>
                    </div>
                </div>

                <!-- Bilancio MO -->
                <div class="rounded-xl bg-[#0a101e] border border-slate-700/15 overflow-hidden">
                    <div class="flex justify-between items-center px-4 py-2.5 text-[11px] font-mono text-slate-600 border-b border-slate-700/10">
                        <span>{{ t('lbl_mo_needed') }}</span>
                        <span>–{{ formatNum(calculation.totalMO) }}</span>
                    </div>
                    <div class="flex justify-between items-center px-4 py-2.5 text-[11px] font-mono text-slate-500 border-b border-slate-700/10">
                        <span>{{ t('lbl_mo_bought') }}</span>
                        <span class="text-slate-400">+{{ formatNum(euroOptimization.totalPurchasedMO) }}</span>
                    </div>
                    <div class="flex justify-between items-center px-4 py-3 text-sm font-black font-mono"
                         :class="(euroOptimization.totalPurchasedMO - calculation.totalMO) >= 0 ? 'text-emerald-400' : 'text-red-400'">
                        <span>{{ t('lbl_diff') }}</span>
                        <span>
                            {{ (euroOptimization.totalPurchasedMO - calculation.totalMO) >= 0 ? '+' : '' }}{{ formatNum(euroOptimization.totalPurchasedMO - calculation.totalMO) }}
                            <span class="text-xs font-medium opacity-60 ml-1">{{ dmLabel }}</span>
                        </span>
                    </div>
                </div>

            </div>
        </div>
    </div>
  </div>
</template>