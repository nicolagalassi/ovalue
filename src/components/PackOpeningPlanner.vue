<script setup>
// Planner apertura pacchi: dato un budget di MO, decide come dividerlo tra
// amplificatori di metallo per pianeta e Pacchetti Metallo, massimizzando il
// metallo ottenuto all'apertura.
//
// Compliance (AGENTS.md): calcolatore puro sui dati del profilo locale.
// Nessuna chiamata al gioco, nessuna automazione o acquisto: suggerisce
// soltanto, il giocatore compra e apre i pacchi a mano dallo shop.
import { reactive, computed, watch } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useProfiles } from '../composables/useProfiles';
import { useOgameFormulas } from '../composables/useOgameFormulas';
import { SHOP_ITEMS } from '../data/ogame_db';
import { getEventDiscountFactor } from '../data/shopDiscounts';

const { t } = useLanguage();
const { activeProfile, saveProfiles } = useProfiles();
const { calcPlanetMetalProduction, calcLFResearchBonus } = useOgameFormulas();

const formatNum = (n) => new Intl.NumberFormat('it-IT').format(Math.floor(n));

// ── Catalogo item ─────────────────────────────────────────────────────────
// Solo metallo: il Pacchetto Metallo vale 1 giorno di produzione di metallo.
const PACK_KEY = 'res_package_metal';
// Amplificatore di Metallo: taglio più corto (7 giorni) — basta che sia attivo
// al momento dell'apertura. Campo pianeta: `item`.
const BOOSTERS = [
    { id: 'b10', pct: 10, tier: 'bronze',   dur: '7d' },
    { id: 'b20', pct: 20, tier: 'silver',   dur: '7d' },
    { id: 'b30', pct: 30, tier: 'gold',     dur: '7d' },
    { id: 'b40', pct: 40, tier: 'platinum', dur: '7d' },
].map(b => ({ ...b, key: 'booster_metal', base: SHOP_ITEMS.items.booster_metal.costs[b.tier][b.dur] }));
// Amplificatore di risorse: solo 30 giorni (taglio minimo). Campo pianeta:
// `itemCustom`, si somma all'amplificatore di metallo.
const AMPS = [15, 20, 25, 30, 40].map(pct => ({
    id: `a${pct}`, pct, tier: 'none', dur: '30d', key: `res_amp_${pct}`,
    base: SHOP_ITEMS.items[`res_amp_${pct}`].costs.none['30d'],
}));

// 'best' = per ogni item lo sconto più alto tra gli eventi disponibili.
const EVENT_IDS = ['none', 'discount', 'discount_20', 'boosters', 'resources', 'platinum'];
const EVENT_OPTIONS = [
    { id: 'best', label: 'pop_best_discount' },
    ...EVENT_IDS.map(id => ({ id, label: `shop_event_${id}` })),
];
const factorFor = (key, tier, dur, eventId) => eventId === 'best'
    ? Math.min(...EVENT_IDS.map(e => getEventDiscountFactor(key, tier, dur, e)))
    : getEventDiscountFactor(key, tier, dur, eventId);

// ── Stato (persistito nel profilo) ────────────────────────────────────────
const createDefaults = () => ({
    mode: 'packs',            // 'packs' | 'mo'
    packs: 100,
    mo: 4200000,
    packEvent: 'best',
    itemEvent: 'best',
    enabled: Object.fromEntries([...BOOSTERS, ...AMPS].map(o => [o.id, true])),
});
const state = reactive(createDefaults());

watch(activeProfile, (p) => {
    const saved = p?.packExchange?.openingPlanner;
    const d = createDefaults();
    Object.assign(state, d, saved ? JSON.parse(JSON.stringify(saved)) : {});
    state.enabled = { ...d.enabled, ...(saved?.enabled || {}) };
}, { immediate: true });

let saveDebounce = null;
watch(state, () => {
    clearTimeout(saveDebounce);
    saveDebounce = setTimeout(() => {
        const p = activeProfile.value;
        if (!p?.packExchange) return;
        p.packExchange.openingPlanner = JSON.parse(JSON.stringify(state));
        saveProfiles();
    }, 400);
}, { deep: true });

