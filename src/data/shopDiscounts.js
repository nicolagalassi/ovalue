// Logica sconti degli eventi shop, condivisa tra Shopping List e Planner
// apertura pacchi (unica fonte di verità per i fattori di sconto).
import { SHOP_ITEMS } from './ogame_db';

// Nuovi item (amplificatori risorse/spedizioni, computer spedizioni, offerte
// mercante) resi idonei agli sconti "item 15%/20%" e "item platino" a
// prescindere da categoria/tier — usato sia per l'idoneità sia per il fattore
// di sconto, così le due funzioni restano coerenti.
export const DISCOUNTABLE_NEW_ITEM = (itemKey) =>
    /^res_amp_/.test(itemKey) ||
    /^exp_res_amp_/.test(itemKey) ||
    itemKey === 'exp_computer' ||
    /^scrap_offer_/.test(itemKey);

// Evento Item Platino: lo sconto è scalare per tier — platino 20%, oro 15%,
// argento 10%; il bronzo non è scontato. Gli item senza tier (pacchetti
// risorse, classi, staff, nuovi item) prendono lo sconto pieno del 20%.
const PLATINUM_EVENT_TIER_FACTOR = { platinum: 0.80, gold: 0.85, silver: 0.90 };
const PLATINUM_EVENT_TIERED_ITEMS = [
    'booster_metal', 'booster_crystal', 'booster_deut', 'booster_energy',
    'fields_planet', 'fields_moon', 'moons',
    'slot_fleet', 'slot_expedition',
];
export const getPlatinumEventFactor = (itemKey, tier) => {
    if (DISCOUNTABLE_NEW_ITEM(itemKey)) return 0.8;
    if (String(itemKey).startsWith('res_package_')) return 0.8;
    if (String(itemKey).startsWith('class_') || (String(itemKey).startsWith('staff_') && itemKey !== 'staff_command')) return 0.8;
    if (tier === 'platinum' || PLATINUM_EVENT_TIERED_ITEMS.includes(itemKey)) {
        return PLATINUM_EVENT_TIER_FACTOR[tier] ?? 1;
    }
    return 1;
};

export const getEventDiscountFactor = (itemKey, tier, dur, eventId) => {
    if (eventId === 'discount') {
        if (DISCOUNTABLE_NEW_ITEM(itemKey)) return 0.85;
        const item = SHOP_ITEMS.items[itemKey];
        const excludeCats = ['officers_only', 'ingame', 'construction', 'expedition'];
        if (item && !excludeCats.includes(item.cat)) return 0.85;
    }
    if (eventId === 'discount_20') {
        if (DISCOUNTABLE_NEW_ITEM(itemKey)) return 0.80;
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
    if (eventId === 'platinum') return getPlatinumEventFactor(itemKey, tier);
    if (eventId === 'merchant'   && itemKey === 'ingame_merchant') return 2000 / 3500;
    if (eventId === 'relocate'   && itemKey === 'ingame_relocate') return 0.5;
    if (eventId === 'slots'      && (itemKey === 'slot_fleet' || itemKey === 'slot_expedition')) return 0.7;
    if (eventId === 'expedition' && String(itemKey).includes('exp_delay_')) return 0.8;
    return 1;
};
