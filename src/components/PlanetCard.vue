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
    
    const natProd = 30 * g.ecoSpeed * posMult;
    const mineBase = calcMineProduction(met, g.ecoSpeed, posMult);

    let bonuses = [];
    let totPerc = 0;

    if (g.plasma > 0) { 
        const v = g.plasma * 1; 
        bonuses.push({n:'Plasma', v}); 
        totPerc += v; 
    }
    
    if (g.geologist) { 
        bonuses.push({n: t('lbl_geo'), v: 10}); 
        totPerc += 10; 
    }
    
    if (g.staff) { 
        bonuses.push({n: t('lbl_staff'), v: 2}); 
        totPerc += 2; 
    }
    
    if (g.playerClass === 'collector') { 
        bonuses.push({n: 'Collector', v: 25}); 
        totPerc += 25; 
    }
    
    if (g.allyClass === 'trader') { 
        bonuses.push({n: 'Trader', v: 5}); 
        totPerc += 5; 
    }
    
    const combinedItem = parseInt(p.item||0) + parseInt(p.itemCustom||0);
    if (combinedItem > 0) { 
        bonuses.push({n: t('lbl_item'), v: combinedItem}); 
        totPerc += combinedItem; 
    }

    const magma = parseInt(p.magma) || 0;
    if (magma > 0) { 
        const v = magma * 2; 
        bonuses.push({n: `${t('lbl_magma')} (${magma})`, v}); 
        totPerc += v; 
    }
    
    const human = parseInt(p.human) || 0;
    if (human > 0) { 
        const v = human * 1.5; 
        bonuses.push({n: `${t('lbl_human')} (${human})`, v}); 
        totPerc += v; 
    }

    if (g.lfBonus > 0) { 
        bonuses.push({n: 'Tech LF', v: g.lfBonus}); 
        totPerc += g.lfBonus; 
    }

    const maxCraw = calcCrawlerCap(met, cry, deu, g.playerClass === 'collector', g.geologist);
    const craw = parseInt(p.crawlers) || 0;
    const actCraw = Math.min(craw, maxCraw);
    
    if (actCraw > 0) {
        let multiplier = 0.02;
        if (g.playerClass === 'collector') {
            multiplier *= 1.5; 
            if (p.overload) multiplier *= 1.5;
        }
        const cP = actCraw * multiplier;
        bonuses.push({n: `Crawler (${actCraw})`, v: cP}); 
        totPerc += cP;
    }

    const bonusProd = Math.floor(mineBase * (totPerc / 100));
    const total = Math.floor(natProd + mineBase + bonusProd);

    return {
        mineBase,
        natProd,
        bonuses,
        total,
        maxCraw,
        isCrawCapReached: craw > maxCraw
    };
});
</script>

