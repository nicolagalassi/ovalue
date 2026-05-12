<script setup>
import { ref, reactive, computed, watch, onBeforeUnmount, onMounted, nextTick } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useProfiles } from '../composables/useProfiles';
import { SHOP_ITEMS } from '../data/ogame_db';

/** 
 * Shopping List V4.2 - "Definitive 3-Column" Layout
 * Focus: Dedicated sticky sidebars for events and cart, dynamic bubbling, mobile accessibility.
 */

const { t } = useLanguage();
const { activeProfile, saveProfiles } = useProfiles();
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

// Sync with active profile
watch(activeProfile, (newP) => {
    if (newP && newP.shoppingList) {
        shopCart.value = JSON.parse(JSON.stringify(newP.shoppingList.cart || []));
        activeDiscountEvent.value = newP.shoppingList.activeEvent || 'none';
    }
}, { immediate: true });

// Save changes back to profile
watch([shopCart, activeDiscountEvent], () => {
    if (activeProfile.value && activeProfile.value.shoppingList) {
        activeProfile.value.shoppingList.cart = JSON.parse(JSON.stringify(shopCart.value));
        activeProfile.value.shoppingList.activeEvent = activeDiscountEvent.value;
        saveProfiles();
    }
}, { deep: true });

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
    { id: 'discount_20',  label: 'shop_event_discount_20',  icon: '🔥' },
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

const getEventInfo = (eventId) => DISCOUNT_EVENTS.find(e => e.id === eventId);