const createFormattedInput = (key) => computed({
    get: () => formatNum(parseInt(state[key]) || 0),
    set: (v) => { state[key] = parseInt(String(v).replace(/\D/g, '')) || 0; },
});
const formPacks = createFormattedInput('packs');
const formMo = createFormattedInput('mo');

// ── Prezzi ────────────────────────────────────────────────────────────────
const packPrice = computed(() => {
    const base = SHOP_ITEMS.items[PACK_KEY].costs.none.base;
    return Math.round(base * factorFor(PACK_KEY, 'none', 'base', state.packEvent));
});
const priced = (o) => ({ ...o, cost: Math.round(o.base * factorFor(o.key, o.tier, o.dur, state.itemEvent)) });
const boosterOpts = computed(() => BOOSTERS.map(priced));
const ampOpts = computed(() => AMPS.map(priced));

const budget = computed(() => state.mode === 'packs'
    ? (parseInt(state.packs) || 0) * packPrice.value
    : (parseInt(state.mo) || 0));

// ── Produzione senza item ─────────────────────────────────────────────────
// Si azzerano item/itemCustom di ogni pianeta: il profilo può avere item
// attivi diversi da quelli simulati. L'item si applica solo alla base miniera,
// quindi ogni punto % vale mineBase × 24 / 100 metallo al giorno.
const planets = computed(() => activeProfile.value?.production?.planets || []);
const prodSettings = computed(() => activeProfile.value?.production?.settings || {});

const production = computed(() => {
    const lfr = calcLFResearchBonus(planets.value);
    let hourlyNoItems = 0, hourlyCurrent = 0;
    const rows = planets.value.map((p, i) => {
        const bare = calcPlanetMetalProduction({ ...p, item: 0, itemCustom: 0 }, prodSettings.value, lfr);
        hourlyNoItems += bare.total;
        hourlyCurrent += calcPlanetMetalProduction(p, prodSettings.value, lfr).total;
        return {
            idx: i,
            name: p.name || `${t('pop_planet')} ${i + 1}`,
            pos: p.pos,
            perPct: bare.mineBase * 24 / 100,
        };
    });
    return {
        rows,
        dailyNoItems: Math.floor(hourlyNoItems * 24),
        dailyCurrent: Math.floor(hourlyCurrent * 24),
    };
});

// ── Combinazioni per pianeta ──────────────────────────────────────────────
// Metallo (7g) + risorse (30g), entrambi opzionali. Si scartano le
// combinazioni dominate (costano di più senza dare più %).
const combos = computed(() => {
    const bs = [null, ...boosterOpts.value.filter(o => state.enabled[o.id])];
    const as = [null, ...ampOpts.value.filter(o => state.enabled[o.id])];
    const all = [];
    for (const b of bs) for (const a of as) {
        all.push({ b, a, pct: (b?.pct || 0) + (a?.pct || 0), cost: (b?.cost || 0) + (a?.cost || 0) });
    }
    all.sort((x, y) => x.cost - y.cost || y.pct - x.pct);
    const kept = [];
    for (const c of all) if (!kept.length || c.pct > kept[kept.length - 1].pct) kept.push(c);
    return kept; // kept[0] è sempre "nessun item"
});

// Valuta un'assegnazione (una combinazione per pianeta).
const evaluate = (assign) => {
    const rows = production.value.rows;
    const P = packPrice.value;
    let itemsCost = 0, gain = 0;
    rows.forEach((r, i) => {
        const c = assign[i];
        itemsCost += c.cost;
        gain += r.perPct * c.pct;
    });
    const left = budget.value - itemsCost;
    if (left < 0 || P <= 0) return null;
    const packs = Math.floor(left / P);
    const packValue = production.value.dailyNoItems + gain;
    return { assign, itemsCost, packs, packValue, total: packs * packValue, leftover: left - packs * P };
};