<template>
  <div class="card-glass p-1 relative group flex flex-col transition-all duration-500 hover:shadow-neon-blue hover:-translate-y-1">
    
    <div class="bg-black/20 rounded-t-xl p-4 flex justify-between items-center border-b border-white/5">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-ogame-accent font-bold text-sm shadow-lg border border-white/5 font-mono">
                {{ index + 1 }}
            </div>
            <span class="font-bold text-gray-200 tracking-wide">{{ t('lbl_planet') }}</span>
        </div>
        <div class="flex gap-2">
            <button @click="emit('clone')" :title="t('btn_clone')" class="p-2 bg-blue-500/10 hover:bg-blue-500/30 text-blue-400 rounded-lg transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </button>
            <button @click="emit('remove')" :title="t('btn_delete')" class="p-2 bg-red-500/10 hover:bg-red-500/30 text-red-400 rounded-lg transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
    </div>

    <div class="p-5 space-y-5 flex-grow">
        <div class="grid grid-cols-3 gap-3">
            <div class="space-y-1">
                <label class="text-[10px] uppercase font-bold text-gray-400 pl-1">{{ t('res_metal') }}</label>
                <input type="number" v-model.number="planet.metal" @focus="$event.target.select()" class="input-glass w-full px-3 py-2 text-center text-lg font-bold text-gray-200 border-b-2 border-gray-600 focus:border-white">
            </div>
            <div class="space-y-1">
                <label class="text-[10px] uppercase font-bold text-gray-400 pl-1">{{ t('res_crystal') }}</label>
                <input type="number" v-model.number="planet.crystal" @focus="$event.target.select()" class="input-glass w-full px-3 py-2 text-center text-lg font-bold text-gray-200 border-b-2 border-gray-600 focus:border-blue-400">
            </div>
            <div class="space-y-1">
                <label class="text-[10px] uppercase font-bold text-gray-400 pl-1">{{ t('res_deuterium') }}</label>
                <input type="number" v-model.number="planet.deuterium" @focus="$event.target.select()" class="input-glass w-full px-3 py-2 text-center text-lg font-bold text-gray-200 border-b-2 border-gray-600 focus:border-green-400">
            </div>
        </div>

        <div class="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block text-[10px] uppercase font-bold text-gray-500 mb-1">{{ t('lbl_position') }}</label>
                <select v-model.number="planet.pos" class="input-glass w-full px-2 py-2 text-sm">
                    <option value="8">Pos 8 (x1.35)</option>
                    <option value="7">Pos 7 (x1.23)</option>
                    <option value="9">Pos 9 (x1.23)</option>
                    <option value="6">Pos 6 (x1.17)</option>
                    <option value="10">Pos 10 (x1.17)</option>
                    <option value="1">Standard</option>
                </select>
            </div>
            <div>
                <label class="block text-[10px] uppercase font-bold text-gray-500 mb-1">{{ t('lbl_item') }} %</label>
                <div class="flex gap-2">
                    <select v-model.number="planet.item" class="input-glass w-1/2 px-1 py-2 text-sm">
                        <option value="0">-</option>
                        <option value="10">10%</option>
                        <option value="20">20%</option>
                        <option value="30">30%</option>
                        <option value="40">40%</option>
                    </select>
                    <input type="number" v-model.number="planet.itemCustom" @focus="$event.target.select()" placeholder="%" class="input-glass w-1/2 px-1 py-2 text-center text-sm">
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block text-[10px] uppercase font-bold text-gray-500 mb-1 truncate">{{ t('lbl_magma') }}</label>
                <input type="number" v-model.number="planet.magma" @focus="$event.target.select()" class="input-glass w-full px-3 py-2 text-sm font-mono">
            </div>
            <div>
                <label class="block text-[10px] uppercase font-bold text-gray-500 mb-1 truncate">{{ t('lbl_human') }}</label>
                <input type="number" v-model.number="planet.human" @focus="$event.target.select()" class="input-glass w-full px-3 py-2 text-sm font-mono">
            </div>
        </div>

        <div class="bg-gradient-to-r from-ogame-warning/5 to-transparent p-3 rounded-lg border border-ogame-warning/10">
            <div class="flex justify-between items-center mb-2">
                <label class="text-[10px] uppercase font-bold text-ogame-warning flex items-center gap-2">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>
                    {{ t('lbl_crawlers') }}
                </label>
                <span class="text-[9px] text-gray-400">{{ t('lbl_max_supported') }} <span class="text-gray-200 font-bold">{{ breakdown.maxCraw }}</span></span>
            </div>
            
            <input type="number" v-model.number="planet.crawlers" @focus="$event.target.select()" class="input-glass w-full border-ogame-warning/30 focus:border-ogame-warning focus:ring-ogame-warning/50 text-ogame-warning font-bold text-center px-3 py-1.5">

            <div class="flex items-center justify-between mt-3">
                <label class="flex items-center space-x-2 cursor-pointer group select-none" 
                       :class="{'opacity-50 cursor-not-allowed': global.playerClass !== 'collector'}">
                    <div class="relative">
                        <input type="checkbox" v-model="planet.overload" :disabled="global.playerClass !== 'collector'" class="peer sr-only">
                        <div class="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-ogame-warning"></div>
                    </div>
                    <span class="text-[10px] uppercase font-bold tracking-wide" 
                          :class="global.playerClass === 'collector' ? 'text-gray-400 group-hover:text-white' : 'text-gray-600'">
                        {{ t('lbl_overload') }}
                    </span>
                </label>
                <span v-if="breakdown.isCrawCapReached" class="text-[9px] bg-red-900/50 text-red-200 px-2 py-0.5 rounded border border-red-500/30 uppercase">
                    {{ t('msg_crawler_cap') }}
                </span>
            </div>
        </div>
    </div>

    <div class="bg-black/40 rounded-b-xl p-4 border-t border-white/5 backdrop-blur-md">
        <div class="space-y-1 mb-3">
            <div v-for="(b, i) in breakdown.bonuses" :key="i" class="flex justify-between text-[10px]">
                <span class="text-gray-400">{{ b.n }}</span>
                <span class="text-ogame-success font-mono">+{{ formatNum(breakdown.mineBase * (b.v / 100)) }}</span>
            </div>
        </div>
        <div class="pt-3 border-t border-white/10 flex justify-between items-end">
            <span class="text-xs text-gray-500 font-bold uppercase">{{ t('footer_prod_hour') }}</span>
            <span class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-ogame-accent to-blue-400 font-mono tracking-tight drop-shadow-md">
                {{ formatNum(breakdown.total) }}
            </span>
        </div>
    </div>
  </div>
</template>