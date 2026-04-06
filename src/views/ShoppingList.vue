<script setup>
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { SHOP_ITEMS } from '../data/ogame_db';

const { t } = useLanguage();

const SHOP_IMG = '/Immagini%20Ogame';

/** Immagini in public/Immagini Ogame (nomi file con spazi → encodeURIComponent nell’URL) */
const SHOP_ITEM_IMAGES = {
    res_package_all: 'packall.png',
    res_package_deut: 'packdeu.png',
    res_package_crystal: 'packcri.png',
    res_package_metal: 'packmetal.png',
    class_collector: 'collector.png',
    class_general: 'general.png',
    class_discoverer: 'discoverer.png',
    staff_researcher: 'alleanza ricercatore.png',
    staff_merchant: 'mercante alleanza.png',
    staff_warrior: 'guerriero alleanza.png',
    officer_commander: 'commander.jpg',
    officer_admiral: 'ammiraglio.jpg',
    officer_engineer: 'ingegnere.jpg',
    officer_geologist: 'geologo.jpg',
    officer_technocrat: 'tecnico.jpg',
    staff_command: 'staffdicomando.jpg',
    booster_metal: '40 metallo.png',
    booster_crystal: '40 cristallo.png',
    booster_deut: '40 deuterio.png',
    booster_energy: 'energia.png',
    slot_expedition: 'slot spedi.png',
    slot_fleet: 'slot flotta.png',
    fields_planet: 'spazi pianeta.png',
    fields_moon: 'spazi luna.png',
    moons: 'moons.png',
    kraken: 'kraken.png',
    detroid: 'detroid.png',
    newtron: 'newtron.png',
    kraken_lifeforms: 'kraken.png',
    detroid_lifeforms: 'detroid.png',
    newtron_lifeforms: 'newtron forme di vita.png',
};

/** Miniatura rappresentativa per la categoria attiva (header sezione) */
const CATEGORY_HERO_IMAGES = {
    resources: 'packall.png',
    boosters: 'energia.png',
    slots: 'slot spedi.png',
    fields: 'spazi pianeta.png',
    construction: 'moons.png',
};

const shopImgUrl = (filename) =>
    filename ? `${SHOP_IMG}/${encodeURIComponent(filename)}` : null;

const shopItemImageSrc = (itemKey) => shopImgUrl(SHOP_ITEM_IMAGES[itemKey]);

const categoryHeroSrc = (catId) => shopImgUrl(CATEGORY_HERO_IMAGES[catId]);

const shopCatHintKey = (catId) => `shop_cat_${catId}_hint`;

const shopCart = ref([]);
const cartDrawerOpen = ref(false);
const activeCategory = ref(SHOP_ITEMS.categories[0].id);
const activeDiscountEvent = ref('none');
const isMounted = ref(false);
const cartJustAdded = ref(false);

import { onMounted } from 'vue';
onMounted(() => {
    isMounted.value = true;
});

const DISCOUNT_EVENTS = [
    { id: 'none', label: 'shop_event_none' },
    { id: 'boosters', label: 'shop_event_boosters' },
    { id: 'resources', label: 'shop_event_resources' },
    { id: 'classes', label: 'shop_event_classes' },
    { id: 'platinum', label: 'shop_event_platinum' },
    { id: 'construction', label: 'shop_event_construction' },
    { id: 'cashback', label: 'shop_event_cashback' },
    { id: 'merchant', label: 'shop_event_merchant' },
    { id: 'relocate', label: 'shop_event_relocate' }
];

const getEventDiscountFactor = (itemKey, tier, dur, eventId) => {
    let factor = 1;
    if (eventId === 'boosters' && String(itemKey).includes('booster')) {
        if (dur === '7d') factor = 0.9;
        if (dur === '30d') factor = 0.85;
        if (dur === '90d') factor = 0.8;
    }
    if (eventId === 'resources' && String(itemKey).includes('res_package')) {
        factor = 0.7;
    }
    if (eventId === 'classes' && (String(itemKey).includes('class_') || String(itemKey).includes('staff_'))) {
        factor = 0.8;
    }
    if (eventId === 'platinum' && tier === 'platinum') {
        factor = 0.8;
    }
    if (eventId === 'merchant' && itemKey === 'ingame_merchant') {
        factor = 2000 / 3500; // Drops from 3500 to 2000
    }
    if (eventId === 'relocate' && itemKey === 'ingame_relocate') {
        factor = 0.5; // Relocate is down 50%
    }
    return factor;
}