// Calculation Helpers
const isItemDiscounted = (itemKey, tier, eventId) => {
    if (eventId === 'none') return false;
    if (eventId === 'discount' || eventId === 'discount_20') {
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
    if (eventId === 'discount_20') {
        const item = SHOP_ITEMS.items[itemKey];
        const excludeCats = ['officers_only', 'ingame', 'construction', 'expedition'];
        if (item && !excludeCats.includes(item.cat)) return 0.80;
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
    if (tier === 'platinum') return 'border-violet-500/30 bg-violet-500/[0.07] text-violet-200 hover:bg-violet-500/[0.14] hover:border-violet-400/50';
    if (tier === 'gold')     return 'border-amber-500/30 bg-amber-500/[0.07] text-amber-200 hover:bg-amber-500/[0.14] hover:border-amber-400/50';
    if (tier === 'silver')   return 'border-slate-500/30 bg-slate-500/[0.07] text-slate-200 hover:bg-slate-500/[0.14] hover:border-slate-400/50';
    if (tier === 'bronze')   return 'border-orange-500/30 bg-orange-500/[0.07] text-orange-200 hover:bg-orange-500/[0.14] hover:border-orange-400/50';
    return 'border-slate-700/30 bg-black/30 text-slate-200 hover:bg-white/[0.06] hover:border-slate-600/50';
};
const getTierBadgeClass = (tier) => {
    if (tier === 'platinum') return 'bg-violet-400/15 text-violet-300 border-violet-400/25';
    if (tier === 'gold')     return 'bg-amber-400/15 text-amber-300 border-amber-400/25';
    if (tier === 'silver')   return 'bg-slate-400/15 text-slate-300 border-slate-400/25';
    if (tier === 'bronze')   return 'bg-orange-400/15 text-orange-300 border-orange-400/25';
    return 'bg-cyan-400/15 text-cyan-300 border-cyan-400/25';
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
        <h1 class="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">{{ t('shopping_title') }}</h1>
        <div class="mt-2 h-[2px] w-16 bg-gradient-to-r from-purple-500 to-transparent rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
      </div>

      <!-- Catalog Grid -->
      <div class="catalog-sections px-4 md:px-10 pb-20 space-y-12 mt-6">
        <div
          v-for="catData in fullCatalog" :key="catData.id"
          :id="'cat-section-' + catData.id"
          class="scroll-mt-[100px]"
        >
          <div class="section-divider flex items-center gap-3 mb-6">
            <span class="w-[2px] h-4 bg-cyan-500/40 rounded-full flex-shrink-0"></span>
            <h2 class="text-[9px] font-black uppercase tracking-[0.25em] text-cyan-400/60 font-mono">{{ t(catData.name) }}</h2>
            <div class="h-px flex-1 bg-gradient-to-r from-cyan-500/10 to-transparent"></div>
          </div>

          <div class="section-blocks space-y-10">
            <div v-for="block in catData.blocks" :key="block.blockKey" class="block-wrap">
              <h3 v-if="block.titleKey" class="text-[8px] font-black uppercase tracking-[0.2em] text-gray-700 mb-4 pl-1 font-mono">
                {{ t(block.titleKey) }}
              </h3>

              <div class="product-grid grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-2 md:gap-4">
                <article
                  v-for="entry in block.items" :key="entry.key"
                  class="product-card relative flex flex-col overflow-hidden rounded-xl bg-[#0d1525] border border-slate-700/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]"
                  :class="{
                    'card-highlight': isItemHighlighted(entry.key, entry.val.costs),
                    'just-added': lastAddedId === entry.key
                  }"
                >
                  <!-- Image -->
                  <div class="relative flex items-center justify-center h-[80px] md:h-[108px] bg-black/30 border-b border-slate-700/15 overflow-hidden group">
                    <img
                      :src="shopItemImageSrc(entry.key)"
                      :alt="t(entry.key)"
                      class="h-[80%] w-[80%] object-contain drop-shadow-lg transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div v-if="isItemHighlighted(entry.key, entry.val.costs) && getBestDiscountPctForCard(entry.key, entry.val.costs) > 0"
                         class="absolute top-1.5 right-1.5 bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 rounded-md leading-none shadow-sm">
                      –{{ getBestDiscountPctForCard(entry.key, entry.val.costs) }}%
                    </div>
                  </div>

                  <!-- Name -->
                  <div class="px-3 pt-3 pb-1.5">
                    <h4 class="text-xs font-black uppercase tracking-wider text-slate-300 leading-snug line-clamp-2 min-h-[2.5em]">{{ t(entry.key) }}</h4>
                  </div>

                  <!-- Quantity -->
                  <div class="px-3 pb-2">
                    <div class="inline-flex items-center gap-1.5 bg-black/40 rounded-lg border border-slate-700/20 px-2 py-1">
                      <span class="text-[9px] font-bold text-slate-600 uppercase">Qtà</span>
                      <input type="number" v-model.number="itemQuantities[entry.key]" min="1" class="qty-input" />
                    </div>
                  </div>

                  <!-- Tier rows -->
                  <div class="px-3 pb-3 space-y-1.5 mt-auto">
                    <div v-for="[tierName, durations] in TIER_DISPLAY_ORDER.filter(tk => entry.val.costs && entry.val.costs[tk]).map(tk => [tk, entry.val.costs[tk]])" :key="tierName">

                      <!-- Duration selector -->
                      <div v-if="Object.keys(durations).length > 1" class="flex p-0.5 mb-1.5 bg-black/50 rounded-lg border border-slate-700/15">
                        <button
                          v-for="(_, dur) in durations" :key="dur"
                          @click="selectedDurations[`${entry.key}_${tierName}`] = dur"
                          class="flex-1 text-[11px] font-black uppercase py-1.5 rounded-md transition-all"
                          :class="selectedDurations[`${entry.key}_${tierName}`] === dur ? 'bg-white/[0.08] text-slate-200' : 'text-slate-600'"
                        >{{ dur === 'base' ? 'STD' : dur }}</button>
                      </div>

                      <!-- Add-to-cart button -->
                      <button
                        @click="addToShopCart(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]])"
                        class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all duration-150"
                        :class="[getTierColorClass(tierName), isItemDiscounted(entry.key, tierName, activeDiscountEvent) ? 'btn-discounted' : '']"
                      >
                        <div class="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
                          <template v-if="tierName !== 'none'">
                            <span class="text-[11px] font-black uppercase tracking-wide truncate">{{ getTierDisplayName(entry.key, tierName) }}</span>
                            <span v-if="getTierSuffix(entry.key, tierName)"
                                  class="inline-flex items-center px-1.5 py-px rounded text-[10px] font-black border flex-shrink-0"
                                  :class="getTierBadgeClass(tierName)">
                              {{ getTierSuffix(entry.key, tierName) }}
                            </span>
                          </template>
                          <svg v-else class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 5v14m7-7H5"/></svg>
                        </div>
                        <div class="flex flex-col items-end leading-none flex-shrink-0">
                          <span v-if="getCalculatedCost(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]]) < durations[selectedDurations[`${entry.key}_${tierName}`]]"
                                class="text-[10px] line-through opacity-35 font-mono mb-0.5">
                            {{ formatNum(durations[selectedDurations[`${entry.key}_${tierName}`]]) }}
                          </span>
                          <span class="text-sm font-black font-mono leading-none">
                            {{ formatNum(getCalculatedCost(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]])) }}<span class="text-[9px] opacity-50 font-bold ml-0.5">MO</span>
                          </span>
                        </div>
                      </button>

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
        
        <div class="cart-scroll-area space-y-2">
          <div v-for="(item, idx) in [...shopCart].reverse()" :key="idx"
               class="group flex items-start justify-between gap-3 p-3 rounded-xl bg-[#0a101e] border border-slate-700/30 hover:border-slate-600/50 transition-all">
            <div class="flex-1 min-w-0">
              <div class="text-xs font-bold text-slate-100 truncate leading-snug">{{ item.mult }}× {{ t(item.tKey) }}</div>
              <div class="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span v-if="item.tier !== 'none'" class="text-[10px] font-black uppercase px-1.5 py-px rounded border"
                      :class="getTierBadgeClass(item.tier)">
                  {{ getTierDisplayName(item.tKey, item.tier) }}
                  <span v-if="getTierSuffix(item.tKey, item.tier)" class="ml-0.5 opacity-80">{{ getTierSuffix(item.tKey, item.tier) }}</span>
                </span>
                <span v-if="item.duration !== 'base'"
                      class="text-[10px] font-black text-cyan-300 uppercase px-1.5 py-px bg-cyan-500/10 border border-cyan-500/20 rounded">{{ item.duration }}</span>
                <span v-if="item.event && item.event !== 'none'"
                      class="text-[10px] font-black text-emerald-300 uppercase px-1.5 py-px bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center gap-1">
                  {{ getEventInfo(item.event)?.icon }} {{ t(getEventInfo(item.event)?.label) }}
                </span>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1 flex-shrink-0">
              <span class="text-sm font-mono font-black text-cyan-300">{{ formatNum(item.cost) }}</span>
              <button @click="removeShopCart(shopCart.length - 1 - idx)"
                      class="text-[9px] text-red-500/50 hover:text-red-400 opacity-0 group-hover:opacity-100 uppercase font-black transition-all">✕</button>
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
              <div class="relative bg-[#0d1525] flex items-center justify-between gap-4 p-4 md:p-5 border border-slate-700/30 hover:border-cyan-500/30 w-full transition-colors"
                   @touchstart="tsStart($event, idx)"
                   @touchmove="tsMove($event, idx)"
                   @touchend="tsEnd(idx)"
                   :style="getSwipeStyle(idx)">
                <div v-if="item.event && item.event !== 'none'" class="absolute top-0 left-0 w-1 h-full bg-emerald-500/50 rounded-l"></div>
                <div class="flex-1 min-w-[50%]">
                  <div class="text-sm font-bold text-slate-100 line-clamp-1 pr-2 leading-snug">{{ item.mult }}× {{ t(item.tKey) }}</div>
                  <div class="flex flex-wrap gap-1.5 mt-2">
                    <span v-if="item.tier !== 'none'"
                          class="text-[10px] font-black uppercase px-2 py-0.5 rounded border flex items-center gap-1"
                          :class="getTierBadgeClass(item.tier)">
                      {{ getTierDisplayName(item.tKey, item.tier) }}
                      <span v-if="getTierSuffix(item.tKey, item.tier)" class="opacity-80">{{ getTierSuffix(item.tKey, item.tier) }}</span>
                    </span>
                    <span v-if="item.duration !== 'base'"
                          class="text-[10px] font-black text-cyan-300 uppercase px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded">{{ item.duration }}</span>
                    <span v-if="item.event && item.event !== 'none'"
                          class="text-[10px] font-black text-emerald-300 uppercase px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center gap-1">
                      {{ getEventInfo(item.event)?.icon }} {{ t(getEventInfo(item.event)?.label) }}
                    </span>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-1 flex-shrink-0">
                  <span class="text-base md:text-lg font-black text-cyan-300 font-mono tracking-tighter">{{ formatNum(item.cost) }}</span>
                  <span class="text-[10px] text-slate-500 font-mono">{{ formatNum(item.unitCost) }} / ud</span>
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
  min-height: calc(100vh - 56px);
}

