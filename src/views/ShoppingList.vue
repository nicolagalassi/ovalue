<script setup>
import { ref, reactive, computed } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { SHOP_ITEMS } from '../data/ogame_db';

const { t, currentLang } = useLanguage();

const shopCart = ref([]);
const activeCategory = ref(SHOP_ITEMS.categories[0].id);

const itemQuantities = reactive({});
for (const key of Object.keys(SHOP_ITEMS.items)) {
    itemQuantities[key] = 1;
}

const formatNum = (n) => new Intl.NumberFormat('it-IT').format(Math.floor(n));

const getItemsForCategory = (catId) => {
    const res = {};
    for (const [key, val] of Object.entries(SHOP_ITEMS.items)) {
        if (val.cat === catId) res[key] = val;
    }
    return res;
};

const addToShopCart = (id, tier, duration, cost) => {
    const mult = Math.max(1, itemQuantities[id] || 1);
    const existing = shopCart.value.find(i => i.id === id && i.tier === tier && i.duration === duration);
    if(existing) {
        existing.mult += mult;
        existing.cost += (cost * mult);
    } else {
        shopCart.value.push({ 
            id, 
            tier, 
            duration, 
            mult, 
            unitCost: cost,
            cost: cost * mult
        });
    }
    itemQuantities[id] = 1; // reset dopo l'aggiunta
};

const removeShopCart = (index) => shopCart.value.splice(index, 1);
const clearCart = () => shopCart.value = [];

const getDurationDiscount = (itemData, tierName, durKey) => {
    const costs = itemData?.costs?.[tierName];
    if(!costs) return 0;
    
    const durDays = { "7d": 7, "30d": 30, "90d": 90 };
    if(!durDays[durKey] || !costs["7d"]) return 0;
    if(durKey === "7d") return 0;

    const cost7dPerDay = costs["7d"] / 7;
    const currentCostPerDay = costs[durKey] / durDays[durKey];
    
    const discount = 1 - (currentCostPerDay / cost7dPerDay);
    return discount > 0.01 ? Math.round(discount * 100) : 0;
};

const totalShopCartMO = computed(() => shopCart.value.reduce((acc, curr) => acc + curr.cost, 0));

const getTierColorClass = (tier) => {
    if(tier === 'platinum') return 'text-purple-400 font-bold';
    if(tier === 'gold') return 'text-yellow-400 font-bold';
    if(tier === 'silver') return 'text-slate-300 font-bold';
    if(tier === 'bronze') return 'text-orange-500 font-bold';
    return 'text-cyan-400 font-bold';
};

const getTierBorderClass = (tier, itemKey) => {
    if(tier === 'none') {
        if(itemKey.includes('metal')) return 'border-red-500 bg-red-900/20 hover:bg-red-600/30';
        if(itemKey.includes('crystal')) return 'border-blue-500 bg-blue-900/20 hover:bg-blue-600/30';
        if(itemKey.includes('deut')) return 'border-green-500 bg-green-900/20 hover:bg-green-600/30';
        if(itemKey.includes('collector') || itemKey.includes('geologist')) return 'border-yellow-500 bg-yellow-900/20 hover:bg-yellow-600/30';
        if(itemKey.includes('general') || itemKey.includes('warrior') || itemKey.includes('admiral')) return 'border-red-500 bg-red-900/20 hover:bg-red-600/30';
        if(itemKey.includes('discoverer') || itemKey.includes('researcher') || itemKey.includes('technocrat')) return 'border-blue-500 bg-blue-900/20 hover:bg-blue-600/30';
        return 'border-cyan-500 bg-cyan-900/20 hover:bg-cyan-600/30';
    }
    if(tier === 'platinum') return 'border-purple-500 bg-purple-900/20 hover:bg-purple-600/30';
    if(tier === 'gold') return 'border-yellow-500 bg-yellow-900/20 hover:bg-yellow-600/30';
    if(tier === 'silver') return 'border-slate-400 bg-slate-700/20 hover:bg-slate-500/30';
    if(tier === 'bronze') return 'border-orange-500 bg-orange-900/20 hover:bg-orange-600/30';
    return 'border-cyan-500 bg-cyan-900/20 hover:bg-cyan-600/30';
};
</script>

