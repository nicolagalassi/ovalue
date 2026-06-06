<script setup>
import { ref, computed } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useOgameFormulas } from '../composables/useOgameFormulas';
import { OGAME_DB } from '../data/ogame_db';

const props = defineProps({
    planet: Object,
    index: Number,
    global: Object,
    lfResearchPct: { type: Object, default: () => ({ metal: 0, collectorBonus: 0 }) },
    showLfResearch: { type: Boolean, default: false }
});

const emit = defineEmits(['clone', 'remove', 'toggle-lf-research']);
const { t } = useLanguage();
const { formatNum, calcPlanetMetalProduction } = useOgameFormulas();

// Ricerche LF ordinate per tier (T1→T18), solo quelle con bonus metallo o collector.
// Il colore identifica la specie; nessun raggruppamento per specie.
const lfResearchByTier = computed(() => {
    const flat = [];
    for (const lf of ['humans', 'rocktal', 'mecha', 'kaelesh']) {
        const cat = OGAME_DB[`lf_${lf}_res`];
        if (!cat) continue;
        for (const [id, item] of Object.entries(cat.items || {})) {
            const b = item.bonus;
            if (b && ((b[0] || 0) > 0 || (b[6] || 0) > 0))
                flat.push({ id, name: item.name || id, bonus: b, species: lf, tier: parseInt(id) % 100 });
        }
    }
    return flat.sort((a, b) => a.tier - b.tier);
});

// Contatore ricerche configurate (per il badge nell'header)
const lfResearchCount = computed(() =>
    Object.values(props.planet.lfResearch || {}).filter(v => v > 0).length
);

const SPECIES_COLORS = {
    humans:  { dot: 'bg-green-400',  text: 'text-green-400/80',  border: 'border-green-500/20',  bg: 'bg-green-500/[0.06]'  },
    rocktal: { dot: 'bg-orange-400', text: 'text-orange-400/80', border: 'border-orange-500/20', bg: 'bg-orange-500/[0.06]' },
    mecha:   { dot: 'bg-blue-400',   text: 'text-blue-400/80',   border: 'border-blue-500/20',   bg: 'bg-blue-500/[0.06]'   },
    kaelesh: { dot: 'bg-violet-400', text: 'text-violet-400/80', border: 'border-violet-500/20', bg: 'bg-violet-500/[0.06]' }
};

// Edifici amplificatori ricerca LF per questa lifeform (nomi dal DB)
const lfMetalBuildings = computed(() => {
    const lf = props.planet.lifeform || 'humans';
    const bldMap = {
        humans: ['1011'],
        rocktal: [],
        mecha: ['3007', '3011'],
        kaelesh: ['4007']
    };
    const ids = bldMap[lf] || [];
    const catKey = `lf_${lf}`;
    const cat = OGAME_DB[catKey];
    if (!cat) return [];
    return ids.map(id => {
        const item = cat.items[id];
        return { id, name: item?.name || id };
    });
});

// Moltiplicatore combinato (lifeform level + edifici amplificatori) per il display nella card.
// Gli edifici del pianeta amplificano tutte le ricerche, indipendentemente dalla specie.
// Formula additiva OGame: lf_level + tutti gli edifici sommati, non moltiplicati
const planetResearchMult = computed(() => {
    const bld      = props.planet.lfBuildings || {};
    const metroLvl = parseInt(bld['1011']) || 0;
    const hptLvl   = parseInt(bld['3007']) || 0;
    const cmpLvl   = parseInt(bld['3011']) || 0;
    const cloneLvl = parseInt(bld['4007']) || 0;
    const lfLevel  = parseInt(props.planet.lifeformLevel) || 0;
    return 1 + lfLevel*0.001 + metroLvl*0.005 + hptLvl*0.003 + cmpLvl*0.004 + cloneLvl*0.0025;
});

// Verifica se una ricerca LF è attiva. Default: inattiva (deve essere true esplicito)
const isLfActive = (id) => props.planet.lfActive?.[id] === true;