// Ottimo: knapsack a scelta multipla sul costo degli item (griglia di MO),
// poi per ogni spesa possibile i pacchi comprati col resto.
const optimal = computed(() => {
    const rows = production.value.rows;
    const cs = combos.value;
    const B = budget.value;
    if (!rows.length || B <= 0) return null;

    const maxSpend = Math.min(B, rows.length * cs[cs.length - 1].cost);
    const unit = Math.max(25, Math.ceil(maxSpend / 20000));
    const U = Math.floor(maxSpend / unit);
    const cu = cs.map(c => Math.ceil(c.cost / unit));

    let best = new Float64Array(U + 1);
    const choice = rows.map(() => new Uint8Array(U + 1));
    rows.forEach((r, i) => {
        const next = new Float64Array(best);
        const ch = choice[i];
        for (let k = 1; k < cs.length; k++) {
            const w = cu[k], v = r.perPct * cs[k].pct;
            for (let u = U; u >= w; u--) {
                const cand = best[u - w] + v;
                if (cand > next[u]) { next[u] = cand; ch[u] = k; }
            }
        }
        best = next;
    });

    let bestRes = null;
    for (let u = 0; u <= U; u++) {
        if (u > 0 && best[u] === best[u - 1]) continue; // stessa resa, spesa maggiore
        const assign = new Array(rows.length);
        let uu = u;
        for (let i = rows.length - 1; i >= 0; i--) {
            const k = choice[i][uu];
            assign[i] = cs[k];
            uu -= cu[k];
        }
        const res = evaluate(assign);
        if (res && (!bestRes || res.total > bestRes.total)) bestRes = res;
    }
    return bestRes;
});

// Strategie uniformi di confronto: stesso item su tutti i pianeti.
const strategies = computed(() => {
    const rows = production.value.rows;
    if (!rows.length) return [];
    const list = [];
    const combo = (b, a) => ({ b, a, pct: (b?.pct || 0) + (a?.pct || 0), cost: (b?.cost || 0) + (a?.cost || 0) });
    const uniform = (id, c) => list.push({ id, combo: c, res: evaluate(rows.map(() => c)) });
    uniform('none', combo(null, null));
    const bs = boosterOpts.value.filter(o => state.enabled[o.id]);
    const as = ampOpts.value.filter(o => state.enabled[o.id]);
    for (const b of bs) uniform(b.id, combo(b, null));
    for (const a of as) uniform(a.id, combo(null, a));
    if (bs.length && as.length) uniform('top', combo(bs[bs.length - 1], as[as.length - 1]));

    const out = list.filter(s => s.res?.packs > 0).map(s => ({ ...s, optimal: false }));
    if (optimal.value) out.push({ id: 'optimal', optimal: true, res: optimal.value });
    const bestTotal = Math.max(...out.map(s => s.res.total), 0);
    return out
        .map(s => ({ ...s, vsBest: bestTotal > 0 ? (s.res.total / bestTotal - 1) * 100 : 0 }))
        .sort((x, y) => y.res.total - x.res.total);
});

const noneTotal = computed(() => strategies.value.find(s => s.id === 'none')?.res.total || 0);

// Piano ottimo per pianeta, ordinato per base miniera.
const plan = computed(() => {
    const o = optimal.value;
    if (!o) return [];
    return production.value.rows
        .map((r, i) => ({ ...r, combo: o.assign[i] }))
        .sort((x, y) => y.perPct - x.perPct);
});

// Riepilogo acquisti: quanti item di ogni tipo.
const shoppingSummary = computed(() => {
    const counts = new Map();
    for (const row of plan.value) {
        for (const it of [row.combo.b, row.combo.a]) {
            if (!it) continue;
            const e = counts.get(it.id) || { item: it, n: 0 };
            e.n++;
            counts.set(it.id, e);
        }
    }
    return [...counts.values()];
});

const itemLabel = (o) => o.key === 'booster_metal'
    ? `${t('booster_metal')} ${o.pct}% (${t('tier_' + o.tier)}, 7${t('pop_days_abbr')})`
    : `${t(o.key)} (30${t('pop_days_abbr')})`;