.shop-sidebar-left {
  width: 240px;
  position: sticky;
  top: 56px;
  height: calc(100vh - 56px);
  border-right: 1px solid rgba(255, 255, 255, 0.04);
  background: rgba(3, 5, 7, 0.96);
  backdrop-filter: blur(20px);
  z-index: 30;
  background-image: repeating-linear-gradient(
    0deg, transparent, transparent 3px,
    rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px
  );
}

.shop-sidebar-right {
  width: 280px;
  position: sticky;
  top: 56px;
  height: calc(100vh - 56px);
  border-left: 1px solid rgba(255, 255, 255, 0.04);
  background: rgba(3, 5, 7, 0.96);
  backdrop-filter: blur(20px);
  z-index: 30;
}

.sidebar-scrollable, .cart-sticky-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 1.25rem;
}

.shop-main-content { flex: 1; min-width: 0; }

/* ─── MOBILE EVENT BAR ─── */
.mobile-event-bar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.mobile-evt-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  color: #9ca3af;
  font-family: monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: all 0.2s;
}
.mobile-evt-active {
  background: rgba(6, 182, 212, 0.08);
  border-color: rgba(6, 182, 212, 0.3);
  color: #22d3ee;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px -4px rgba(6, 182, 212, 0.15);
}

/* ─── PRODUCT CARDS ─── */
.card-highlight {
  border-color: rgba(34, 197, 94, 0.25) !important;
  background-color: rgba(34, 197, 94, 0.025);
}
.just-added { animation: flashAdd 0.8s ease-out; }
@keyframes flashAdd {
  0%   { border-color: rgba(6, 182, 212, 0.55); box-shadow: 0 0 10px rgba(6,182,212,0.25); }
  100% { border-color: rgba(51, 65, 85, 0.2); box-shadow: none; }
}