<template>
  <div class="max-w-[1400px] mx-auto px-4 md:px-6 mt-6 md:mt-10 pb-12">
    <!-- Page Header -->
    <div class="mb-10 text-center relative">
        <h1 class="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            Shopping List
        </h1>
        <div class="mt-2 h-1 w-24 bg-cyan-500 mx-auto rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
    </div>

    <!-- Intro Section -->
    <div class="card-glass p-6 mb-8 border-l-4 border-l-cyan-500/50 bg-cyan-500/5 backdrop-blur-md">
        <div class="flex items-start gap-4">
            <div class="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
            <div>
                <p class="text-sm text-gray-300 leading-relaxed font-medium">Aggiungi gli Item dal catalogo OGame cliccando sui tasti corrispondenti a livello e durata. Puoi anche impostare la quantità prima di cliccare. Tieni sotto controllo il totale in Materia Oscura spesa.</p>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative items-start">
        
        <!-- MAIN CATALOG AREA -->
        <div class="lg:col-span-8 xl:col-span-9 space-y-6">
            
            <!-- Category Tabs -->
            <div class="flex flex-wrap gap-2 p-2 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
                <button 
                    v-for="cat in SHOP_ITEMS.categories" 
                    :key="cat.id"
                    @click="activeCategory = cat.id"
                    class="px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold uppercase transition-all duration-300 flex-grow sm:flex-grow-0 text-center"
                    :class="activeCategory === cat.id ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/10'"
                >
                    {{ t(cat.name) }}
                </button>
            </div>

            <!-- Items Grid for Active Category -->
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div v-for="(val, key) in getItemsForCategory(activeCategory)" :key="key" class="card-glass p-5 flex flex-col h-full hover:border-white/20 transition-colors">
                    
                    <h3 class="text-sm font-bold text-white mb-4 flex items-center justify-between border-b border-white/10 pb-2 drop-shadow-md">
                        <div class="flex items-center gap-2">
                             {{ t(key) }}
                        </div>
                        <div class="flex items-center gap-1 bg-black/40 rounded px-2 py-1 border border-white/5">
                            <span class="text-[9px] uppercase font-bold text-gray-400">Q.tà:</span>
                            <input type="number" v-model.number="itemQuantities[key]" @focus="$event.target.select()" min="1" class="bg-transparent text-white text-xs font-mono w-10 text-right outline-none">
                        </div>
                    </h3>

                    <div class="flex-grow flex flex-col justify-end">
                        
                        <!-- Multi-Tier Items -->
                        <div v-if="val.tier === 'multi'" class="space-y-3">
                            <div v-for="(durations, tierName) in val.costs" :key="tierName" class="flex flex-col gap-1">
                                <span class="text-[10px] uppercase font-bold pl-1" :class="getTierColorClass(tierName)">{{ tierName }}</span>
                                <div class="grid grid-cols-3 gap-2" :class="{'!grid-cols-1': Object.keys(durations).length === 1}">
                                    <button 
                                        v-for="(cost, dur) in durations" 
                                        :key="dur"
                                        @click="addToShopCart(key, tierName, dur, cost)"
                                        class="flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200 active:scale-95 group cursor-pointer"
                                        :class="getTierBorderClass(tierName, key)"
                                    >
                                        <span class="text-xs font-bold text-white group-hover:scale-110 transition-transform flex items-center justify-center gap-1">
                                             {{ dur === 'base' ? 'Aggiungi' : t('dur_' + dur) }}
                                             <span v-if="getDurationDiscount(val, tierName, dur) > 0" class="text-[9px] bg-green-500/80 text-white px-1.5 py-0.5 rounded ml-1 leading-none shadow-sm">-{{ getDurationDiscount(val, tierName, dur) }}%</span>
                                        </span>
                                        <span class="text-[9px] font-mono mt-1 opacity-70 group-hover:opacity-100 transition-opacity">{{ formatNum(cost) }}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Single-Tier Items (None/Base) -->
                        <div v-else class="grid grid-cols-1 gap-2 mt-auto">
                            <div v-for="(cost, dur) in val.costs.none" :key="dur">
                                <button 
                                    @click="addToShopCart(key, 'none', dur, cost)"
                                    class="w-full flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200 active:scale-95 group cursor-pointer"
                                    :class="getTierBorderClass('none', key)"
                                >
                                    <span class="text-sm font-bold text-white group-hover:scale-105 transition-transform flex items-center justify-center gap-1">
                                        {{ dur === 'base' ? 'Aggiungi' : t('dur_' + dur) }}
                                        <span v-if="getDurationDiscount(val, 'none', dur) > 0" class="text-[10px] bg-green-500/80 text-white px-1.5 py-0.5 rounded leading-none shadow-sm">-{{ getDurationDiscount(val, 'none', dur) }}%</span>
                                    </span>
                                    <span class="text-[10px] font-mono mt-1 opacity-70 group-hover:opacity-100 transition-opacity opacity-80">+ {{ formatNum(cost) }} MO</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

        </div>

        <!-- SIDEBAR CART -->
        <div class="lg:col-span-4 xl:col-span-3 sticky top-24">
            <div class="card-glass p-0 overflow-hidden flex flex-col h-[calc(100vh-140px)] max-h-[800px] border-t-4 border-t-cyan-500 bg-[#080b12]/90">
                <!-- Cart Header -->
                <div class="p-5 border-b border-white/5 bg-black/40 flex justify-between items-center shadow-md pb-4">
                    <h3 class="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        Carrello
                    </h3>
                    <button @click="clearCart" v-if="shopCart.length > 0" class="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/20 shadow-inner">
                        <div class="flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            Svuota
                        </div>
                    </button>
                </div>

                <!-- Cart Items -->
                <div class="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar relative">
                    <div v-if="shopCart.length === 0" class="absolute inset-0 flex flex-col items-center justify-center text-gray-600 italic opacity-50 p-6 text-center">
                        <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                        Nessun item aggiunto. Usa le categorie a sinistra per iniziare lo shopping.
                    </div>
                    
                    <div v-for="(item, index) in shopCart" :key="index" class="bg-black/60 border border-white/10 rounded-xl p-3 flex justify-between items-start group hover:border-cyan-500/30 hover:bg-black/80 transition-all shadow-sm">
                        <div class="flex-grow pr-3">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-xs font-bold text-white leading-tight break-words">{{ item.mult }}x {{ t(item.id) }}</span>
                            </div>
                            <div class="flex items-center gap-2 text-[10px]">
                                <span :class="getTierColorClass(item.tier)" class="uppercase" v-if="item.tier !== 'none'">{{ item.tier }}</span>
                                <span class="text-gray-500 font-bold" v-if="item.duration !== 'base'">{{ t('dur_' + item.duration) }}</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-end flex-shrink-0 justify-between h-full">
                            <button @click="removeShopCart(index)" class="text-gray-600 hover:text-red-500 mb-2 opacity-50 group-hover:opacity-100 transition-opacity bg-white/5 rounded p-1 hover:bg-red-500/20">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                            <span class="text-xs font-mono font-bold text-cyan-400 mt-2">{{ formatNum(item.cost) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Cart Total -->
                <div class="p-6 border-t border-cyan-500/30 bg-black/80 shadow-[0_-15px_30px_rgba(0,0,0,0.8)] z-10">
                    <div class="text-[10px] text-cyan-500/80 uppercase tracking-widest font-bold mb-1 flex items-center justify-between">
                        <span>Totale Materia Oscura</span>
                        <span>MO</span>
                    </div>
                    <div class="text-4xl font-black text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.6)] font-mono text-right">
                        {{ formatNum(totalShopCartMO) }}
                    </div>
                </div>
            </div>
        </div>

    </div>
  </div>
</template>
