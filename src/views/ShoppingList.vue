<script setup>
import { ref, reactive, computed, watch, onBeforeUnmount, onMounted, nextTick } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { SHOP_ITEMS } from '../data/ogame_db';

/** 
 * Shopping List V4.2 - "Definitive 3-Column" Layout
 * Focus: Dedicated sticky sidebars for events and cart, dynamic bubbling, mobile accessibility.
 */

const { t } = useLanguage();
const SHOP_IMG = '/Immagini%20Ogame';

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
    exp_delay_50: '50_.png',
    exp_delay_75: '75_.png',
    exp_delay_100: '100_.png',
};

const shopImgUrl = (f) => f ? `${SHOP_IMG}/${encodeURIComponent(f)}` : null;
const shopItemImageSrc = (k) => shopImgUrl(SHOP_ITEM_IMAGES[k]);

// State
const shopCart = ref([]);
const cartDrawerOpen = ref(false);
const activeCategory = ref(SHOP_ITEMS.categories[0].id);
const activeDiscountEvent = ref('none');
const isMounted = ref(false);
const cartJustAdded = ref(false);
const lastAddedId = ref(null);

// Sidebar / Scroll logic
const scrollToCategory = (catId) => {
    activeCategory.value = catId;
    const el = document.getElementById(`cat-section-${catId}`);
    if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
    }
};

let observer = null;
const setupObserver = () => {
    if (observer) observer.disconnect();
    observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) activeCategory.value = e.target.id.replace('cat-section-', '');
        });
    }, { rootMargin: '-60px 0px -70% 0px', threshold: 0 });
    
    visibleCategories.value.forEach(cat => {
        const el = document.getElementById(`cat-section-${cat.id}`);
        if (el) observer.observe(el);
    });
};

onMounted(() => {
    isMounted.value = true;
    nextTick(setupObserver);
});

watch(activeDiscountEvent, () => nextTick(setupObserver));

// Events
const DISCOUNT_EVENTS = [
    { id: 'none',         label: 'shop_event_none',         icon: '✕' },
    { id: 'discount',     label: 'shop_event_discount',     icon: '🏷️' },
    { id: 'boosters',     label: 'shop_event_boosters',     icon: '⚡' },
    { id: 'resources',    label: 'shop_event_resources',    icon: '📦' },
    { id: 'classes',      label: 'shop_event_classes',      icon: '🎓' },
    { id: 'platinum',     label: 'shop_event_platinum',     icon: '💎' },
    { id: 'construction', label: 'shop_event_construction', icon: '🏗️' },
    { id: 'cashback',     label: 'shop_event_cashback',     icon: '💰' },
    { id: 'merchant',     label: 'shop_event_merchant',     icon: '🛒' },
    { id: 'relocate',     label: 'shop_event_relocate',     icon: '🚀' },
    { id: 'slots',        label: 'shop_event_slots',        icon: '🔓' },
    { id: 'expedition',   label: 'shop_event_expedition',   icon: '🌌' },
];

// Calculation Helpers
const isItemDiscounted = (itemKey, tier, eventId) => {
    if (eventId === 'none') return false;
    if (eventId === 'discount') {
        const item = SHOP_ITEMS.items[itemKey];
        const excludeCats = ['officers_only', 'ingame', 'construction', 'expedition'];
        if (item && !excludeCats.includes(item.cat)) return true;
        return false;
    }
    if (eventId === 'boosters'     && String(itemKey).includes('booster')) return true;
    if (eventId === 'resources'    && String(itemKey).includes('res_package')) return true;
    if (eventId === 'classes'      && (String(itemKey).includes('class_') || (String(itemKey).includes('staff_') && itemKey !== 'staff_command'))) return true;
    if (eventId === 'platinum'     && tier === 'platinum') return true;
    if (eventId === 'merchant'     && itemKey === 'ingame_merchant') return true;
    if (eventId === 'relocate'     && itemKey === 'ingame_relocate') return true;
    if (eventId === 'slots'        && (itemKey === 'slot_fleet' || itemKey === 'slot_expedition')) return true;
    if (eventId === 'expedition'   && String(itemKey).includes('exp_delay_')) return true;
    return false;
};