// Toggle attivazione ricerca
const toggleLfResearch = (id) => {
    if (!props.planet.lfActive) props.planet.lfActive = {};
    props.planet.lfActive[id] = !isLfActive(id);
};

const breakdown = computed(() => {
    const p = props.planet;
    const g = props.global;

    // Calcolo autorizzativo: delegato alla funzione condivisa.
    // Tutti i valori numerici (total, mineBase, natProd, maxCraw, actCraw, collFactor)
    // provengono da qui — nessuna formula duplicata.
    const core = calcPlanetMetalProduction(p, g, props.lfResearchPct);

    // Chips di dettaglio: solo per il display, i nomi richiedono t() che non è
    // disponibile nella funzione shared. Il totale è core.total, non la somma dei chip.
    const bonuses = [];
    const { collFactor, mineBase, actCraw } = core;

    if (g.plasma > 0) bonuses.push({ n: 'Plasma', v: g.plasma });
    if (g.geologist) bonuses.push({ n: t('lbl_geo'), v: 10 });
    if (g.staff) bonuses.push({ n: t('lbl_staff'), v: 2 });
    if (g.playerClass === 'collector') bonuses.push({ n: 'Collector', v: 25 * collFactor });
    if (g.allyClass === 'trader') bonuses.push({ n: 'Trader', v: 5 });
    const itemV = (parseInt(p.item) || 0) + (parseInt(p.itemCustom) || 0);
    if (itemV > 0) bonuses.push({ n: t('lbl_item'), v: itemV });
    const magma = parseInt(p.magma) || 0;
    if (magma > 0 && p.lifeform === 'rocktal') bonuses.push({ n: `${t('lbl_magma')} (${magma})`, v: magma * 2 });
    const human = parseInt(p.human) || 0;
    if (human > 0 && p.lifeform === 'humans') bonuses.push({ n: `${t('lbl_human')} (${human})`, v: human * 1.5 });
    const lfMetal = props.lfResearchPct?.metal || 0;
    if (lfMetal > 0) bonuses.push({ n: t('lbl_lf_research_abbr'), v: lfMetal });
    const hasLfResearch = Object.values(p.lfResearch || {}).some(v => v);
    if (!hasLfResearch && (g.lfBonus || 0) > 0) bonuses.push({ n: t('lbl_lf_tech_abbr'), v: g.lfBonus });
    if (actCraw > 0) {
        let mult = 0.02;
        if (g.playerClass === 'collector') {
            mult *= (1 + (50 * collFactor) / 100);
            if (p.overload) mult *= 1.5;
        }
        bonuses.push({ n: `Crawler (${actCraw})`, v: Math.min(actCraw * mult, 50) });
    }

    return { ...core, bonuses };
});
</script>

