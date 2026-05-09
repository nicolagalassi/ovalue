<script setup>
import { computed } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useOgameFormulas } from '../composables/useOgameFormulas';

const props = defineProps({
    planet: Object,
    index: Number,
    global: Object
});

const emit = defineEmits(['clone', 'remove']);
const { t } = useLanguage();
const { formatNum, calcMineProduction, getPosMult, calcCrawlerCap } = useOgameFormulas();

const breakdown = computed(() => {
    const p = props.planet;
    const g = props.global;

    const met = parseInt(p.metal) || 0;
    const cry = parseInt(p.crystal) || 0;
    const deu = parseInt(p.deuterium) || 0;
    const posMult = getPosMult(p.pos);

    const natProd = Math.floor(30 * g.ecoSpeed * posMult);
    const mineBase = calcMineProduction(met, g.ecoSpeed, posMult);

    let bonuses = [];
    let totPerc = 0;
    const collFactor = 1 + ((g.rocktalEnhancement || 0) / 100);

    if (g.plasma > 0) { const v = g.plasma; bonuses.push({ n: 'Plasma', v }); totPerc += v; }
    if (g.geologist) { bonuses.push({ n: t('lbl_geo'), v: 10 }); totPerc += 10; }
    if (g.staff) { bonuses.push({ n: t('lbl_staff'), v: 2 }); totPerc += 2; }
    if (g.playerClass === 'collector') { const v = 25 * collFactor; bonuses.push({ n: 'Collector', v }); totPerc += v; }
    if (g.allyClass === 'trader') { bonuses.push({ n: 'Trader', v: 5 }); totPerc += 5; }

    const itemV = (parseInt(p.item) || 0) + (parseInt(p.itemCustom) || 0);
    if (itemV > 0) { bonuses.push({ n: t('lbl_item'), v: itemV }); totPerc += itemV; }

    const magma = parseInt(p.magma) || 0;
    if (magma > 0 && p.lifeform === 'rocktal') { const v = magma * 2; bonuses.push({ n: `${t('lbl_magma')} (${magma})`, v }); totPerc += v; }

    const human = parseInt(p.human) || 0;
    if (human > 0 && p.lifeform === 'humans') { const v = human * 1.5; bonuses.push({ n: `${t('lbl_human')} (${human})`, v }); totPerc += v; }

    if (g.lfBonus > 0) { bonuses.push({ n: 'Tech LF', v: g.lfBonus }); totPerc += g.lfBonus; }

    const isCollector = g.playerClass === 'collector';
    const maxCraw = calcCrawlerCap(met, cry, deu, isCollector, g.geologist, g.rocktalEnhancement);
    const craw = parseInt(p.crawlers) || 0;
    const actCraw = Math.min(craw, maxCraw);

    if (actCraw > 0) {
        let multiplier = 0.02;
        if (g.playerClass === 'collector') {
            multiplier *= (1 + (50 * collFactor) / 100);
            if (p.overload) multiplier *= 1.5;
        }
        const cP = Math.min(actCraw * multiplier, 50);
        bonuses.push({ n: `Crawler (${actCraw})`, v: cP });
        totPerc += cP;
    }

    const bonusProd = Math.floor(mineBase * (totPerc / 100));
    const total = Math.floor(natProd + mineBase + bonusProd);

    return { mineBase, natProd, bonuses, total, maxCraw, isCrawCapReached: craw > maxCraw };
});
</script>