const isItemHighlighted = (itemKey, costs) => {
    if (activeDiscountEvent.value === 'none') return false;
    return Object.keys(costs).some(tier => isItemDiscounted(itemKey, tier, activeDiscountEvent.value));
};

const getEventDiscountFactor = (itemKey, tier, dur, eventId) => {
    if (eventId === 'discount') {
        const item = SHOP_ITEMS.items[itemKey];
        const excludeCats = ['officers_only', 'ingame', 'construction', 'expedition'];
        if (item && !excludeCats.includes(item.cat)) return 0.85;
    }
    if (eventId === 'boosters' && String(itemKey).includes('booster')) {
        if (dur === '7d')  return 0.9;
        if (dur === '30d') return 0.85;
        if (dur === '90d') return 0.8;
    }
    if (eventId === 'resources'  && String(itemKey).includes('res_package')) return 0.7;
    if (eventId === 'classes'    && (String(itemKey).includes('class_') || (String(itemKey).includes('staff_') && itemKey !== 'staff_command'))) return 0.8;
    if (eventId === 'platinum'   && tier === 'platinum') return 0.8;
    if (eventId === 'merchant'   && itemKey === 'ingame_merchant') return 2000 / 3500;
    if (eventId === 'relocate'   && itemKey === 'ingame_relocate') return 0.5;
    if (eventId === 'slots'      && (itemKey === 'slot_fleet' || itemKey === 'slot_expedition')) return 0.7;
    if (eventId === 'expedition' && String(itemKey).includes('exp_delay_')) return 0.8;
    return 1;
};

const getCalculatedCost = (itemKey, tier, dur, baseCost) =>
    Math.round(baseCost * getEventDiscountFactor(itemKey, tier, dur, activeDiscountEvent.value));

const getBestDiscountPctForCard = (itemKey, costs) => {
    let best = 0;
    for (const [tier, durs] of Object.entries(costs)) {
        const dur = Object.keys(durs)[0];
        const f = getEventDiscountFactor(itemKey, tier, dur, activeDiscountEvent.value);
        if (f < 1) {
            const pct = Math.round((1 - f) * 100);
            if (pct > best) best = pct;
        }
    }
    return best;
};

// Item State
const itemQuantities = reactive({});
const selectedDurations = reactive({});

for (const [key, val] of Object.entries(SHOP_ITEMS.items)) {
    itemQuantities[key] = 1;
    if (val.costs) {
        for (const [tier, durs] of Object.entries(val.costs)) {
            selectedDurations[`${key}_${tier}`] = Object.keys(durs)[0];
        }
    }
}

const formatNum = (n) => new Intl.NumberFormat('it-IT').format(Math.floor(n));

// Catalog Filtering & Sorting
const visibleCategories = computed(() =>
    SHOP_ITEMS.categories.filter(c => {
        if (c.id === 'construction') return activeDiscountEvent.value === 'construction';
        if (c.id === 'expedition')   return activeDiscountEvent.value === 'expedition';
        if (c.id === 'avatars')      return false;
        return true;
    })
);

const fullCatalog = computed(() => {
    return visibleCategories.value.map(cat => {
        let blocks = [];
        const pair = (id) => ({ key: id, val: SHOP_ITEMS.items[id] });
        
        if (cat.id === 'boosters') {
            blocks = [
                { blockKey: 'boost-res', titleKey: 'shop_boosters_sub_res', items: ['booster_metal','booster_crystal','booster_deut'].map(pair) },
                { blockKey: 'boost-en', titleKey: 'shop_boosters_sub_energy', items: [pair('booster_energy')] },
            ];
        } else if (cat.id === 'construction') {
            blocks = [
                { blockKey: 'cons-std', titleKey: 'shop_construction_sub_standard', items: ['kraken','detroid','newtron'].map(pair) },
                { blockKey: 'cons-life', titleKey: 'shop_construction_sub_lifeforms', items: ['kraken_lifeforms','detroid_lifeforms','newtron_lifeforms'].map(pair) },
            ];
        } else if (cat.id === 'expedition') {
            blocks = [{ blockKey: 'exp-std', titleKey: null, items: ['exp_delay_50','exp_delay_75','exp_delay_100'].map(pair) }];
        } else {
            const flat = {};
            for (const [k, v] of Object.entries(SHOP_ITEMS.items)) if (v.cat === cat.id) flat[k] = v;
            blocks = [{ blockKey: 'flat', titleKey: null, items: Object.entries(flat).map(([k, v]) => ({ key: k, val: v })) }];
        }

        // Apply bubbling: items with active discounts go first
        blocks = blocks.map(b => {
            const sortedItems = [...b.items].sort((a, b) => {
                const aH = isItemHighlighted(a.key, a.val.costs);
                const bH = isItemHighlighted(b.key, b.val.costs);
                if (aH && !bH) return -1;
                if (!aH && bH) return 1;
                return 0;
            });
            return { ...b, items: sortedItems };
        });

        return { id: cat.id, name: cat.name, blocks };
    });
});

