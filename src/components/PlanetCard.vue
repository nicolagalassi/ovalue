<script setup>
import { ref, computed } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useOgameFormulas } from '../composables/useOgameFormulas';
import { OGAME_DB, METAL_BOOSTER_PCTS, RES_AMP_PCTS } from '../data/ogame_db';
import NumStepper from './NumStepper.vue';

const props = defineProps({
    planet: Object,
    index: Number,
    global: Object,
    lfResearchPct: { type: Object, default: () => ({ metal: 0, collectorBonus: 0 }) },
    showLfResearch: { type: Boolean, default: false }
});

const emit = defineEmits(['clone', 'remove', 'toggle-lf-research']);
const { t } = useLanguage();
const { formatNum, calcPlanetMetalProduction, calcPlanetResearchMult } = useOgameFormulas();

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

// Amplificatore di risorse: item unico OGame con tagli fissi 15/20/25/30/40%.
// Un valore fuori scala salvato prima (quando il campo era libero) resta
// selezionabile finché non si sceglie un taglio valido, così non si perde il dato.
const RES_AMP_STEPS = RES_AMP_PCTS;
const resAmpOptions = computed(() => {
    const v = parseInt(props.planet.itemCustom) || 0;
    return (v > 0 && !RES_AMP_STEPS.includes(v))
        ? [...RES_AMP_STEPS, v].sort((a, b) => a - b)
        : RES_AMP_STEPS;
});

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
const planetResearchMult = computed(() => calcPlanetResearchMult(props.planet));

// Verifica se una ricerca LF è attiva. Default: inattiva (deve essere true esplicito)
const isLfActive = (id) => props.planet.lfActive?.[id] === true;

// Card compatta: i controlli si aprono con "Modifica pianeta"
const editOpen = ref(false);

// Riassunto per la card chiusa
const lifeformLabel = computed(() => t('opt_' + (props.planet.lifeform || 'humans')));
const pctLabel = (v) => (parseInt(v) || 0) > 0 ? `+${parseInt(v)}%` : '–';
// Bonus metallo delle ricerche LF attive (stesso valore usato nel calcolo)
const lfMetalPct = computed(() => props.lfResearchPct?.fromResearch ? (props.lfResearchPct.metal || 0) : 0);
const fmtPct = (v) => (Math.round(v * 10) / 10).toLocaleString(undefined, { maximumFractionDigits: 1 });

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

    // c = colore della fonte, uguale nella barra e nella tabella
    if (g.plasma > 0) bonuses.push({ n: 'Plasma', v: g.plasma, c: '#a78bfa' });
    if (g.geologist) bonuses.push({ n: t('lbl_geo'), v: 10, c: '#f472b6' });
    if (g.staff) bonuses.push({ n: t('lbl_staff'), v: 2, c: '#94a3b8' });
    if (g.playerClass === 'collector') bonuses.push({ n: 'Collector', v: 25 * collFactor, c: '#22d3ee' });
    if (g.allyClass === 'trader') bonuses.push({ n: 'Trader', v: 5, c: '#facc15' });
    const itemV = (parseInt(p.item) || 0) + (parseInt(p.itemCustom) || 0);
    if (itemV > 0) bonuses.push({ n: t('lbl_item'), v: itemV, c: '#fb923c' });
    const magma = parseInt(p.magma) || 0;
    if (magma > 0 && p.lifeform === 'rocktal') bonuses.push({ n: `${t('lbl_magma')} (${magma})`, v: magma * 2, c: '#f97316' });
    const human = parseInt(p.human) || 0;
    if (human > 0 && p.lifeform === 'humans') bonuses.push({ n: `${t('lbl_human')} (${human})`, v: human * 1.5, c: '#4ade80' });
    // Stessa regola di calcPlanetMetalProduction: ricerche LF oppure totale manuale, mai entrambi
    if (props.lfResearchPct?.fromResearch) {
        const lfMetal = props.lfResearchPct.metal || 0;
        if (lfMetal > 0) bonuses.push({ n: t('lf_research_title'), v: lfMetal, c: '#34d399' });
    } else if ((g.lfBonus || 0) > 0) {
        bonuses.push({ n: t('lbl_lf_tech_abbr'), v: g.lfBonus, c: '#34d399' });
    }
    if (actCraw > 0) {
        let mult = 0.02;
        if (g.playerClass === 'collector') {
            mult *= (1 + (50 * collFactor) / 100);
            if (p.overload) mult *= 1.5;
        }
        bonuses.push({ n: `Crawler (${actCraw})`, v: Math.min(actCraw * mult, 50), c: '#fbbf24' });
    }
    // Valore orario di ogni bonus: percentuale sulla miniera, come nel calcolo condiviso
    for (const b of bonuses) b.amount = mineBase * (b.v / 100);

    return { ...core, bonuses };
});
</script>