const getCalculatedCost = (itemKey, tier, dur, baseCost) => {
    const factor = getEventDiscountFactor(itemKey, tier, dur, activeDiscountEvent.value);
    return Math.round(baseCost * factor);
};

const itemQuantities = reactive({});
const selectedDurations = reactive({});

const initSelectedDurations = () => {
    for (const [key, val] of Object.entries(SHOP_ITEMS.items)) {
        if (val.costs) {
            for (const [tier, durs] of Object.entries(val.costs)) {
                if (!selectedDurations[`${key}_${tier}`]) {
                    selectedDurations[`${key}_${tier}`] = Object.keys(durs)[0];
                }
            }
        }
    }
};
initSelectedDurations();
for (const key of Object.keys(SHOP_ITEMS.items)) {
    itemQuantities[key] = 1;
}

const activeCategoryMeta = computed(() =>
    SHOP_ITEMS.categories.find((c) => c.id === activeCategory.value)
);

const formatNum = (n) => new Intl.NumberFormat('it-IT').format(Math.floor(n));

const getItemsForCategory = (catId) => {
    const res = {};
    for (const [key, val] of Object.entries(SHOP_ITEMS.items)) {
        if (val.cat === catId) res[key] = val;
    }
    return res;
};

/** Blocchi catalogo: amplificatori in due sottosezioni, altre categorie in un solo blocco */
const displayCatalog = computed(() => {
    const cat = activeCategory.value;
    if (cat === 'boosters') {
        const pair = (id) => ({ key: id, val: SHOP_ITEMS.items[id] });
        return [
            {
                blockKey: 'boost-res',
                titleKey: 'shop_boosters_sub_res',
                items: ['booster_metal', 'booster_crystal', 'booster_deut'].map(pair),
            },
            {
                blockKey: 'boost-en',
                titleKey: 'shop_boosters_sub_energy',
                items: [pair('booster_energy')],
            },
        ];
    }
    if (cat === 'construction') {
        if (activeDiscountEvent.value !== 'construction') return [];
        const pair = (id) => ({ key: id, val: SHOP_ITEMS.items[id] });
        return [
            {
                blockKey: 'cons-std',
                titleKey: 'shop_construction_sub_standard',
                items: ['kraken', 'detroid', 'newtron'].map(pair),
            },
            {
                blockKey: 'cons-life',
                titleKey: 'shop_construction_sub_lifeforms',
                items: ['kraken_lifeforms', 'detroid_lifeforms', 'newtron_lifeforms'].map(pair),
            },
        ];
    }
    const flat = getItemsForCategory(cat);
    return [
        {
            blockKey: 'flat',
            titleKey: null,
            items: Object.entries(flat).map(([key, val]) => ({ key, val })),
        },
    ];
});

const addToShopCart = (id, tier, duration, baseCost) => {
    const mult = Math.max(1, itemQuantities[id] || 1);
    const event = activeDiscountEvent.value;
    const cost = getCalculatedCost(id, tier, duration, baseCost);
    const cbPerUnit = event === 'cashback' ? Math.floor(cost * 0.2) : 0;

    const existing = shopCart.value.find(i => i.id === id && i.tier === tier && i.duration === duration && i.event === event);
    if(existing) {
        existing.mult += mult;
        existing.cost += (cost * mult);
        existing.cashback += (cbPerUnit * mult);
    } else {
        shopCart.value.push({ 
            id, 
            tier, 
            duration, 
            mult, 
            unitCost: cost,
            cost: cost * mult,
            cashback: cbPerUnit * mult,
            event
        });
    }
    itemQuantities[id] = 1;
    cartJustAdded.value = true;
    setTimeout(() => { cartJustAdded.value = false; }, 300);
};