// Cart Logic
const addToShopCart = (id, tier, duration, baseCost) => {
    const mult = Math.max(1, itemQuantities[id] || 1);
    const event = activeDiscountEvent.value;
    const cost = getCalculatedCost(id, tier, duration, baseCost);
    const cbPerUnit = event === 'cashback' ? Math.floor(cost * 0.2) : 0;
    
    const existing = shopCart.value.find(i => i.id === id && i.tier === tier && i.duration === duration && i.event === event);
    if (existing) {
        existing.mult += mult;
        existing.cost += cost * mult;
        existing.cashback += cbPerUnit * mult;
    } else {
        shopCart.value.push({ id, tier, duration, mult, unitCost: cost, cost: cost * mult, cashback: cbPerUnit * mult, event, tKey: id });
    }
    
    itemQuantities[id] = 1;
    lastAddedId.value = id;
    cartJustAdded.value = true;
    setTimeout(() => { cartJustAdded.value = false; lastAddedId.value = null; }, 1200);
};

const removeShopCart = (idx) => shopCart.value.splice(idx, 1);
const clearCart = () => { shopCart.value = []; };

const totalShopCartMO = computed(() => shopCart.value.reduce((s, i) => s + i.cost, 0));
const totalShopCartCashback = computed(() => shopCart.value.reduce((s, i) => s + (i.cashback || 0), 0));
const cartTotalQty = computed(() => shopCart.value.reduce((s, i) => s + i.mult, 0));

// Tiers & Labels
const TIER_DISPLAY_ORDER = ['platinum', 'gold', 'silver', 'bronze', 'none'];

const getTierDisplayName = (itemKey, tier) => {
    return t(`tier_${tier}`) || tier;
};

const getTierSuffix = (itemKey, tier) => {
    if (String(itemKey).includes('booster')) return { platinum: '40%', gold: '30%', silver: '20%', bronze: '10%' }[tier] || '';
    if (itemKey === 'fields_planet') return { platinum: '+20', gold: '+15', silver: '+9', bronze: '+4' }[tier] || '';
    if (itemKey === 'fields_moon') return { platinum: '+8', gold: '+6', silver: '+4', bronze: '+2' }[tier] || '';
    if (itemKey === 'moons') return { gold: '30min', silver: '60min', bronze: '90min' }[tier] || '';
    if (itemKey === 'slot_expedition') return { gold: '+3', silver: '+2', bronze: '+1' }[tier] || '';
    if (itemKey === 'slot_fleet') return { gold: '+6', silver: '+4', bronze: '+2' }[tier] || '';
    return '';
};

const getTierColorClass = (tier) => {
    if (tier === 'platinum') return 'glow-purple text-purple-200';
    if (tier === 'gold')     return 'glow-yellow text-yellow-200';
    if (tier === 'silver')   return 'glow-slate text-slate-200';
    if (tier === 'bronze')   return 'glow-orange text-orange-200';
    return 'text-cyan-200';
};
// Swipe delete logic
const swipeState = reactive({ idx: null, startX: 0, currentXP: 0 });
const tsStart = (e, idx) => { swipeState.idx = idx; swipeState.startX = e.touches[0].clientX; swipeState.currentXP = 0; };
const tsMove = (e, idx) => { if (swipeState.idx !== idx) return; const diff = swipeState.startX - e.touches[0].clientX; if (diff > 0) swipeState.currentXP = Math.min(diff, 100); else swipeState.currentXP = 0; };
const tsEnd = (idx) => { if (swipeState.idx !== idx) return; if (swipeState.currentXP >= 60) removeShopCart(idx); swipeState.idx = null; swipeState.currentXP = 0; };
const getSwipeStyle = (idx) => {
    if (swipeState.idx === idx) return { transform: `translateX(-${swipeState.currentXP}px)`, transition: 'none' };
    return { transform: 'translateX(0)', transition: 'transform 0.3s ease-out' };
};
</script>

