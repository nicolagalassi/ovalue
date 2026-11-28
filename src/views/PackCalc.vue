<script setup>
import PageHead from '../components/PageHead.vue';
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { OGAME_DB, DM_PACKAGES, DM_EVENT_BONUSES, SHOP_PACK_DISCOUNTS } from '../data/ogame_db';
import { useOgameFormulas, formatInt, formatPct } from '../composables/useOgameFormulas';
import { useProfiles } from '../composables/useProfiles';
import PackOpeningPlanner from '../components/PackOpeningPlanner.vue';

const { t, currentLang } = useLanguage();
const { getBuildCostLF } = useOgameFormulas();
const { activeProfile, saveProfiles } = useProfiles();

// --- STATO ---
const queue = ref([]);
const isAutoLoaded = ref(true);
const showIntro = ref(false);

// Scheda attiva: 'exchange' (scambio pacchi) | 'planner' (planner apertura).
// Preferenza per-visitatore in localStorage; senza storage resta 'exchange'.
const TAB_KEY = 'ovalue_pack_tab';
const activeTab = ref((() => { try { return localStorage.getItem(TAB_KEY) === 'planner' ? 'planner' : 'exchange'; } catch { return 'exchange'; } })());
watch(activeTab, (v) => { try { localStorage.setItem(TAB_KEY, v); } catch { /* storage non disponibile */ } });

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
        let m = 0, c = 0, d = 0;
        queue.value.forEach(item => { m += item.m; c += item.c; d += item.d; });
        inputs.metal = m; inputs.crystal = c; inputs.deuterium = d;

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
const formatNum = formatInt;