const shortLabel = (o) => o.key === 'booster_metal' ? `${t('pop_short_metal')} ${o.pct}%` : `${t('pop_short_amp')} ${o.pct}%`;
const strategyLabel = (s) => {
    if (s.optimal) return t('pop_strat_optimal');
    if (s.id === 'none') return t('pop_strat_none');
    const parts = [s.combo.b, s.combo.a].filter(Boolean).map(shortLabel).join(' + ');
    return `${t('pop_strat_all')}: ${parts}`;
};
</script>

<template>
  <div>
    <!-- Intro -->
    <div class="card-glass mb-8 bg-amber-500/[0.03] p-6 flex items-start gap-4">
        <div class="hidden md:block p-3 rounded-xl bg-amber-500/[0.08] text-amber-400 flex-shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div class="space-y-2">
            <p class="text-sm text-slate-300 leading-relaxed font-medium">{{ t('pop_intro') }}</p>
            <p class="text-xs text-slate-500 leading-relaxed">{{ t('pop_note_duration') }}</p>
        </div>
    </div>

    <div v-if="!production.rows.length" class="card-glass p-8 text-center">
        <p class="text-slate-300 mb-4">{{ t('pop_no_planets') }}</p>
        <router-link to="/metal" class="inline-block px-4 py-2 rounded-lg border border-amber-500/40 text-amber-300 text-sm font-bold hover:bg-amber-500/10">
            {{ t('pop_go_production') }}
        </router-link>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Colonna impostazioni -->
        <div class="lg:col-span-1 space-y-6">
            <!-- Budget -->
            <div class="card-glass p-5 bg-amber-500/[0.03] border border-amber-500/20">
                <h3 class="text-[11px] font-black text-amber-400 uppercase tracking-widest font-mono mb-3">{{ t('pop_budget_title') }}</h3>
                <div class="grid grid-cols-2 gap-1 p-1 rounded-lg bg-black/40 mb-3" role="tablist">
                    <button v-for="m in ['packs', 'mo']" :key="m" type="button" role="tab" :aria-selected="state.mode === m"
                            @click="state.mode = m"
                            class="py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors"
                            :class="state.mode === m ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500 hover:text-slate-300'">
                        {{ t(m === 'packs' ? 'pop_mode_packs' : 'pop_mode_mo') }}
                    </button>
                </div>
                <input v-if="state.mode === 'packs'" v-model.lazy="formPacks" type="text" inputmode="numeric" @focus="$event.target.select()"
                       :aria-label="t('pop_mode_packs')"
                       class="input-glass w-full px-4 py-3 text-white font-black text-center text-2xl">
                <input v-else v-model.lazy="formMo" type="text" inputmode="numeric" @focus="$event.target.select()"
                       :aria-label="t('pop_mode_mo')"
                       class="input-glass w-full px-4 py-3 text-white font-black text-center text-2xl">
                <p class="text-[11px] text-slate-500 mt-2 text-center">
                    {{ t('pop_budget_total') }}: <span class="text-ogame-dm font-bold">{{ formatNum(budget) }} {{ t('lbl_dm') }}</span>
                    <template v-if="state.mode === 'packs'"><br>{{ t('pop_budget_packs_hint') }}</template>
                </p>
            </div>

            <!-- Sconti -->
            <div class="card-glass p-5 space-y-4">
                <div>
                    <label for="pop-pack-event" class="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{{ t('pop_pack_event') }}</label>
                    <select id="pop-pack-event" v-model="state.packEvent" class="input-glass w-full px-3 py-2 text-sm">
                        <option v-for="e in EVENT_OPTIONS" :key="e.id" :value="e.id">{{ t(e.label) }}</option>
                    </select>
                    <p class="text-[11px] text-slate-500 mt-1">{{ t('pop_pack_price') }}: <span class="text-ogame-dm font-bold">{{ formatNum(packPrice) }}</span></p>
                </div>
                <div>
                    <label for="pop-item-event" class="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{{ t('pop_item_event') }}</label>
                    <select id="pop-item-event" v-model="state.itemEvent" class="input-glass w-full px-3 py-2 text-sm">
                        <option v-for="e in EVENT_OPTIONS" :key="e.id" :value="e.id">{{ t(e.label) }}</option>
                    </select>
                </div>
            </div>

            <!-- Item considerati -->
            <div class="card-glass p-5">
                <h3 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">{{ t('pop_options_title') }}</h3>
                <div class="space-y-1.5">
                    <label v-for="o in [...boosterOpts, ...ampOpts]" :key="o.id"
                           class="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-white/[0.03] cursor-pointer">
                        <input type="checkbox" v-model="state.enabled[o.id]" class="accent-amber-400">
                        <span class="flex-1 text-xs text-slate-300">{{ itemLabel(o) }}</span>
                        <span class="text-xs font-mono font-bold text-ogame-dm">{{ formatNum(o.cost) }}</span>
                    </label>
                </div>
            </div>

            <!-- Produzione -->
            <div class="card-glass p-5 space-y-2">
                <div class="flex justify-between items-baseline gap-2">
                    <span class="text-xs text-slate-400">{{ t('pop_base_prod') }}</span>
                    <span class="font-mono font-bold text-white">{{ formatNum(production.dailyNoItems) }}</span>
                </div>
                <div class="flex justify-between items-baseline gap-2">
                    <span class="text-xs text-slate-500">{{ t('pop_current_prod') }}</span>
                    <span class="font-mono text-slate-400">{{ formatNum(production.dailyCurrent) }}</span>
                </div>
                <p class="text-[11px] text-slate-500 leading-snug">{{ t('pop_base_prod_hint') }}</p>
            </div>
        </div>

        <!-- Colonna risultati -->
        <div class="lg:col-span-2 space-y-6">
            <!-- Risultato ottimo -->
            <div v-if="optimal" class="card-glass p-6 border border-ogame-success/25 bg-ogame-success/[0.03]">
                <h3 class="text-[11px] font-black text-ogame-success uppercase tracking-widest font-mono mb-4">{{ t('pop_strat_optimal') }}</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <div class="text-[10px] uppercase text-slate-500 font-bold">{{ t('pop_total_metal') }}</div>
                        <div class="text-lg font-black text-white font-mono">{{ formatNum(optimal.total) }}</div>
                    </div>
                    <div>
                        <div class="text-[10px] uppercase text-slate-500 font-bold">{{ t('pop_packs') }}</div>
                        <div class="text-lg font-black text-amber-300 font-mono">{{ formatNum(optimal.packs) }}</div>
                    </div>
                    <div>
                        <div class="text-[10px] uppercase text-slate-500 font-bold">{{ t('pop_pack_value') }}</div>
                        <div class="text-lg font-black text-white font-mono">{{ formatNum(optimal.packValue) }}</div>
                    </div>
                    <div>
                        <div class="text-[10px] uppercase text-slate-500 font-bold">{{ t('pop_gain') }}</div>
                        <div class="text-lg font-black font-mono" :class="optimal.total > noneTotal ? 'text-ogame-success' : 'text-slate-400'">
                            +{{ noneTotal > 0 ? ((optimal.total / noneTotal - 1) * 100).toFixed(2) : '0.00' }}%
                        </div>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-slate-700/30 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
                    <span>{{ t('pop_items_cost') }}: <b class="text-ogame-dm">{{ formatNum(optimal.itemsCost) }}</b></span>
                    <span>{{ t('pop_packs_cost') }}: <b class="text-ogame-dm">{{ formatNum(optimal.packs * packPrice) }}</b></span>
                    <span>{{ t('pop_leftover') }}: <b class="text-slate-300">{{ formatNum(optimal.leftover) }}</b></span>
                </div>
                <div v-if="shoppingSummary.length" class="mt-4 flex flex-wrap gap-2">
                    <span v-for="s in shoppingSummary" :key="s.item.id"
                          class="px-2.5 py-1 rounded-md bg-black/40 border border-slate-700/40 text-xs text-slate-200">
                        {{ s.n }}× {{ itemLabel(s.item) }}
                    </span>
                </div>
            </div>
            <div v-else class="card-glass p-6 text-sm text-slate-400">{{ t('pop_not_affordable') }}</div>

            <!-- Confronto strategie -->
            <div class="card-glass p-6">
                <h3 class="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">{{ t('pop_results_title') }}</h3>
                <div class="overflow-x-auto -mx-2">
                    <table class="w-full text-xs min-w-[520px]">
                        <thead>
                            <tr class="text-[10px] uppercase tracking-wider text-slate-500 text-left">
                                <th class="px-2 py-2 font-bold">{{ t('pop_strategy') }}</th>
                                <th class="px-2 py-2 font-bold text-right">{{ t('pop_items_cost') }}</th>
                                <th class="px-2 py-2 font-bold text-right">{{ t('pop_packs') }}</th>
                                <th class="px-2 py-2 font-bold text-right">{{ t('pop_total_metal') }}</th>
                                <th class="px-2 py-2 font-bold text-right">{{ t('pop_vs_best') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="s in strategies" :key="s.id" class="border-t border-slate-700/20"
                                :class="s.optimal ? 'bg-ogame-success/[0.05]' : ''">
                                <td class="px-2 py-2" :class="s.optimal ? 'text-ogame-success font-bold' : 'text-slate-300'">{{ strategyLabel(s) }}</td>
                                <td class="px-2 py-2 text-right font-mono text-ogame-dm">{{ formatNum(s.res.itemsCost) }}</td>
                                <td class="px-2 py-2 text-right font-mono text-amber-300">{{ formatNum(s.res.packs) }}</td>
                                <td class="px-2 py-2 text-right font-mono text-white">{{ formatNum(s.res.total) }}</td>
                                <td class="px-2 py-2 text-right font-mono" :class="s.vsBest >= -0.0001 ? 'text-ogame-success' : 'text-ogame-danger'">
                                    {{ s.vsBest >= -0.0001 ? '—' : s.vsBest.toFixed(2) + '%' }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p class="text-[11px] text-slate-500 mt-3">{{ t('pop_unaffordable_hidden') }}</p>
            </div>

            <!-- Piano per pianeta -->
            <div v-if="plan.length" class="card-glass p-6">
                <h3 class="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">{{ t('pop_plan_title') }}</h3>
                <div class="overflow-x-auto -mx-2">
                    <table class="w-full text-xs min-w-[480px]">
                        <thead>
                            <tr class="text-[10px] uppercase tracking-wider text-slate-500 text-left">
                                <th class="px-2 py-2 font-bold">{{ t('pop_planet') }}</th>
                                <th class="px-2 py-2 font-bold text-right">{{ t('pop_mine_daily') }}</th>
                                <th class="px-2 py-2 font-bold">{{ t('pop_items') }}</th>
                                <th class="px-2 py-2 font-bold text-right">{{ t('pop_cost') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="r in plan" :key="r.idx" class="border-t border-slate-700/20">
                                <td class="px-2 py-2 text-slate-300">
                                    {{ r.name }} <span v-if="r.pos" class="text-slate-500 font-mono">[{{ r.pos }}]</span>
                                </td>
                                <td class="px-2 py-2 text-right font-mono text-slate-400">{{ formatNum(r.perPct * 100) }}</td>
                                <td class="px-2 py-2">
                                    <span v-if="!r.combo.b && !r.combo.a" class="text-slate-600">—</span>
                                    <span v-else class="flex flex-wrap gap-1">
                                        <span v-if="r.combo.b" class="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300">{{ shortLabel(r.combo.b) }}</span>
                                        <span v-if="r.combo.a" class="px-1.5 py-0.5 rounded bg-ogame-accent/10 text-ogame-accent">{{ shortLabel(r.combo.a) }}</span>
                                    </span>
                                </td>
                                <td class="px-2 py-2 text-right font-mono text-ogame-dm">{{ r.combo.cost ? formatNum(r.combo.cost) : '—' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>