<template>
  <div class="shop-v4-root items-start">
    
    <!-- ════ SIDEBAR LEFT (Sticky) ════ -->
    <aside class="shop-sidebar-left hidden lg:flex flex-col">
      <div class="sidebar-scrollable custom-scrollbar">
        
        <!-- Events Section -->
        <div class="sidebar-section">
          <label class="section-label">
            <svg class="w-3 h-3 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Evento Attivo
          </label>
          <div class="event-nav space-y-1 mt-3">
            <button
              v-for="evt in DISCOUNT_EVENTS" :key="evt.id"
              type="button"
              @click="activeDiscountEvent = evt.id"
              class="event-btn"
              :class="{ 'event-active': activeDiscountEvent === evt.id }"
            >
              <span class="btn-icon">{{ evt.icon }}</span>
              <span class="btn-label">{{ t(evt.label) }}</span>
            </button>
          </div>
        </div>

        <div class="sidebar-divider"></div>

        <!-- Categories Section -->
        <div class="sidebar-section">
          <label class="section-label">Sezioni</label>
          <div class="cat-nav space-y-1 mt-3">
            <button
              v-for="cat in visibleCategories" :key="cat.id"
              type="button"
              @click="scrollToCategory(cat.id)"
              class="cat-btn"
              :class="{ 'cat-active': activeCategory === cat.id }"
            >
              {{ t(cat.name) }}
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- ════ MAIN CONTENT ════ -->
    <main class="shop-main-content">
      
      <!-- Mobile Event & Category Bar (Horizontal Scroll) -->
      <div class="lg:hidden px-4 pt-6 pb-2">
        <div class="flex flex-col gap-4">
            <!-- Eventi -->
            <div>
              <div class="flex items-center gap-2 mb-3">
                <svg class="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                <span class="text-[10px] font-black uppercase tracking-widest text-gray-500">Eventi Attivi</span>
              </div>
              <div class="mobile-event-bar flex gap-2 overflow-x-auto pb-6 pt-2 px-1 custom-scrollbar no-scrollbar -ml-1">
                <button
                  v-for="evt in DISCOUNT_EVENTS" :key="evt.id"
                  @click="activeDiscountEvent = evt.id"
                  class="mobile-evt-btn shrink-0"
                  :class="{ 'mobile-evt-active': activeDiscountEvent === evt.id }"
                >
                  <span class="text-lg">{{ evt.icon }}</span>
                  <span class="text-[10px] font-bold whitespace-nowrap">{{ t(evt.label) }}</span>
                </button>
              </div>
            </div>

            <!-- Categorie -->
            <div>
              <div class="flex items-center gap-2 mb-3 mt-1">
                <svg class="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                <span class="text-[10px] font-black uppercase tracking-widest text-gray-500">Categorie</span>
              </div>
              <div class="mobile-event-bar flex gap-2 overflow-x-auto pb-6 pt-2 px-1 custom-scrollbar no-scrollbar -ml-1">
                <button
                  v-for="cat in visibleCategories" :key="cat.id"
                  @click="scrollToCategory(cat.id)"
                  class="shrink-0 py-2.5 px-4 flex items-center justify-center rounded-xl border transition-all text-[11px] font-bold whitespace-nowrap"
                  :class="activeCategory === cat.id ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_10px_20px_-5px_rgba(6,182,212,0.2)]' : 'bg-white/5 border-white/5 text-gray-400 hover:text-gray-200'"
                >
                  {{ t(cat.name) }}
                </button>
              </div>
            </div>
        </div>
      </div>

      <!-- Page Title Area -->
      <div class="catalog-header px-4 md:px-10 pt-8 pb-4">
        <h1 class="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white">Shopping List</h1>
      </div>

      <!-- Catalog Grid -->
      <div class="catalog-sections px-4 md:px-10 pb-20 space-y-12 mt-6">
        <div
          v-for="catData in fullCatalog" :key="catData.id"
          :id="'cat-section-' + catData.id"
          class="scroll-mt-[100px]"
        >
          <div class="section-divider flex items-center gap-4 mb-6">
            <h2 class="text-xs font-black uppercase tracking-[0.4em] text-cyan-400/80">{{ t(catData.name) }}</h2>
            <div class="h-px flex-1 bg-gradient-to-r from-cyan-500/20 to-transparent"></div>
          </div>

          <div class="section-blocks space-y-10">
            <div v-for="block in catData.blocks" :key="block.blockKey" class="block-wrap">
              <h3 v-if="block.titleKey" class="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4 pl-1">
                {{ t(block.titleKey) }}
              </h3>

              <div class="product-grid grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-2 md:gap-4">
                <article
                  v-for="entry in block.items" :key="entry.key"
                  class="product-card"
                  :class="{ 
                    'card-highlight': isItemHighlighted(entry.key, entry.val.costs),
                    'just-added': lastAddedId === entry.key
                  }"
                >
                  <!-- Card Top: Name -->
                  <div class="card-header p-2 md:p-3 pb-0">
                    <h4 class="text-[11px] font-bold leading-tight text-gray-200 min-h-[2.5rem] line-clamp-2">
                      {{ t(entry.key) }}
                    </h4>
                  </div>

                  <!-- Card Mid: Image -->
                  <div class="card-image-wrap px-2 md:px-3 py-2">
                    <div class="img-container relative h-20 md:h-36 bg-white/[0.03] rounded-xl overflow-hidden border border-white/5 shadow-inner flex items-center justify-center group">
                      <img
                        :src="shopItemImageSrc(entry.key)"
                        :alt="t(entry.key)"
                        class="product-img h-[85%] w-[85%] object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div v-if="isItemHighlighted(entry.key, entry.val.costs) && getBestDiscountPctForCard(entry.key, entry.val.costs) > 0"
                           class="discount-overlay absolute top-1.5 right-1.5 bg-green-500 text-black text-[9px] font-black px-2 py-0.5 rounded-md shadow-lg">
                        -{{ getBestDiscountPctForCard(entry.key, entry.val.costs) }}%
                      </div>
                    </div>
                  </div>

                  <!-- Card Bottom: Controls -->
                  <div class="card-footer p-2 md:p-3 pt-0 space-y-2">
                    <div class="flex items-center justify-between gap-2">
                      <div class="qty-control flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-white/10">
                        <span class="text-[7px] font-bold text-gray-600">QTÀ</span>
                        <input type="number" v-model.number="itemQuantities[entry.key]" min="1" class="qty-input" />
                      </div>
                    </div>

                    <div class="tier-stack space-y-1">
                      <div v-for="[tierName, durations] in TIER_DISPLAY_ORDER.filter(t => entry.val.costs && entry.val.costs[t]).map(t => [t, entry.val.costs[t]])" :key="tierName">
                        
                        <div v-if="Object.keys(durations).length > 1" class="segmented-control flex p-0.5 mb-1.5 bg-black/50 rounded-lg border border-white/5">
                          <button
                            v-for="(_, dur) in durations" :key="dur"
                            @click="selectedDurations[`${entry.key}_${tierName}`] = dur"
                            class="seg-btn"
                            :class="{ 'seg-active': selectedDurations[`${entry.key}_${tierName}`] === dur }"
                          >
                            {{ dur === 'base' ? 'STD' : dur }}
                          </button>
                        </div>

                        <button
                          @click="addToShopCart(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]])"
                          class="add-btn flex items-center justify-between"
                          :class="[getTierColorClass(tierName), { 'btn-discounted': isItemHighlighted(entry.key, entry.val.costs) }]"
                        >
                          <span class="tier-label text-[9px] font-black uppercase leading-none truncate max-w-[55%] flex items-center gap-1.5 focus-visible:outline-none">
                            <template v-if="tierName !== 'none'">
                              <span>{{ getTierDisplayName(entry.key, tierName) }}</span>
                              <span v-if="getTierSuffix(entry.key, tierName)" class="inline-flex items-center justify-center px-1.5 py-[2px] ml-0.5 rounded-sm text-[10px] font-black bg-cyan-400 text-black whitespace-nowrap shadow-[0_0_8px_rgba(34,211,238,0.4)] tracking-wide">{{ getTierSuffix(entry.key, tierName) }}</span>
                            </template>
                            <svg v-else class="w-3.5 h-3.5 m-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 5v14m7-7H5"></path></svg>
                          </span>
                          <span class="price-block flex flex-col items-end leading-none">
                            <span v-if="getCalculatedCost(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]]) < durations[selectedDurations[`${entry.key}_${tierName}`]]"
                                  class="text-[8px] line-through opacity-40 font-mono mb-0.5">
                              {{ formatNum(durations[selectedDurations[`${entry.key}_${tierName}`]]) }}
                            </span>
                            <span class="mo-text font-black text-xs">
                              {{ formatNum(getCalculatedCost(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]])) }}
                              <span class="text-[7px] opacity-60 ml-0.5 font-bold">MO</span>
                            </span>
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ════ SIDEBAR RIGHT: STICKY CART ════ -->
    <aside class="shop-sidebar-right hidden xl:flex flex-col">
      <div class="cart-sticky-container custom-scrollbar">
        <div class="panel-header flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            </div>
            <span class="text-xs font-black uppercase tracking-[0.2em] text-white">Carrello</span>
          </div>
          <button @click="clearCart" class="text-[10px] font-bold text-red-500/40 hover:text-red-400 transition-colors uppercase tracking-tighter" v-if="shopCart.length > 0">Reset</button>
        </div>
        
        <div class="cart-scroll-area space-y-3">
          <div v-for="(item, idx) in [...shopCart].reverse()" :key="idx" class="cart-row-v4 group flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/20 transition-all">
            <div class="flex-1 min-w-0">
              <div class="text-[10px] font-black text-gray-200 truncate">{{ item.mult }}× {{ t(item.tKey) }}</div>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-[8px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  {{ item.tier !== 'none' ? getTierDisplayName(item.tKey, item.tier) : '' }}
                  <span v-if="item.tier !== 'none' && getTierSuffix(item.tKey, item.tier)" class="text-[9px] font-black text-cyan-400 tracking-wider">{{ getTierSuffix(item.tKey, item.tier) }}</span>
                </span>
                <span v-if="item.duration !== 'base'" class="text-[8px] font-black text-cyan-500/60">{{ item.duration }}</span>
              </div>
            </div>
            <div class="flex flex-col items-end">
              <span class="text-[11px] font-mono font-black text-cyan-400">{{ formatNum(item.cost) }}</span>
              <button @click="removeShopCart(shopCart.length - 1 - idx)" class="text-[8px] text-red-500/60 opacity-0 group-hover:opacity-100 uppercase font-black tracking-tighter">Rimuovi</button>
            </div>
          </div>
          <div v-if="shopCart.length === 0" class="flex flex-col items-center justify-center py-12 opacity-20 filter grayscale">
            <svg class="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <span class="text-[10px] uppercase font-black tracking-widest italic">Vuoto</span>
          </div>
        </div>

        <div v-if="shopCart.length > 0" class="panel-total mt-10 pt-6 border-t border-white/10">
          <div class="flex items-center justify-between mb-4">
            <span class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Totale MO</span>
            <span class="text-2xl font-black text-white glow-white">{{ formatNum(totalShopCartMO) }}</span>
          </div>
          <button @click="cartDrawerOpen = true" class="checkout-btn w-full">
            Dettaglio Acquisto
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile Floating Cart Button -->
    <div class="xl:hidden fixed bottom-6 right-6 z-40">
      <button @click="cartDrawerOpen = true" class="relative bg-cyan-500 text-black p-4 rounded-full shadow-[0_10px_25px_rgba(6,182,212,0.5)] active:scale-95 transition-transform border border-cyan-400">
         <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
         <span v-if="shopCart.length > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#050505]">{{ cartTotalQty }}</span>
      </button>
    </div>

    <!-- ════ FULL CART DRAWER (Mobile/Desktop Detail) ════ -->
    <Teleport to="body">
      <div v-show="cartDrawerOpen" class="fixed inset-0 z-[100] flex justify-end">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-md" @click="cartDrawerOpen = false" />
        <aside class="relative z-10 w-full max-w-xl bg-[#06080d] border-l border-white/10 flex flex-col shadow-2xl overflow-hidden">
          <div class="header-drawer flex items-center justify-between px-8 py-6 border-b border-white/5 bg-black/40">
            <span class="text-xs font-black uppercase tracking-[0.3em] text-white flex items-center gap-4">
              <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              Riepilogo Database
            </span>
            <button @click="cartDrawerOpen = false" class="p-3 hover:bg-white/5 rounded-full text-gray-500 transition-all"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <div class="flex-1 overflow-y-auto p-4 md:p-8 space-y-3 custom-scrollbar overflow-x-hidden">
            <div v-for="(item, idx) in shopCart" :key="idx" class="relative group overflow-hidden rounded-2xl w-full">
              <!-- Delete background -->
              <div class="absolute inset-0 bg-red-600/90 flex justify-end items-center px-6 cursor-pointer" @click="removeShopCart(idx)">
                <span class="text-xs font-black uppercase text-white mr-2 hidden lg:block">Elimina</span>
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </div>

              <!-- Item container -->
              <div class="relative bg-[#06080d] flex items-center justify-between gap-4 p-4 md:p-5 border border-white/5 hover:border-cyan-500/40 w-full"
                   @touchstart="tsStart($event, idx)"
                   @touchmove="tsMove($event, idx)"
                   @touchend="tsEnd(idx)"
                   :style="getSwipeStyle(idx)">
                <div v-if="item.event && item.event !== 'none'" class="absolute top-0 left-0 w-1 h-full bg-green-500/40"></div>
                <div class="flex-1 min-w-[50%]">
                  <div class="text-sm font-black text-gray-100 uppercase tracking-tight italic line-clamp-1 pr-2">{{ item.mult }}× {{ t(item.tKey) }}</div>
                  <div class="flex gap-2 mt-2">
                    <span class="text-[9px] font-black text-gray-400 uppercase px-1.5 py-0.5 bg-black/50 rounded border border-white/5 flex items-center gap-1.5">
                      {{ item.tier !== 'none' ? getTierDisplayName(item.tKey, item.tier) : 'Base' }}
                      <span v-if="item.tier !== 'none' && getTierSuffix(item.tKey, item.tier)" class="text-[10px] text-cyan-400 tracking-wider">{{ getTierSuffix(item.tKey, item.tier) }}</span>
                    </span>
                    <span v-if="item.duration !== 'base'" class="text-[9px] font-black text-cyan-400 uppercase px-1.5 py-0.5 bg-cyan-400/10 rounded">{{ item.duration }}</span>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span class="text-base md:text-lg font-black text-cyan-400 font-mono tracking-tighter">{{ formatNum(item.cost) }}</span>
                  <span class="text-[9px] text-gray-600 font-bold uppercase">{{ formatNum(item.unitCost) }} / ud</span>
                </div>
              </div>
            </div>
          </div>
          <div class="p-6 md:p-10 border-t border-white/10 bg-black/80">
             <div v-if="totalShopCartCashback > 0" class="flex items-center justify-between mb-4 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                <span class="text-[10px] font-black uppercase text-green-500 flex items-center gap-1.5">
                   <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                   Cashback Previsto
                </span>
                <span class="text-xs font-black text-green-400 font-mono tracking-tight">+ {{ formatNum(totalShopCartCashback) }} MO</span>
             </div>
             <div class="flex items-baseline justify-between gap-4 mb-6 md:mb-10 px-2">
                <span class="text-xs font-black text-gray-500 uppercase tracking-widest text-[11px]">Totale Ordine</span>
                <span class="text-4xl font-black text-white glow-white tracking-tighter">{{ formatNum(totalShopCartMO) }} <span class="text-sm opacity-40 font-normal">MO</span></span>
             </div>
             <button @click="cartDrawerOpen = false" class="w-full py-4 bg-white text-black text-[11px] font-black uppercase tracking-[0.4em] rounded-2xl hover:bg-cyan-400 transition-all shadow-[0_15px_30px_rgba(0,0,0,0.4)] active:scale-95">Salva e Chiudi</button>
          </div>
        </aside>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
/* ─── BASE LAYOUT ─── */
.shop-v4-root {
  display: flex;
  min-height: calc(100vh - 72px);
  background: radial-gradient(circle at 10% 10%, rgba(6, 182, 212, 0.05), transparent 800px);
}

.shop-sidebar-left {
  width: 260px;
  position: sticky;
  top: 72px;
  height: calc(100vh - 72px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(5, 5, 5, 0.6);
  backdrop-filter: blur(15px);
  z-index: 30;
}

.shop-sidebar-right {
  width: 300px;
  position: sticky;
  top: 72px;
  height: calc(100vh - 72px);
  border-left: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(5, 5, 5, 0.6);
  backdrop-filter: blur(15px);
  z-index: 30;
}

.sidebar-scrollable, .cart-sticky-container {
  flex: 1;
  overflow-y: auto;
  padding: 2rem 1.5rem;
}

.shop-main-content {
  flex: 1;
  min-width: 0;
}

/* ─── MOBILE EVENT BAR ─── */
.mobile-event-bar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.mobile-evt-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  color: #6b7280;
  transition: all 0.3s;
}
.mobile-evt-active {
  background: rgba(6, 182, 212, 0.15);
  border-color: rgba(6, 182, 212, 0.4);
  color: #22d3ee;
  transform: translateY(-4px);
  box-shadow: 0 10px 20px -5px rgba(6, 182, 212, 0.2);
}

/* ─── PRODUCT CARDS ─── */
.product-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  position: relative;
}
.product-card:hover { border-color: rgba(255, 255, 255, 0.15); transform: translateY(-4px); }