const createFormattedInput = (targetObj, key, isPackVal = false) => computed({
    get() { 
        return isNaN(targetObj[key]) ? '0' : formatInt(targetObj[key]); 
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
const builderMult = createFormattedInput(builder, 'mult');
const basePacks = DM_PACKAGES;  // fonte condivisa con la Shopping List (src/data/ogame_db.js)

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

// --- SHARE / COPY ---
const resultCopied = ref(false);

const copyShareText = async () => {
    const n = formatInt;
    const c = calculation.value;
    const eo = euroOptimization.value;
    const lines = [];

    lines.push(`📦 Pack Calc · OValue`);
    lines.push('');

    if (queue.value.length > 0) {
        lines.push(`**${t('lbl_queue_list')}** (${queue.value.length})`);
        for (const item of queue.value) {
            const name = t(item.key);
            const levelPart = item.cat === 'fleet'
                ? `×${n(item.amount)}`
                : `${t('lbl_level_abbr')} ${item.level}${item.amount > 1 ? ` ×${item.amount}` : ''}`;
            const resParts = [];
            if (item.m > 0) resParts.push(`M ${n(item.m)}`);
            if (item.c > 0) resParts.push(`C ${n(item.c)}`);
            if (item.d > 0) resParts.push(`D ${n(item.d)}`);
            lines.push(`▸ ${name}  ${levelPart}  ${resParts.join(' · ')}`);
        }
        lines.push('');
    }

    lines.push(`${t('lbl_pack_val')}: **${n(settings.packValue)}** M`);
    lines.push(`${t('lbl_packs_needed')}: **${n(c.packsNeeded)}**  ·  ${t('lbl_mo_needed')}: **${n(c.totalMO)}** ${t('lbl_dm')}`);

    if (eo.totalCost > 0) {
        const breakdown = eo.packList.map(p => `${p.count}×${p.pack.cost}€`).join(' + ');
        lines.push(`${t('lbl_total')}: **${eo.totalCost}€** (${breakdown})`);
    }

    try {
        await navigator.clipboard.writeText(lines.join('\n'));
        resultCopied.value = true;
        setTimeout(() => { resultCopied.value = false; }, 2000);
    } catch { /* clipboard non disponibile */ }
};
</script>

<template>
  <div class="w-full min-w-0 max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-8" style="--tc:#fbbf24">
    <!-- Titolo compatto + schede -->
    <PageHead tool="pack" :title="t('pack_calc_title')" :sub="t('card_pack_desc')">
        <template #title>
                <button type="button" @click="showIntro = !showIntro" :aria-expanded="showIntro" aria-controls="pack-intro-content"
                        :aria-label="t('pack_calc_intro')"
                        class="w-5 h-5 rounded-full border border-slate-600 text-slate-400 hover:text-slate-200 text-[11px] font-bold inline-flex items-center justify-center">?</button>
        </template>
        <div class="ov-seg" role="tablist">
            <button v-for="tab in ['exchange', 'planner']" :key="tab" type="button" role="tab"
                    :aria-selected="activeTab === tab" @click="activeTab = tab" class="!px-3.5 !py-1.5 !text-[13px]">
                {{ t(tab === 'exchange' ? 'pop_tab_exchange' : 'pop_tab_planner') }}
            </button>
        </div>
    </PageHead>

    <PackOpeningPlanner v-if="activeTab === 'planner'" />

    <template v-else>
    <!-- Spiegazione: si apre dal "?" -->
    <div v-if="showIntro" id="pack-intro-content" class="ov-panel px-5 py-4 mb-5 text-sm text-slate-300 leading-relaxed max-w-[75ch]">
        {{ t('pack_calc_intro') }}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        <div class="lg:col-span-2 grid grid-cols-1 gap-4 min-w-0">

            <!-- Valore pacchetto -->
            <div class="ov-panel p-5 grid gap-3">
                <h2 class="ov-sh">
                    <label for="pack-val">{{ t('lbl_pack_val') }}</label>
                    <span class="ov-sh-r text-xs" :class="isAutoLoaded ? 'text-emerald-400' : 'text-slate-400'">
                        {{ isAutoLoaded ? '✓ ' + t('pack_source_auto') : t('pack_source_manual') }}
                    </span>
                </h2>
                <div class="relative">
                    <input id="pack-val" type="text" inputmode="numeric" v-model="formPackVal" @focus="$event.target.select()"
                           class="input-glass w-full h-11 px-4 pr-16 text-lg font-bold tabular-nums">
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 ov-tag ov-tag-mute">MET</span>
                </div>
            </div>

            <!-- 1 · Sconti forme di vita -->
            <div class="ov-panel p-5 grid gap-4">
                <h2 class="ov-sh">1 · {{ t('lf_settings_title') }}</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="grid gap-1.5">
                        <label for="pc-min-level" class="ov-label">{{ t('lbl_min_level_settings') }}</label>
                        <div class="relative">
                            <input id="pc-min-level" type="number" v-model.number="settings.minLevel" @focus="$event.target.select()" placeholder="0" min="0" class="input-glass w-full h-9 px-3 pr-12 text-sm tabular-nums">
                            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-400">LVL</span>
                        </div>
                        <p class="text-[11px] text-slate-400">–{{ formatPct(Math.min(50, settings.minLevel * 0.5), 1) }}% {{ t('lbl_bonus_mines_only') }} · {{ t('lbl_min_desc_settings') }}</p>
                    </div>
                    <div class="grid gap-1.5">
                        <label for="pc-lf-lab" class="ov-label">{{ t('lbl_lf_rsr_lab') }}</label>
                        <div class="relative">
                            <input id="pc-lf-lab" type="number" v-model.number="settings.lfRsrLabLevel" @focus="$event.target.select()" placeholder="0" min="0" max="100" class="input-glass w-full h-9 px-3 pr-12 text-sm tabular-nums">
                            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-400">LVL</span>
                        </div>
                        <p class="text-[11px] text-slate-400">–{{ formatPct(Math.min(25, settings.lfRsrLabLevel * 0.25), 2) }}% {{ t('lbl_bonus_lf_res_only') }} · {{ t('lbl_lf_rsr_lab_desc') }}</p>
                    </div>
                </div>
            </div>

            <!-- 2 · Costruttore -->
            <div class="ov-panel p-5 grid gap-4">
                <h2 class="ov-sh">2 · {{ t('builder_title') }}</h2>
                <div class="grid grid-cols-2 md:grid-cols-[1.1fr_1.4fr_.8fr_.8fr_.7fr] gap-3 items-end">
                    <div class="col-span-2 md:col-span-1">
                        <label for="pc-builder-cat" class="ov-label mb-1.5">{{ t('lbl_category') }}</label>
                        <select id="pc-builder-cat" v-model="builder.cat" class="input-glass w-full h-9 px-2 text-sm">
                            <option value="resources">{{ t('cat_resources') }}</option>
                            <option value="facilities">{{ t('cat_facilities') }}</option>
                            <option value="research">{{ t('cat_research') }}</option>
                            <option value="fleet">{{ t('cat_fleet') }}</option>
                            <option value="orion">{{ t('cat_orion') }}</option>
                            <option value="lf_humans">{{ t('cat_lf_humans') }} — {{ t('cat_lf_buildings') }}</option>
                            <option value="lf_humans_res">{{ t('cat_lf_humans') }} — {{ t('cat_research') }}</option>
                            <option value="lf_rocktal">{{ t('cat_lf_rocktal') }} — {{ t('cat_lf_buildings') }}</option>
                            <option value="lf_rocktal_res">{{ t('cat_lf_rocktal') }} — {{ t('cat_research') }}</option>
                            <option value="lf_mecha">{{ t('cat_lf_mecha') }} — {{ t('cat_lf_buildings') }}</option>
                            <option value="lf_mecha_res">{{ t('cat_lf_mecha') }} — {{ t('cat_research') }}</option>
                            <option value="lf_kaelesh">{{ t('cat_lf_kaelesh') }} — {{ t('cat_lf_buildings') }}</option>
                            <option value="lf_kaelesh_res">{{ t('cat_lf_kaelesh') }} — {{ t('cat_research') }}</option>
                        </select>
                    </div>
                    <div class="col-span-2 md:col-span-1">
                        <label for="pc-builder-item" class="ov-label mb-1.5">{{ t('lbl_element') }}</label>
                        <!-- v-memo: Vue riscrive l'attributo `value` di ogni <option> a ogni
                             re-render del componente (patchProp → patchAttr, senza confronto).
                             Una mutazione DOM dentro un <select> aperto fa chiudere e riaprire
                             il popup nativo di Chrome: memoizzando su [key, currentLang] le
                             option non vengono più toccate se non cambiano davvero. -->
                        <select id="pc-builder-item" v-model="builder.item" class="input-glass w-full h-9 px-2 text-sm">
                            <option v-for="(val, key) in currentItems" :key="key" v-memo="[key, currentLang]" :value="key">{{ t(key) }}</option>
                        </select>
                    </div>
                    <div v-if="builder.cat !== 'fleet'">
                        <label for="pc-builder-level" class="ov-label mb-1.5 truncate" :title="t('lbl_target_level')">{{ t('lbl_target_level') }}</label>
                        <input id="pc-builder-level" type="number" v-model.number="builder.level" @focus="$event.target.select()" min="1" class="input-glass w-full h-9 px-2 text-sm tabular-nums">
                    </div>
                    <div v-if="builder.cat !== 'fleet'">
                        <label for="pc-builder-start" class="ov-label mb-1.5 truncate" :title="t('lbl_start_level')">{{ t('lbl_start_level') }}</label>
                        <input id="pc-builder-start" type="number" v-model.number="builder.startLevel" @focus="$event.target.select()" min="0" class="input-glass w-full h-9 px-2 text-sm tabular-nums">
                    </div>
                    <div class="relative" :class="builder.cat === 'fleet' ? 'col-span-2 md:col-span-3' : ''">
                        <label for="pc-builder-mult" class="ov-label mb-1.5">{{ builder.cat === 'fleet' ? t('lbl_quantity') : t('lbl_planets') }}</label>
                        <input v-if="builder.cat === 'fleet'" id="pc-builder-mult" type="text" inputmode="numeric" v-model="builderMult" @focus="$event.target.select()" class="input-glass w-full h-9 px-2 text-sm tabular-nums">
                        <div v-else class="relative">
                            <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">×</span>
                            <input id="pc-builder-mult" type="number" v-model.number="builder.mult" @focus="$event.target.select()" min="1" class="input-glass w-full h-9 pl-6 pr-2 text-sm tabular-nums">
                        </div>
                    </div>
                </div>
                <button @click="addToQueue" class="ov-btn ov-btn-primary w-full">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    {{ t('btn_add_queue') }}
                </button>
            </div>

            <!-- 3 · Lista costruzioni -->
            <div class="ov-panel p-5 grid gap-3">
                <h2 class="ov-sh">
                    3 · {{ t('lbl_queue_list') }} <span class="text-slate-100">· {{ queue.length }}</span>
                    <span class="ov-sh-r">
                        <button v-if="queue.length > 0" @click="queue = []; updateInputsFromQueue()" class="ov-btn ov-btn-ghost ov-btn-sm">{{ t('shop_cart_clear') }}</button>
                    </span>
                </h2>
                <p v-if="queue.length === 0" class="text-sm text-slate-400 py-4 text-center">{{ t('queue_empty') }}</p>
                <div v-else class="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table class="w-full text-[13px]">
                        <thead>
                            <tr class="text-left font-mono text-[11px] uppercase tracking-[0.08em] text-slate-400">
                                <th class="font-bold pb-2 pr-3"></th>
                                <th class="font-bold pb-2 px-3 text-right">{{ t('res_metal') }}</th>
                                <th class="font-bold pb-2 px-3 text-right">{{ t('res_crystal') }}</th>
                                <th class="font-bold pb-2 px-3 text-right">{{ t('res_deuterium') }}</th>
                                <th class="pb-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item, index) in queue" :key="index" class="border-t border-ogame-line">
                                <td class="py-2 pr-3 min-w-0">
                                    <b class="text-slate-100">{{ t(item.key) }}</b>
                                    <span class="ov-tag ov-tag-mute ml-1.5">{{ t('cat_' + item.cat) || item.cat }}</span>
                                    <span class="text-slate-400 ml-1.5 tabular-nums">
                                        <template v-if="item.cat === 'fleet'">×{{ formatNum(item.amount) }}</template>
                                        <template v-else>{{ t('lbl_level_abbr') }}&nbsp;{{ item.level }} · {{ item.amount }}×</template>
                                    </span>
                                </td>
                                <td class="py-2 px-3 text-right tabular-nums">{{ formatNum(item.m) }}</td>
                                <td class="py-2 px-3 text-right tabular-nums">{{ formatNum(item.c) }}</td>
                                <td class="py-2 px-3 text-right tabular-nums">{{ formatNum(item.d) }}</td>
                                <td class="py-2 pl-2 text-right sticky right-0 bg-ogame-panel">
                                    <button @click="removeFromQueue(index)" :aria-label="t('btn_delete')"
                                            class="w-7 h-7 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-rose-300 border border-ogame-line hover:border-rose-500/40 transition-colors">
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 4 · Costi e magazzino: una riga per risorsa con lo stato -->
            <div class="ov-panel p-5 grid gap-3">
                <h2 class="ov-sh">4 · {{ t('lbl_costs') }} / {{ t('lbl_stock') }}</h2>
                <p class="text-[11px] text-slate-400 -mt-1">{{ t('lbl_stock') }}: {{ t('shared_purchase_hint').charAt(0).toLowerCase() + t('shared_purchase_hint').slice(1) }}</p>
                <div class="overflow-x-auto">
                    <table class="w-full text-[13px] min-w-[440px]">
                        <thead>
                            <tr class="text-left font-mono text-[11px] uppercase tracking-[0.08em] text-slate-400">
                                <th class="font-bold pb-2 pr-3"></th>
                                <th class="font-bold pb-2 px-2 text-right">{{ t('lbl_cost_list') }}</th>
                                <th class="font-bold pb-2 px-2 text-right">{{ t('lbl_stock_avail') }}</th>
                                <th class="font-bold pb-2 pl-2 text-right"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="border-t border-ogame-line">
                                <td class="py-2 pr-3 font-semibold text-slate-100">{{ t('res_metal') }}</td>
                                <td class="py-2 px-2"><input id="pc-cost-met" type="text" inputmode="numeric" v-model="formMet" @focus="$event.target.select()" :aria-label="t('res_metal') + ' — ' + t('lbl_cost_list')" class="input-glass w-full h-8 px-3 text-right tabular-nums"></td>
                                <td class="py-2 px-2"><input id="pc-stock-met" type="text" inputmode="numeric" v-model="stockMet" @focus="$event.target.select()" :aria-label="t('res_metal') + ' — ' + t('lbl_stock_avail')" class="input-glass w-full h-8 px-3 text-right tabular-nums"></td>
                                <td class="py-2 pl-2 text-right whitespace-nowrap">
                                    <span v-if="calculation.needM > 0" class="ov-tag ov-tag-bad">{{ t('msg_missing') }}: {{ formatNum(calculation.needM) }}</span>
                                    <span v-else class="ov-tag ov-tag-ok">{{ t('msg_covered') }}</span>
                                </td>
                            </tr>
                            <tr class="border-t border-ogame-line">
                                <td class="py-2 pr-3 font-semibold text-slate-100">{{ t('res_crystal') }}</td>
                                <td class="py-2 px-2"><input id="pc-cost-cry" type="text" inputmode="numeric" v-model="formCry" @focus="$event.target.select()" :aria-label="t('res_crystal') + ' — ' + t('lbl_cost_list')" class="input-glass w-full h-8 px-3 text-right tabular-nums"></td>
                                <td class="py-2 px-2"><input id="pc-stock-cry" type="text" inputmode="numeric" v-model="stockCry" @focus="$event.target.select()" :aria-label="t('res_crystal') + ' — ' + t('lbl_stock_avail')" class="input-glass w-full h-8 px-3 text-right tabular-nums"></td>
                                <td class="py-2 pl-2 text-right whitespace-nowrap">
                                    <span v-if="calculation.needC > 0 && calculation.totalMSU <= 0" class="ov-tag ov-tag-warn">{{ t('msg_covered_surplus') }}</span>
                                    <span v-else-if="calculation.needC > 0" class="ov-tag ov-tag-bad">{{ t('msg_missing') }}: {{ formatNum(calculation.needC) }}</span>
                                    <span v-else class="ov-tag ov-tag-ok">{{ t('msg_covered') }}</span>
                                </td>
                            </tr>
                            <tr class="border-t border-ogame-line">
                                <td class="py-2 pr-3 font-semibold text-slate-100">{{ t('res_deuterium') }}</td>
                                <td class="py-2 px-2"><input id="pc-cost-deu" type="text" inputmode="numeric" v-model="formDeu" @focus="$event.target.select()" :aria-label="t('res_deuterium') + ' — ' + t('lbl_cost_list')" class="input-glass w-full h-8 px-3 text-right tabular-nums"></td>
                                <td class="py-2 px-2"><input id="pc-stock-deu" type="text" inputmode="numeric" v-model="stockDeu" @focus="$event.target.select()" :aria-label="t('res_deuterium') + ' — ' + t('lbl_stock_avail')" class="input-glass w-full h-8 px-3 text-right tabular-nums"></td>
                                <td class="py-2 pl-2 text-right whitespace-nowrap">
                                    <span v-if="calculation.needD > 0 && calculation.totalMSU <= 0" class="ov-tag ov-tag-warn">{{ t('msg_covered_surplus') }}</span>
                                    <span v-else-if="calculation.needD > 0" class="ov-tag ov-tag-bad">{{ t('msg_missing') }}: {{ formatNum(calculation.needD) }}</span>
                                    <span v-else class="ov-tag ov-tag-ok">{{ t('msg_covered') }}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Colonna risultati (resta in vista mentre scorri) -->
        <div class="grid grid-cols-1 gap-4 min-w-0 lg:sticky lg:top-[72px]">

            <div class="ov-panel p-5 grid gap-3">
                <h2 class="ov-sh">
                    {{ t('lbl_packs_needed') }}
                    <span class="ov-sh-r">
                        <button v-if="calculation.packsNeeded > 0" @click="copyShareText" class="ov-btn ov-btn-ghost ov-btn-sm"
                                :class="resultCopied ? '!text-emerald-300 !border-emerald-500/40' : ''">
                            {{ resultCopied ? t('copied') : t('btn_copy') }}
                        </button>
                    </span>
                </h2>
                <div class="grid grid-cols-1 gap-3">
                    <div class="ov-stat"><span class="ov-stat-k">{{ t('lbl_msu_needed') }}</span><span class="ov-stat-v !text-base sm:!text-xl overflow-x-auto max-w-full">{{ formatNum(calculation.totalMSU) }}</span></div>
                    <div class="ov-stat"><span class="ov-stat-k">{{ t('lbl_packs_needed') }}</span><span class="ov-stat-v !text-3xl text-amber-300">{{ formatNum(calculation.packsNeeded) }}</span></div>
                </div>
            </div>

            <!-- Tassi MSU: chiusi di default, quasi sempre 3:2:1 -->
            <details class="ov-acc">
                <summary>
                    <b>{{ t('lbl_rates') }} MSU</b>
                    <span class="ov-acc-sum tabular-nums">{{ settings.rateMet }}:{{ settings.rateCry }}:{{ settings.rateDeut }}</span>
                </summary>
                <div class="grid gap-3">
                    <div class="grid grid-cols-3 gap-2">
                        <div><span class="ov-label mb-1 text-center">{{ t('res_metal') }}</span><input type="number" value="3" readonly :aria-label="t('res_metal')" class="input-glass w-full h-9 text-center tabular-nums !border-dashed text-slate-400 cursor-not-allowed"></div>
                        <div><span class="ov-label mb-1 text-center">{{ t('res_crystal') }}</span><input type="number" step="0.1" min="0" v-model.number="settings.rateCry" @focus="$event.target.select()" :aria-label="t('res_crystal')" class="input-glass w-full h-9 text-center tabular-nums"></div>
                        <div><span class="ov-label mb-1 text-center">{{ t('res_deuterium') }}</span><input type="number" step="0.1" min="0" v-model.number="settings.rateDeut" @focus="$event.target.select()" :aria-label="t('res_deuterium')" class="input-glass w-full h-9 text-center tabular-nums"></div>
                    </div>
                    <button v-if="settings.rateCry !== 2 || settings.rateDeut !== 1" @click="settings.rateMet=3; settings.rateCry=2; settings.rateDeut=1" class="ov-btn ov-btn-ghost ov-btn-sm justify-self-start">Reset 3:2:1</button>
                </div>
            </details>

            <!-- Piano di acquisto -->
            <div v-if="tradePlan && (tradePlan.tradeMetToCry > 0 || tradePlan.tradeMetToDeut > 0)" class="ov-panel p-5 grid gap-3">
                <h2 class="ov-sh">{{ t('lbl_trade_plan') }}</h2>
                <div class="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-[13px]">
                    <span class="text-slate-400">{{ t('lbl_trade_total') }}</span><b class="tabular-nums text-right">{{ formatNum(tradePlan.totalMetalRequired) }}</b>
                    <span class="text-slate-400 col-span-2 text-xs pt-1">{{ t('lbl_trade_distribute') }}</span>
                    <span class="text-slate-400">{{ t('lbl_trade_keep_metal') }} {{ t('res_metal') }}</span><span class="tabular-nums text-right">{{ formatNum(tradePlan.keepMetal) }}</span>
                    <template v-if="tradePlan.tradeMetToCry > 0"><span class="text-slate-400">{{ t('lbl_trade_convert') }} {{ t('res_crystal') }}</span><span class="tabular-nums text-right">{{ formatNum(tradePlan.tradeMetToCry) }}</span></template>
                    <template v-if="tradePlan.tradeMetToDeut > 0"><span class="text-slate-400">{{ t('lbl_trade_convert') }} {{ t('res_deuterium') }}</span><span class="tabular-nums text-right">{{ formatNum(tradePlan.tradeMetToDeut) }}</span></template>
                </div>
            </div>

            <!-- Costo in MO -->
            <div class="ov-panel p-5 grid gap-3.5" style="--tc:#a78bfa">
                <h2 class="ov-sh">{{ t('lbl_cost_dm') }}</h2>
                <div>
                    <span class="ov-label mb-1.5">{{ t('lbl_shop_discount') }}</span>
                    <div class="ov-seg ov-seg-full">
                        <button v-for="d in SHOP_PACK_DISCOUNTS" :key="d" type="button" @click="settings.shopDiscount = d" :aria-pressed="settings.shopDiscount === d">
                            {{ d === 0 ? t('opt_none') : '–' + d + '%' }}
                        </button>
                    </div>
                </div>
                <div>
                    <span class="ov-label mb-1.5">{{ t('lbl_event_bonus') }}</span>
                    <div class="ov-seg ov-seg-full !grid grid-cols-4">
                        <button v-for="b in DM_EVENT_BONUSES" :key="b" type="button" @click="settings.moBonus = b" :aria-pressed="settings.moBonus === b" class="!px-1.5">
                            {{ b === 0 ? '–' : '+' + b + '%' }}
                        </button>
                    </div>
                </div>
                <label class="flex flex-wrap items-center gap-x-2.5 gap-y-1 cursor-pointer">
                    <input type="checkbox" v-model="settings.paymentBonus" class="w-4 h-4 accent-cyan-400 flex-shrink-0 cursor-pointer rounded">
                    <span class="text-[13px] text-slate-200">{{ t('lbl_payment_bonus') }}</span>
                    <span class="text-[11px] text-slate-400 ml-auto text-right">PayPal · Carta · Amazon · +1.000/€</span>
                </label>
                <p class="text-[11px] text-slate-400 flex items-center gap-1.5"><svg class="w-3 h-3 flex-none" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.8 10.2a4 4 0 00-5.6 0l-3 3a4 4 0 005.6 5.6l1.1-1.1m-.7-4.5a4 4 0 005.6 0l3-3a4 4 0 00-5.6-5.6l-1.1 1.1"/></svg>{{ t('shared_purchase_hint') }}</p>
                <div class="ov-stat"><span class="ov-stat-k">{{ t('lbl_mo_needed') }}</span><span class="ov-stat-v !text-2xl">{{ formatNum(calculation.totalMO) }} <span class="text-sm text-slate-400 font-medium">{{ dmLabel }}</span></span></div>
            </div>

            <!-- Stima costo ottimizzato -->
            <div class="ov-panel p-5 grid gap-3" style="--tc:#34d399">
                <h2 class="ov-sh">
                    {{ t('lbl_opt_cost') }}
                    <label class="ov-sh-r flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                        <span class="relative">
                            <input type="checkbox" v-model="settings.smartRounding" class="sr-only peer" aria-label="Smart (+20€)">
                            <span class="block w-8 h-[18px] bg-slate-700 rounded-full peer-checked:bg-emerald-500/50 peer-focus-visible:ring-2 peer-focus-visible:ring-ogame-accent/60 transition-colors"></span>
                            <span class="absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-slate-400 rounded-full peer-checked:translate-x-3.5 peer-checked:bg-emerald-300 transition-transform duration-150"></span>
                        </span>
                        Smart (+20€)
                    </label>
                </h2>
                <p v-if="euroOptimization.totalCost === 0" class="text-sm text-slate-400 py-3 text-center">{{ t('shop_list_empty') }}</p>
                <div v-else class="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-[13px] max-h-[220px] overflow-y-auto">
                    <template v-for="(item, index) in euroOptimization.packList" :key="index">
                        <span>{{ item.count }} × {{ t('shop_list_pack') }} {{ item.pack.cost }} € <span class="text-slate-400">· {{ formatNum(item.pack.amount) }} {{ t('shop_list_each') }}</span></span>
                        <span class="tabular-nums text-right font-semibold">{{ formatNum(item.count * item.pack.cost) }} €</span>
                    </template>
                </div>
                <div class="flex items-baseline justify-between border-t border-ogame-line pt-3">
                    <span class="ov-stat-k">{{ t('lbl_total') }}</span>
                    <span class="text-2xl font-bold text-emerald-300 tabular-nums">{{ formatNum(euroOptimization.totalCost) }} €</span>
                </div>
                <div class="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
                    <span class="text-slate-400">{{ t('lbl_mo_needed') }}</span><span class="tabular-nums text-right">–{{ formatNum(calculation.totalMO) }}</span>
                    <span class="text-slate-400">{{ t('lbl_mo_bought') }}</span><span class="tabular-nums text-right">+{{ formatNum(euroOptimization.totalPurchasedMO) }} €</span>
                    <b>{{ t('lbl_diff') }}</b>
                    <b class="tabular-nums text-right" :class="(euroOptimization.totalPurchasedMO - calculation.totalMO) >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                        {{ (euroOptimization.totalPurchasedMO - calculation.totalMO) >= 0 ? '+' : '' }}{{ formatNum(euroOptimization.totalPurchasedMO - calculation.totalMO) }} {{ dmLabel }}
                    </b>
                </div>
            </div>
        </div>
    </div>
    </template>
  </div>

  <!-- Qui il Planner apertura porta la sua barra dei risultati -->
  <div id="pack-resultbar-slot" class="contents"></div>

  <!-- Barra fissa dei risultati (scheda Scambio pacchi) -->
  <div v-if="activeTab !== 'planner'" class="ov-resultbar">
    <div class="ov-resultbar-in">
      <div class="ov-stat"><span class="ov-stat-k">{{ t('lbl_packs_needed') }}</span><span class="ov-stat-v text-amber-300">{{ formatNum(calculation.packsNeeded) }}</span></div>
      <div class="ov-stat"><span class="ov-stat-k">{{ t('lbl_mo_needed') }}</span><span class="ov-stat-v">{{ formatNum(calculation.totalMO) }} <span class="text-sm text-slate-400 font-medium">{{ dmLabel }}</span></span></div>
      <div class="ov-stat"><span class="ov-stat-k">{{ t('lbl_opt_cost') }}</span><span class="ov-stat-v text-emerald-300">{{ formatNum(euroOptimization.totalCost) }} €</span></div>
      <button v-if="calculation.packsNeeded > 0" @click="copyShareText" class="ov-btn ov-btn-tint ov-btn-sm ml-auto">
        {{ resultCopied ? t('copied') : t('btn_copy') }}
      </button>
    </div>
  </div>
</template>
