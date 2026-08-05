<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useProfiles } from '../composables/useProfiles';
import { SHOP_ITEMS, DM_PACKAGES, DM_EVENT_BONUSES, dmPackageAmount } from '../data/ogame_db';

/**
 * Shopping List V5 - "Event Spotlight" Layout
 * Tre colonne (eventi/categorie · catalogo · carrello sticky).
 * Quando un evento è attivo: banner con conteggio, card correlate in evidenza
 * smeraldo, card non correlate attenuate, pallino sulle categorie coinvolte.
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

// ───── Glifi SVG per item senza immagine ─────────────────────────────────
// Per gli item del catalogo che non hanno un'immagine OGame (es. utility
// in-game) si disegna una tile con glifo vettoriale tintato, coerente col
// resto del sistema: niente placeholder rotti né sole scritte.
const ITEM_GLYPHS = {
    ingame_merchant: {
        paths: ['M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3'],
        tint: 'text-amber-300 bg-amber-500/10 border-amber-400/20'
    },
    ingame_relocate: {
        paths: ['M12 19l9 2-9-18-9 18 9-2zm0 0v-8'],
        tint: 'text-sky-300 bg-sky-500/10 border-sky-400/20'
    },
    _res_amp: {
        paths: ['M13 10V3L4 14h7v7l9-11h-7z'],
        tint: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/20'
    },
    _exp_res_amp: {
        paths: ['M12 19l9 2-9-18-9 18 9-2zm0 0v-8'],
        tint: 'text-sky-300 bg-sky-500/10 border-sky-400/20'
    },
    _exp_computer: {
        paths: ['M9 3v18m6-18v18M3 9h18M3 15h18M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z'],
        tint: 'text-violet-300 bg-violet-500/10 border-violet-400/20'
    },
    _scrap_offer: {
        paths: ['M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'],
        tint: 'text-amber-300 bg-amber-500/10 border-amber-400/20'
    },
    _default: {
        paths: ['M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'],
        tint: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
    }
};
const itemGlyph = (k) => {
    if (ITEM_GLYPHS[k]) return ITEM_GLYPHS[k];
    if (/^res_amp_/.test(k))      return ITEM_GLYPHS._res_amp;
    if (/^exp_res_amp_/.test(k))  return ITEM_GLYPHS._exp_res_amp;
    if (k === 'exp_computer')     return ITEM_GLYPHS._exp_computer;
    if (/^scrap_offer_/.test(k))  return ITEM_GLYPHS._scrap_offer;
    return ITEM_GLYPHS._default;
};

// State
const shopCart = ref([]);
const cartDrawerOpen = ref(false);
const clearCartConfirmOpen = ref(false);
const activeCategory = ref(SHOP_ITEMS.categories[0].id);
const activeDiscountEvent = ref('none');
const isMounted = ref(false);
const lastAddedId = ref(null);

// ── Selettore Tagli di MO (pacchetti Materia Oscura) ──────────────────────
// Riferimento in cima alla lista: mostra quanta MO rende ogni taglio in €,
// con gli stessi bonus del Pack Exchange (bonus evento + bonus pagamento PayPal).
const dmPanelOpen = ref(false);
const dmEventBonus = ref(0);
const dmPaymentBonus = ref(true);
const dmPackages = computed(() =>
    DM_PACKAGES.map(pkg => {
        const amount = dmPackageAmount(pkg, { paymentBonus: dmPaymentBonus.value, eventBonus: dmEventBonus.value });
        return {
            cost: pkg.cost,
            base: pkg.amount,
            amount,
            perEuro: Math.floor(amount / pkg.cost),
            gain: amount - pkg.amount
        };
    })
);

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

// ───── Eventi sconto ──────────────────────────────────────────────────────
// Icone vettoriali coerenti (outline 24×24) al posto delle emoji di
// piattaforma: stesso peso visivo su ogni OS.
const DISCOUNT_EVENTS = [
    { id: 'none',         label: 'shop_event_none',         paths: ['M6 18L18 6M6 6l12 12'] },
    { id: 'discount',     label: 'shop_event_discount',     paths: ['M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'] },
    { id: 'discount_20',  label: 'shop_event_discount_20',  paths: ['M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z', 'M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z'] },
    { id: 'boosters',     label: 'shop_event_boosters',     paths: ['M13 10V3L4 14h7v7l9-11h-7z'] },
    { id: 'resources',    label: 'shop_event_resources',    paths: ['M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'] },
    { id: 'classes',      label: 'shop_event_classes',      paths: ['M12 14l9-5-9-5-9 5 9 5z', 'M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222'] },
    { id: 'platinum',     label: 'shop_event_platinum',     paths: ['M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'] },
    { id: 'construction', label: 'shop_event_construction', paths: ['M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'] },
    { id: 'cashback',     label: 'shop_event_cashback',     paths: ['M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z'] },
    { id: 'merchant',     label: 'shop_event_merchant',     paths: ['M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3'] },
    { id: 'relocate',     label: 'shop_event_relocate',     paths: ['M12 19l9 2-9-18-9 18 9-2zm0 0v-8'] },
    { id: 'slots',        label: 'shop_event_slots',        paths: ['M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z'] },
    { id: 'expedition',   label: 'shop_event_expedition',   paths: ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'] },
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
    if (eventId === 'platinum') {
        if (tier === 'platinum') return true;
        if (String(itemKey).startsWith('res_package_')) return true;
        if (String(itemKey).startsWith('class_') || (String(itemKey).startsWith('staff_') && itemKey !== 'staff_command')) return true;
        if (['booster_metal', 'booster_crystal', 'booster_deut'].includes(itemKey) && tier !== 'bronze') return true;
        if (itemKey === 'fields_planet' || itemKey === 'fields_moon' || itemKey === 'moons') return true;
        if (itemKey === 'booster_energy' && tier !== 'bronze') return true;
        if (itemKey === 'slot_fleet' || itemKey === 'slot_expedition') return true;
    }
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

// "Correlato all'evento" è più ampio di "scontato": l'evento Costruzioni non
// applica sconti ma rende disponibile la categoria → i suoi item vanno
// comunque messi in evidenza.
const isItemEventRelated = (itemKey, costs) => {
    if (activeDiscountEvent.value === 'none') return false;
    if (isItemHighlighted(itemKey, costs)) return true;
    if (activeDiscountEvent.value === 'construction' && SHOP_ITEMS.items[itemKey]?.cat === 'construction') return true;
    return false;
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
    if (eventId === 'platinum') {
        if (tier === 'platinum') return 0.8;
        if (String(itemKey).startsWith('res_package_')) return 0.8;
        if (String(itemKey).startsWith('class_') || (String(itemKey).startsWith('staff_') && itemKey !== 'staff_command')) return 0.8;
        if (['booster_metal', 'booster_crystal', 'booster_deut'].includes(itemKey) && tier !== 'bronze') return 0.8;
        if (itemKey === 'fields_planet' || itemKey === 'fields_moon' || itemKey === 'moons') return 0.8;
        if (itemKey === 'booster_energy' && tier !== 'bronze') return 0.8;
        if (itemKey === 'slot_fleet' || itemKey === 'slot_expedition') return 0.8;
    }
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

const stepQty = (key, delta) => {
    itemQuantities[key] = Math.max(1, (parseInt(itemQuantities[key]) || 1) + delta);
};

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
                { blockKey: 'boost-resamp', titleKey: 'shop_boosters_sub_resamp', items: ['res_amp_15','res_amp_20','res_amp_25','res_amp_30','res_amp_40'].map(pair) },
            ];
        } else if (cat.id === 'construction') {
            blocks = [
                { blockKey: 'cons-std', titleKey: 'shop_construction_sub_standard', items: ['kraken','detroid','newtron'].map(pair) },
                { blockKey: 'cons-life', titleKey: 'shop_construction_sub_lifeforms', items: ['kraken_lifeforms','detroid_lifeforms','newtron_lifeforms'].map(pair) },
            ];
        } else if (cat.id === 'expedition') {
            blocks = [
                { blockKey: 'exp-delay', titleKey: 'shop_expedition_sub_delay', items: ['exp_delay_50','exp_delay_75','exp_delay_100'].map(pair) },
                { blockKey: 'exp-resamp', titleKey: 'shop_expedition_sub_resamp', items: ['exp_res_amp_10','exp_res_amp_15','exp_res_amp_20','exp_res_amp_25','exp_res_amp_30','exp_res_amp_35','exp_res_amp_40'].map(pair) },
                { blockKey: 'exp-computer', titleKey: 'shop_expedition_sub_computer', items: ['exp_computer'].map(pair) },
            ];
        } else {
            const flat = {};
            for (const [k, v] of Object.entries(SHOP_ITEMS.items)) if (v.cat === cat.id) flat[k] = v;
            blocks = [{ blockKey: 'flat', titleKey: null, items: Object.entries(flat).map(([k, v]) => ({ key: k, val: v })) }];
        }

        // Bubbling: gli item correlati all'evento attivo salgono in testa al blocco
        blocks = blocks.map(b => {
            const sortedItems = [...b.items].sort((a, b) => {
                const aH = isItemEventRelated(a.key, a.val.costs);
                const bH = isItemEventRelated(b.key, b.val.costs);
                if (aH && !bH) return -1;
                if (!aH && bH) return 1;
                return 0;
            });
            return { ...b, items: sortedItems };
        });

        return { id: cat.id, name: cat.name, blocks };
    });
});

// ───── Evidenza evento: conteggi e dimming ────────────────────────────────
// Numero di item correlati all'evento attivo (per il banner) e mappa delle
// categorie che ne contengono (per il pallino nella nav).
const eventRelatedCount = computed(() => {
    if (activeDiscountEvent.value === 'none') return 0;
    let n = 0;
    fullCatalog.value.forEach(cat => cat.blocks.forEach(b => b.items.forEach(it => {
        if (isItemEventRelated(it.key, it.val.costs)) n++;
    })));
    return n;
});
const categoryHasEventItems = computed(() => {
    const map = {};
    if (activeDiscountEvent.value === 'none') return map;
    fullCatalog.value.forEach(cat => {
        map[cat.id] = cat.blocks.some(b => b.items.some(it => isItemEventRelated(it.key, it.val.costs)));
    });
    return map;
});
// Attenua le card non correlate solo se l'evento ha bersagli puntuali
// (il cashback vale su tutto → nessun dimming).
const shouldDimUnrelated = computed(() =>
    activeDiscountEvent.value !== 'none' && eventRelatedCount.value > 0
);

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
    setTimeout(() => { lastAddedId.value = null; }, 1200);
};

// Modifica quantità direttamente dal carrello: ricalcola costo e cashback
// dal prezzo unitario (fallback per carrelli salvati senza unitCost).
const stepCartQty = (item, delta) => {
    const unit = item.unitCost ?? Math.round(item.cost / Math.max(1, item.mult));
    const newMult = item.mult + delta;
    if (newMult <= 0) { removeCartItem(item); return; }
    item.mult = newMult;
    item.unitCost = unit;
    item.cost = unit * newMult;
    item.cashback = (item.event === 'cashback' ? Math.floor(unit * 0.2) : 0) * newMult;
};

const removeCartItem = (item) => {
    const idx = shopCart.value.indexOf(item);
    if (idx >= 0) shopCart.value.splice(idx, 1);
};
const removeShopCart = (idx) => shopCart.value.splice(idx, 1);
const clearCart = () => { shopCart.value = []; };
const requestClearCart = () => { clearCartConfirmOpen.value = true; };
const doClearCart = () => { clearCart(); clearCartConfirmOpen.value = false; };

const totalShopCartMO = computed(() => shopCart.value.reduce((s, i) => s + i.cost, 0));
const totalShopCartCashback = computed(() => shopCart.value.reduce((s, i) => s + (i.cashback || 0), 0));
const cartTotalQty = computed(() => shopCart.value.reduce((s, i) => s + i.mult, 0));
const reversedCart = computed(() => [...shopCart.value].reverse());

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
    return 'bg-ogame-accent/10 text-ogame-accent border-ogame-accent/25';
};
const getTierDotClass = (tier) => {
    if (tier === 'platinum') return 'bg-violet-400';
    if (tier === 'gold')     return 'bg-amber-400';
    if (tier === 'silver')   return 'bg-slate-400';
    if (tier === 'bronze')   return 'bg-orange-400';
    return 'bg-ogame-accent';
};

// ───── Ricerca per nome ───────────────────────────────────────────────────────
const searchQuery = ref('');

const searchResults = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    if (!q) return null;
    return Object.entries(SHOP_ITEMS.items)
        .filter(([key]) => t(key).toLowerCase().includes(q))
        .map(([key, val]) => ({ key, val }));
});

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
            {{ t('lbl_active_events') }}
          </label>
          <div class="event-nav space-y-1 mt-3">
            <button
              v-for="evt in DISCOUNT_EVENTS" :key="evt.id"
              type="button"
              @click="activeDiscountEvent = evt.id"
              class="event-btn"
              :class="{ 'event-active': activeDiscountEvent === evt.id }"
            >
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path v-for="(p, i) in evt.paths" :key="i" stroke-linecap="round" stroke-linejoin="round" :d="p"/>
              </svg>
              <span class="btn-label">{{ t(evt.label) }}</span>
            </button>
          </div>
        </div>

        <div class="sidebar-divider"></div>

        <!-- Search Section -->
        <div class="sidebar-section">
          <label class="section-label">
            <svg class="w-3 h-3 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            {{ t('shop_search_placeholder').replace('...', '') }}
          </label>
          <div class="relative mt-3">
            <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input
              v-model="searchQuery"
              type="search"
              :placeholder="t('shop_search_placeholder')"
              :aria-label="t('shop_search_placeholder')"
              class="shop-search-input w-full pl-8 pr-7 py-2 text-[11px] text-slate-300 bg-black/40 border border-slate-700/40 rounded-lg focus:outline-none focus:border-ogame-accent/50 focus:bg-black/60 placeholder-slate-500 transition-colors"
            />
            <button v-if="searchQuery" @click="searchQuery = ''"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    :aria-label="t('shop_search_clear')">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div class="sidebar-divider"></div>

        <!-- Categories Section -->
        <div class="sidebar-section">
          <label class="section-label">{{ t('lbl_categories') }}</label>
          <div class="cat-nav space-y-1 mt-3">
            <button
              v-for="cat in visibleCategories" :key="cat.id"
              type="button"
              @click="scrollToCategory(cat.id)"
              class="cat-btn"
              :class="{ 'cat-active': activeCategory === cat.id }"
            >
              <span class="flex-1 text-left truncate">{{ t(cat.name) }}</span>
              <span v-if="categoryHasEventItems[cat.id]"
                    class="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"
                    :title="t(getEventInfo(activeDiscountEvent)?.label)"></span>
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
                <span class="text-[10px] font-black uppercase tracking-widest text-cyan-500/60">{{ t('lbl_active_events') }}</span>
              </div>
              <div class="mobile-event-bar flex gap-2 overflow-x-auto pb-6 pt-2 px-1 custom-scrollbar no-scrollbar -ml-1">
                <button
                  v-for="evt in DISCOUNT_EVENTS" :key="evt.id"
                  @click="activeDiscountEvent = evt.id"
                  class="mobile-evt-btn shrink-0"
                  :class="{ 'mobile-evt-active': activeDiscountEvent === evt.id }"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <path v-for="(p, i) in evt.paths" :key="i" stroke-linecap="round" stroke-linejoin="round" :d="p"/>
                  </svg>
                  <span class="text-[10px] font-bold whitespace-nowrap">{{ t(evt.label) }}</span>
                </button>
              </div>
            </div>

            <!-- Categorie -->
            <div>
              <div class="flex items-center gap-2 mb-3 mt-1">
                <svg class="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                <span class="text-[10px] font-black uppercase tracking-widest text-cyan-500/60">{{ t('lbl_categories') }}</span>
              </div>
              <div class="mobile-event-bar flex gap-2 overflow-x-auto pb-6 pt-2 px-1 custom-scrollbar no-scrollbar -ml-1">
                <button
                  v-for="cat in visibleCategories" :key="cat.id"
                  @click="scrollToCategory(cat.id)"
                  class="shrink-0 py-2.5 px-4 flex items-center justify-center gap-1.5 rounded-xl border transition-all text-[11px] font-bold whitespace-nowrap"
                  :class="activeCategory === cat.id ? 'bg-ogame-accent/15 border-ogame-accent/40 text-ogame-accent shadow-[0_10px_20px_-5px_rgba(0,240,255,0.15)]' : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'"
                >
                  {{ t(cat.name) }}
                  <span v-if="categoryHasEventItems[cat.id]" class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </button>
              </div>
            </div>
        </div>
      </div>

      <!-- Page Title Area -->
      <div class="catalog-header px-4 md:px-10 pt-8 pb-4">
        <h1 class="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white">{{ t('shopping_title') }}</h1>
        <div class="mt-2 h-[2px] w-16 bg-gradient-to-r from-purple-500 to-transparent rounded-full"></div>
        <!-- Ricerca visibile solo su mobile; desktop usa il sidebar -->
        <div class="relative mt-4 max-w-xs lg:hidden">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input
            v-model="searchQuery"
            type="search"
            :placeholder="t('shop_search_placeholder')"
            :aria-label="t('shop_search_placeholder')"
            class="shop-search-input w-full pl-9 pr-8 py-2 text-sm text-slate-300 bg-black/40 border border-slate-700/40 rounded-lg focus:outline-none focus:border-ogame-accent/50 focus:bg-black/60 placeholder-slate-500 transition-colors"
          />
          <button v-if="searchQuery" @click="searchQuery = ''"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  :aria-label="t('shop_search_no_results')">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      <!-- Selettore Tagli di MO (pacchetti Materia Oscura) -->
      <div class="px-4 md:px-10 pb-2">
        <div class="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] overflow-hidden">
          <button type="button" @click="dmPanelOpen = !dmPanelOpen"
                  class="w-full flex items-center gap-3 px-4 py-3 text-left"
                  :aria-expanded="dmPanelOpen">
            <div class="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-400/25 flex items-center justify-center text-violet-300 flex-shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 1v-1m0 0c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[11px] font-black uppercase tracking-widest text-violet-200">{{ t('shop_mo_packages_title') }}</div>
              <div class="text-[10px] text-slate-500 mt-0.5">{{ t('shop_mo_packages_sub') }}</div>
            </div>
            <svg class="w-4 h-4 text-slate-500 transition-transform flex-shrink-0" :class="dmPanelOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>

          <div v-if="dmPanelOpen" class="px-4 pb-4 border-t border-violet-500/10 pt-3">
            <!-- Controlli bonus -->
            <div class="flex flex-col sm:flex-row sm:items-end gap-3 mb-3">
              <div class="flex-1 min-w-0">
                <div class="text-[9px] text-slate-600 uppercase tracking-widest font-semibold mb-1.5">{{ t('lbl_event_bonus') }}</div>
                <div class="flex flex-wrap gap-1">
                  <button v-for="b in DM_EVENT_BONUSES" :key="b" @click="dmEventBonus = b"
                          class="px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-all border"
                          :class="dmEventBonus === b ? 'bg-amber-500/15 border-amber-400/35 text-amber-200' : 'text-slate-500 hover:text-slate-300 border-transparent'">
                    <template v-if="b === 0">–</template><template v-else>+{{ b }}%</template>
                  </button>
                </div>
              </div>
              <label class="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
                <input type="checkbox" v-model="dmPaymentBonus" class="w-4 h-4 accent-violet-500 rounded" />
                <span class="text-[11px] font-medium text-slate-300">{{ t('lbl_payment_bonus') }}</span>
                <span class="hidden sm:inline text-[9px] text-violet-400/50 font-mono">PayPal · Carta · Amazon</span>
              </label>
            </div>

            <!-- Griglia tagli -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <div v-for="pkg in dmPackages" :key="pkg.cost"
                   class="rounded-xl border border-slate-700/25 bg-black/30 px-3 py-2.5 flex flex-col">
                <div class="text-[13px] font-black text-slate-200">{{ pkg.cost }} €</div>
                <div class="text-sm font-black font-mono text-violet-200 mt-1 leading-none">{{ formatNum(pkg.amount) }}<span class="text-[9px] opacity-50 ml-0.5">MO</span></div>
                <div class="text-[9px] text-slate-500 font-mono mt-1">{{ formatNum(pkg.perEuro) }} MO/€</div>
                <div v-if="pkg.gain > 0" class="text-[9px] text-emerald-400/70 font-mono mt-0.5">+{{ formatNum(pkg.gain) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Banner evento attivo -->
      <div v-if="activeDiscountEvent !== 'none'" class="px-4 md:px-10 mt-2">
        <div class="event-banner flex items-center gap-3 md:gap-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.05] px-4 py-3">
          <div class="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-300 flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path v-for="(p, i) in getEventInfo(activeDiscountEvent).paths" :key="i" stroke-linecap="round" stroke-linejoin="round" :d="p"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold text-emerald-200 leading-tight truncate">{{ t(getEventInfo(activeDiscountEvent).label) }}</div>
            <div class="text-[11px] text-emerald-400/70 mt-0.5">
              <template v-if="activeDiscountEvent === 'cashback'">{{ t('shop_event_cashback_note') }}</template>
              <template v-else-if="eventRelatedCount > 0">{{ eventRelatedCount }} {{ t('shop_items_on_sale') }}</template>
            </div>
          </div>
          <button @click="activeDiscountEvent = 'none'"
                  class="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-emerald-300/70 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors flex-shrink-0">
            {{ t('shop_event_clear') }}
          </button>
        </div>
      </div>

      <!-- Catalog Grid -->
      <div class="catalog-sections px-4 md:px-10 pb-20 space-y-12 mt-6">

        <!-- ── Risultati ricerca ── -->
        <template v-if="searchResults !== null">
          <div v-if="searchResults.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
            <svg class="w-12 h-12 mb-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <span class="text-[10px] uppercase font-black tracking-widest text-slate-600">{{ t('shop_search_no_results') }}</span>
          </div>
          <div v-else>
            <div class="section-divider flex items-center gap-3 mb-6">
              <span class="w-[2px] h-4 bg-ogame-accent/40 rounded-full flex-shrink-0"></span>
              <span class="text-[9px] font-black uppercase tracking-[0.25em] text-ogame-accent/60 font-mono">{{ searchResults.length }} {{ t('shop_search_results') }}</span>
              <div class="h-px flex-1 bg-gradient-to-r from-ogame-accent/10 to-transparent"></div>
            </div>
            <div class="product-grid grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-2 md:gap-4">
              <article
                v-for="entry in searchResults" :key="entry.key"
                class="product-card relative flex flex-col overflow-hidden rounded-xl bg-ogame-panel border border-slate-700/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]"
                :class="{
                  'card-highlight': isItemEventRelated(entry.key, entry.val.costs),
                  'card-muted': shouldDimUnrelated && !isItemEventRelated(entry.key, entry.val.costs),
                  'just-added': lastAddedId === entry.key
                }"
              >
                <div class="relative flex items-center justify-center h-[80px] md:h-[108px] bg-black/30 border-b border-slate-700/15 overflow-hidden group">
                  <img v-if="shopItemImageSrc(entry.key)" :src="shopItemImageSrc(entry.key)" :alt="t(entry.key)" class="h-[80%] w-[80%] object-contain drop-shadow-lg transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                  <div v-else class="glyph-tile w-14 h-14 md:w-16 md:h-16 rounded-2xl border flex items-center justify-center transition-transform duration-500 group-hover:scale-110" :class="itemGlyph(entry.key).tint">
                    <svg class="w-7 h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path v-for="(p, i) in itemGlyph(entry.key).paths" :key="i" stroke-linecap="round" stroke-linejoin="round" :d="p"/>
                    </svg>
                  </div>
                  <div v-if="isItemEventRelated(entry.key, entry.val.costs)" class="absolute top-1.5 right-1.5 flex items-center gap-1 bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 rounded-md leading-none shadow-sm">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path v-for="(p, i) in getEventInfo(activeDiscountEvent).paths" :key="i" stroke-linecap="round" stroke-linejoin="round" :d="p"/></svg>
                    <template v-if="getBestDiscountPctForCard(entry.key, entry.val.costs) > 0">–{{ getBestDiscountPctForCard(entry.key, entry.val.costs) }}%</template>
                  </div>
                </div>
                <div class="px-3 pt-3 pb-1.5">
                  <h4 class="text-xs font-black uppercase tracking-wider text-slate-300 leading-snug line-clamp-2 min-h-[2.5em]">{{ t(entry.key) }}</h4>
                </div>
                <div class="px-3 pb-2">
                  <div class="inline-flex items-center gap-0.5 bg-black/40 rounded-lg border border-slate-700/20 p-0.5">
                    <button @click="stepQty(entry.key, -1)" :aria-label="t('shop_label_qty') + ' −1'" class="qty-step" :disabled="(itemQuantities[entry.key] || 1) <= 1">−</button>
                    <input type="number" v-model.number="itemQuantities[entry.key]" min="1" :id="'qty-s-' + entry.key" :name="'qty-s-' + entry.key" :aria-label="t('shop_label_qty') + ' ' + t(entry.key)" class="qty-input" />
                    <button @click="stepQty(entry.key, 1)" :aria-label="t('shop_label_qty') + ' +1'" class="qty-step">+</button>
                  </div>
                </div>
                <div class="px-3 pb-3 space-y-1.5 mt-auto">
                  <div v-for="[tierName, durations] in TIER_DISPLAY_ORDER.filter(tk => entry.val.costs && entry.val.costs[tk]).map(tk => [tk, entry.val.costs[tk]])" :key="tierName">
                    <div v-if="Object.keys(durations).length > 1" class="flex p-0.5 mb-1.5 bg-black/50 rounded-lg border border-slate-700/15">
                      <button v-for="(_, dur) in durations" :key="dur" @click="selectedDurations[`${entry.key}_${tierName}`] = dur" class="flex-1 text-[11px] font-black uppercase py-1.5 rounded-md transition-all" :class="selectedDurations[`${entry.key}_${tierName}`] === dur ? 'bg-white/[0.08] text-slate-200' : 'text-slate-600'">{{ dur === 'base' ? 'STD' : dur }}</button>
                    </div>
                    <button @click="addToShopCart(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]])" class="tier-row group/tier w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all duration-150" :class="[getTierColorClass(tierName), isItemDiscounted(entry.key, tierName, activeDiscountEvent) ? 'btn-discounted' : '']" :aria-label="t('shop_btn_add_cart') + ': ' + t(entry.key)">
                      <div class="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
                        <template v-if="tierName !== 'none'">
                          <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="getTierDotClass(tierName)"></span>
                          <span class="text-[11px] font-black uppercase tracking-wide truncate">{{ getTierDisplayName(entry.key, tierName) }}</span>
                          <span v-if="getTierSuffix(entry.key, tierName)" class="inline-flex items-center px-1.5 py-px rounded text-[10px] font-black border flex-shrink-0" :class="getTierBadgeClass(tierName)">{{ getTierSuffix(entry.key, tierName) }}</span>
                        </template>
                        <svg v-else class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 5v14m7-7H5"/></svg>
                      </div>
                      <div class="flex items-center gap-2 flex-shrink-0">
                        <div class="flex flex-col items-end leading-none">
                          <span v-if="getCalculatedCost(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]]) < durations[selectedDurations[`${entry.key}_${tierName}`]]" class="text-[10px] line-through opacity-35 font-mono mb-0.5">{{ formatNum(durations[selectedDurations[`${entry.key}_${tierName}`]]) }}</span>
                          <span class="text-sm font-black font-mono leading-none">{{ formatNum(getCalculatedCost(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]])) }}<span class="text-[9px] opacity-50 font-bold ml-0.5">MO</span></span>
                        </div>
                        <svg class="tier-add-icon w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m7-7H5"/></svg>
                      </div>
                    </button>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </template>

        <!-- ── Catalogo normale ── -->
        <template v-else>
        <div
          v-for="catData in fullCatalog" :key="catData.id"
          :id="'cat-section-' + catData.id"
          class="scroll-mt-[100px]"
        >
          <div class="section-divider flex items-center gap-3 mb-6">
            <span class="w-[2px] h-4 bg-ogame-accent/40 rounded-full flex-shrink-0"></span>
            <h2 class="text-[9px] font-black uppercase tracking-[0.25em] text-ogame-accent/60 font-mono">{{ t(catData.name) }}</h2>
            <div class="h-px flex-1 bg-gradient-to-r from-ogame-accent/10 to-transparent"></div>
          </div>

          <div class="section-blocks space-y-10">
            <div v-for="block in catData.blocks" :key="block.blockKey" class="block-wrap">
              <h3 v-if="block.titleKey" class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-4 pl-1 font-mono">
                {{ t(block.titleKey) }}
              </h3>

              <div class="product-grid grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-2 md:gap-4">
                <article
                  v-for="entry in block.items" :key="entry.key"
                  class="product-card relative flex flex-col overflow-hidden rounded-xl bg-ogame-panel border border-slate-700/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]"
                  :class="{
                    'card-highlight': isItemEventRelated(entry.key, entry.val.costs),
                    'card-muted': shouldDimUnrelated && !isItemEventRelated(entry.key, entry.val.costs),
                    'just-added': lastAddedId === entry.key
                  }"
                >
                  <!-- Image / Glyph -->
                  <div class="relative flex items-center justify-center h-[80px] md:h-[108px] bg-black/30 border-b border-slate-700/15 overflow-hidden group">
                    <img
                      v-if="shopItemImageSrc(entry.key)"
                      :src="shopItemImageSrc(entry.key)"
                      :alt="t(entry.key)"
                      class="h-[80%] w-[80%] object-contain drop-shadow-lg transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div v-else
                         class="glyph-tile w-14 h-14 md:w-16 md:h-16 rounded-2xl border flex items-center justify-center transition-transform duration-500 group-hover:scale-110"
                         :class="itemGlyph(entry.key).tint">
                      <svg class="w-7 h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                        <path v-for="(p, i) in itemGlyph(entry.key).paths" :key="i" stroke-linecap="round" stroke-linejoin="round" :d="p"/>
                      </svg>
                    </div>
                    <div v-if="isItemEventRelated(entry.key, entry.val.costs)"
                         class="absolute top-1.5 right-1.5 flex items-center gap-1 bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 rounded-md leading-none shadow-sm">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path v-for="(p, i) in getEventInfo(activeDiscountEvent).paths" :key="i" stroke-linecap="round" stroke-linejoin="round" :d="p"/>
                      </svg>
                      <template v-if="getBestDiscountPctForCard(entry.key, entry.val.costs) > 0">–{{ getBestDiscountPctForCard(entry.key, entry.val.costs) }}%</template>
                    </div>
                  </div>

                  <!-- Name + Qty stepper -->
                  <div class="px-3 pt-3 pb-1.5">
                    <h4 class="text-xs font-black uppercase tracking-wider text-slate-300 leading-snug line-clamp-2 min-h-[2.5em]">{{ t(entry.key) }}</h4>
                  </div>

                  <div class="px-3 pb-2">
                    <div class="inline-flex items-center gap-0.5 bg-black/40 rounded-lg border border-slate-700/20 p-0.5">
                      <button @click="stepQty(entry.key, -1)" :aria-label="t('shop_label_qty') + ' −1'"
                              class="qty-step" :disabled="(itemQuantities[entry.key] || 1) <= 1">−</button>
                      <input type="number" v-model.number="itemQuantities[entry.key]" min="1"
                             :id="'qty-' + entry.key" :name="'qty-' + entry.key"
                             :aria-label="t('shop_label_qty') + ' ' + t(entry.key)" class="qty-input" />
                      <button @click="stepQty(entry.key, 1)" :aria-label="t('shop_label_qty') + ' +1'"
                              class="qty-step">+</button>
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
                        class="tier-row group/tier w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all duration-150"
                        :class="[getTierColorClass(tierName), isItemDiscounted(entry.key, tierName, activeDiscountEvent) ? 'btn-discounted' : '']"
                        :aria-label="t('shop_btn_add_cart') + ': ' + t(entry.key) + (tierName !== 'none' ? ' ' + getTierDisplayName(entry.key, tierName) : '')"
                      >
                        <div class="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
                          <template v-if="tierName !== 'none'">
                            <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="getTierDotClass(tierName)"></span>
                            <span class="text-[11px] font-black uppercase tracking-wide truncate">{{ getTierDisplayName(entry.key, tierName) }}</span>
                            <span v-if="getTierSuffix(entry.key, tierName)"
                                  class="inline-flex items-center px-1.5 py-px rounded text-[10px] font-black border flex-shrink-0"
                                  :class="getTierBadgeClass(tierName)">
                              {{ getTierSuffix(entry.key, tierName) }}
                            </span>
                          </template>
                          <svg v-else class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 5v14m7-7H5"/></svg>
                        </div>
                        <div class="flex items-center gap-2 flex-shrink-0">
                          <div class="flex flex-col items-end leading-none">
                            <span v-if="getCalculatedCost(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]]) < durations[selectedDurations[`${entry.key}_${tierName}`]]"
                                  class="text-[10px] line-through opacity-35 font-mono mb-0.5">
                              {{ formatNum(durations[selectedDurations[`${entry.key}_${tierName}`]]) }}
                            </span>
                            <span class="text-sm font-black font-mono leading-none">
                              {{ formatNum(getCalculatedCost(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]])) }}<span class="text-[9px] opacity-50 font-bold ml-0.5">MO</span>
                            </span>
                          </div>
                          <svg class="tier-add-icon w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m7-7H5"/></svg>
                        </div>
                      </button>

                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
        </template>

      </div>
    </main>

    <!-- ════ SIDEBAR RIGHT: STICKY CART ════ -->
    <aside class="shop-sidebar-right hidden xl:flex flex-col">
      <div class="cart-sticky-container custom-scrollbar">
        <div class="panel-header flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="relative w-10 h-10 rounded-xl bg-ogame-accent/10 flex items-center justify-center text-ogame-accent border border-ogame-accent/20 shadow-[0_0_15px_rgba(0,240,255,0.08)]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              <span v-if="cartTotalQty > 0" class="absolute -top-1.5 -right-1.5 bg-ogame-accent text-black text-[9px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">{{ cartTotalQty }}</span>
            </div>
            <span class="text-xs font-black uppercase tracking-[0.2em] text-white">{{ t('shopping_cart_title') }}</span>
          </div>
          <button @click="requestClearCart" class="text-[10px] font-bold text-red-500/40 hover:text-red-400 transition-colors uppercase tracking-tighter" v-if="shopCart.length > 0">{{ t('shop_cart_clear') }}</button>
        </div>

        <div class="cart-scroll-area space-y-2">
          <div v-for="item in reversedCart" :key="item.id + item.tier + item.duration + item.event"
               class="group cart-row flex items-start gap-2.5 p-2.5 rounded-xl bg-ogame-surface border border-slate-700/30 hover:border-slate-600/50 transition-all">
            <!-- Thumb -->
            <div class="w-10 h-10 rounded-lg bg-black/40 border border-slate-700/25 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img v-if="shopItemImageSrc(item.tKey)" :src="shopItemImageSrc(item.tKey)" :alt="t(item.tKey)" class="w-[85%] h-[85%] object-contain" loading="lazy" />
              <svg v-else class="w-5 h-5" :class="itemGlyph(item.tKey).tint.split(' ')[0]" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path v-for="(p, i) in itemGlyph(item.tKey).paths" :key="i" stroke-linecap="round" stroke-linejoin="round" :d="p"/>
              </svg>
            </div>

            <div class="flex-1 min-w-0">
              <div class="text-xs font-bold text-slate-100 truncate leading-snug">{{ t(item.tKey) }}</div>
              <div class="flex flex-wrap items-center gap-1 mt-1">
                <span v-if="item.tier !== 'none'" class="inline-flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-px rounded border"
                      :class="getTierBadgeClass(item.tier)">
                  <span class="w-1 h-1 rounded-full" :class="getTierDotClass(item.tier)"></span>
                  {{ getTierDisplayName(item.tKey, item.tier) }}{{ getTierSuffix(item.tKey, item.tier) ? ' ' + getTierSuffix(item.tKey, item.tier) : '' }}
                </span>
                <span v-if="item.duration !== 'base'"
                      class="text-[9px] font-black text-ogame-accent uppercase px-1.5 py-px bg-ogame-accent/10 border border-ogame-accent/20 rounded">{{ item.duration }}</span>
                <span v-if="item.event && item.event !== 'none'"
                      class="inline-flex items-center text-emerald-300 px-1 py-px bg-emerald-500/10 border border-emerald-500/20 rounded"
                      :title="t(getEventInfo(item.event)?.label)">
                  <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path v-for="(p, i) in (getEventInfo(item.event)?.paths || [])" :key="i" stroke-linecap="round" stroke-linejoin="round" :d="p"/>
                  </svg>
                </span>
              </div>
              <!-- Qty stepper -->
              <div class="inline-flex items-center gap-0.5 bg-black/40 rounded-md border border-slate-700/25 p-px mt-1.5">
                <button @click="stepCartQty(item, -1)" class="cart-qty-step" :aria-label="t('shop_label_qty') + ' −1'">−</button>
                <span class="text-[10px] font-black font-mono text-slate-200 min-w-[18px] text-center">{{ item.mult }}</span>
                <button @click="stepCartQty(item, 1)" class="cart-qty-step" :aria-label="t('shop_label_qty') + ' +1'">+</button>
              </div>
            </div>

            <div class="flex flex-col items-end gap-1 flex-shrink-0">
              <span class="text-xs font-mono font-black text-ogame-accent">{{ formatNum(item.cost) }}</span>
              <span v-if="item.mult > 1" class="text-[9px] text-slate-600 font-mono">{{ formatNum(item.unitCost ?? Math.round(item.cost / item.mult)) }} {{ t('shop_list_each') }}</span>
              <button @click="removeCartItem(item)" :aria-label="t('btn_delete')"
                      class="text-red-500/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-0.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>

          <div v-if="shopCart.length === 0" class="flex flex-col items-center justify-center py-12 text-center px-4">
            <svg class="w-12 h-12 mb-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <span class="text-[10px] uppercase font-black tracking-widest text-slate-600">{{ t('shopping_cart_empty') }}</span>
            <span class="text-[10px] text-slate-700 mt-1.5 normal-case leading-relaxed">{{ t('shop_cart_empty_catalog_hint') }}</span>
          </div>
        </div>

        <div v-if="shopCart.length > 0" class="panel-total mt-10 pt-6 border-t border-white/10">
          <div v-if="totalShopCartCashback > 0" class="flex items-center justify-between mb-3 px-2.5 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
            <span class="text-[9px] font-black uppercase text-green-500">{{ t('shopping_cashback') }}</span>
            <span class="text-[11px] font-black text-green-400 font-mono">+{{ formatNum(totalShopCartCashback) }}</span>
          </div>
          <div class="flex items-center justify-between mb-4">
            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{{ t('shopping_total_mo') }}</span>
            <span class="text-2xl font-black text-white glow-white">{{ formatNum(totalShopCartMO) }}</span>
          </div>
          <button @click="cartDrawerOpen = true" class="checkout-btn w-full">
            {{ t('shopping_detail_btn') }}
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile Floating Cart Button -->
    <div class="xl:hidden fixed bottom-6 right-6 z-40">
      <button @click="cartDrawerOpen = true" :aria-label="t('shopping_cart_title')" class="relative bg-ogame-accent text-black p-4 rounded-full shadow-[0_10px_25px_rgba(0,240,255,0.4)] active:scale-95 transition-transform border border-ogame-accent/80">
         <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
         <span v-if="shopCart.length > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-black">{{ cartTotalQty }}</span>
      </button>
    </div>

    <!-- ════ CLEAR CART CONFIRM DIALOG ════ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="clearCartConfirmOpen" class="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="clearCartConfirmOpen = false"></div>
          <div class="bg-ogame-panel border border-white/10 rounded-xl w-full max-w-sm p-7 relative z-10 shadow-2xl">
            <p class="text-white font-semibold text-base mb-2 leading-snug">{{ t('shopping_cart_title') }} — Reset?</p>
            <p class="text-slate-400 text-sm mb-7">{{ t('msg_clear_cart_confirm') }}</p>
            <div class="flex justify-end gap-3">
              <button @click="clearCartConfirmOpen = false"
                      class="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                {{ t('btn_cancel') }}
              </button>
              <button @click="doClearCart"
                      class="px-4 py-2 text-sm font-semibold text-white bg-red-700 hover:bg-red-600 rounded-lg transition-colors">
                {{ t('btn_confirm') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ════ FULL CART DRAWER (Mobile/Desktop Detail) ════ -->
    <Teleport to="body">
      <div v-show="cartDrawerOpen" class="fixed inset-0 z-[100] flex justify-end">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-md" @click="cartDrawerOpen = false" />
        <aside class="relative z-10 w-full max-w-xl bg-ogame-bg border-l border-white/10 flex flex-col shadow-2xl overflow-hidden">
          <div class="header-drawer flex items-center justify-between px-8 py-6 border-b border-white/5 bg-black/40">
            <span class="text-xs font-black uppercase tracking-[0.3em] text-white flex items-center gap-4">
              <svg class="w-5 h-5 text-ogame-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              {{ t('shopping_detail_btn') }}
            </span>
            <button @click="cartDrawerOpen = false" class="p-3 hover:bg-white/5 rounded-full text-slate-500 transition-all"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <div class="flex-1 overflow-y-auto p-4 md:p-8 space-y-3 custom-scrollbar overflow-x-hidden">
            <div v-for="(item, idx) in shopCart" :key="idx" class="relative group overflow-hidden rounded-2xl w-full">
              <!-- Delete background -->
              <div class="absolute inset-0 bg-red-600/90 flex justify-end items-center px-6 cursor-pointer" @click="removeShopCart(idx)">
                <span class="text-xs font-black uppercase text-white mr-2 hidden lg:block">{{ t('btn_delete') }}</span>
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </div>

              <!-- Item container -->
              <div class="relative bg-ogame-panel flex items-center gap-3 md:gap-4 p-4 md:p-5 border border-slate-700/30 hover:border-ogame-accent/30 w-full transition-colors"
                   @touchstart="tsStart($event, idx)"
                   @touchmove="tsMove($event, idx)"
                   @touchend="tsEnd(idx)"
                   :style="getSwipeStyle(idx)">
                <!-- Thumb -->
                <div class="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-black/40 border border-slate-700/25 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img v-if="shopItemImageSrc(item.tKey)" :src="shopItemImageSrc(item.tKey)" :alt="t(item.tKey)" class="w-[85%] h-[85%] object-contain" loading="lazy" />
                  <svg v-else class="w-6 h-6" :class="itemGlyph(item.tKey).tint.split(' ')[0]" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path v-for="(p, i) in itemGlyph(item.tKey).paths" :key="i" stroke-linecap="round" stroke-linejoin="round" :d="p"/>
                  </svg>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="text-sm font-bold text-slate-100 line-clamp-1 pr-2 leading-snug">{{ t(item.tKey) }}</div>
                  <div class="flex flex-wrap gap-1.5 mt-2">
                    <span v-if="item.tier !== 'none'"
                          class="text-[10px] font-black uppercase px-2 py-0.5 rounded border flex items-center gap-1"
                          :class="getTierBadgeClass(item.tier)">
                      <span class="w-1 h-1 rounded-full" :class="getTierDotClass(item.tier)"></span>
                      {{ getTierDisplayName(item.tKey, item.tier) }}
                      <span v-if="getTierSuffix(item.tKey, item.tier)" class="opacity-80">{{ getTierSuffix(item.tKey, item.tier) }}</span>
                    </span>
                    <span v-if="item.duration !== 'base'"
                          class="text-[10px] font-black text-ogame-accent uppercase px-2 py-0.5 bg-ogame-accent/10 border border-ogame-accent/20 rounded">{{ item.duration }}</span>
                    <span v-if="item.event && item.event !== 'none'"
                          class="text-[10px] font-black text-emerald-300 uppercase px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded inline-flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path v-for="(p, i) in (getEventInfo(item.event)?.paths || [])" :key="i" stroke-linecap="round" stroke-linejoin="round" :d="p"/>
                      </svg>
                      {{ t(getEventInfo(item.event)?.label) }}
                    </span>
                  </div>
                  <!-- Qty stepper -->
                  <div class="inline-flex items-center gap-0.5 bg-black/40 rounded-md border border-slate-700/25 p-px mt-2">
                    <button @click="stepCartQty(item, -1)" class="cart-qty-step" :aria-label="t('shop_label_qty') + ' −1'">−</button>
                    <span class="text-[11px] font-black font-mono text-slate-200 min-w-[22px] text-center">{{ item.mult }}</span>
                    <button @click="stepCartQty(item, 1)" class="cart-qty-step" :aria-label="t('shop_label_qty') + ' +1'">+</button>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-1 flex-shrink-0">
                  <span class="text-base md:text-lg font-black text-ogame-accent font-mono tracking-tighter">{{ formatNum(item.cost) }}</span>
                  <span class="text-[10px] text-slate-500 font-mono">{{ formatNum(item.unitCost ?? Math.round(item.cost / Math.max(1, item.mult))) }} {{ t('shop_list_each') }}</span>
                </div>
              </div>
            </div>

            <div v-if="shopCart.length === 0" class="flex flex-col items-center justify-center py-16 text-center px-6">
              <svg class="w-14 h-14 mb-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              <span class="text-[11px] uppercase font-black tracking-widest text-slate-600">{{ t('shopping_cart_empty') }}</span>
              <span class="text-[11px] text-slate-700 mt-2 leading-relaxed">{{ t('shop_cart_empty_catalog_hint') }}</span>
            </div>
          </div>
          <div class="p-6 md:p-10 border-t border-white/10 bg-black/80">
             <div v-if="totalShopCartCashback > 0" class="flex items-center justify-between mb-4 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                <span class="text-[10px] font-black uppercase text-green-500 flex items-center gap-1.5">
                   <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"></path></svg>
                   {{ t('shopping_cashback') }}
                </span>
                <span class="text-xs font-black text-green-400 font-mono tracking-tight">+ {{ formatNum(totalShopCartCashback) }} MO</span>
             </div>
             <div class="flex items-baseline justify-between gap-4 mb-6 md:mb-10 px-2">
                <span class="text-xs font-black text-slate-500 uppercase tracking-widest text-[11px]">{{ t('shopping_order_total') }}</span>
                <span class="text-4xl font-black text-white glow-white tracking-tighter">{{ formatNum(totalShopCartMO) }} <span class="text-sm opacity-40 font-normal">MO</span></span>
             </div>
             <button @click="cartDrawerOpen = false" class="w-full py-4 bg-white text-black text-[11px] font-black uppercase tracking-[0.4em] rounded-2xl hover:bg-ogame-accent transition-all shadow-[0_15px_30px_rgba(0,0,0,0.4)] active:scale-95">{{ t('shopping_save_close') }}</button>
          </div>
        </aside>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
/* ─── SEARCH ─── */
.shop-search-input::-webkit-search-cancel-button { display: none; }

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
  color: theme('colors.slate.400');
  font-family: monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: all 0.2s;
}
.mobile-evt-active {
  background: rgba(0, 240, 255, 0.08);
  border-color: rgba(0, 240, 255, 0.3);
  color: theme('colors.ogame.accent');
  transform: translateY(-2px);
  box-shadow: 0 6px 16px -4px rgba(0, 240, 255, 0.15);
}

