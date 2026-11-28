<script setup>
// Planner apertura pacchi: il giocatore ha già N Pacchetti Metallo e un
// budget di MO. Le MO vanno in amplificatori per pianeta (che alzano il valore
// di ogni pacco aperto) e quelle avanzate comprano pacchi extra: si cerca la
// divisione che massimizza il metallo ottenuto all'apertura.
//
// Compliance (AGENTS.md): calcolatore puro sui dati del profilo locale.
// Nessuna chiamata al gioco, nessuna automazione o acquisto: suggerisce
// soltanto, il giocatore compra e apre i pacchi a mano dallo shop.
import { reactive, computed, watch } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useProfiles } from '../composables/useProfiles';
import { useOgameFormulas, formatInt, formatPct } from '../composables/useOgameFormulas';
import { SHOP_ITEMS, RES_AMP_PCTS } from '../data/ogame_db';
import { getEventDiscountFactor } from '../data/shopDiscounts';

const { t } = useLanguage();
const { activeProfile, saveProfiles } = useProfiles();
const { calcPlanetMetalProduction, calcLFResearchBonus } = useOgameFormulas();

const formatNum = formatInt;

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
const AMPS = RES_AMP_PCTS.map(pct => ({
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
    packs: 100,               // pacchi già posseduti
    mo: 500000,               // MO disponibili per item e pacchi extra
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
    delete state.mode; // vecchio formato: budget = costo dei pacchi
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

const ownedPacks = computed(() => parseInt(state.packs) || 0);
const budget = computed(() => parseInt(state.mo) || 0);

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
    const extraPacks = Math.floor(left / P);
    const packs = ownedPacks.value + extraPacks;
    const packValue = production.value.dailyNoItems + gain;
    return { assign, itemsCost, extraPacks, packs, packValue, total: packs * packValue, leftover: left - extraPacks * P };
};

// Ottimo: knapsack a scelta multipla sul costo degli item (griglia di MO),
// poi per ogni spesa possibile i pacchi extra comprati col resto.
const optimal = computed(() => {
    const rows = production.value.rows;
    const cs = combos.value;
    const B = budget.value;
    if (!rows.length) return null;

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
    <div class="mb-5 grid gap-1 max-w-[80ch]">
        <p class="text-sm text-slate-300 leading-relaxed">{{ t('pop_intro') }}</p>
        <p class="text-xs text-slate-400 leading-relaxed">{{ t('pop_note_duration') }}</p>
    </div>

    <div v-if="!production.rows.length" class="ov-panel p-8 text-center">
        <p class="text-slate-300 mb-4">{{ t('pop_no_planets') }}</p>
        <router-link to="/metal" class="ov-btn ov-btn-tint">
            {{ t('pop_go_production') }}
        </router-link>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <!-- Colonna impostazioni -->
        <div class="lg:col-span-1 grid gap-4 min-w-0">
            <!-- Budget -->
            <div class="ov-panel p-5 grid gap-3">
                <h3 class="ov-sh">{{ t('pop_budget_title') }}</h3>
                <div>
                    <label for="pop-owned" class="ov-label mb-1.5">{{ t('pop_owned_packs') }}</label>
                    <input id="pop-owned" v-model.lazy="formPacks" type="text" inputmode="numeric" @focus="$event.target.select()"
                           class="input-glass w-full h-10 px-3 text-lg font-bold tabular-nums">
                </div>
                <div>
                    <label for="pop-mo" class="ov-label mb-1.5">{{ t('pop_available_mo') }}</label>
                    <input id="pop-mo" v-model.lazy="formMo" type="text" inputmode="numeric" @focus="$event.target.select()"
                           class="input-glass w-full h-10 px-3 text-lg font-bold tabular-nums">
                </div>
                <p class="text-[11px] text-slate-400">{{ t('pop_budget_hint') }}</p>
            </div>

            <!-- Sconti -->
            <div class="ov-panel p-5 grid gap-4" style="--tc:#a78bfa">
                <h3 class="ov-sh">{{ t('lbl_cost_dm') }}</h3>
                <div>
                    <label for="pop-pack-event" class="ov-label mb-1.5">{{ t('pop_pack_event') }}</label>
                    <select id="pop-pack-event" v-model="state.packEvent" class="input-glass w-full h-9 px-3 text-sm">
                        <option v-for="e in EVENT_OPTIONS" :key="e.id" :value="e.id">{{ t(e.label) }}</option>
                    </select>
                    <p class="text-[11px] text-slate-400 mt-1">{{ t('pop_pack_price') }}: <span class="text-slate-100 font-semibold tabular-nums">{{ formatNum(packPrice) }}</span></p>
                </div>
                <div>
                    <label for="pop-item-event" class="ov-label mb-1.5">{{ t('pop_item_event') }}</label>
                    <select id="pop-item-event" v-model="state.itemEvent" class="input-glass w-full h-9 px-3 text-sm">
                        <option v-for="e in EVENT_OPTIONS" :key="e.id" :value="e.id">{{ t(e.label) }}</option>
                    </select>
                </div>
            </div>

            <!-- Item considerati -->
            <div class="ov-panel p-5 grid gap-3">
                <h3 class="ov-sh">{{ t('pop_options_title') }}</h3>
                <div class="space-y-1.5">
                    <label v-for="o in [...boosterOpts, ...ampOpts]" :key="o.id"
                           class="flex items-center gap-2.5 px-1 py-1 rounded-md hover:bg-white/[0.03] cursor-pointer">
                        <input type="checkbox" v-model="state.enabled[o.id]" class="w-4 h-4 accent-cyan-400">
                        <span class="flex-1 text-[13px] text-slate-200">{{ itemLabel(o) }}</span>
                        <span class="text-xs text-slate-400 tabular-nums">{{ formatNum(o.cost) }}</span>
                    </label>
                </div>
            </div>

            <!-- Produzione -->
            <div class="ov-panel p-5 grid gap-2.5" style="--tc:#38bdf8">
                <div class="ov-stat"><span class="ov-stat-k">{{ t('pop_base_prod') }}</span><span class="ov-stat-v">{{ formatNum(production.dailyNoItems) }}</span></div>
                <div class="ov-stat"><span class="ov-stat-k">{{ t('pop_current_prod') }}</span><span class="text-base font-semibold text-slate-300 tabular-nums">{{ formatNum(production.dailyCurrent) }}</span></div>
                <p class="text-[11px] text-slate-400 leading-snug">{{ t('pop_base_prod_hint') }}</p>
            </div>
        </div>

        <!-- Colonna risultati -->
        <div class="lg:col-span-2 grid gap-4 min-w-0">
            <!-- Risultato ottimo -->
            <div v-if="optimal" class="ov-panel p-5 grid gap-4" style="--tc:#34d399">
                <h3 class="ov-sh">{{ t('pop_strat_optimal') }}</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-px bg-ogame-line rounded-lg overflow-hidden [&>div]:bg-ogame-panel [&>div]:px-3 [&>div]:py-2.5">
                    <div>
                        <div class="ov-stat-k">{{ t('pop_total_metal') }}</div>
                        <div class="ov-stat-v">{{ formatNum(optimal.total) }}</div>
                    </div>
                    <div>
                        <div class="ov-stat-k">{{ t('pop_packs') }}</div>
                        <div class="ov-stat-v text-amber-300">
                            {{ formatNum(optimal.packs) }}
                            <span v-if="optimal.extraPacks" class="text-sm text-slate-400">(+{{ formatNum(optimal.extraPacks) }})</span>
                        </div>
                    </div>
                    <div>
                        <div class="ov-stat-k">{{ t('pop_pack_value') }}</div>
                        <div class="ov-stat-v">{{ formatNum(optimal.packValue) }}</div>
                    </div>
                    <div>
                        <div class="ov-stat-k">{{ t('pop_gain') }}</div>
                        <div class="ov-stat-v" :class="optimal.total > noneTotal ? '!text-emerald-400' : '!text-slate-400'">
                            +{{ noneTotal > 0 ? formatPct((optimal.total / noneTotal - 1) * 100, 2) : '0,00' }}%
                        </div>
                    </div>
                </div>
                <div class="flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-slate-400">
                    <span>{{ t('pop_items_cost') }}: <b class="text-slate-100 tabular-nums">{{ formatNum(optimal.itemsCost) }}</b></span>
                    <span>{{ t('pop_packs_cost') }}: <b class="text-slate-100 tabular-nums">{{ formatNum(optimal.extraPacks * packPrice) }}</b></span>
                    <span>{{ t('pop_leftover') }}: <b class="text-slate-300">{{ formatNum(optimal.leftover) }}</b></span>
                </div>
                <div v-if="shoppingSummary.length" class="flex flex-wrap gap-2">
                    <span v-for="s in shoppingSummary" :key="s.item.id"
                          class="px-2.5 py-1 rounded-md bg-ogame-raised border border-slate-700 text-xs text-slate-200">
                        {{ s.n }}× {{ itemLabel(s.item) }}
                    </span>
                </div>
            </div>

            <!-- Confronto strategie -->
            <div class="ov-panel p-5 grid gap-3">
                <h3 class="ov-sh">{{ t('pop_results_title') }}</h3>
                <div class="overflow-x-auto -mx-2">
                    <table class="w-full text-[13px] tabular-nums min-w-[520px]">
                        <thead>
                            <tr class="font-mono text-[11px] uppercase tracking-[0.08em] text-slate-400 text-left">
                                <th class="px-2 py-2 font-bold">{{ t('pop_strategy') }}</th>
                                <th class="px-2 py-2 font-bold text-right">{{ t('pop_items_cost') }}</th>
                                <th class="px-2 py-2 font-bold text-right">{{ t('pop_packs') }}</th>
                                <th class="px-2 py-2 font-bold text-right">{{ t('pop_total_metal') }}</th>
                                <th class="px-2 py-2 font-bold text-right">{{ t('pop_vs_best') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="s in strategies" :key="s.id" class="border-t border-ogame-line"
                                :class="s.optimal ? 'bg-emerald-400/[0.06]' : ''">
                                <td class="px-2 py-2" :class="s.optimal ? 'text-slate-100 font-semibold' : 'text-slate-300'">{{ strategyLabel(s) }}</td>
                                <td class="px-2 py-2 text-right text-slate-300">{{ formatNum(s.res.itemsCost) }}</td>
                                <td class="px-2 py-2 text-right text-slate-200">
                                    {{ formatNum(s.res.packs) }}<span v-if="s.res.extraPacks" class="text-slate-400"> (+{{ formatNum(s.res.extraPacks) }})</span>
                                </td>
                                <td class="px-2 py-2 text-right text-slate-100">{{ formatNum(s.res.total) }}</td>
                                <td class="px-2 py-2 text-right font-mono" :class="s.vsBest >= -0.0001 ? 'text-emerald-400' : 'text-slate-400'">
                                    {{ s.vsBest >= -0.0001 ? '—' : formatPct(s.vsBest, 2) + '%' }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p class="text-[11px] text-slate-400">{{ t('pop_unaffordable_hidden') }}</p>
            </div>

            <!-- Piano per pianeta -->
            <div v-if="plan.length" class="ov-panel p-5 grid gap-3">
                <h3 class="ov-sh">{{ t('pop_plan_title') }}</h3>
                <div class="overflow-x-auto -mx-2">
                    <table class="w-full text-[13px] tabular-nums min-w-[480px]">
                        <thead>
                            <tr class="font-mono text-[11px] uppercase tracking-[0.08em] text-slate-400 text-left">
                                <th class="px-2 py-2 font-bold">{{ t('pop_planet') }}</th>
                                <th class="px-2 py-2 font-bold text-right">{{ t('pop_mine_daily') }}</th>
                                <th class="px-2 py-2 font-bold">{{ t('pop_items') }}</th>
                                <th class="px-2 py-2 font-bold text-right">{{ t('pop_cost') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="r in plan" :key="r.idx" class="border-t border-ogame-line">
                                <td class="px-2 py-2 text-slate-300">
                                    {{ r.name }} <span v-if="r.pos" class="text-slate-400">[{{ r.pos }}]</span>
                                </td>
                                <td class="px-2 py-2 text-right text-slate-300">{{ formatNum(r.perPct * 100) }}</td>
                                <td class="px-2 py-2">
                                    <span v-if="!r.combo.b && !r.combo.a" class="text-slate-400">—</span>
                                    <span v-else class="flex flex-wrap gap-1">
                                        <span v-if="r.combo.b" class="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300">{{ shortLabel(r.combo.b) }}</span>
                                        <span v-if="r.combo.a" class="px-1.5 py-0.5 rounded bg-ogame-accent/10 text-ogame-accent">{{ shortLabel(r.combo.a) }}</span>
                                    </span>
                                </td>
                                <td class="px-2 py-2 text-right text-slate-300">{{ r.combo.cost ? formatNum(r.combo.cost) : '—' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    <!-- Barra fissa dei risultati: portata fuori dal contenitore della pagina, a tutta larghezza come le altre -->
    <Teleport defer to="#pack-resultbar-slot">
    <div v-if="optimal" class="ov-resultbar">
      <div class="ov-resultbar-in">
        <div class="ov-stat"><span class="ov-stat-k">{{ t('pop_total_metal') }}</span><span class="ov-stat-v">{{ formatNum(optimal.total) }}</span></div>
        <div class="ov-stat"><span class="ov-stat-k">{{ t('pop_packs') }}</span><span class="ov-stat-v text-amber-300">{{ formatNum(optimal.packs) }}<span v-if="optimal.extraPacks" class="text-sm text-slate-400"> (+{{ formatNum(optimal.extraPacks) }})</span></span></div>
        <div class="ov-stat"><span class="ov-stat-k">{{ t('pop_gain') }}</span><span class="ov-stat-v text-emerald-400">+{{ noneTotal > 0 ? formatPct((optimal.total / noneTotal - 1) * 100, 2) : '0,00' }}%</span></div>
      </div>
    </div>
    </Teleport>
  </div>
</template>
