<script setup>
import { usePurchaseSettings } from '../composables/usePurchaseSettings';
import PageHead from '../components/PageHead.vue';
import { formatInt } from '../composables/useOgameFormulas';
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useProfiles } from '../composables/useProfiles';
import { useOverlay } from '../composables/useOverlay';
import { SHOP_ITEMS, DM_PACKAGES, DM_EVENT_BONUSES, dmPackageAmount } from '../data/ogame_db';
import { DISCOUNTABLE_NEW_ITEM, getPlatinumEventFactor, getEventDiscountFactor } from '../data/shopDiscounts';

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
    ingame_merchant: 'mercante.png',
    ingame_relocate: 'reloc.png',
    res_amp_15: 'res15.png',
    res_amp_20: 'res20.png',
    res_amp_25: 'res25.png',
    res_amp_30: 'res30.png',
    res_amp_40: 'res40.png',
    exp_res_amp_10: 'expe10.png',
    exp_res_amp_15: 'expe15.png',
    exp_res_amp_20: 'expe20.png',
    exp_res_amp_25: 'expe25.png',
    exp_res_amp_30: 'expe30.png',
    exp_res_amp_35: 'expe35.png',
    exp_res_amp_40: 'expe40.png',
    exp_computer: 'computer.png',
    scrap_offer_77: 'scrap77.jpg',
    scrap_offer_79: 'scrap79.jpg',
    scrap_offer_81: 'scrap81.jpg',
    scrap_offer_83: 'scrap83.jpg',
    scrap_offer_85: 'scrap85.jpg',
};

const shopImgUrl = (f) => f ? `${SHOP_IMG}/${encodeURIComponent(f)}` : null;
const shopItemImageSrc = (k) => shopImgUrl(SHOP_ITEM_IMAGES[k]);

// ───── Glifo SVG di fallback ─────────────────────────────────────────────
// Gli unici item senza immagine OGame sono gli avatar: per loro si disegna
// una tile con glifo vettoriale tintato invece di un placeholder rotto.
const DEFAULT_GLYPH = {
    paths: ['M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'],
    tint: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
};

// State
const shopCart = ref([]);
const cartDrawerOpen = ref(false);
const clearCartConfirmOpen = ref(false);
useOverlay(cartDrawerOpen);
useOverlay(clearCartConfirmOpen);
const activeCategory = ref(SHOP_ITEMS.categories[0].id);
const activeDiscountEvent = ref('none');
const isMounted = ref(false);
const lastAddedId = ref(null);

// ── Selettore Tagli di MO (pacchetti Materia Oscura) ──────────────────────
// Riferimento in cima alla lista: mostra quanta MO rende ogni taglio in €,
// con gli stessi bonus del Pack Exchange (bonus evento + bonus pagamento PayPal).
// Il taglio selezionato alimenta la stima in € del carrello.
const dmPanelOpen = ref(false);
// Bonus evento MO e bonus pagamento: condivisi con Pack Exchange e Planner
const { moBonus: dmEventBonus, paymentBonus: dmPaymentBonus } = usePurchaseSettings();
const dmSelectedCost = ref(null);
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
// Default: il taglio con il miglior rapporto MO/€, finché l'utente non ne sceglie uno.
const dmSelectedPackage = computed(() => {
    const list = dmPackages.value;
    return list.find(p => p.cost === dmSelectedCost.value)
        || list.reduce((best, p) => (!best || p.perEuro > best.perEuro ? p : best), null);
});

// Sync with active profile
watch(activeProfile, (newP) => {
    if (newP && newP.shoppingList) {
        shopCart.value = migrateCartTiers(JSON.parse(JSON.stringify(newP.shoppingList.cart || [])));
        activeDiscountEvent.value = newP.shoppingList.activeEvent || 'none';
    }
}, { immediate: true });

// Gli amplificatori risorse/spedizioni e il computer nascevano con tier "bronzo"
// (etichetta in-game) ma sono item unici: i carrelli salvati vanno riallineati
// al tier "none", altrimenti mostrerebbero ancora il badge Bronzo.
function migrateCartTiers(cart) {
    for (const entry of cart) {
        if (entry.tier !== 'none' && SHOP_ITEMS.items[entry.id]?.tier === 'none') entry.tier = 'none';
    }
    return cart;
}

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
        if (DISCOUNTABLE_NEW_ITEM(itemKey)) return true;
        const item = SHOP_ITEMS.items[itemKey];
        const excludeCats = ['officers_only', 'ingame', 'construction', 'expedition'];
        if (item && !excludeCats.includes(item.cat)) return true;
        return false;
    }
    if (eventId === 'boosters'     && String(itemKey).includes('booster')) return true;
    if (eventId === 'resources'    && String(itemKey).includes('res_package')) return true;
    if (eventId === 'classes'      && (String(itemKey).includes('class_') || (String(itemKey).includes('staff_') && itemKey !== 'staff_command'))) return true;
    if (eventId === 'platinum') return getPlatinumEventFactor(itemKey, tier) < 1;
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

const formatNum = formatInt;
const formatEuro = (n) => new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