/* ─── PRODUCT CARDS ─── */
.card-highlight {
  border-color: rgba(52, 211, 153, 0.40) !important;
  background-color: rgba(52, 211, 153, 0.035);
}
.card-muted {
  opacity: 0.5;
  filter: saturate(0.55);
  transition: opacity 0.2s, filter 0.2s;
}
.card-muted:hover, .card-muted:focus-within {
  opacity: 1;
  filter: none;
}
.just-added { animation: flashAdd 0.8s ease-out; }
@keyframes flashAdd {
  0%   { border-color: rgba(0, 240, 255, 0.55); box-shadow: 0 0 10px rgba(6,182,212,0.25); }
  100% { border-color: rgba(51, 65, 85, 0.2); box-shadow: none; }
}

/* Icona "+" sui tier row: appare all'hover come affordance di aggiunta */
.tier-add-icon { opacity: 0; transition: opacity 0.15s; }
.tier-row:hover .tier-add-icon, .tier-row:focus-visible .tier-add-icon { opacity: 0.7; }

/* ─── SIDEBAR ELEMENTS ─── */
.section-label {
  font-family: monospace;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  color: theme('colors.slate.400');
  letter-spacing: 0.15em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-btn, .cat-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
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
  color: theme('colors.slate.500');
}
.event-btn:hover, .cat-btn:hover { color: theme('colors.slate.300'); background: rgba(255,255,255,0.03); }