<template>
  <div class="planet-card ov-panel overflow-hidden flex flex-col">

    <!-- HEADER: numero + nome + posizione + azioni -->
    <div class="flex items-center gap-2 px-3.5 py-2.5 border-b border-ogame-line">
      <span class="w-5 text-[11px] font-mono text-slate-400 flex-shrink-0">{{ index + 1 }}</span>
      <input type="text" v-model="planet.name"
             :aria-label="t('lbl_planet')" :title="planet.name"
             class="flex-grow bg-transparent border-none text-slate-100 text-sm font-semibold focus:ring-0 p-0 placeholder:text-slate-400 min-w-0 truncate"
             :placeholder="t('lbl_planet')" />
      <select v-model.number="planet.pos"
              :aria-label="t('lbl_position')"
              class="input-glass text-xs px-2 py-1 flex-shrink-0 cursor-pointer">
        <option value="8">P8 x1.35</option>
        <option value="7">P7 x1.23</option>
        <option value="9">P9 x1.23</option>
        <option value="6">P6 x1.17</option>
        <option value="10">P10 x1.17</option>
        <option value="1">Std x1.00</option>
        <option v-if="![8, 7, 9, 6, 10, 1].includes(Number(planet.pos))" :value="planet.pos">P{{ planet.pos }} x1.00</option>
      </select>
      <button @click="emit('clone')" :title="t('btn_clone')" :aria-label="t('btn_clone')"
              class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-sky-300 border border-ogame-line hover:border-slate-600 rounded-md transition-colors flex-shrink-0">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
      </button>
      <button @click="emit('remove')" :title="t('btn_delete')" :aria-label="t('btn_delete')"
              class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-300 border border-ogame-line hover:border-rose-500/40 rounded-md transition-colors flex-shrink-0">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- PRODUZIONE: risultato, barra composita e tabella delle fonti (sempre visibili) -->
    <div class="bg-ogame-surface px-3.5 py-3 grid gap-2.5 border-b border-ogame-line">
      <div class="flex items-end justify-between gap-3">
        <div>
          <div class="ov-label">{{ t('footer_prod_hour') }}</div>
          <div class="text-[26px] leading-none font-bold text-sky-400 tabular-nums mt-1">{{ formatNum(breakdown.total) }}</div>
        </div>
        <div class="text-right text-xs text-slate-400">
          {{ t('pc_per_day') }}
          <div class="text-sm font-semibold text-slate-100 tabular-nums">{{ formatNum(breakdown.total * 24) }}</div>
        </div>
      </div>

      <div class="flex h-2.5 rounded-full overflow-hidden gap-0.5 bg-ogame-line" role="img"
           :aria-label="t('footer_prod_hour')">
        <i class="block h-full" :style="{ flex: breakdown.mineBase || 0, background: '#38bdf8' }"></i>
        <i v-for="(b, i) in breakdown.bonuses" :key="i" class="block h-full"
           :style="{ flex: b.amount, background: b.c }" :title="b.n"></i>
      </div>

      <div class="src-table text-[11.5px]">
        <i class="sw" style="background:#38bdf8"></i>
        <span class="text-slate-200">{{ t('lbl_mine_base') }}</span>
        <span class="bar" style="color:#38bdf8"><s :style="{ width: breakdown.mineBase > 0 ? '100%' : '0%' }"></s></span>
        <span class="text-slate-400 text-right">{{ t('pc_base') }}</span>
        <span class="text-slate-100 font-semibold text-right tabular-nums">{{ formatNum(breakdown.mineBase) }}</span>
        <template v-for="(b, i) in breakdown.bonuses" :key="i">
          <i class="sw" :style="{ background: b.c }"></i>
          <span class="text-slate-200 truncate" :title="b.n">{{ b.n }}</span>
          <span class="bar" :style="{ color: b.c }"><s :style="{ width: Math.min(100, b.v) + '%' }"></s></span>
          <span class="text-slate-400 text-right tabular-nums">+{{ fmtPct(b.v) }}%</span>
          <span class="text-slate-100 font-semibold text-right tabular-nums">+{{ formatNum(b.amount) }}</span>
        </template>
        <i class="sw bg-slate-700"></i>
        <span class="text-slate-400 col-span-3 min-w-0 truncate">{{ t('lbl_nat_prod') }}</span>
        <span class="text-slate-400 text-right tabular-nums">+{{ formatNum(breakdown.natProd) }}</span>
      </div>
    </div>

    <!-- RIASSUNTO (card chiusa) -->
    <div v-if="!editOpen" class="px-3.5 py-3 grid gap-2 border-b border-ogame-line">
      <div class="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] gap-1.5">
        <div class="min-w-0 flex items-baseline justify-between gap-1.5 px-2.5 py-1.5 rounded-md bg-ogame-surface border border-sky-500/30">
          <span class="ov-label truncate">{{ t('res_metal') }}</span><b class="text-xl tabular-nums text-slate-100">{{ planet.metal }}</b>
        </div>
        <div class="min-w-0 flex items-baseline justify-between gap-1.5 px-2.5 py-1.5 rounded-md bg-ogame-surface border border-ogame-line">
          <span class="ov-label truncate">{{ t('res_crystal') }}</span><b class="text-base tabular-nums text-slate-400">{{ planet.crystal }}</b>
        </div>
        <div class="min-w-0 flex items-baseline justify-between gap-1.5 px-2.5 py-1.5 rounded-md bg-ogame-surface border border-ogame-line">
          <span class="ov-label truncate">{{ t('res_deuterium') }}</span><b class="text-base tabular-nums text-slate-400">{{ planet.deuterium }}</b>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-400">
        <span>{{ lifeformLabel }}</span>·
        <span>Crawler <b class="text-slate-100 tabular-nums">{{ planet.crawlers || 0 }}/{{ breakdown.maxCraw }}</b></span>
        <span v-if="breakdown.isCrawCapReached" class="ov-tag ov-tag-bad">CAP</span>
        <span v-if="planet.overload" class="ov-tag ov-tag-warn">150%</span>·
        <span>{{ t('lbl_item') }} {{ pctLabel(planet.item) }}</span>·
        <span>{{ t('lbl_item_additional') }} {{ pctLabel(planet.itemCustom) }}</span>·
        <span>LF <b class="text-slate-100">{{ lfResearchCount }}</b></span>
      </div>
    </div>

    <!-- MODIFICA (card aperta): tutti i controlli -->
    <template v-else>
      <div class="px-3.5 py-3 grid gap-3 border-b border-ogame-line">
        <!-- Miniere -->
        <div class="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2">
          <div>
            <label :for="'metal-' + index" class="ov-label mb-1">{{ t('res_metal') }}</label>
            <NumStepper :id="'metal-' + index" v-model="planet.metal"
                        input-class="h-9 text-lg font-bold !border-sky-500/45" />
          </div>
          <div>
            <label :for="'crystal-' + index" class="ov-label mb-1">{{ t('res_crystal') }}</label>
            <NumStepper :id="'crystal-' + index" v-model="planet.crystal"
                        input-class="h-9 text-sm font-semibold text-slate-400" />
          </div>
          <div>
            <label :for="'deut-' + index" class="ov-label mb-1">{{ t('res_deuterium') }}</label>
            <NumStepper :id="'deut-' + index" v-model="planet.deuterium"
                        input-class="h-9 text-sm font-semibold text-slate-400" />
          </div>
        </div>

        <!-- Forma di vita -->
        <div class="ov-seg ov-seg-full" role="group" :aria-label="t('lbl_lifeform')">
          <button v-for="lf in ['humans','rocktal','mecha','kaelesh']" :key="lf" type="button"
                  @click="planet.lifeform = lf" :aria-pressed="planet.lifeform === lf">
            {{ t('opt_' + lf) }}
          </button>
        </div>

        <!-- Edificio LF (solo Umani/Rock'tal) + Item + Ampl. risorse -->
        <div class="grid gap-2" :class="planet.lifeform === 'rocktal' || planet.lifeform === 'humans' ? 'grid-cols-3' : 'grid-cols-2'">
          <div v-if="planet.lifeform === 'rocktal'">
            <label :for="'magma-' + index" class="ov-label mb-1 truncate">{{ t('lbl_magma') }}</label>
            <NumStepper :id="'magma-' + index" v-model="planet.magma" input-class="h-8 text-sm" />
          </div>
          <div v-else-if="planet.lifeform === 'humans'">
            <label :for="'human-' + index" class="ov-label mb-1 truncate">{{ t('lbl_human') }}</label>
            <NumStepper :id="'human-' + index" v-model="planet.human" input-class="h-8 text-sm" />
          </div>
          <div>
            <label :for="'item-' + index" class="ov-label mb-1">{{ t('lbl_item') }}</label>
            <select :id="'item-' + index" v-model.number="planet.item" class="input-glass w-full h-8 px-2 text-sm cursor-pointer">
              <option value="0">&ndash;</option>
              <option v-for="pct in METAL_BOOSTER_PCTS" :key="pct" v-memo="[pct]" :value="pct">+{{ pct }}%</option>
            </select>
          </div>
          <div>
            <label :for="'amp-' + index" class="ov-label mb-1">{{ t('lbl_item_additional') }}</label>
            <select :id="'amp-' + index" v-model.number="planet.itemCustom" class="input-glass w-full h-8 px-2 text-sm cursor-pointer">
              <option value="0">&ndash;</option>
              <!-- v-memo: evita che il re-render della scheda riscriva gli attributi delle
                   option (Vue lo fa sempre) chiudendo la tendina nativa già aperta. -->
              <option v-for="pct in resAmpOptions" :key="pct" v-memo="[pct]" :value="pct">+{{ pct }}%</option>
            </select>
          </div>
        </div>

        <!-- Crawler -->
        <div class="flex items-center gap-2">
          <label :for="'craw-' + index" class="ov-label w-14 flex-shrink-0">Crawler</label>
          <NumStepper :id="'craw-' + index" v-model="planet.crawlers" :aria-label="t('lbl_crawlers')"
                      class="w-28" input-class="h-8 text-sm" />
          <span class="text-sm text-slate-400 tabular-nums">/ {{ breakdown.maxCraw }}</span>
          <span v-if="breakdown.isCrawCapReached" class="ov-tag ov-tag-bad">CAP</span>
          <label class="flex items-center gap-1.5 cursor-pointer ml-auto"
                 :class="{'opacity-50 cursor-not-allowed': global.playerClass !== 'collector'}"
                 :title="t('lbl_overload')">
            <span class="relative">
              <input type="checkbox" v-model="planet.overload" :disabled="global.playerClass !== 'collector'" class="sr-only peer" :aria-label="t('lbl_overload')">
              <span class="block w-8 h-[18px] bg-slate-700 rounded-full peer-checked:bg-amber-500/50 peer-focus-visible:ring-2 peer-focus-visible:ring-ogame-accent/60 transition-colors"></span>
              <span class="absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-slate-400 rounded-full peer-checked:translate-x-3.5 peer-checked:bg-amber-300 transition-transform duration-150"></span>
            </span>
            <span class="text-xs text-slate-400">150%</span>
          </label>
        </div>
      </div>

      <!-- RICERCHE LF (apribile; stato condiviso da tutte le card) -->
      <div class="border-b border-ogame-line">
        <button @click="$emit('toggle-lf-research')"
                :aria-expanded="showLfResearch"
                :aria-controls="'lf-research-body-' + index"
                class="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
          {{ t('lf_research_title') }}
          <b class="text-slate-100">{{ lfResearchCount }} {{ t('pc_lf_active') }}</b>
          <span v-if="lfMetalPct > 0" class="text-emerald-400">→ +{{ fmtPct(lfMetalPct) }}%</span>
          <svg class="w-3 h-3 ml-auto transition-transform duration-150 flex-shrink-0"
               :class="{ 'rotate-180': showLfResearch }" aria-hidden="true"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        <div v-show="showLfResearch" :id="'lf-research-body-' + index" class="px-3.5 pb-3">
          <!-- Livello Lifeform -->
          <div class="flex items-center justify-between py-1.5 mb-2 border-b border-ogame-line">
            <span class="text-xs text-slate-400">{{ t('lf_lifeform_level') }}</span>
            <input type="number" v-model.number="planet.lifeformLevel" @focus="$event.target.select()" min="0" max="100"
                   :aria-label="t('lf_lifeform_level')"
                   class="input-glass w-16 h-7 px-1.5 text-xs text-center tabular-nums" />
          </div>

          <!-- Ricerche ordinate per tier T1→T18; colore = specie -->
          <div class="space-y-0.5">
            <div v-for="r in lfResearchByTier" :key="r.id"
                 class="flex items-center gap-1.5 px-1.5 py-1 rounded-md transition-colors"
                 :class="isLfActive(r.id) ? SPECIES_COLORS[r.species].bg : 'bg-transparent'">
              <span class="flex-grow min-w-0 flex items-center gap-1.5 overflow-hidden">
                <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="SPECIES_COLORS[r.species].dot"></span>
                <span class="flex-shrink-0 text-[11px] font-mono font-bold px-1 py-0.5 rounded bg-ogame-raised text-slate-400">T{{ r.tier }}</span>
                <span class="truncate text-[11px] cursor-default"
                      :class="isLfActive(r.id) ? 'text-slate-200' : 'text-slate-400 line-through'"
                      :title="r.name">{{ r.name }}</span>
              </span>
              <button @click="toggleLfResearch(r.id)"
                      :aria-pressed="isLfActive(r.id)"
                      :aria-label="r.name"
                      class="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-[11px] font-bold transition-colors border"
                      :class="isLfActive(r.id)
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                          : 'bg-ogame-surface border-slate-700 text-slate-400 hover:border-slate-500'">
                <span aria-hidden="true">{{ isLfActive(r.id) ? '✓' : '×' }}</span>
              </button>
              <input type="number" v-model.number="planet.lfResearch[r.id]" @focus="$event.target.select()" min="0"
                     :aria-label="r.name + ' — ' + t('lbl_level_abbr')"
                     class="input-glass flex-shrink-0 w-12 h-7 px-1 text-[11px] text-center tabular-nums"
                     :class="isLfActive(r.id) ? 'text-slate-100' : 'text-slate-400'" />
              <span class="flex-shrink-0 w-[3.75rem] text-right text-[11px] tabular-nums"
                    :class="(r.bonus[6]||0) > 0 ? 'text-violet-300' : 'text-emerald-400'">
                <template v-if="(planet.lfResearch[r.id]||0) > 0 && isLfActive(r.id)">
                  <template v-if="(r.bonus[6]||0) > 0">
                    +{{ (planetResearchMult * (r.bonus[6]*100) * (planet.lfResearch[r.id]||0)).toFixed(2) }}%<span class="text-violet-400"> col</span>
                  </template>
                  <template v-else>
                    +{{ (planetResearchMult * (r.bonus[0]*100) * (planet.lfResearch[r.id]||0)).toFixed(2) }}%
                  </template>
                </template>
                <span v-else class="text-slate-400">—</span>
              </span>
            </div>
          </div>

          <!-- Edifici amplificatori -->
          <template v-if="lfMetalBuildings.length > 0">
            <div class="mt-3 pt-2 border-t border-ogame-line">
              <div class="ov-sh mb-1.5" style="--tc:#fbbf24">{{ t('lf_section_buildings') }}</div>
              <div v-for="b in lfMetalBuildings" :key="b.id" class="flex items-center gap-1.5 px-1.5 py-1">
                <span class="flex-grow min-w-0 text-[11px] text-slate-300 truncate" :title="b.name">{{ b.name }}</span>
                <input type="number" v-model.number="planet.lfBuildings[b.id]" @focus="$event.target.select()" min="0"
                       :aria-label="b.name + ' — ' + t('lbl_level_abbr')"
                       class="input-glass flex-shrink-0 w-12 h-7 px-1 text-[11px] text-center tabular-nums" />
                <span class="flex-shrink-0 w-[3.75rem]"></span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>

    <!-- Apri / chiudi la modifica -->
    <button type="button" @click="editOpen = !editOpen" :aria-expanded="editOpen"
            class="mt-auto w-full flex items-center gap-2 px-3.5 py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
      {{ editOpen ? t('pc_close') : t('pc_edit') }}
      <svg class="w-3 h-3 ml-auto transition-transform duration-150" :class="{ 'rotate-180': editOpen }" aria-hidden="true"
           fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
    </button>

  </div>
</template>

<style scoped>
/* Tabella delle fonti: colore · nome · barretta · % · valore orario */
.src-table { display: grid; grid-template-columns: 8px minmax(0, 1fr) 56px auto auto; gap: 4px 8px; align-items: center; }
.src-table .sw { width: 8px; height: 8px; border-radius: 2px; display: block; }
.src-table .bar { height: 4px; border-radius: 2px; background: #1e293b; position: relative; overflow: hidden; display: block; }
.src-table .bar > s { position: absolute; inset: 0 auto 0 0; background: currentColor; text-decoration: none; }
</style>
