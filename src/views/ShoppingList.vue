<script setup>
import { ref, computed } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { OGAME_DB } from '../data/ogame_db';

const { t } = useLanguage();

// Sfruttiamo i dati che l'utente ha importato tramite il tool "Production Core" 
// per conoscere le risorse che potrebbe già avere se vogliamo estendere la feature in futuro,
// ma per ora ci concentriamo solo sui costi dei singoli elementi.

const selectedCategory = ref('cat_boosters'); // Default category

const categories = [
    { id: 'cat_boosters', label: 'cat_boosters', filter: 'booster' },
    { id: 'cat_reducers', label: 'cat_reducers', filter: 'reducer' }
];

// Carrello reattivo
// Struttura: { elementId: { elementId: string, category: string, quantity: number } }
const cartMap = ref({});

// Items disponibili per la categoria selezionata (filtrati per type)
const availableItems = computed(() => {
    const cat = OGAME_DB['premium_items'];
    if (!cat || !cat.items) return [];
    
    const activeFilter = categories.find(c => c.id === selectedCategory.value)?.filter;
    
    return Object.keys(cat.items)
        .filter(key => cat.items[key].type === activeFilter)
        .map(key => {
            return {
                id: key,
                data: cat.items[key]
            };
        });
});

const addToCart = (item) => {
    if (!cartMap.value[item.id]) {
        cartMap.value[item.id] = {
            id: item.id,
            category: selectedCategory.value,
            quantity: 1,
            data: item.data
        };
    } else {
        cartMap.value[item.id].quantity += 1;
    }
};

const removeFromCart = (itemId) => {
    delete cartMap.value[itemId];
};

const updateQuantity = (itemId, change) => {
    if (cartMap.value[itemId]) {
        const newQuant = cartMap.value[itemId].quantity + change;
        if (newQuant > 0) {
            cartMap.value[itemId].quantity = newQuant;
        } else {
            removeFromCart(itemId);
        }
    }
};

// Calcolo totali in Materia Oscura
const cartTotals = computed(() => {
    let dm = 0;

    Object.values(cartMap.value).forEach(item => {
        const cost = item.data.cost || 0;
        const q = item.quantity;
        dm += (cost * q);
    });

    return { dm };
});

const clearCart = () => {
    cartMap.value = {};
};

const formatNumber = (num) => {
    return new Intl.NumberFormat('it-IT').format(Math.floor(num));
};

</script>