.event-active {
  background: rgba(0, 240, 255, 0.08);
  border-color: rgba(0, 240, 255, 0.30);
  color: theme('colors.ogame.accent');
}
.cat-active {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.10);
  color: theme('colors.slate.100');
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
  -moz-appearance: textfield;
  appearance: textfield;
}
.qty-input::-webkit-outer-spin-button, .qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.qty-step {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: theme('colors.slate.400');
  font-size: 13px;
  font-weight: 900;
  line-height: 1;
  transition: all 0.15s;
}
.qty-step:hover:not(:disabled) { background: rgba(255,255,255,0.08); color: #fff; }
.qty-step:disabled { opacity: 0.3; cursor: not-allowed; }

.cart-qty-step {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: theme('colors.slate.400');
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
  transition: all 0.15s;
}
.cart-qty-step:hover { background: rgba(255,255,255,0.08); color: #fff; }

.btn-discounted {
  border-color: rgba(34, 197, 94, 0.35) !important;
  background-color: rgba(34, 197, 94, 0.06) !important;
}

/* ─── CHECKOUT BTN ─── */
.checkout-btn {
  width: 100%;
  background: rgba(0, 240, 255, 0.15);
  border: 1px solid rgba(0, 240, 255, 0.35);
  color: theme('colors.ogame.accent');
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
  background: rgba(0, 240, 255, 0.25);
  border-color: rgba(0, 240, 255, 0.55);
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

@media (prefers-reduced-motion: reduce) {
  .just-added { animation: none; }
  .card-muted { transition: none; }
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
</style>