const removeShopCart = (index) => shopCart.value.splice(index, 1);
const clearCart = () => shopCart.value = [];

const getDurationDiscount = (itemData, tierName, durKey) => {
    const costs = itemData?.costs?.[tierName];
    if(!costs) return 0;
    
    const durDays = { "7d": 7, "30d": 30, "90d": 90 };
    if(!durDays[durKey] || !costs["7d"]) return 0;
    if(durKey === "7d") return 0;

    const cost7dPerDay = costs["7d"] / 7;
    const currentCostPerDay = costs[durKey] / durDays[durKey];
    
    const discount = 1 - (currentCostPerDay / cost7dPerDay);
    return discount > 0.01 ? Math.round(discount * 100) : 0;
};

const totalShopCartMO = computed(() => shopCart.value.reduce((acc, curr) => acc + curr.cost, 0));
const totalShopCartCashback = computed(() => shopCart.value.reduce((acc, curr) => acc + (curr.cashback || 0), 0));

/** Quantità totale righe carrello (somma pezzi) per badge */
const cartTotalQty = computed(() => shopCart.value.reduce((acc, row) => acc + row.mult, 0));

let cartEscapeHandler = null;
watch(cartDrawerOpen, (open) => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = open ? 'hidden' : '';
    if (cartEscapeHandler) {
        window.removeEventListener('keydown', cartEscapeHandler);
        cartEscapeHandler = null;
    }
    if (open) {
        cartEscapeHandler = (e) => {
            if (e.key === 'Escape') cartDrawerOpen.value = false;
        };
        window.addEventListener('keydown', cartEscapeHandler);
    }
});

onBeforeUnmount(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = '';
    if (cartEscapeHandler) window.removeEventListener('keydown', cartEscapeHandler);
});

const getTierColorClass = (tier) => {
    if(tier === 'platinum') return 'text-purple-400 font-bold';
    if(tier === 'gold') return 'text-yellow-400 font-bold';
    if(tier === 'silver') return 'text-slate-300 font-bold';
    if(tier === 'bronze') return 'text-orange-500 font-bold';
    return 'text-cyan-400 font-bold';
};

const getTierBorderClass = (tier, itemKey) => {
    if (itemKey === 'booster_energy' && tier !== 'none') {
        return 'border-amber-500/70 bg-amber-950/25 hover:bg-amber-900/35';
    }
    if(tier === 'none') {
        if(itemKey.includes('metal')) return 'border-red-500 bg-red-900/20 hover:bg-red-600/30';
        if(itemKey.includes('crystal')) return 'border-blue-500 bg-blue-900/20 hover:bg-blue-600/30';
        if(itemKey.includes('deut')) return 'border-green-500 bg-green-900/20 hover:bg-green-600/30';
        if(itemKey.includes('collector') || itemKey.includes('geologist')) return 'border-yellow-500 bg-yellow-900/20 hover:bg-yellow-600/30';
        if(itemKey.includes('general') || itemKey.includes('warrior') || itemKey.includes('admiral')) return 'border-red-500 bg-red-900/20 hover:bg-red-600/30';
        if(itemKey.includes('discoverer') || itemKey.includes('researcher') || itemKey.includes('technocrat')) return 'border-blue-500 bg-blue-900/20 hover:bg-blue-600/30';
        return 'border-cyan-500 bg-cyan-900/20 hover:bg-cyan-600/30';
    }
    if(tier === 'platinum') return 'border-purple-500 bg-purple-900/20 hover:bg-purple-600/30';
    if(tier === 'gold') return 'border-yellow-500 bg-yellow-900/20 hover:bg-yellow-600/30';
    if(tier === 'silver') return 'border-slate-400 bg-slate-700/20 hover:bg-slate-500/30';
    if(tier === 'bronze') return 'border-orange-500 bg-orange-900/20 hover:bg-orange-600/30';
    return 'border-cyan-500 bg-cyan-900/20 hover:bg-cyan-600/30';
};