.card-highlight { border-color: rgba(34, 197, 94, 0.4); background: rgba(34, 197, 94, 0.03); }

/* ─── SIDEBAR ELEMENTS ─── */
.section-label { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #4b5563; letter-spacing: 0.25em; display: flex; align-items: center; gap: 8px; }
.event-btn, .cat-btn { width: 100%; display: flex; align-items: center; padding: 12px 16px; border-radius: 14px; font-size: 11px; font-weight: 700; transition: all 0.25s; border: 1px solid transparent; color: #52525b; }
.event-active { background: rgba(6, 182, 212, 0.12); border-color: rgba(6, 182, 212, 0.4); color: #22d3ee; }
.cat-active { background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.1); color: #fff; }

.sidebar-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05) 50%, transparent); margin: 2rem 0; }

/* ─── CARD CONTROLS ─── */
.qty-input { background: transparent; border: none; color: #fff; font-family: monospace; font-size: 11px; font-weight: 900; width: 30px; text-align: center; outline: none; }
.seg-btn { flex: 1; font-size: 10px; font-weight: 900; text-transform: uppercase; padding: 8px 4px; border-radius: 6px; color: #52525b; transition: all 0.2s; }
.seg-active { background: #1e293b; color: #fff; }
.add-btn { width: 100%; border-radius: 12px; padding: 8px 12px; transition: all 0.2s; border: 1px solid rgba(255, 255, 255, 0.05); background: rgba(0, 0, 0, 0.4); }
.add-btn:hover { background: rgba(255, 255, 255, 0.1); transform: scale(1.02); }
.btn-discounted { border-color: rgba(34, 197, 94, 0.5); }

/* ─── CHECKOUT BTN ─── */
.checkout-btn { width: 100%; py: 4; background: #22d3ee; color: #000; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: 0.15em; border-radius: 14px; padding: 12px; transition: all 0.3s; box-shadow: 0 10px 20px -10px rgba(6,182,212,0.5); }
.checkout-btn:hover { background: #fff; transform: translateY(-2px); }

/* ─── GLOWS ─── */
.glow-white { text-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }

/* ─── RESPONSIVE ─── */
@media (max-width: 1440px) {
  .shop-sidebar-right { display: none; }
}
@media (max-width: 1024px) {
  .shop-sidebar-left { display: none; }
}
/* Layout is handled by grid-cols-* classes directly */

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
</style>