/* ─── SIDEBAR ELEMENTS ─── */
.section-label {
  font-family: monospace;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  color: #9ca3af;
  letter-spacing: 0.15em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-btn, .cat-btn {
  width: 100%;
  display: flex;
  align-items: center;
  text-align: left;
  padding: 8px 10px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: all 0.15s;
  border: 1px solid transparent;
  color: #6b7280;
}
.event-btn:hover, .cat-btn:hover { color: #d1d5db; background: rgba(255,255,255,0.03); }

.event-active {
  background: rgba(6, 182, 212, 0.08);
  border-color: rgba(6, 182, 212, 0.30);
  color: #67e8f9;
}
.cat-active {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.10);
  color: #f1f5f9;
}

.sidebar-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04) 50%, transparent);
  margin: 1.5rem 0;
}

/* ─── CARD CONTROLS ─── */
.qty-input {
  background: transparent;
  border: none;
  color: #fff;
  font-family: monospace;
  font-size: 11px;
  font-weight: 900;
  width: 30px;
  text-align: center;
  outline: none;
}
.btn-discounted {
  border-color: rgba(34, 197, 94, 0.35) !important;
  background-color: rgba(34, 197, 94, 0.06) !important;
}

/* ─── CHECKOUT BTN ─── */
.checkout-btn {
  width: 100%;
  background: rgba(6, 182, 212, 0.15);
  border: 1px solid rgba(6, 182, 212, 0.35);
  color: #22d3ee;
  font-family: monospace;
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  border-radius: 6px;
  padding: 11px;
  transition: all 0.2s;
}
.checkout-btn:hover {
  background: rgba(6, 182, 212, 0.25);
  border-color: rgba(6, 182, 212, 0.55);
  box-shadow: 0 0 16px rgba(6,182,212,0.2);
}

/* ─── GLOWS ─── */
.glow-white { text-shadow: 0 0 20px rgba(255, 255, 255, 0.25); }

/* ─── RESPONSIVE ─── */
@media (max-width: 1440px) { .shop-sidebar-right { display: none; } }
@media (max-width: 1024px) { .shop-sidebar-left { display: none; } }

.custom-scrollbar::-webkit-scrollbar { width: 3px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.04); border-radius: 10px; }
</style>