<template>
  <div class="flex flex-col items-center w-full min-h-screen bg-[#050505] overflow-x-hidden pt-8 md:pt-12 px-4 md:px-8 pb-32">
    
    <div class="w-full max-w-7xl">
        <div class="mb-8">
            <h1 class="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600 mb-2">
                {{ t('shopping_title') }}
            </h1>
            <p class="text-gray-400 text-sm md:text-base">
                {{ t('shopping_desc') }}
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- LISTA ELEMENTI (Main Content) -->
            <div class="lg:col-span-2 flex flex-col gap-6">
                
                <!-- Category Tabs -->
                <div class="flex flex-wrap gap-2 md:gap-4 p-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                    <button 
                        v-for="cat in categories" :key="cat.id"
                        @click="selectedCategory = cat.id"
                        class="flex-1 min-w-[120px] px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300"
                        :class="selectedCategory === cat.id ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/10'"
                    >
                        {{ t(cat.label) }}
                    </button>
                </div>

                <!-- Element Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    <div 
                        v-for="item in availableItems" :key="item.id"
                        @click="addToCart(item)"
                        class="group relative bg-[#11141a] hover:bg-[#1a1e28] border border-white/5 hover:border-emerald-500/50 rounded-2xl p-4 transition-all duration-300 cursor-pointer flex flex-col items-center justify-between min-h-[140px]"
                    >
                        <div class="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-900/10 opacity-0 group-hover:opacity-100 rounded-2xl transition duration-500"></div>
                        
                        <div class="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-3 border border-white/5 group-hover:border-emerald-500/30 transition shadow-inner">
                            <span class="text-xl group-hover:scale-110 transition duration-300">{{ item.data.type === 'booster' ? '📈' : '⏱️' }}</span>
                        </div>
                        
                        <h3 class="text-xs font-bold text-center text-gray-300 group-hover:text-white transition line-clamp-2">
                            {{ t(item.id) }}
                        </h3>

                        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition duration-300">
                             <div class="bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(16,185,129,0.5)]">+</div>
                        </div>
                    </div>
                </div>

            </div>

            <!-- CARRELLO (Sidebar) -->
            <div class="lg:col-span-1">
                <div class="sticky top-24 bg-[#0b0e14]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
                    
                    <div class="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                        <h2 class="text-xl font-bold flex items-center gap-2">
                            <span class="text-emerald-400">🛒</span> {{ t('shopping_cart_title') }}
                        </h2>
                        <span class="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                            {{ Object.keys(cartMap).length }} Items
                        </span>
                    </div>

                    <!-- Cart Items List (Scrollable) -->
                    <div class="flex-grow overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                        <div v-if="Object.keys(cartMap).length === 0" class="flex flex-col items-center justify-center h-full text-gray-500 gap-4 opacity-50">
                             <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                             <p>{{ t('shopping_cart_empty') }}</p>
                        </div>

                        <div 
                            v-else
                            v-for="(item, key) in cartMap" :key="key"
                            class="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col gap-3 group relative transition-all hover:border-white/20 hover:bg-white/10"
                        >
                            <button @click="removeFromCart(key)" class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-400 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow-lg z-10">✕</button>
                            
                            <div class="flex justify-between items-start">
                                <h4 class="font-bold text-sm text-gray-200 pr-4 leading-tight">
                                    {{ t(item.id) }}
                                </h4>
                            </div>

                            <div class="flex items-center justify-between mt-auto">
                                <span class="text-[10px] uppercase text-gray-500 font-bold tracking-wider">
                                    {{ t('shopping_quantity') }}
                                </span>
                                
                                <div class="flex items-center bg-black/40 rounded-lg p-1 border border-white/10">
                                    <button @click="updateQuantity(key, -1)" class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition">-</button>
                                    <input 
                                        type="number" 
                                        v-model.number="item.quantity" 
                                        min="1"
                                        class="w-12 text-center bg-transparent border-none focus:outline-none text-sm font-bold text-white appearance-none" 
                                        @blur="item.quantity = Math.max(1, item.quantity)"
                                    >
                                    <button @click="updateQuantity(key, 1)" class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition">+</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Totals Section -->
                    <div class="mt-6 pt-6 border-t border-white/10">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-gray-400 text-sm font-bold uppercase tracking-wider">{{ t('shopping_total') }}</h3>
                            <button @click="clearCart" v-if="Object.keys(cartMap).length > 0" class="text-xs text-red-500/80 hover:text-red-400 font-bold transition uppercase">
                                {{ t('shopping_clear') }}
                            </button>
                        </div>
                        
                        <div class="flex flex-col gap-3">
                            <div class="flex items-center justify-between bg-black/40 px-4 py-4 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                <div class="flex items-center gap-2">
                                    <span class="text-lg">🌌</span>
                                    <span class="text-sm font-bold text-gray-300">Materia Oscura (MO)</span>
                                </div>
                                <span class="font-mono font-bold text-emerald-400 text-xl">{{ formatNumber(cartTotals.dm) }}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    </div>
  </div>
</template>

<style scoped>
/* Stili per nascondere le freccette nell'input number type */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
input[type=number] {
  -webkit-appearance: textfield;
  -moz-appearance: textfield;
  appearance: textfield;
}

/* Scrollbar invisibile / custom per il carrello */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(16, 185, 129, 0.2);
  border-radius: 4px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: rgba(16, 185, 129, 0.5);
}
</style>