// Catalog Filtering & Sorting
const visibleCategories = computed(() =>
    SHOP_ITEMS.categories.filter(c => {
        if (c.id === 'construction') return activeDiscountEvent.value === 'construction';
        // expedition: sempre visibile (amplificatori risorse + computer come gli slot).
        // I soli item di riduzione ritardo restano legati all'evento "turbo spedizioni",
        // gestiti a livello di blocco in fullCatalog.
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
                { blockKey: 'exp-resamp', titleKey: 'shop_expedition_sub_resamp', items: ['exp_res_amp_10','exp_res_amp_15','exp_res_amp_20','exp_res_amp_25','exp_res_amp_30','exp_res_amp_35','exp_res_amp_40'].map(pair) },
                { blockKey: 'exp-computer', titleKey: 'shop_expedition_sub_computer', items: ['exp_computer'].map(pair) },
            ];
            // Riduzione ritardo: solo durante l'evento "turbo spedizioni" (come in origine)
            if (activeDiscountEvent.value === 'expedition') {
                blocks.unshift({ blockKey: 'exp-delay', titleKey: 'shop_expedition_sub_delay', items: ['exp_delay_50','exp_delay_75','exp_delay_100'].map(pair) });
            }
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

// ── Stima in € del carrello ───────────────────────────────────────────────
// Converte il totale MO usando il taglio selezionato nel selettore MO:
// `euro` è il pro-rata esatto, `packs`/`packsEuro` la spesa reale se si
// comprano solo tagli interi di quel tipo.
const cartEuroEstimate = computed(() => {
    const pkg = dmSelectedPackage.value;
    if (!pkg || !pkg.amount || totalShopCartMO.value <= 0) return null;
    const packs = Math.ceil(totalShopCartMO.value / pkg.amount);
    return {
        pkgCost: pkg.cost,
        euro: totalShopCartMO.value * pkg.cost / pkg.amount,
        packs,
        packsEuro: packs * pkg.cost
    };
});

// Tiers & Labels
const TIER_DISPLAY_ORDER = ['platinum', 'gold', 'silver', 'bronze', 'none'];

// ───── Card: una durata per tutta la card (A) o tabella fasce × durate (B) ─────
const cardTiers = (entry) => TIER_DISPLAY_ORDER.filter(tk => entry.val.costs?.[tk]).map(tk => [tk, entry.val.costs[tk]]);
// Durate presenti nelle fasce della card, nell'ordine in cui compaiono
const cardDurations = (entry) => {
    const list = [];
    for (const [, d] of cardTiers(entry)) for (const k of Object.keys(d)) if (!list.includes(k)) list.push(k);
    return list;
};
// Tabella solo quando c'è davvero qualcosa da confrontare: più fasce e più durate
const useMatrix = (entry) => cardTiers(entry).length > 1 && cardDurations(entry).length > 1;
const cardDuration = (entry) => selectedDurations[`${entry.key}_${cardTiers(entry)[0]?.[0]}`];
const setCardDuration = (entry, dur) => {
    for (const [tk, d] of cardTiers(entry)) if (dur in d) selectedDurations[`${entry.key}_${tk}`] = dur;
};
const durLabel = (d) => d === 'base' ? 'STD' : d;

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

const getTierColorClass = () => 'border-ogame-line text-slate-200 hover:border-slate-600';
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
            {{ t('shop_search_placeholder').replace('...', '') }}
          </label>
          <div class="relative mt-3">
            <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input
              v-model="searchQuery"
              type="search"
              :placeholder="t('shop_search_placeholder')"
              :aria-label="t('shop_search_placeholder')"
              class="shop-search-input input-glass w-full pl-8 pr-7 h-9 text-[13px]"
            />
            <button v-if="searchQuery" @click="searchQuery = ''"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
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
      <div class="lg:hidden pt-6 pb-2">
        <div class="flex flex-col gap-4">
            <!-- Eventi -->
            <div>
              <div class="flex items-center gap-2 mb-3">
                <svg class="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                <span class="ov-sh ov-sh-noline" style="--tc:#a78bfa">{{ t('lbl_active_events') }}</span>
              </div>
              <div class="mobile-event-bar flex gap-2 overflow-x-auto pb-6 pt-2 px-1 custom-scrollbar no-scrollbar -ml-1">
                <button
                  v-for="evt in DISCOUNT_EVENTS" :key="evt.id"
                  @click="activeDiscountEvent = evt.id"
                  class="mobile-evt-btn shrink-0"
                  :class="{ 'mobile-evt-active': activeDiscountEvent === evt.id }"
                >
                  <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <path v-for="(p, i) in evt.paths" :key="i" stroke-linecap="round" stroke-linejoin="round" :d="p"/>
                  </svg>
                  <span class="font-medium whitespace-nowrap">{{ t(evt.label) }}</span>
                </button>
              </div>
            </div>

            <!-- Categorie -->
            <div>
              <div class="flex items-center gap-2 mb-3 mt-1">
                <svg class="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                <span class="ov-sh ov-sh-noline" style="--tc:#a78bfa">{{ t('lbl_categories') }}</span>
              </div>
              <div class="mobile-event-bar flex gap-2 overflow-x-auto pb-6 pt-2 px-1 custom-scrollbar no-scrollbar -ml-1">
                <button
                  v-for="cat in visibleCategories" :key="cat.id"
                  @click="scrollToCategory(cat.id)"
                  class="mobile-evt-btn shrink-0 font-medium whitespace-nowrap"
                  :class="activeCategory === cat.id ? 'mobile-evt-active' : ''"
                >
                  {{ t(cat.name) }}
                  <span v-if="categoryHasEventItems[cat.id]" class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </button>
              </div>
            </div>
        </div>
      </div>

      <!-- Page Title Area -->
      <div class="catalog-header pt-6 pb-4">
        <PageHead tool="shopping" :title="t('shopping_title')" :sub="t('card_shopping_desc')" class="!mb-0" />
        <!-- Ricerca visibile solo su mobile; desktop usa il sidebar -->
        <div class="relative mt-4 max-w-xs lg:hidden">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input
            v-model="searchQuery"
            type="search"
            :placeholder="t('shop_search_placeholder')"
            :aria-label="t('shop_search_placeholder')"
            class="shop-search-input w-full pl-9 pr-8 py-2 text-sm text-slate-300 bg-black/40 border border-slate-700/40 rounded-lg focus:outline-none focus:border-ogame-accent/50 focus:bg-black/60 placeholder-slate-500 transition-colors"
          />
          <button v-if="searchQuery" @click="searchQuery = ''"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  :aria-label="t('shop_search_no_results')">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      <!-- Selettore Tagli di MO (pacchetti Materia Oscura) -->
      <div class="pb-2">
        <div class="ov-acc overflow-hidden">
          <button type="button" @click="dmPanelOpen = !dmPanelOpen"
                  class="w-full flex items-center gap-3 px-4 py-3 text-left"
                  :aria-expanded="dmPanelOpen">
            <div class="flex-1 min-w-0">
              <div class="text-[13px] font-semibold text-slate-100">{{ t('shop_mo_packages_title') }}</div>
              <div class="text-[11px] text-slate-400 mt-0.5">{{ t('shop_mo_packages_sub') }}</div>
            </div>
            <svg class="w-4 h-4 text-slate-400 transition-transform flex-shrink-0" :class="dmPanelOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>

          <div v-if="dmPanelOpen" class="px-4 pb-4 border-t border-violet-500/10 pt-3">
            <!-- Controlli bonus -->
            <div class="flex flex-col sm:flex-row sm:items-end gap-3 mb-3">
              <div class="flex-1 min-w-0">
                <div class="ov-label mb-1.5">{{ t('lbl_event_bonus') }}</div>
                <div class="grid grid-cols-4 gap-1">
                  <button v-for="b in DM_EVENT_BONUSES" :key="b" @click="dmEventBonus = b"
                          class="px-1 py-1.5 text-[11px] font-bold rounded-lg transition-colors duration-150 border tabular-nums"
                          :class="dmEventBonus === b ? 'bg-amber-500/15 border-amber-400/35 text-amber-200' : 'text-slate-400 hover:text-slate-300 border-transparent'">
                    <template v-if="b === 0">–</template><template v-else>+{{ b }}%</template>
                  </button>
                </div>
              </div>
              <label class="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
                <input type="checkbox" v-model="dmPaymentBonus" class="w-4 h-4 accent-violet-500 rounded" />
                <span class="text-[11px] font-medium text-slate-300">{{ t('lbl_payment_bonus') }}</span>
                <span class="hidden sm:inline text-[11px] text-violet-400/50 font-mono">PayPal · Carta · Amazon</span>
              </label>
              <p class="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5"><svg class="w-3 h-3 flex-none" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.8 10.2a4 4 0 00-5.6 0l-3 3a4 4 0 005.6 5.6l1.1-1.1m-.7-4.5a4 4 0 005.6 0l3-3a4 4 0 00-5.6-5.6l-1.1 1.1"/></svg>{{ t('shared_purchase_hint') }}</p>
            </div>

            <!-- Griglia tagli: il taglio selezionato guida la stima in € del carrello -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <button v-for="pkg in dmPackages" :key="pkg.cost" type="button"
                      @click="dmSelectedCost = pkg.cost"
                      :aria-pressed="dmSelectedPackage?.cost === pkg.cost"
                      class="rounded-xl border px-3 py-2.5 flex flex-col text-left transition-colors duration-150"
                      :class="dmSelectedPackage?.cost === pkg.cost
                        ? 'border-violet-400/50 bg-violet-500/[0.12]'
                        : 'border-slate-700/25 bg-black/30 hover:border-slate-600/50'">
                <div class="text-[13px] font-bold text-slate-200">{{ pkg.cost }} €</div>
                <div class="text-sm font-bold font-mono text-violet-200 mt-1 leading-none">{{ formatNum(pkg.amount) }}<span class="text-[11px] opacity-50 ml-0.5">MO</span></div>
                <div class="text-[11px] text-slate-400 font-mono mt-1">{{ formatNum(pkg.perEuro) }} MO/€</div>
                <div v-if="pkg.gain > 0" class="text-[11px] text-emerald-400/70 font-mono mt-0.5">+{{ formatNum(pkg.gain) }}</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Banner evento attivo -->
      <div v-if="activeDiscountEvent !== 'none'" class="mt-2">
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
                  class="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-emerald-300/70 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors flex-shrink-0">
            {{ t('shop_event_clear') }}
          </button>
        </div>
      </div>

      <!-- Catalog Grid -->
      <div class="catalog-sections pb-20 space-y-8 mt-5">

        <!-- ── Risultati ricerca ── -->
        <template v-if="searchResults !== null">
          <div v-if="searchResults.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
            <svg class="w-12 h-12 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <span class="text-[11px] uppercase font-bold tracking-widest text-slate-400">{{ t('shop_search_no_results') }}</span>
          </div>
          <div v-else>
            <h2 class="ov-sh mb-4" style="--tc:#a78bfa">{{ searchResults.length }} {{ t('shop_search_results') }}</h2>
            <div class="product-grid grid grid-cols-1 sm:grid-cols-2 gap-3">
              <article
                v-for="entry in searchResults" :key="entry.key"
                class="product-card relative flex flex-col gap-2.5 p-3 rounded-xl bg-ogame-panel border border-ogame-line transition-colors duration-150 hover:border-slate-600"
                :class="{
                  'card-highlight': isItemEventRelated(entry.key, entry.val.costs),
                  'card-muted': shouldDimUnrelated && !isItemEventRelated(entry.key, entry.val.costs),
                  'just-added': lastAddedId === entry.key
                }"
              >
                <!-- Immagine piccola + nome -->
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-12 h-12 rounded-lg bg-ogame-surface border border-ogame-line flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img v-if="shopItemImageSrc(entry.key)" :src="shopItemImageSrc(entry.key)" :alt="t(entry.key)" class="w-[88%] h-[88%] object-contain" loading="lazy" />
                    <svg v-else class="w-6 h-6" :class="DEFAULT_GLYPH.tint.split(' ')[0]" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path v-for="(p, i) in DEFAULT_GLYPH.paths" :key="i" stroke-linecap="round" stroke-linejoin="round" :d="p"/>
                    </svg>
                  </div>
                  <h3 class="flex-1 min-w-0 text-[13px] font-semibold text-slate-100 leading-snug line-clamp-2">{{ t(entry.key) }}</h3>
                  <span v-if="isItemEventRelated(entry.key, entry.val.costs)" class="ov-tag ov-tag-ok flex-shrink-0">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path v-for="(p, i) in getEventInfo(activeDiscountEvent).paths" :key="i" stroke-linecap="round" stroke-linejoin="round" :d="p"/></svg>
                    <template v-if="getBestDiscountPctForCard(entry.key, entry.val.costs) > 0">–{{ getBestDiscountPctForCard(entry.key, entry.val.costs) }}%</template>
                  </span>
                </div>

                                <!-- Quantità + durata unica per tutta la card (variante A) -->
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <div class="inline-flex items-center border border-slate-700 rounded-md">
                    <button @click="stepQty(entry.key, -1)" :aria-label="t('shop_label_qty') + ' −1'" class="qty-step" :disabled="(itemQuantities[entry.key] || 1) <= 1">−</button>
                    <input type="number" v-model.number="itemQuantities[entry.key]" min="1" :id="'qty-s-' + entry.key" :name="'qty-s-' + entry.key" :aria-label="t('shop_label_qty') + ' ' + t(entry.key)" class="qty-input" />
                    <button @click="stepQty(entry.key, 1)" :aria-label="t('shop_label_qty') + ' +1'" class="qty-step">+</button>
                  </div>
                  <div v-if="!useMatrix(entry) && cardDurations(entry).length > 1" class="ov-seg">
                    <button v-for="dur in cardDurations(entry)" :key="dur" type="button" @click="setCardDuration(entry, dur)"
                            :aria-pressed="cardDuration(entry) === dur" class="!py-0.5">{{ durLabel(dur) }}</button>
                  </div>
                </div>

                <!-- Variante B: tabella fasce × durate, un clic sul prezzo lo aggiunge -->
                <table v-if="useMatrix(entry)" class="w-full text-xs tabular-nums mt-auto">
                  <thead>
                    <tr class="font-mono text-[11px] uppercase tracking-[0.08em] text-slate-400">
                      <th class="text-left font-bold pb-1"></th>
                      <th v-for="dur in cardDurations(entry)" :key="dur" class="text-right font-bold pb-1 pl-1">{{ durLabel(dur) }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="[tierName, durations] in cardTiers(entry)" :key="tierName" class="border-t border-ogame-line">
                      <td class="py-1.5 pr-1 whitespace-nowrap">
                        <span class="inline-block w-2 h-2 rounded-full mr-1.5" :class="getTierDotClass(tierName)"></span>
                        <span class="text-slate-200">{{ getTierDisplayName(entry.key, tierName) }}</span>
                        <span v-if="getTierSuffix(entry.key, tierName)" class="text-slate-400 ml-1">{{ getTierSuffix(entry.key, tierName) }}</span>
                      </td>
                      <td v-for="dur in cardDurations(entry)" :key="dur" class="py-1 pl-1 text-right">
                        <button v-if="durations[dur] != null" type="button"
                                @click="addToShopCart(entry.key, tierName, dur, durations[dur])"
                                class="price-cell" :class="isItemDiscounted(entry.key, tierName, activeDiscountEvent) ? 'btn-discounted' : ''"
                                :aria-label="t('shop_btn_add_cart') + ': ' + t(entry.key) + ' ' + getTierDisplayName(entry.key, tierName) + ' ' + durLabel(dur)">
                          <span v-if="getCalculatedCost(entry.key, tierName, dur, durations[dur]) < durations[dur]" class="block text-[11px] line-through text-slate-400 leading-none">{{ formatNum(durations[dur]) }}</span>
                          {{ formatNum(getCalculatedCost(entry.key, tierName, dur, durations[dur])) }}
                        </button>
                        <span v-else class="text-slate-400">—</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- Variante A: una riga per fascia, alla durata scelta -->
                <div v-else class="grid grid-cols-1 gap-1.5 mt-auto min-w-0">
                    <button v-for="[tierName, durations] in cardTiers(entry)" :key="tierName"
                            @click="addToShopCart(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]])"
                            class="tier-row w-full min-w-0 overflow-hidden flex items-center gap-2 px-2.5 py-2 rounded-md border border-ogame-line text-left hover:border-slate-600 hover:bg-white/[0.03] transition-colors duration-150"
                            :class="isItemDiscounted(entry.key, tierName, activeDiscountEvent) ? 'btn-discounted' : ''"
                            :aria-label="t('shop_btn_add_cart') + ': ' + t(entry.key) + (tierName !== 'none' ? ' ' + getTierDisplayName(entry.key, tierName) : '')">
                      <template v-if="tierName !== 'none'">
                        <span class="w-2 h-2 rounded-full flex-shrink-0" :class="getTierDotClass(tierName)"></span>
                        <span class="text-xs text-slate-200 truncate min-w-0">{{ getTierDisplayName(entry.key, tierName) }}</span>
                        <span v-if="getTierSuffix(entry.key, tierName)" class="text-xs text-slate-400 flex-shrink-0">{{ getTierSuffix(entry.key, tierName) }}</span>
                      </template>
                      <span v-else class="text-xs text-slate-400 truncate whitespace-nowrap min-w-0">{{ t('shop_buy') }}</span>
                      <span class="ml-auto flex flex-col items-end leading-tight flex-shrink-0 tabular-nums">
                        <span v-if="getCalculatedCost(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]]) < durations[selectedDurations[`${entry.key}_${tierName}`]]"
                              class="text-[11px] line-through text-slate-400">{{ formatNum(durations[selectedDurations[`${entry.key}_${tierName}`]]) }}</span>
                        <span class="flex items-baseline gap-1">
                        <span class="text-[13px] font-semibold text-slate-100">{{ formatNum(getCalculatedCost(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]])) }}</span>
                        <span class="text-[11px] text-slate-400">MO</span>
                        </span>
                      </span>
                      <svg class="tier-add-icon w-3.5 h-3.5 flex-shrink-0 text-ogame-accent" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m7-7H5"/></svg>
                    </button>
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
          <h2 class="ov-sh mb-4" style="--tc:#a78bfa">{{ t(catData.name) }}</h2>

          <div class="section-blocks space-y-6">
            <div v-for="block in catData.blocks" :key="block.blockKey" class="block-wrap">
              <p v-if="block.titleKey" class="text-[13px] font-semibold text-slate-300 mb-3">
                {{ t(block.titleKey) }}
              </p>

              <div class="product-grid grid grid-cols-1 sm:grid-cols-2 gap-3" :class="block.items.some(useMatrix) ? '' : 'xl:grid-cols-3'">
                <article
                v-for="entry in block.items" :key="entry.key"
                class="product-card relative flex flex-col gap-2.5 p-3 rounded-xl bg-ogame-panel border border-ogame-line transition-colors duration-150 hover:border-slate-600"
                :class="{
                  'card-highlight': isItemEventRelated(entry.key, entry.val.costs),
                  'card-muted': shouldDimUnrelated && !isItemEventRelated(entry.key, entry.val.costs),
                  'just-added': lastAddedId === entry.key
                }"
              >
                <!-- Immagine piccola + nome -->
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-12 h-12 rounded-lg bg-ogame-surface border border-ogame-line flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img v-if="shopItemImageSrc(entry.key)" :src="shopItemImageSrc(entry.key)" :alt="t(entry.key)" class="w-[88%] h-[88%] object-contain" loading="lazy" />
                    <svg v-else class="w-6 h-6" :class="DEFAULT_GLYPH.tint.split(' ')[0]" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path v-for="(p, i) in DEFAULT_GLYPH.paths" :key="i" stroke-linecap="round" stroke-linejoin="round" :d="p"/>
                    </svg>
                  </div>
                  <h3 class="flex-1 min-w-0 text-[13px] font-semibold text-slate-100 leading-snug line-clamp-2">{{ t(entry.key) }}</h3>
                  <span v-if="isItemEventRelated(entry.key, entry.val.costs)" class="ov-tag ov-tag-ok flex-shrink-0">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path v-for="(p, i) in getEventInfo(activeDiscountEvent).paths" :key="i" stroke-linecap="round" stroke-linejoin="round" :d="p"/></svg>
                    <template v-if="getBestDiscountPctForCard(entry.key, entry.val.costs) > 0">–{{ getBestDiscountPctForCard(entry.key, entry.val.costs) }}%</template>
                  </span>
                </div>

                                <!-- Quantità + durata unica per tutta la card (variante A) -->
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <div class="inline-flex items-center border border-slate-700 rounded-md">
                    <button @click="stepQty(entry.key, -1)" :aria-label="t('shop_label_qty') + ' −1'" class="qty-step" :disabled="(itemQuantities[entry.key] || 1) <= 1">−</button>
                    <input type="number" v-model.number="itemQuantities[entry.key]" min="1" :id="'qty-' + entry.key" :name="'qty-' + entry.key" :aria-label="t('shop_label_qty') + ' ' + t(entry.key)" class="qty-input" />
                    <button @click="stepQty(entry.key, 1)" :aria-label="t('shop_label_qty') + ' +1'" class="qty-step">+</button>
                  </div>
                  <div v-if="!useMatrix(entry) && cardDurations(entry).length > 1" class="ov-seg">
                    <button v-for="dur in cardDurations(entry)" :key="dur" type="button" @click="setCardDuration(entry, dur)"
                            :aria-pressed="cardDuration(entry) === dur" class="!py-0.5">{{ durLabel(dur) }}</button>
                  </div>
                </div>

                <!-- Variante B: tabella fasce × durate, un clic sul prezzo lo aggiunge -->
                <table v-if="useMatrix(entry)" class="w-full text-xs tabular-nums mt-auto">
                  <thead>
                    <tr class="font-mono text-[11px] uppercase tracking-[0.08em] text-slate-400">
                      <th class="text-left font-bold pb-1"></th>
                      <th v-for="dur in cardDurations(entry)" :key="dur" class="text-right font-bold pb-1 pl-1">{{ durLabel(dur) }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="[tierName, durations] in cardTiers(entry)" :key="tierName" class="border-t border-ogame-line">
                      <td class="py-1.5 pr-1 whitespace-nowrap">
                        <span class="inline-block w-2 h-2 rounded-full mr-1.5" :class="getTierDotClass(tierName)"></span>
                        <span class="text-slate-200">{{ getTierDisplayName(entry.key, tierName) }}</span>
                        <span v-if="getTierSuffix(entry.key, tierName)" class="text-slate-400 ml-1">{{ getTierSuffix(entry.key, tierName) }}</span>
                      </td>
                      <td v-for="dur in cardDurations(entry)" :key="dur" class="py-1 pl-1 text-right">
                        <button v-if="durations[dur] != null" type="button"
                                @click="addToShopCart(entry.key, tierName, dur, durations[dur])"
                                class="price-cell" :class="isItemDiscounted(entry.key, tierName, activeDiscountEvent) ? 'btn-discounted' : ''"
                                :aria-label="t('shop_btn_add_cart') + ': ' + t(entry.key) + ' ' + getTierDisplayName(entry.key, tierName) + ' ' + durLabel(dur)">
                          <span v-if="getCalculatedCost(entry.key, tierName, dur, durations[dur]) < durations[dur]" class="block text-[11px] line-through text-slate-400 leading-none">{{ formatNum(durations[dur]) }}</span>
                          {{ formatNum(getCalculatedCost(entry.key, tierName, dur, durations[dur])) }}
                        </button>
                        <span v-else class="text-slate-400">—</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- Variante A: una riga per fascia, alla durata scelta -->
                <div v-else class="grid grid-cols-1 gap-1.5 mt-auto min-w-0">
                    <button v-for="[tierName, durations] in cardTiers(entry)" :key="tierName"
                            @click="addToShopCart(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]])"
                            class="tier-row w-full min-w-0 overflow-hidden flex items-center gap-2 px-2.5 py-2 rounded-md border border-ogame-line text-left hover:border-slate-600 hover:bg-white/[0.03] transition-colors duration-150"
                            :class="isItemDiscounted(entry.key, tierName, activeDiscountEvent) ? 'btn-discounted' : ''"
                            :aria-label="t('shop_btn_add_cart') + ': ' + t(entry.key) + (tierName !== 'none' ? ' ' + getTierDisplayName(entry.key, tierName) : '')">
                      <template v-if="tierName !== 'none'">
                        <span class="w-2 h-2 rounded-full flex-shrink-0" :class="getTierDotClass(tierName)"></span>
                        <span class="text-xs text-slate-200 truncate min-w-0">{{ getTierDisplayName(entry.key, tierName) }}</span>
                        <span v-if="getTierSuffix(entry.key, tierName)" class="text-xs text-slate-400 flex-shrink-0">{{ getTierSuffix(entry.key, tierName) }}</span>
                      </template>
                      <span v-else class="text-xs text-slate-400 truncate whitespace-nowrap min-w-0">{{ t('shop_buy') }}</span>
                      <span class="ml-auto flex flex-col items-end leading-tight flex-shrink-0 tabular-nums">
                        <span v-if="getCalculatedCost(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]]) < durations[selectedDurations[`${entry.key}_${tierName}`]]"
                              class="text-[11px] line-through text-slate-400">{{ formatNum(durations[selectedDurations[`${entry.key}_${tierName}`]]) }}</span>
                        <span class="flex items-baseline gap-1">
                        <span class="text-[13px] font-semibold text-slate-100">{{ formatNum(getCalculatedCost(entry.key, tierName, selectedDurations[`${entry.key}_${tierName}`], durations[selectedDurations[`${entry.key}_${tierName}`]])) }}</span>
                        <span class="text-[11px] text-slate-400">MO</span>
                        </span>
                      </span>
                      <svg class="tier-add-icon w-3.5 h-3.5 flex-shrink-0 text-ogame-accent" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m7-7H5"/></svg>
                    </button>
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
    <aside class="shop-sidebar-right flex flex-col">
      <div class="cart-sticky-container">
        <h2 class="ov-sh mb-3 whitespace-nowrap" style="--tc:#a78bfa">
          {{ t('shopping_cart_title') }}<span v-if="cartTotalQty > 0" class="text-slate-100">&nbsp;· {{ cartTotalQty }}</span>
          <span class="ov-sh-r">
            <button v-if="shopCart.length > 0" @click="requestClearCart" class="ov-btn ov-btn-ghost ov-btn-sm hover:!text-rose-300">{{ t('shop_cart_clear') }}</button>
          </span>
        </h2>

        <!-- Totale sopra la lista: leggibile senza dover scorrere il carrello -->
        <div v-if="shopCart.length > 0" class="cart-total-card pb-3 mb-1 flex-shrink-0 border-b border-ogame-line">
          <div class="flex items-baseline justify-between gap-2">
            <span class="ov-stat-k">{{ t('shopping_total_mo') }}</span>
            <span class="text-[11px] font-mono text-slate-400">{{ cartTotalQty }} ×</span>
          </div>
          <div class="mt-1 flex items-baseline gap-1.5">
            <span class="text-[26px] leading-none font-bold tracking-tight text-slate-100 tabular-nums">{{ formatNum(totalShopCartMO) }}</span>
            <span class="text-[11px] font-bold text-slate-400">MO</span>
          </div>

          <!-- Stima in € sul taglio di MO selezionato nel selettore in cima alla pagina -->
          <div v-if="cartEuroEstimate" class="mt-3 pt-3 border-t border-ogame-line">
            <div class="flex items-baseline justify-between gap-2">
              <span class="ov-stat-k">{{ t('shopping_est_cost') }}</span>
              <span class="text-lg leading-none font-bold text-slate-100 tabular-nums">≈ {{ formatEuro(cartEuroEstimate.euro) }} €</span>
            </div>
            <div class="text-[11px] text-slate-400 font-mono mt-1.5 text-right">
              {{ cartEuroEstimate.packs }} × {{ cartEuroEstimate.pkgCost }} € = {{ formatNum(cartEuroEstimate.packsEuro) }} €
            </div>
          </div>

          <div v-if="totalShopCartCashback > 0" class="flex items-center justify-between mt-3 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
            <span class="text-xs font-semibold text-emerald-400">{{ t('shopping_cashback') }}</span>
            <span class="text-xs font-semibold text-emerald-300 tabular-nums">+{{ formatNum(totalShopCartCashback) }}</span>
          </div>

          <button @click="cartDrawerOpen = true" class="ov-btn ov-btn-tint w-full mt-3.5" style="--tc:#a78bfa">
            {{ t('shopping_detail_btn') }}
          </button>
        </div>

        <div class="cart-scroll-area custom-scrollbar">
          <div v-for="item in reversedCart" :key="item.id + item.tier + item.duration + item.event"
               class="group cart-row flex items-start gap-2.5 py-2.5 border-t border-ogame-line">
            <!-- Thumb -->
            <div class="w-10 h-10 rounded-lg bg-black/40 border border-slate-700/25 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img v-if="shopItemImageSrc(item.tKey)" :src="shopItemImageSrc(item.tKey)" :alt="t(item.tKey)" class="w-[85%] h-[85%] object-contain" loading="lazy" />
              <svg v-else class="w-5 h-5" :class="DEFAULT_GLYPH.tint.split(' ')[0]" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path v-for="(p, i) in DEFAULT_GLYPH.paths" :key="i" stroke-linecap="round" stroke-linejoin="round" :d="p"/>
              </svg>
            </div>

            <div class="flex-1 min-w-0">
              <div class="text-xs font-semibold text-slate-100 line-clamp-2 leading-snug" :title="t(item.tKey)">{{ t(item.tKey) }}</div>
              <div class="flex flex-wrap items-center gap-1 mt-1">
                <span v-if="item.tier !== 'none'" class="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-1.5 py-px rounded border"
                      :class="getTierBadgeClass(item.tier)">
                  <span class="w-1.5 h-1.5 rounded-full" :class="getTierDotClass(item.tier)"></span>
                  {{ getTierDisplayName(item.tKey, item.tier) }}{{ getTierSuffix(item.tKey, item.tier) ? ' ' + getTierSuffix(item.tKey, item.tier) : '' }}
                </span>
                <span v-if="item.duration !== 'base'"
                      class="text-[11px] font-bold text-ogame-accent uppercase px-1.5 py-px bg-ogame-accent/10 border border-ogame-accent/20 rounded">{{ item.duration }}</span>
                <span v-if="item.event && item.event !== 'none'"
                      class="inline-flex items-center text-emerald-300 px-1 py-px bg-emerald-500/10 border border-emerald-500/20 rounded"
                      :title="t(getEventInfo(item.event)?.label)">
                  <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path v-for="(p, i) in (getEventInfo(item.event)?.paths || [])" :key="i" stroke-linecap="round" stroke-linejoin="round" :d="p"/>
                  </svg>
                </span>
              </div>
              <!-- Qty stepper -->
              <div class="inline-flex items-center border border-slate-700 rounded-md mt-1.5">
                <button @click="stepCartQty(item, -1)" class="qty-step" :aria-label="t('shop_label_qty') + ' −1'">−</button>
                <span class="text-[13px] font-semibold tabular-nums text-slate-100 min-w-[28px] text-center">{{ item.mult }}</span>
                <button @click="stepCartQty(item, 1)" class="qty-step" :aria-label="t('shop_label_qty') + ' +1'">+</button>
              </div>
            </div>

            <div class="flex flex-col items-end gap-1 flex-shrink-0">
              <span class="text-[13px] font-semibold text-slate-100 tabular-nums">{{ formatNum(item.cost) }}</span>
              <span v-if="item.mult > 1" class="text-[11px] text-slate-400 font-mono">{{ formatNum(item.unitCost ?? Math.round(item.cost / item.mult)) }} {{ t('shop_list_each') }}</span>
              <button @click="removeCartItem(item)" :aria-label="t('btn_delete')"
                      class="text-slate-400 hover:text-rose-400 transition-colors p-0.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>

          <div v-if="shopCart.length === 0" class="flex flex-col items-center justify-center py-12 text-center px-4">
            <svg class="w-12 h-12 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <span class="text-sm font-semibold text-slate-200">{{ t('shopping_cart_empty') }}</span>
            <span class="text-[11px] text-slate-400 mt-1.5 normal-case leading-relaxed">{{ t('shop_cart_empty_catalog_hint') }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Mobile Floating Cart Button -->
    <div class="shop-fab fixed bottom-6 right-6 z-40">
      <button @click="cartDrawerOpen = true" :aria-label="t('shopping_cart_title')" class="relative bg-ogame-accent text-black p-4 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.5)] active:scale-[0.97] transition-transform">
         <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
         <span v-if="shopCart.length > 0" class="absolute -top-1 -right-1 bg-ogame-bg text-slate-100 text-[11px] font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center border border-ogame-accent tabular-nums">{{ cartTotalQty }}</span>
      </button>
    </div>

    <!-- ════ CLEAR CART CONFIRM DIALOG ════ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="clearCartConfirmOpen" class="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div class="absolute inset-0 bg-black/70" @click="clearCartConfirmOpen = false"></div>
          <div class="ov-dialog bg-ogame-panel border border-slate-700 rounded-xl w-full max-w-sm p-6 relative z-10 shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
            <p class="text-slate-100 font-semibold text-base mb-2 leading-snug">{{ t('shop_cart_clear') }}?</p>
            <p class="text-slate-400 text-sm mb-6">{{ t('msg_clear_cart_confirm') }}</p>
            <div class="flex justify-end gap-3">
              <button @click="clearCartConfirmOpen = false" class="ov-btn ov-btn-ghost">
                {{ t('btn_cancel') }}
              </button>
              <button @click="doClearCart" class="ov-btn ov-btn-danger">
                {{ t('btn_confirm') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ════ FULL CART DRAWER (Mobile/Desktop Detail) ════ -->
    <Teleport to="body">
      <Transition name="drawer">
      <div v-if="cartDrawerOpen" class="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true" :aria-label="t('shopping_cart_title')"
          >
        <div class="drawer-backdrop absolute inset-0 bg-black/70" @click="cartDrawerOpen = false" />
        <aside class="drawer-panel relative z-10 w-full max-w-xl bg-ogame-bg border-l border-slate-700 flex flex-col shadow-2xl overflow-hidden">
          <div class="header-drawer flex items-center justify-between px-5 py-4 border-b border-ogame-line">
            <span class="text-[15px] font-semibold text-slate-100">{{ t('shopping_detail_btn') }}</span>
            <button @click="cartDrawerOpen = false" class="ov-btn ov-btn-ghost w-9 px-0" :aria-label="t('pc_close')"><svg class="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-2 custom-scrollbar overflow-x-hidden">
            <div v-for="(item, idx) in shopCart" :key="item.id + item.tier + item.duration + item.event" class="relative group overflow-hidden rounded-lg w-full">
              <!-- Delete background -->
              <div class="absolute inset-0 bg-red-600/90 flex justify-end items-center px-6 cursor-pointer" @click="removeShopCart(idx)">
                <span class="text-xs font-bold uppercase text-white mr-2 hidden lg:block">{{ t('btn_delete') }}</span>
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </div>

              <!-- Item container -->
              <div class="relative bg-ogame-panel flex items-center gap-3 p-3 md:p-4 border border-ogame-line rounded-lg w-full transition-colors"
                   @touchstart="tsStart($event, idx)"
                   @touchmove="tsMove($event, idx)"
                   @touchend="tsEnd(idx)"
                   :style="getSwipeStyle(idx)">
                <!-- Thumb -->
                <div class="w-12 h-12 rounded-lg bg-ogame-surface border border-ogame-line flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img v-if="shopItemImageSrc(item.tKey)" :src="shopItemImageSrc(item.tKey)" :alt="t(item.tKey)" class="w-[85%] h-[85%] object-contain" loading="lazy" />
                  <svg v-else class="w-6 h-6" :class="DEFAULT_GLYPH.tint.split(' ')[0]" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path v-for="(p, i) in DEFAULT_GLYPH.paths" :key="i" stroke-linecap="round" stroke-linejoin="round" :d="p"/>
                  </svg>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold text-slate-100 line-clamp-2 pr-2 leading-snug" :title="t(item.tKey)">{{ t(item.tKey) }}</div>
                  <div class="flex flex-wrap gap-1.5 mt-2">
                    <span v-if="item.tier !== 'none'"
                          class="ov-tag ov-tag-mute">
                      <span class="w-1 h-1 rounded-full" :class="getTierDotClass(item.tier)"></span>
                      {{ getTierDisplayName(item.tKey, item.tier) }}
                      <span v-if="getTierSuffix(item.tKey, item.tier)" class="opacity-80">{{ getTierSuffix(item.tKey, item.tier) }}</span>
                    </span>
                    <span v-if="item.duration !== 'base'"
                          class="ov-tag ov-tag-mute">{{ item.duration }}</span>
                    <span v-if="item.event && item.event !== 'none'"
                          class="ov-tag ov-tag-ok">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path v-for="(p, i) in (getEventInfo(item.event)?.paths || [])" :key="i" stroke-linecap="round" stroke-linejoin="round" :d="p"/>
                      </svg>
                      {{ t(getEventInfo(item.event)?.label) }}
                    </span>
                  </div>
                  <!-- Qty stepper -->
                  <div class="inline-flex items-center border border-slate-700 rounded-md mt-2">
                    <button @click="stepCartQty(item, -1)" class="qty-step" :aria-label="t('shop_label_qty') + ' −1'">−</button>
                    <span class="text-[13px] font-semibold tabular-nums text-slate-100 min-w-[32px] text-center">{{ item.mult }}</span>
                    <button @click="stepCartQty(item, 1)" class="qty-step" :aria-label="t('shop_label_qty') + ' +1'">+</button>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-1 flex-shrink-0">
                  <span class="text-base font-semibold text-slate-100 tabular-nums">{{ formatNum(item.cost) }}</span>
                  <span class="text-[11px] text-slate-400 tabular-nums">{{ formatNum(item.unitCost ?? Math.round(item.cost / Math.max(1, item.mult))) }} {{ t('shop_list_each') }}</span>
                </div>
              </div>
            </div>

            <div v-if="shopCart.length === 0" class="flex flex-col items-center justify-center py-16 text-center px-6">
              <svg class="w-14 h-14 mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              <span class="text-[11px] uppercase font-bold tracking-widest text-slate-400">{{ t('shopping_cart_empty') }}</span>
              <span class="text-[11px] text-slate-400 mt-2 leading-relaxed">{{ t('shop_cart_empty_catalog_hint') }}</span>
            </div>
          </div>
          <div class="p-5 border-t border-ogame-line bg-ogame-raised">
             <div v-if="totalShopCartCashback > 0" class="flex items-center justify-between mb-4 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                <span class="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                   <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"></path></svg>
                   {{ t('shopping_cashback') }}
                </span>
                <span class="text-xs font-semibold text-emerald-300 tabular-nums">+ {{ formatNum(totalShopCartCashback) }} MO</span>
             </div>
             <div class="flex items-baseline justify-between gap-4" :class="cartEuroEstimate ? 'mb-3' : 'mb-5'">
                <span class="ov-stat-k">{{ t('shopping_order_total') }}</span>
                <span class="text-3xl font-bold text-slate-100 tabular-nums">{{ formatNum(totalShopCartMO) }} <span class="text-sm text-slate-400 font-medium">MO</span></span>
             </div>
             <!-- Stima in € sul taglio di MO selezionato nel selettore in cima alla pagina -->
             <div v-if="cartEuroEstimate" class="flex items-baseline justify-between gap-4 mb-5">
                <span class="ov-stat-k">{{ t('shopping_est_cost') }}</span>
                <span class="text-right">
                  <span class="text-xl font-bold tabular-nums text-slate-100">≈ {{ formatEuro(cartEuroEstimate.euro) }} €</span>
                  <span class="block text-[11px] text-slate-400 tabular-nums mt-1">{{ cartEuroEstimate.packs }} × {{ cartEuroEstimate.pkgCost }} € = {{ formatNum(cartEuroEstimate.packsEuro) }} €</span>
                </span>
             </div>
             <button @click="cartDrawerOpen = false" class="ov-btn ov-btn-primary w-full h-11">{{ t('shopping_save_close') }}</button>
          </div>
        </aside>
      </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
/* ─── SEARCH ─── */
.shop-search-input::-webkit-search-cancel-button { display: none; }

/* ─── BASE LAYOUT ─── */
.shop-v4-root {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr) 290px;
  gap: 20px;
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1.5rem 2rem;
}
@media (max-width: 1279px) { .shop-v4-root { grid-template-columns: 200px minmax(0, 1fr); } }
@media (max-width: 1023px) { .shop-v4-root { grid-template-columns: minmax(0, 1fr); padding: 0 1rem 2rem; } }

.shop-sidebar-left {
  position: sticky;
  top: 72px;
  max-height: calc(100vh - 88px);
  margin-top: 1.5rem;
}

.shop-sidebar-right {
  position: sticky;
  top: 72px;
  max-height: calc(100vh - 88px);
  margin-top: 1.5rem;
  background: theme('colors.ogame.panel');
  border: 1px solid theme('colors.ogame.line');
  border-radius: 12px;
}

.sidebar-scrollable {
  flex: 1;
  overflow-y: auto;
  padding: 0 0.25rem 1rem 0;
}

/* Header e totale restano fissi: scorre solo la lista degli articoli. */
.cart-sticky-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 1rem 1.125rem;
}
.cart-scroll-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  margin-right: -0.35rem;
  padding-right: 0.35rem;
}

.shop-main-content { flex: 1; min-width: 0; }

/* ─── MOBILE EVENT BAR ─── */
.mobile-event-bar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.mobile-evt-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  min-height: 40px;
  background: theme('colors.ogame.panel');
  border: 1px solid theme('colors.ogame.line');
  border-radius: 6px;
  color: theme('colors.slate.400');
  font-size: 12px;
  transition: color 150ms, background-color 150ms, border-color 150ms;
}
.mobile-evt-active {
  background: theme('colors.ogame.raised');
  border-color: theme('colors.slate.600');
  color: theme('colors.slate.100');
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
.card-muted:focus-within {
  opacity: 1;
  filter: none;
}
/* Appena aggiunta: bordo ciano, poi torna al bordo normale con la transizione della card */
.just-added { border-color: rgb(0 240 255 / 0.55) !important; transition-duration: 0ms !important; }

@media (hover: hover) and (pointer: fine) { .card-muted:hover { opacity: 1; filter: none; } }
/* Icona "+" sui tier row: appare all'hover come affordance di aggiunta */
.tier-add-icon { opacity: 0.8; }

/* ─── SIDEBAR ELEMENTS ─── */
.section-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: theme('colors.slate.400');
  letter-spacing: 0.12em;
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
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  transition: color 150ms, background-color 150ms;
  color: theme('colors.slate.400');
}
@media (hover: hover) and (pointer: fine) { .event-btn:hover, .cat-btn:hover { color: theme('colors.slate.200'); background: rgba(255,255,255,0.03); } }