<template>
  <div class="planet-card bg-[#0d1525] rounded-xl border border-slate-700/25 hover:border-slate-600/40 transition-all duration-200 overflow-hidden flex flex-col">

    <!-- ── HEADER: numero + nome + posizione + azioni ───────────── -->
    <div class="flex items-center gap-2 px-3 py-2 border-b border-slate-700/20 bg-[#0a101e]">
      <span class="w-6 h-6 rounded bg-sky-500/[0.08] border border-sky-500/20 text-sky-400 text-[11px] font-black flex items-center justify-center flex-shrink-0 font-mono">
        {{ index + 1 }}
      </span>
      <input type="text" v-model="planet.name"
             class="flex-grow bg-transparent border-none text-slate-200 text-sm font-medium focus:ring-0 p-0 placeholder:text-slate-700 min-w-0"
             :placeholder="t('lbl_planet')" />
      <!-- Posizione in header -->
      <select v-model.number="planet.pos"
              class="bg-[#0d1525] border border-slate-700/30 rounded-lg text-[11px] text-slate-400 px-2 py-1 focus:outline-none focus:border-sky-500/40 flex-shrink-0 cursor-pointer">
        <option value="8">P8 ×1.35</option>
        <option value="7">P7 ×1.23</option>
        <option value="9">P9 ×1.23</option>
        <option value="6">P6 ×1.17</option>
        <option value="10">P10 ×1.17</option>
        <option value="1">Std ×1.00</option>
      </select>
      <button @click="emit('clone')" :title="t('btn_clone')"
              class="p-1.5 text-slate-600 hover:text-sky-400 hover:bg-sky-500/[0.07] rounded-lg transition flex-shrink-0">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
      </button>
      <button @click="emit('remove')" :title="t('btn_delete')"
              class="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/[0.07] rounded-lg transition flex-shrink-0">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- ── MINIERE: 3 grandi input numerici ─────────────────────── -->
    <div class="grid grid-cols-3 border-b border-slate-700/20">
      <div class="px-3 pt-3 pb-2 border-r border-slate-700/15">
        <div class="text-[9px] text-slate-600 uppercase tracking-widest font-semibold mb-1 flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span> {{ t('res_metal') }}
        </div>
        <input type="number" v-model.number="planet.metal" @focus="$event.target.select()"
               class="w-full bg-transparent border-none text-[22px] font-black text-slate-100 text-center focus:ring-0 p-0 font-mono leading-tight" />
      </div>
      <div class="px-3 pt-3 pb-2 border-r border-slate-700/15">
        <div class="text-[9px] text-sky-500/60 uppercase tracking-widest font-semibold mb-1 flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-sky-500"></span> {{ t('res_crystal') }}
        </div>
        <input type="number" v-model.number="planet.crystal" @focus="$event.target.select()"
               class="w-full bg-transparent border-none text-[22px] font-black text-sky-200 text-center focus:ring-0 p-0 font-mono leading-tight" />
      </div>
      <div class="px-3 pt-3 pb-2">
        <div class="text-[9px] text-emerald-500/60 uppercase tracking-widest font-semibold mb-1 flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {{ t('res_deuterium') }}
        </div>
        <input type="number" v-model.number="planet.deuterium" @focus="$event.target.select()"
               class="w-full bg-transparent border-none text-[22px] font-black text-emerald-200 text-center focus:ring-0 p-0 font-mono leading-tight" />
      </div>
    </div>

    <!-- ── LIFEFORM + CAMPO LF + ITEM ────────────────────────────── -->
    <div class="px-3 py-2 border-b border-slate-700/20 flex items-center gap-2 flex-wrap">

      <!-- LF selector compatto -->
      <div class="flex gap-0.5 bg-[#070c18]/50 rounded-lg p-0.5 flex-shrink-0">
        <button @click="planet.lifeform = 'humans'"
                class="px-2 py-1 rounded-md text-[10px] font-semibold transition-all"
                :class="planet.lifeform === 'humans'
                    ? 'bg-blue-500/20 border border-blue-400/30 text-blue-300'
                    : 'text-slate-600 hover:text-slate-400'">
          {{ t('opt_humans') }}
        </button>
        <button @click="planet.lifeform = 'rocktal'"
                class="px-2 py-1 rounded-md text-[10px] font-semibold transition-all"
                :class="planet.lifeform === 'rocktal'
                    ? 'bg-sky-500/20 border border-sky-400/30 text-sky-300'
                    : 'text-slate-600 hover:text-slate-400'">
          Rock'tal
        </button>
        <button @click="planet.lifeform = 'mecha'"
                class="px-2 py-1 rounded-md text-[10px] font-semibold transition-all"
                :class="planet.lifeform === 'mecha'
                    ? 'bg-violet-500/20 border border-violet-400/30 text-violet-300'
                    : 'text-slate-600 hover:text-slate-400'">
          Mecha
        </button>
      </div>

      <!-- Campo LF specifico (visibile solo se rilevante) -->
      <input v-if="planet.lifeform === 'rocktal'"
             type="number" v-model.number="planet.magma" @focus="$event.target.select()"
             :placeholder="t('lbl_magma')"
             class="w-16 bg-[#070c18]/50 border border-sky-500/20 rounded-lg px-2 py-1 text-[11px] font-mono text-sky-300 text-center focus:outline-none focus:border-sky-400/50" />
      <input v-if="planet.lifeform === 'humans'"
             type="number" v-model.number="planet.human" @focus="$event.target.select()"
             :placeholder="t('lbl_human')"
             class="w-16 bg-[#070c18]/50 border border-blue-500/20 rounded-lg px-2 py-1 text-[11px] font-mono text-blue-300 text-center focus:outline-none focus:border-blue-400/50" />

      <!-- Item + Custom — con label -->
      <div class="flex items-end gap-1.5 ml-auto">
        <div class="flex flex-col gap-0.5">
          <span class="text-[8px] text-slate-700 uppercase tracking-wider font-semibold text-center">{{ t('lbl_item') }}</span>
          <select v-model.number="planet.item"
                  class="bg-[#070c18]/50 border border-slate-700/25 rounded-lg text-[11px] text-slate-400 px-1.5 py-1 focus:outline-none focus:border-sky-500/40 cursor-pointer">
            <option value="0">–</option>
            <option value="10">+10%</option>
            <option value="20">+20%</option>
            <option value="30">+30%</option>
            <option value="40">+40%</option>
          </select>
        </div>
        <div class="flex flex-col gap-0.5">
          <span class="text-[8px] text-slate-700 uppercase tracking-wider font-semibold text-center">{{ t('lbl_item_additional') }}</span>
          <input type="number" v-model.number="planet.itemCustom" @focus="$event.target.select()"
                 placeholder="+%"
                 class="w-12 bg-[#070c18]/50 border border-slate-700/25 rounded-lg px-1.5 py-1 text-[11px] font-mono text-slate-400 text-center focus:outline-none focus:border-sky-500/40" />
        </div>
      </div>
    </div>

    <!-- ── CRAWLER ─────────────────────────────────────────────────── -->
    <div class="px-3 py-2 border-b border-slate-700/20 flex items-center gap-3">
      <svg class="w-3.5 h-3.5 text-amber-400/50 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
      </svg>
      <input type="number" v-model.number="planet.crawlers" @focus="$event.target.select()"
             class="w-20 bg-[#070c18]/50 border border-amber-500/20 rounded-lg px-2 py-1 text-sm font-mono text-amber-300 text-center focus:outline-none focus:border-amber-400/50" />
      <span class="text-[10px] text-slate-600 font-mono">/ {{ breakdown.maxCraw }}</span>

      <!-- Overload toggle -->
      <label class="flex items-center gap-1.5 cursor-pointer ml-auto"
             :class="{'opacity-40 cursor-not-allowed': global.playerClass !== 'collector'}" :title="t('lbl_overload')">
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

    <!-- ── PRODUZIONE FOOTER ──────────────────────────────────────── -->
    <div class="bg-[#0a101e] px-3 pt-2.5 pb-3 flex-grow flex flex-col justify-between">

      <!-- Dettagli base -->
      <div class="flex items-center justify-between text-[10px] text-slate-600 font-mono mb-1.5">
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

      <!-- Totale orario — prominente -->
      <div class="flex items-center justify-between pt-2 border-t border-slate-700/20">
        <span class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{{ t('footer_prod_hour') }}</span>
        <span class="text-xl font-black font-mono text-sky-300 leading-none">{{ formatNum(breakdown.total) }}</span>
      </div>
    </div>

  </div>
</template>