<template>
  <div class="planet-card bg-ogame-panel rounded-xl border border-slate-700/25 hover:border-slate-600/40 transition-all duration-200 overflow-hidden flex flex-col">

    <!-- HEADER: numero + nome + posizione + azioni -->
    <div class="flex items-center gap-2 px-3 py-2 border-b border-slate-700/20 bg-ogame-surface">
      <span class="w-6 h-6 rounded bg-sky-500/[0.08] border border-sky-500/20 text-sky-400 text-[11px] font-black flex items-center justify-center flex-shrink-0 font-mono">
        {{ index + 1 }}
      </span>
      <input type="text" v-model="planet.name"
             :aria-label="t('lbl_planet')"
             class="flex-grow bg-transparent border-none text-slate-200 text-sm font-medium focus:ring-0 p-0 placeholder:text-slate-700 min-w-0"
             :placeholder="t('lbl_planet')" />
      <select v-model.number="planet.pos"
              :aria-label="t('lbl_position')"
              class="bg-ogame-panel border border-slate-700/30 rounded-lg text-[11px] text-slate-400 px-2 py-1 focus:outline-none focus:border-sky-500/40 flex-shrink-0 cursor-pointer">
        <option value="8">P8 x1.35</option>
        <option value="7">P7 x1.23</option>
        <option value="9">P9 x1.23</option>
        <option value="6">P6 x1.17</option>
        <option value="10">P10 x1.17</option>
        <option value="1">Std x1.00</option>
      </select>
      <button @click="emit('clone')" :title="t('btn_clone')" :aria-label="t('btn_clone')"
              class="p-2 text-slate-500 hover:text-sky-400 hover:bg-sky-500/[0.07] rounded-lg transition flex-shrink-0">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
      </button>
      <button @click="emit('remove')" :title="t('btn_delete')" :aria-label="t('btn_delete')"
              class="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/[0.07] rounded-lg transition flex-shrink-0">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- MINIERE: 3 grandi input numerici -->
    <div class="grid grid-cols-3 border-b border-slate-700/20">
      <div class="px-3 pt-3 pb-2 border-r border-slate-700/15">
        <label :for="'metal-' + index" class="text-[9px] text-slate-400 uppercase tracking-widest font-semibold mb-1 flex items-center gap-1 cursor-default">
          <span class="w-1.5 h-1.5 rounded-full bg-slate-500" aria-hidden="true"></span> {{ t('res_metal') }}
        </label>
        <input :id="'metal-' + index" type="number" v-model.number="planet.metal" @focus="$event.target.select()"
               class="w-full bg-transparent border-none text-[22px] font-black text-slate-100 text-center focus:ring-0 p-0 font-mono leading-tight" />
      </div>
      <div class="px-3 pt-3 pb-2 border-r border-slate-700/15">
        <label :for="'crystal-' + index" class="text-[9px] text-sky-400/80 uppercase tracking-widest font-semibold mb-1 flex items-center gap-1 cursor-default">
          <span class="w-1.5 h-1.5 rounded-full bg-sky-500" aria-hidden="true"></span> {{ t('res_crystal') }}
        </label>
        <input :id="'crystal-' + index" type="number" v-model.number="planet.crystal" @focus="$event.target.select()"
               class="w-full bg-transparent border-none text-[22px] font-black text-sky-200 text-center focus:ring-0 p-0 font-mono leading-tight" />
      </div>
      <div class="px-3 pt-3 pb-2">
        <label :for="'deut-' + index" class="text-[9px] text-emerald-400/80 uppercase tracking-widest font-semibold mb-1 flex items-center gap-1 cursor-default">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span> {{ t('res_deuterium') }}
        </label>
        <input :id="'deut-' + index" type="number" v-model.number="planet.deuterium" @focus="$event.target.select()"
               class="w-full bg-transparent border-none text-[22px] font-black text-emerald-200 text-center focus:ring-0 p-0 font-mono leading-tight" />
      </div>
    </div>

    <!-- LIFEFORM + CAMPO LF + ITEM -->
    <div class="px-3 pt-2 pb-2 border-b border-slate-700/20 space-y-2">

      <!-- Riga 1: Toggle LF (full width) -->
      <div class="flex gap-0.5 bg-ogame-bg/50 rounded-lg p-0.5">
        <button @click="planet.lifeform = 'humans'"
                class="flex-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all text-center"
                :class="planet.lifeform === 'humans'
                    ? 'bg-green-500/20 border border-green-400/30 text-green-300'
                    : 'text-slate-600 hover:text-slate-400'">
          {{ t('opt_humans') }}
        </button>
        <button @click="planet.lifeform = 'rocktal'"
                class="flex-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all text-center"
                :class="planet.lifeform === 'rocktal'
                    ? 'bg-orange-500/20 border border-orange-400/30 text-orange-300'
                    : 'text-slate-600 hover:text-slate-400'">
          Rock'tal
        </button>
        <button @click="planet.lifeform = 'mecha'"
                class="flex-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all text-center"
                :class="planet.lifeform === 'mecha'
                    ? 'bg-blue-500/20 border border-blue-400/30 text-blue-300'
                    : 'text-slate-600 hover:text-slate-400'">
          Mecha
        </button>
        <button @click="planet.lifeform = 'kaelesh'"
                class="flex-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all text-center"
                :class="planet.lifeform === 'kaelesh'
                    ? 'bg-violet-500/20 border border-violet-400/30 text-violet-300'
                    : 'text-slate-600 hover:text-slate-400'">
          Kaelesh
        </button>
      </div>

      <!-- Riga 2: Edificio LF (sinistra, se presente) + Item (destra) -->
      <div class="flex items-end justify-between gap-2">

        <!-- Campo edificio LF (solo humans/rocktal) -->
        <div v-if="planet.lifeform === 'rocktal'" class="flex flex-col gap-0.5">
          <span class="text-[8px] text-orange-400/60 uppercase tracking-wider font-semibold">{{ t('lbl_magma') }}</span>
          <input type="number" v-model.number="planet.magma" @focus="$event.target.select()"
                 class="w-16 bg-ogame-bg/50 border border-orange-500/20 rounded-lg px-2 py-1 text-[11px] font-mono text-orange-300 text-center focus:outline-none focus:border-orange-400/50" />
        </div>
        <div v-else-if="planet.lifeform === 'humans'" class="flex flex-col gap-0.5">
          <span class="text-[8px] text-green-400/60 uppercase tracking-wider font-semibold">{{ t('lbl_human') }}</span>
          <input type="number" v-model.number="planet.human" @focus="$event.target.select()"
                 class="w-16 bg-ogame-bg/50 border border-green-500/20 rounded-lg px-2 py-1 text-[11px] font-mono text-green-300 text-center focus:outline-none focus:border-green-400/50" />
        </div>
        <!-- Placeholder invisibile per mantenere l'allineamento item a destra -->
        <div v-else class="w-16 flex-shrink-0"></div>

        <!-- Item + Custom (sempre a destra) -->
        <div class="flex items-end gap-1.5">
          <div class="flex flex-col gap-0.5">
            <span class="text-[8px] text-slate-400 uppercase tracking-wider font-semibold text-center">{{ t('lbl_item') }}</span>
            <select v-model.number="planet.item"
                    :aria-label="t('lbl_item')"
                    class="bg-ogame-bg/50 border border-slate-700/25 rounded-lg text-[11px] text-slate-400 px-1.5 py-1 focus:outline-none focus:border-sky-500/40 cursor-pointer">
              <option value="0">&ndash;</option>
              <option value="10">+10%</option>
              <option value="20">+20%</option>
              <option value="30">+30%</option>
              <option value="40">+40%</option>
            </select>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-[8px] text-slate-400 uppercase tracking-wider font-semibold text-center">{{ t('lbl_item_additional') }}</span>
            <input type="number" v-model.number="planet.itemCustom" @focus="$event.target.select()"
                   :aria-label="t('lbl_item_additional')"
                   placeholder="+%"
                 class="w-12 bg-ogame-bg/50 border border-slate-700/25 rounded-lg px-1.5 py-1 text-[11px] font-mono text-slate-400 text-center focus:outline-none focus:border-sky-500/40" />
          </div>
        </div>
      </div>
    </div>

    <!-- CRAWLER -->
    <div class="px-3 py-2 border-b border-slate-700/20 flex items-center gap-3">
      <svg class="w-3.5 h-3.5 text-amber-400/50 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
      </svg>
      <input type="number" v-model.number="planet.crawlers" @focus="$event.target.select()"
             :aria-label="t('lbl_crawlers')"
             class="w-20 bg-ogame-bg/50 border border-amber-500/20 rounded-lg px-2 py-1 text-sm font-mono text-amber-300 text-center focus:outline-none focus:border-amber-400/50" />
      <span class="text-[10px] text-slate-400 font-mono">/ {{ breakdown.maxCraw }}</span>

      <label class="flex items-center gap-1.5 cursor-pointer ml-auto"
             :class="{'opacity-40 cursor-not-allowed': global.playerClass !== 'collector'}"
             :aria-label="t('lbl_overload')" :title="t('lbl_overload')">
        <div class="relative">
          <input type="checkbox" v-model="planet.overload" :disabled="global.playerClass !== 'collector'" class="sr-only peer">
          <div class="w-8 h-4 bg-slate-800 rounded-full border border-slate-700/40 peer-checked:bg-amber-600/30 peer-checked:border-amber-500/40 transition-all"></div>
          <div class="absolute top-0.5 left-0.5 w-3 h-3 bg-slate-500 rounded-full peer-checked:translate-x-4 peer-checked:bg-amber-400 transition-all duration-200"></div>
        </div>
        <span class="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">150%</span>
      </label>

      <span v-if="breakdown.isCrawCapReached"
            class="text-[9px] text-rose-400/80 font-mono uppercase bg-rose-500/[0.08] border border-rose-500/20 px-1.5 py-0.5 rounded flex-shrink-0">
        CAP
      </span>
    </div>

    <!-- RICERCHE LF (collassabile) -->
    <div class="border-b border-slate-700/20">

      <!-- Header toggle -->
      <button @click="$emit('toggle-lf-research')"
              :aria-expanded="showLfResearch"
              :aria-controls="'lf-research-body-' + index"
              class="w-full flex items-center justify-between px-3 py-2 text-[10px] text-purple-400/60 hover:text-purple-300 transition-colors">
        <span class="flex items-center gap-1.5 font-semibold uppercase tracking-wider">
          <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
          {{ t('lf_research_title') }}
          <span v-if="lfResearchCount > 0"
                class="px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/25 text-purple-300 font-mono normal-case tracking-normal">
            {{ lfResearchCount }}
          </span>
        </span>
        <svg class="w-3 h-3 transition-transform duration-200 flex-shrink-0"
             :class="{ 'rotate-180': showLfResearch }"
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <!-- Corpo espandibile -->
      <div v-show="showLfResearch" :id="'lf-research-body-' + index" class="px-3 pb-3">

        <!-- Livello Lifeform -->
        <div class="flex items-center justify-between py-1.5 mb-2 border-b border-slate-700/20">
          <span class="text-[10px] text-slate-500 font-medium">{{ t('lf_lifeform_level') }}</span>
          <input type="number" v-model.number="planet.lifeformLevel" @focus="$event.target.select()" min="0" max="100"
                 :aria-label="t('lf_lifeform_level')"
                 class="w-16 bg-ogame-bg/50 border border-slate-700/30 rounded-md px-1.5 py-1 text-[11px] font-mono text-purple-300 text-center focus:outline-none focus:border-purple-400/40" />
        </div>

        <!-- Ricerche ordinate per tier T1→T18; colore = specie -->
        <div class="space-y-0.5">
          <div v-for="r in lfResearchByTier" :key="r.id"
               class="flex items-center gap-1.5 px-1.5 py-1 rounded-md transition-colors"
               :class="isLfActive(r.id) ? SPECIES_COLORS[r.species].bg : 'bg-transparent'">

            <!-- Dot specie + Tier + Nome -->
            <span class="flex-grow min-w-0 flex items-center gap-1.5 overflow-hidden">
              <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="SPECIES_COLORS[r.species].dot"></span>
              <span class="flex-shrink-0 text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-slate-800/70 transition-colors"
                    :class="isLfActive(r.id) ? 'text-slate-500' : 'text-slate-700'">
                T{{ r.tier }}
              </span>
              <span class="truncate text-[10px] transition-colors cursor-default"
                    :class="isLfActive(r.id) ? 'text-slate-300' : 'text-slate-600 line-through'"
                    :title="r.name">{{ r.name }}</span>
            </span>

            <!-- Toggle attivo/inattivo -->
            <button @click="toggleLfResearch(r.id)"
                    :aria-pressed="isLfActive(r.id)"
                    :aria-label="r.name"
                    class="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-[9px] font-bold transition-all border"
                    :class="isLfActive(r.id)
                        ? 'bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/25'
                        : 'bg-slate-700/20 border-slate-700/40 text-slate-600 hover:border-slate-600/50'">
              <span aria-hidden="true">{{ isLfActive(r.id) ? '✓' : '×' }}</span>
            </button>

            <!-- Input livello -->
            <input type="number" v-model.number="planet.lfResearch[r.id]" @focus="$event.target.select()" min="0"
                   :aria-label="r.name + ' — ' + t('lbl_level_abbr')"
                   class="flex-shrink-0 w-12 bg-ogame-bg/60 border border-slate-700/30 rounded-md px-1 py-1 text-[11px] font-mono text-center focus:outline-none focus:border-purple-400/40 transition-opacity"
                   :class="[isLfActive(r.id) ? 'text-purple-300' : 'text-slate-600 opacity-50']" />

            <!-- Bonus preview -->
            <span class="flex-shrink-0 w-[3.5rem] text-right text-[9px] font-mono"
                  :class="(r.bonus[6]||0) > 0 ? 'text-purple-400/70' : 'text-emerald-500/60'">
              <template v-if="(planet.lfResearch[r.id]||0) > 0 && isLfActive(r.id)">
                <template v-if="(r.bonus[6]||0) > 0">
                  +{{ (planetResearchMult * (r.bonus[6]*100) * (planet.lfResearch[r.id]||0)).toFixed(2) }}%<span class="text-purple-600"> col</span>
                </template>
                <template v-else>
                  +{{ (planetResearchMult * (r.bonus[0]*100) * (planet.lfResearch[r.id]||0)).toFixed(2) }}%
                </template>
              </template>
              <span v-else class="text-slate-700">—</span>
            </span>

          </div>
        </div>

        <!-- Edifici amplificatori -->
        <template v-if="lfMetalBuildings.length > 0">
          <div class="mt-3 pt-2 border-t border-slate-700/20">
            <div class="text-[9px] text-amber-500/60 uppercase tracking-widest font-bold mb-1.5 flex items-center gap-1.5">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              {{ t('lf_section_buildings') }}
            </div>
            <div v-for="b in lfMetalBuildings" :key="b.id"
                 class="flex items-center gap-1.5 px-1.5 py-1 rounded-md bg-amber-500/[0.04]">
              <span class="flex-grow min-w-0 text-[10px] text-slate-400 truncate" :title="b.name">{{ b.name }}</span>
              <input type="number" v-model.number="planet.lfBuildings[b.id]" @focus="$event.target.select()" min="0"
                     :aria-label="b.name + ' — ' + t('lbl_level_abbr')"
                     class="flex-shrink-0 w-12 bg-ogame-bg/60 border border-slate-700/30 rounded-md px-1 py-1 text-[11px] font-mono text-amber-300 text-center focus:outline-none focus:border-amber-400/40" />
              <span class="flex-shrink-0 w-[3.5rem]"></span>
            </div>
          </div>
        </template>

      </div>
    </div>

    <!-- PRODUZIONE FOOTER -->
    <div class="bg-ogame-surface px-3 pt-2.5 pb-3 flex-grow flex flex-col justify-between">

      <!-- Dettagli base -->
      <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1.5">
        <span>{{ t('lbl_nat_prod') }}: {{ formatNum(breakdown.natProd) }}</span>
        <span>{{ t('lbl_mine_base') }}: {{ formatNum(breakdown.mineBase) }}</span>
      </div>

      <!-- Bonus chips -->
      <div v-if="breakdown.bonuses.length > 0" class="flex flex-wrap gap-1 mb-2">
        <span v-for="(b, i) in breakdown.bonuses" :key="i"
              class="inline-flex items-center text-[9px] bg-emerald-500/[0.06] border border-emerald-500/15 text-emerald-400/70 px-1.5 py-0.5 rounded font-mono">
          +{{ formatNum(breakdown.mineBase * (b.v / 100)) }}
          <span class="text-emerald-700 ml-0.5">{{ b.n }}</span>
        </span>
      </div>

      <!-- Totale orario -->
      <div class="flex items-center justify-between pt-2 border-t border-slate-700/20">
        <span class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{{ t('footer_prod_hour') }}</span>
        <span class="text-xl font-black font-mono text-ogame-accent leading-none">{{ formatNum(breakdown.total) }}</span>
      </div>
    </div>

  </div>
</template>
