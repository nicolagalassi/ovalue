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

// CALCOLI REATTIVI
const breakdown = computed(() => {
    const p = props.planet;
    const g = props.global;
    
    // --- 1. Dati Iniziali ---
    const met = parseInt(p.metal) || 0;
    const cry = parseInt(p.crystal) || 0;
    const deu = parseInt(p.deuterium) || 0;
    const posMult = getPosMult(p.pos);
    
    // --- 2. Produzione Naturale ---
    const natProd = 30 * g.ecoSpeed * posMult;
    
    // --- 3. Produzione Base Miniera ---
    const mineBase = calcMineProduction(met, g.ecoSpeed, posMult);

    // --- 4. Calcolo Percentuali Bonus ---
    let bonuses = [];
    let totPerc = 0;

    // Plasma
    if (g.plasma > 0) { 
        const v = g.plasma * 1; 
        bonuses.push({n:'Plasma', v}); 
        totPerc += v; 
    }
    
    // Geologo
    if (g.geologist) { 
        bonuses.push({n: t('lbl_geo'), v: 10}); 
        totPerc += 10; 
    }
    
    // Staff
    if (g.staff) { 
        bonuses.push({n: t('lbl_staff'), v: 2}); 
        totPerc += 2; 
    }
    
    // Classe Collector
    if (g.playerClass === 'collector') { 
        bonuses.push({n: 'Collector', v: 25}); 
        totPerc += 25; 
    }
    
    // Alleanza Mercante
    if (g.allyClass === 'trader') { 
        bonuses.push({n: 'Trader', v: 5}); 
        totPerc += 5; 
    }
    
    // Item + Custom
    const combinedItem = parseInt(p.item||0) + parseInt(p.itemCustom||0);
    if (combinedItem > 0) { 
        bonuses.push({n: t('lbl_item'), v: combinedItem}); 
        totPerc += combinedItem; 
    }

    // Magma Forge
    const magma = parseInt(p.magma) || 0;
    if (magma > 0) { 
        const v = magma * 2; 
        bonuses.push({n: `Magma (${magma})`, v}); 
        totPerc += v; 
    }
    
    // Human
    const human = parseInt(p.human) || 0;
    if (human > 0) { 
        const v = human * 1.5; 
        bonuses.push({n: `Human (${human})`, v}); 
        totPerc += v; 
    }

    // Tech LF
    if (g.lfBonus > 0) { 
        bonuses.push({n: 'Tech LF', v: g.lfBonus}); 
        totPerc += g.lfBonus; 
    }

    // --- 5. Crawlers (LOGICA CORRETTA) ---
    const maxCraw = calcCrawlerCap(met, cry, deu, g.playerClass === 'collector', g.geologist);
    const craw = parseInt(p.crawlers) || 0;
    const actCraw = Math.min(craw, maxCraw);
    
    if (actCraw > 0) {
        let multiplier = 0.02; // Base 0.02%
        
        // Il bonus classe e overload si applicano SOLO se sei collector
        if (g.playerClass === 'collector') {
            multiplier *= 1.5; // Bonus Classe (+50%)
            
            // Overload: Solo se Collector
            if (p.overload) {
                multiplier *= 1.5; // Bonus Overload (+50% ulteriore)
            }
        }
        // Se non sei collector, il multiplier rimane 0.02, e overload viene ignorato.
        
        const cP = actCraw * multiplier;
        bonuses.push({n: `Crawler (${actCraw})`, v: cP}); 
        totPerc += cP;
    }

    // --- 6. Totali ---
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
  <div class="bg-ogame-panel border border-gray-700/50 rounded-xl p-5 hover:border-ogame-accent/50 transition duration-300 relative group flex flex-col shadow-lg">
    
    <div class="flex justify-between items-center mb-5 pb-3 border-b border-gray-800">
        <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-gray-400 font-bold text-xs border border-gray-700">
                #{{ index + 1 }}
            </div>
            <span class="font-bold text-gray-300">{{ t('lbl_planet') }}</span>
        </div>
        <div class="flex gap-2">
            <button @click="emit('clone')" class="px-3 py-1.5 bg-blue-900/40 hover:bg-blue-600 border border-blue-800/50 text-blue-200 text-xs rounded transition flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                <span class="hidden sm:inline">{{ t('btn_clone') }}</span>
            </button>
            <button @click="emit('remove')" class="px-3 py-1.5 bg-red-900/40 hover:bg-red-600 border border-red-800/50 text-red-200 text-xs rounded transition flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                <span class="hidden sm:inline">{{ t('btn_delete') }}</span>
            </button>
        </div>
    </div>

    <div class="space-y-4 flex-grow">
        <div class="bg-gray-800/20 p-3 rounded-lg border border-gray-700/30">
            <div class="mb-3">
                <label class="block text-[11px] uppercase font-bold text-ogame-accent mb-1">{{ t('lbl_mine_metal') }}</label>
                <input type="number" v-model.number="planet.metal" class="w-full bg-[#0d1014] border border-gray-700/50 rounded px-3 py-2 text-white text-sm focus:border-ogame-accent outline-none font-mono">
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-[11px] uppercase font-bold text-gray-500 mb-1">{{ t('lbl_mine_crystal') }}</label>
                    <input type="number" v-model.number="planet.crystal" class="w-full bg-[#0d1014] border border-gray-700/50 rounded px-3 py-2 text-white text-sm focus:border-gray-500 outline-none font-mono">
                </div>
                <div>
                    <label class="block text-[11px] uppercase font-bold text-gray-500 mb-1">{{ t('lbl_mine_deuterium') }}</label>
                    <input type="number" v-model.number="planet.deuterium" class="w-full bg-[#0d1014] border border-gray-700/50 rounded px-3 py-2 text-white text-sm focus:border-gray-500 outline-none font-mono">
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
            <div>
                <label class="block text-[11px] uppercase font-bold text-gray-500 mb-1">{{ t('lbl_position') }}</label>
                <select v-model.number="planet.pos" class="w-full bg-[#0d1014] border border-gray-700 rounded px-2 py-2 text-white text-sm focus:border-ogame-accent outline-none">
                    <option value="8">Pos 8 (x1.35)</option>
                    <option value="7">Pos 7 (x1.23)</option>
                    <option value="9">Pos 9 (x1.23)</option>
                    <option value="6">Pos 6 (x1.17)</option>
                    <option value="10">Pos 10 (x1.17)</option>
                    <option value="1">Standard</option>
                </select>
            </div>
            <div>
                <label class="block text-[11px] uppercase font-bold text-gray-500 mb-1">{{ t('lbl_item') }} %</label>
                <div class="flex gap-1">
                    <select v-model.number="planet.item" class="w-1/2 bg-[#0d1014] border border-gray-700 rounded px-1 py-2 text-white text-sm outline-none">
                        <option value="0">-</option>
                        <option value="10">10%</option>
                        <option value="20">20%</option>
                        <option value="30">30%</option>
                        <option value="40">40%</option>
                    </select>
                    <input type="number" v-model.number="planet.itemCustom" placeholder="%" class="w-1/2 bg-[#0d1014] border border-gray-700 rounded px-1 py-2 text-white text-sm text-center outline-none">
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
            <div>
                <label class="block text-[11px] uppercase font-bold text-gray-500 mb-1 truncate">{{ t('lbl_magma') }}</label>
                <input type="number" v-model.number="planet.magma" placeholder="0" class="w-full bg-[#0d1014] border border-gray-700 rounded px-2 py-2 text-white text-sm font-mono outline-none">
            </div>
            <div>
                <label class="block text-[11px] uppercase font-bold text-gray-500 mb-1 truncate">{{ t('lbl_human') }}</label>
                <input type="number" v-model.number="planet.human" placeholder="0" class="w-full bg-[#0d1014] border border-gray-700 rounded px-2 py-2 text-white text-sm font-mono outline-none">
            </div>
        </div>

        <div class="pt-4 border-t border-gray-800">
            <div class="flex justify-between items-center mb-1">
                <label class="block text-[11px] uppercase font-bold text-ogame-warning mb-0">{{ t('lbl_crawlers') }}</label>
                <span class="text-[10px] text-gray-500">{{ t('lbl_max_supported') }} <span class="text-ogame-warning font-bold">{{ breakdown.maxCraw }}</span></span>
            </div>
            <input type="number" v-model.number="planet.crawlers" class="w-full bg-[#0d1014] border border-ogame-warning/30 rounded px-3 py-2 text-white text-sm focus:border-ogame-warning outline-none font-mono">
            
            <div class="flex items-center justify-between mt-2">
                <label class="flex items-center space-x-2 cursor-pointer group" 
                       :class="{'opacity-50 cursor-not-allowed': global.playerClass !== 'collector'}">
                    
                    <input type="checkbox" 
                           v-model="planet.overload" 
                           :disabled="global.playerClass !== 'collector'"
                           class="w-4 h-4 accent-ogame-warning rounded bg-gray-800 border-gray-600">
                    
                    <span class="text-[10px] transition" 
                          :class="global.playerClass === 'collector' ? 'text-gray-400 group-hover:text-ogame-warning' : 'text-gray-600'">
                        {{ t('lbl_overload') }}
                    </span>
                </label>
                <span v-if="breakdown.isCrawCapReached" class="text-[9px] text-ogame-warning font-bold">{{ t('msg_crawler_cap') }}</span>
            </div>
        </div>
    </div>

    <div class="bg-black/30 p-4 rounded-lg mt-5 font-mono text-[11px] border border-gray-800 space-y-1">
        <div class="flex justify-between text-gray-500"><span>Base</span><span>{{ formatNum(breakdown.mineBase) }}</span></div>
        <div class="flex justify-between text-gray-600 text-[10px] mb-2"><span>Nat.</span><span>{{ formatNum(breakdown.natProd) }}</span></div>
        <div class="border-t border-gray-700 my-2"></div>
        
        <div v-for="(b, i) in breakdown.bonuses" :key="i" class="flex justify-between text-gray-400">
            <span>{{ b.n }} <span class="text-gray-600 text-[9px]">(+{{ b.v.toFixed(2) }}%)</span></span>
            <span class="text-ogame-success">+{{ formatNum(breakdown.mineBase * (b.v / 100)) }}</span>
        </div>

        <div class="border-t border-gray-700 mt-2 pt-2 flex justify-between font-bold text-ogame-accent text-sm">
            <span>TOT</span><span>{{ formatNum(breakdown.total) }}</span>
        </div>
    </div>

  </div>
</template>