.event-active, .cat-active {
  background: theme('colors.ogame.raised');
  color: theme('colors.slate.100');
  font-weight: 600;
}

.sidebar-divider {
  height: 1px;
  background: theme('colors.ogame.line');
  margin: 1.25rem 0;
}

/* ─── CARD CONTROLS ─── */
.qty-input {
  background: transparent;
  border: none;
  border-inline: 1px solid theme('colors.ogame.line');
  color: theme('colors.slate.100');
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  width: 36px;
  height: 28px;
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
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: theme('colors.slate.400');
  font-size: 14px;
  line-height: 1;
  transition: color 150ms, background-color 150ms;
}
@media (hover: hover) and (pointer: fine) { .qty-step:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: #fff; } }
.qty-step:disabled { opacity: 0.3; cursor: not-allowed; }


.price-cell {
  display: inline-block;
  min-width: 4.25rem;
  padding: 4px 8px;
  border-radius: 5px;
  border: 1px solid theme('colors.ogame.line');
  font-weight: 600;
  color: theme('colors.slate.100');
  transition: border-color 150ms, color 150ms, background-color 150ms, transform 150ms cubic-bezier(0.23, 1, 0.32, 1);
}
@media (hover: hover) and (pointer: fine) { .price-cell:hover { border-color: rgb(0 240 255 / 0.6); color: theme('colors.ogame.accent'); background: rgb(0 240 255 / 0.05); } }
.price-cell:active { transform: scale(0.97); }
@media (max-width: 359px) { .price-cell { min-width: 0; padding: 4px 5px; } }
@media (pointer: coarse) { .qty-step { width: 40px; height: 40px; } .qty-input { width: 44px; height: 40px; } .price-cell { padding: 8px; } }

.btn-discounted {
  border-color: rgba(34, 197, 94, 0.35) !important;
  background-color: rgba(34, 197, 94, 0.06) !important;
}



/* ─── RESPONSIVE ─── */
/* Il carrello resta visibile da 1280px; sotto resta il pulsante flottante */
@media (max-width: 1279px) { .shop-sidebar-right { display: none; } }
@media (min-width: 1280px) { .shop-fab { display: none; } }

.custom-scrollbar::-webkit-scrollbar { width: 3px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.04); border-radius: 10px; }

.qty-input:focus-visible { outline: 1px solid rgba(0, 240, 255, 0.6); outline-offset: 2px; border-radius: 4px; }

/* Cassetto del carrello: entra dal bordo destro, esce più in fretta */
.drawer-enter-active .drawer-panel { transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1); }
.drawer-leave-active .drawer-panel { transition: transform 200ms cubic-bezier(0.32, 0.72, 0, 1); }
.drawer-enter-from .drawer-panel, .drawer-leave-to .drawer-panel { transform: translateX(100%); }
.drawer-enter-active .drawer-backdrop { transition: opacity 200ms ease-out; }
.drawer-leave-active .drawer-backdrop { transition: opacity 150ms ease-out; }
.drawer-enter-from .drawer-backdrop, .drawer-leave-to .drawer-backdrop { opacity: 0; }
.drawer-enter-active { transition: opacity 300ms; }
.drawer-leave-active { transition: opacity 200ms; }

@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active .drawer-panel, .drawer-leave-active .drawer-panel { transition: opacity 150ms; transform: none; }
  .drawer-enter-from .drawer-panel, .drawer-leave-to .drawer-panel { transform: none; opacity: 0; }
}
</style>