/** Ordine tier in UI: platino → oro → argento → bronzo → none */
const TIER_DISPLAY_ORDER = ['platinum', 'gold', 'silver', 'bronze', 'none'];

const tiersForDisplay = (itemKey, costs) => {
    if (!costs || typeof costs !== 'object') return [];
    return TIER_DISPLAY_ORDER
        .filter((t) => costs[t] != null)
        .filter((t) => {
            if (itemKey.includes('booster') && t === 'bronze' && activeDiscountEvent.value !== 'boosters') {
                return false;
            }
            return true;
        })
        .map((t) => [t, costs[t]]);
};

const getTierDisplayName = (itemKey, tier) => {
    let suffix = '';
    if (String(itemKey).includes('booster')) {
        if (tier === 'platinum') suffix = ' 40%';
        if (tier === 'gold') suffix = ' 30%';
        if (tier === 'silver') suffix = ' 20%';
        if (tier === 'bronze') suffix = ' 10%';
    } else if (itemKey === 'fields_planet') {
        if (tier === 'platinum') suffix = ' (+20)';
        if (tier === 'gold') suffix = ' (+15)';
        if (tier === 'silver') suffix = ' (+9)';
        if (tier === 'bronze') suffix = ' (+4)';
    } else if (itemKey === 'fields_moon') {
        if (tier === 'platinum') suffix = ' (+8)';
        if (tier === 'gold') suffix = ' (+6)';
        if (tier === 'silver') suffix = ' (+4)';
        if (tier === 'bronze') suffix = ' (+2)';
    } else if (itemKey === 'moons') {
        if (tier === 'gold') return '30min';
        if (tier === 'silver') return '60min';
        if (tier === 'bronze') return '90min';
    } else if (itemKey === 'slot_expedition') {
        if (tier === 'gold') suffix = ' (+3)';
        if (tier === 'silver') suffix = ' (+2)';
        if (tier === 'bronze') suffix = ' (+1)';
    } else if (itemKey === 'slot_fleet') {
        if (tier === 'gold') suffix = ' (+6)';
        if (tier === 'silver') suffix = ' (+4)';
        if (tier === 'bronze') suffix = ' (+2)';
    }
    
    // Assumiamo che ci sia una traduzione come tier_platinum in locales
    const baseName = t(`tier_${tier}`) || tier;
    return `${baseName}${suffix}`;
};
</script>

