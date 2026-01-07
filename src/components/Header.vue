<script setup>
import { ref } from 'vue';
import { useLanguage } from '../composables/useLanguage';

const { currentLang, setLanguage, t } = useLanguage();
const isMenuOpen = ref(false);

const changeLang = (lang) => {
    setLanguage(lang);
    isMenuOpen.value = false;
};
</script>

<template>
  <header 
    class="relative w-full z-50 transition-colors duration-300 border-b"
    :class="$route.path === '/' 
      ? 'bg-transparent border-transparent py-6' 
      : 'bg-[#161b22] border-ogame-border py-6'"
  >
    <div class="max-w-7xl mx-auto px-4 md:px-6 flex flex-row justify-between items-start gap-4">
      
      <div class="flex-grow min-w-0" v-if="$route.path !== '/'">
        <router-link to="/" class="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-[#0d1014] border border-gray-700 rounded-lg text-[10px] md:text-xs font-bold text-gray-400 hover:text-white hover:border-ogame-accent hover:bg-gray-800 transition shadow-md mb-3 group uppercase tracking-wider">
            <svg class="w-3 h-3 md:w-4 md:h-4 text-ogame-accent transform group-hover:-translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            <span>{{ t('nav_back') }}</span>
        </router-link>

        <h1 class="text-2xl md:text-5xl font-bold text-white tracking-tight leading-normal pb-1">
            <span v-if="$route.path === '/metal'">{{ t('metal_calc_title') }}</span>
            <span v-else-if="$route.path === '/pack'">{{ t('pack_calc_title') }}</span>
        </h1>
        
        <p class="text-gray-400 mt-1 md:mt-0 text-xs md:text-base hidden sm:block">
            <span v-if="$route.path === '/metal'">{{ t('metal_calc_desc') }}</span>
            <span v-else-if="$route.path === '/pack'">{{ t('pack_calc_desc') }}</span>
        </p>
      </div>

      <div v-else class="flex-grow"></div>

      <div class="flex-shrink-0 flex items-center gap-2 mt-1">
        
        <div id="header-actions" class="flex gap-1 md:gap-2"></div>

        <div v-if="$route.path !== '/'" class="w-px h-8 bg-gray-700 mx-1 hidden md:block"></div>

        <div class="relative bg-ogame-panel p-1 rounded-xl border border-ogame-border shadow-lg">
            <button @click="isMenuOpen = !isMenuOpen" 
                class="flex flex-col items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg transition outline-none hover:bg-gray-800 text-gray-400 hover:text-white"
            >
                <svg class="w-4 h-4 md:w-5 md:h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
                <span class="text-[8px] md:text-[9px] font-bold uppercase">{{ currentLang }}</span>
            </button>

            <div v-if="isMenuOpen" class="absolute right-0 top-full mt-2 w-32 bg-[#161b22] border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all">
                <div class="p-1 space-y-0.5">
                    <button @click="changeLang('it')" class="w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 rounded-lg transition group" :class="currentLang === 'it' ? 'bg-ogame-accent/10 text-ogame-accent' : 'text-gray-400 hover:bg-gray-800 hover:text-white'">
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-mono border" :class="currentLang === 'it' ? 'bg-ogame-accent text-white border-ogame-accent' : 'bg-gray-700 text-gray-300 border-gray-600'">IT</span> 
                        <span>Italiano</span>
                    </button>
                    <button @click="changeLang('en')" class="w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 rounded-lg transition group" :class="currentLang === 'en' ? 'bg-ogame-accent/10 text-ogame-accent' : 'text-gray-400 hover:bg-gray-800 hover:text-white'">
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-mono border" :class="currentLang === 'en' ? 'bg-ogame-accent text-white border-ogame-accent' : 'bg-gray-700 text-gray-300 border-gray-600'">EN</span> 
                        <span>English</span>
                    </button>
                </div>
            </div>
            
            <div v-if="isMenuOpen" @click="isMenuOpen = false" class="fixed inset-0 z-40"></div>
        </div>

      </div>
    </div>
  </header>
</template>