<template>
  <div class="max-w-[min(100rem,calc(100%-1.5rem))] mx-auto px-4 md:px-8 mt-6 md:mt-10 pb-12">
    
    <!-- Header Cart Integration -->
    <Teleport to="#header-actions" v-if="isMounted">
        <button
            type="button"
            class="group relative flex items-center gap-2 md:gap-3 rounded-xl border transition-all focus:outline-none"
            :class="[
                shopCart.length > 0 ? 'border-cyan-500/50 bg-cyan-900/20 px-3 py-1.5 hover:bg-cyan-900/40 md:px-4 md:py-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'border-transparent bg-transparent px-2 py-1.5 hover:border-white/10 hover:bg-white/5 md:px-3 md:py-2',
                {'scale-110 !border-green-400 !bg-green-900/30': cartJustAdded}
            ]"
            :aria-expanded="cartDrawerOpen"
            @click="cartDrawerOpen = true"
        >
            <div class="relative flex items-center justify-center transition-colors" :class="shopCart.length > 0 ? 'text-cyan-400 shadow-cyan-500/50 drop-shadow-md' : 'text-gray-400 group-hover:text-cyan-400'">
                <svg class="h-5 w-5 md:h-6 md:w-6 transition-transform" :class="{'scale-125 text-green-400': cartJustAdded}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                <div
                    v-if="cartTotalQty > 0"
                    class="absolute -right-2 -top-2 flex h-4 min-w-[1rem] md:h-5 md:min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[9px] md:text-[10px] font-black text-[#0b0e14] shadow-md transition-all"
                    :class="cartJustAdded ? 'bg-green-400 scale-125' : 'bg-cyan-500'"
                >{{ cartTotalQty > 99 ? '99+' : cartTotalQty }}</div>
            </div>
            <div class="hidden md:flex flex-col items-start leading-none ml-1">
                <span v-if="shopCart.length > 0" class="text-[10px] md:text-sm font-mono font-bold transition-colors" :class="cartJustAdded ? 'text-green-300' : 'text-cyan-100'">{{ formatNum(totalShopCartMO) }}</span>
                <span v-else class="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-500">{{ t('shop_cart_button') }}</span>
            </div>
        </button>
    </Teleport>

    <!-- Page Header -->
    <div class="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div class="text-center sm:text-left flex-1 min-w-0">
            <h1 class="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                Shopping List
            </h1>
            <div class="mt-2 h-1 w-24 bg-cyan-500 mx-auto sm:mx-0 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
        </div>
    </div>

    <!-- Intro Section & Event Simulator -->
    <div class="flex flex-col md:flex-row gap-4 mb-8">
        <div class="flex-1 card-glass p-5 border-l-4 border-l-cyan-500/50 bg-cyan-500/5 backdrop-blur-md">
            <div class="flex items-start gap-4">
                <div class="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <div>
                    <p class="text-sm text-gray-300 leading-relaxed font-medium">Aggiungi gli Item dal catalogo OGame cliccando sui tasti corrispondenti a livello e durata. Puoi impostare la quantità prima di cliccare.</p>
                </div>
            </div>
        </div>
        
        <div class="w-full md:w-72 shrink-0 card-glass p-5 border-t border-white/10 bg-[#0b0e14]/80 backdrop-blur-md flex flex-col justify-center">
            <label for="event-simulator" class="block text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-2 flex items-center gap-2">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Simula Evento Sconto
            </label>
            <select
                id="event-simulator"
                v-model="activeDiscountEvent"
                class="w-full appearance-none rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 text-sm font-medium text-white shadow-inner outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
            >
                <option v-for="evt in DISCOUNT_EVENTS" :key="evt.id" :value="evt.id">{{ t(evt.label) }}</option>
            </select>
        </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        
        <!-- Sidebar categorie (schermi larghi) -->
        <aside class="hidden lg:flex lg:w-56 xl:w-60 shrink-0 flex-col lg:sticky lg:top-24 self-start">
            <p class="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3 px-1">{{ t('shop_nav_label') }}</p>
            <nav
                class="rounded-2xl border border-white/10 bg-[#0b0e14]/70 backdrop-blur-sm p-1.5 space-y-0.5 shadow-inner"
                aria-label="Categorie shop"
            >
                <button
                    v-for="cat in SHOP_ITEMS.categories"
                    :key="cat.id"
                    type="button"
                    @click="activeCategory = cat.id"
                    class="w-full text-left px-3 py-2.5 rounded-xl text-xs xl:text-sm font-medium transition-all duration-200 border border-transparent leading-snug"
                    :class="activeCategory === cat.id
                        ? 'bg-cyan-600/20 text-cyan-200 border-cyan-500/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'"
                >
                    {{ t(cat.name) }}
                </button>
            </nav>
        </aside>

        <!-- Catalogo centrale -->
        <div class="min-w-0 flex-1 space-y-6 w-full order-first lg:order-none">
            
            <!-- Mobile / tablet: select categorie -->
            <div class="lg:hidden">
                <label for="shop-category-select" class="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">{{ t('shop_nav_label') }}</label>
                <select
                    id="shop-category-select"
                    v-model="activeCategory"
                    class="w-full appearance-none rounded-xl border border-white/10 bg-[#0b0e14]/90 px-4 py-3 text-sm font-medium text-white shadow-inner outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                >
                    <option
                        v-for="cat in SHOP_ITEMS.categories"
                        :key="cat.id"
                        :value="cat.id"
                    >
                        {{ t(cat.name) }}
                    </option>
                </select>
            </div>

            <!-- Sezione categoria attiva: titolo + hint + immagine rappresentativa -->
            <header
                v-if="activeCategoryMeta"
                class="flex flex-col sm:flex-row sm:items-center gap-4 p-4 md:p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0b0e14]/90 to-black/40 shadow-lg"
            >
                <div
                    v-if="categoryHeroSrc(activeCategory)"
                    class="shrink-0 flex items-center justify-center w-full sm:w-auto"
                >
                    <div class="rounded-xl bg-black/50 border border-white/10 p-3 shadow-inner">
                        <img
                            :src="categoryHeroSrc(activeCategory)"
                            alt=""
                            class="w-20 h-20 md:w-24 md:h-24 object-contain"
                            loading="lazy"
                        />
                    </div>
                </div>
                <div class="min-w-0 flex-1 text-center sm:text-left">
                    <h2 class="text-lg md:text-xl font-bold text-white tracking-tight">
                        {{ t(activeCategoryMeta.name) }}
                    </h2>
                    <p class="text-sm text-gray-400 mt-1.5 leading-relaxed max-w-3xl">
                        {{ t(shopCatHintKey(activeCategory)) }}
                    </p>
                </div>
            </header>

            <!-- Griglia articoli (blocchi: sottosezioni amplificatori o lista unica) -->
            <div class="space-y-8">
                <section
                    v-for="block in displayCatalog"
                    :key="block.blockKey"
                    class="space-y-4"
                >
                    <h3
                        v-if="block.titleKey"
                        class="text-[11px] font-bold text-cyan-500/90 uppercase tracking-[0.2em] border-b border-white/10 pb-2"
                    >
                        {{ t(block.titleKey) }}
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-5">
                        <article
                            v-for="entry in block.items"
                            :key="entry.key"
                            class="card-glass p-0 flex flex-col h-full overflow-hidden border border-white/10 hover:border-cyan-500/25 transition-colors rounded-2xl"
                        >
                            <!-- Intestazione card: asset + titolo + quantità -->
                            <div class="p-4 md:p-5 border-b border-white/10 bg-black/20">
                                <div class="flex gap-3 md:gap-4">
                                    <div
                                        class="shrink-0 w-16 h-16 md:w-[4.5rem] md:h-[4.5rem] rounded-xl bg-black/45 border border-white/10 flex items-center justify-center overflow-hidden"
                                    >
                                        <img
                                            v-if="shopItemImageSrc(entry.key)"
                                            :src="shopItemImageSrc(entry.key)"
                                            :alt="t(entry.key)"
                                            class="w-[88%] h-[88%] object-contain drop-shadow-md"
                                            loading="lazy"
                                        />
                                        <svg
                                            v-else
                                            class="w-8 h-8 text-cyan-500/50"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    <div class="min-w-0 flex-1 flex flex-col justify-center gap-2">
                                        <h4 class="text-sm md:text-[0.95rem] font-bold text-white leading-snug">
                                            {{ t(entry.key) }}
                                        </h4>
                                        <div class="flex items-center gap-2 flex-wrap">
                                            <span class="text-[10px] uppercase font-bold text-gray-500 tracking-wide">{{ t('shop_label_qty') }}</span>
                                            <input
                                                type="number"
                                                v-model.number="itemQuantities[entry.key]"
                                                @focus="$event.target.select()"
                                                min="1"
                                                class="bg-black/50 border border-white/15 rounded-lg text-white text-xs font-mono w-14 px-2 py-1.5 text-right outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="p-4 md:p-5 flex-grow flex flex-col justify-end gap-4">
                                
                                <div class="space-y-3">
                                    <div
                                        v-for="[tierName, durations] in tiersForDisplay(entry.key, entry.val.costs)"
                                        :key="tierName"
                                        class="rounded-xl border border-white/5 bg-black/40 p-3 lg:p-4 flex flex-col gap-3 lg:gap-3.5 shadow-inner"
                                        :class="getTierBorderClass(tierName, entry.key)"
                                    >
                                        <div v-if="tierName !== 'none' || Object.keys(durations).length > 1" class="flex items-center gap-3" :class="tierName !== 'none' ? 'justify-between' : 'justify-end'">
                                             <span v-if="tierName !== 'none'" class="text-[11px] lg:text-xs font-bold uppercase tracking-wider min-w-[70px] leading-tight" :class="getTierColorClass(tierName)">
                                                  {{ getTierDisplayName(entry.key, tierName) }}
                                             </span>
                                             <div v-if="Object.keys(durations).length > 1" class="flex p-0.5 bg-[#0b0e14] rounded-md border border-white/10 gap-0.5 shadow-sm overflow-x-auto">
                                                 <button 
                                                     v-for="(_, dur) in durations" :key="dur"
                                                     type="button"
                                                     @click="selectedDurations[`${entry.key}_${tierName}`] = dur"
                                                     class="px-2.5 py-1.5 text-[10px] font-bold uppercase rounded-sm transition-colors whitespace-nowrap"
                                                     :class="selectedDurations[`${entry.key}_${tierName}`] === dur ? 'bg-cyan-600/90 text-white shadow-md' : 'text-gray-500 hover:text-white hover:bg-white/5'"
                                                 >
                                                     {{ dur === 'base' ? 'Base' : t('dur_' + dur).replace(' Days', 'd').replace(' Giorni', 'g') }}
                                                 </button>
                                             </div>
                                        </div>
                                
                                        <button 
                                            type="button"
                                            @click="addToShopCart(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]])"
                                            class="group w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2.5 lg:px-4 lg:py-3 rounded-lg border border-transparent bg-white/5 hover:bg-white/10 hover:border-cyan-500/40 transition-all active:scale-[0.98]"
                                        >
                                            <span class="text-[11px] lg:text-xs font-bold text-white flex items-center gap-1.5 lg:gap-2 group-hover:text-cyan-200 transition-colors">
                                                <svg class="w-4 h-4 lg:w-4 lg:h-4 text-cyan-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                                                <span v-if="getDurationDiscount(entry.val, tierName, selectedDurations[`${entry.key}_${tierName}`]) > 0" class="text-[9px] bg-green-600 px-1.5 py-0.5 rounded shadow-sm ml-0.5 text-white">
                                                     -{{ getDurationDiscount(entry.val, tierName, selectedDurations[`${entry.key}_${tierName}`]) }}%
                                                </span>
                                            </span>
                                            <span class="text-[11px] lg:text-xs font-mono font-bold flex flex-wrap items-center sm:justify-end gap-1.5 w-full sm:w-auto" :class="getCalculatedCost(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]]) < durations[selectedDurations[`${entry.key}_${tierName}`]] ? 'text-green-400' : 'text-cyan-100'">
                                                <span v-if="getCalculatedCost(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]]) < durations[selectedDurations[`${entry.key}_${tierName}`]]" class="opacity-60 line-through text-[10px] text-cyan-700 decoration-cyan-500/50">
                                                    {{ formatNum(durations[selectedDurations[`${entry.key}_${tierName}`]]) }}
                                                </span>
                                                <span class="flex items-baseline gap-1">
                                                    {{ formatNum(getCalculatedCost(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]])) }}
                                                    <span class="text-[9px] opacity-70 font-sans tracking-widest">MO</span>
                                                </span>
                                            </span>
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </article>
                    </div>
                </section>
            </div>

        </div>

    </div>

    <!-- Drawer carrello (full-height da destra, stile flyout) -->
    <Teleport to="body">
        <div
            v-show="cartDrawerOpen"
            id="shop-cart-drawer"
            class="fixed inset-0 z-[100] flex justify-end"
            role="dialog"
            aria-modal="true"
            :aria-hidden="!cartDrawerOpen"
        >
            <div
                class="absolute inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity"
                aria-hidden="true"
                @click="cartDrawerOpen = false"
            />
            <aside
                class="relative z-10 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#080b12] shadow-[-16px_0_48px_rgba(0,0,0,0.55)]"
            >
                <div class="flex items-center justify-between gap-3 border-b border-white/10 bg-black/50 px-4 py-4">
                    <h3 id="cart-drawer-title" class="text-base font-bold uppercase tracking-wider text-white flex items-center gap-2">
                        <svg class="w-5 h-5 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        {{ t('shop_cart_button') }}
                    </h3>
                    <div class="flex items-center gap-2">
                        <button
                            v-if="shopCart.length > 0"
                            type="button"
                            class="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/20"
                            @click="clearCart"
                        >
                            {{ t('shop_cart_clear') }}
                        </button>
                        <button
                            type="button"
                            class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                            :aria-label="t('shop_cart_close')"
                            @click="cartDrawerOpen = false"
                        >
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>

                <div class="flex min-h-0 flex-1 flex-col">
                    <div class="custom-scrollbar flex-1 overflow-y-auto p-4">
                        <div
                            v-if="shopCart.length === 0"
                            class="flex flex-col items-center justify-center py-16 text-center text-sm leading-relaxed text-gray-500"
                        >
                            <svg class="mb-4 h-16 w-16 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                            <p>{{ t('shop_cart_empty_hint') }}</p>
                            <p class="mt-2 text-xs text-gray-600">{{ t('shop_cart_empty_catalog_hint') }}</p>
                        </div>

                        <div v-else class="space-y-3">
                            <div
                                v-for="(item, index) in shopCart"
                                :key="index"
                                class="group flex justify-between gap-3 rounded-xl border border-white/10 bg-black/60 p-3 shadow-sm transition-all hover:border-cyan-500/30 hover:bg-black/80"
                            >
                                <div class="min-w-0 flex-1">
                                    <div class="mb-1 text-xs font-bold leading-tight text-white break-words">{{ item.mult }}× {{ t(item.id) }}</div>
                                    <div class="flex flex-wrap items-center gap-2 text-[10px]">
                                        <span v-if="item.tier !== 'none'" :class="getTierColorClass(item.tier)" class="uppercase">{{ getTierDisplayName(item.id, item.tier) }}</span>
                                        <span v-if="item.duration !== 'base'" class="font-bold text-gray-400 bg-gray-800/80 px-1 rounded">{{ t('dur_' + item.duration) }}</span>
                                        <span v-if="item.event && item.event !== 'none'" class="font-bold text-cyan-200 bg-cyan-900/40 px-1 rounded border border-cyan-500/20 flex items-center gap-1">
                                            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            {{ t('shop_event_' + item.event) }}
                                        </span>
                                    </div>
                                </div>
                                <div class="flex shrink-0 flex-col items-end justify-between">
                                    <button
                                        type="button"
                                        class="rounded p-1 text-gray-600 opacity-50 transition-opacity hover:bg-red-500/20 hover:text-red-500 group-hover:opacity-100"
                                        :aria-label="'Rimuovi'"
                                        @click="removeShopCart(index)"
                                    >
                                        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                    <span class="mt-2 font-mono text-xs font-bold text-cyan-400">{{ formatNum(item.cost) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="border-t border-cyan-500/30 bg-black/90 p-5 shadow-[0_-12px_32px_rgba(0,0,0,0.85)]">
                        <div class="space-y-2">
                             <div v-if="totalShopCartCashback > 0" class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-green-400">
                                 <span>Cashback Accumulato</span>
                                 <span class="font-mono text-base">+{{ formatNum(totalShopCartCashback) }} MO</span>
                             </div>
                             <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-cyan-500/80">
                                 <span>Totale Spesa MO</span>
                                 <span>MO</span>
                             </div>
                             <div class="text-right font-mono text-3xl font-black text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.5)] sm:text-4xl">
                                 {{ formatNum(totalShopCartMO) }}
                             </div>
                             <div v-if="totalShopCartCashback > 0" class="text-right mt-1 pt-1 border-t border-white/5 flex items-center justify-end gap-2">
                                 <span class="text-[10px] uppercase tracking-wider text-gray-500">Costo Netto Reale</span>
                                 <span class="text-xl font-mono font-bold text-gray-300">{{ formatNum(totalShopCartMO - totalShopCartCashback) }}</span>
                             </div>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    </Teleport>
  </div>
</template>
