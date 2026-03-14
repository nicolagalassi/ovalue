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
    class="sticky top-0 z-50 w-full transition-all duration-300 border-b border-white/5 backdrop-blur-md bg-[#050505]/80"
  >
    <div class="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex flex-row justify-between items-center gap-4">
      
      <!-- Logo Container -->
      <div class="flex items-center flex-shrink-0" :class="{ 'hidden md:flex': $route.path !== '/' }">
         <router-link to="/" class="group flex items-center gap-3">
             <img src="/ovalue.png" alt="OValue" class="h-8 md:h-10 w-auto object-contain transition-transform group-hover:scale-105" />
         </router-link>
      </div>

      <!-- Navigation / Breadcrumbs for internal pages -->
      <div class="flex-grow min-w-0 flex flex-col md:flex-row md:items-center gap-3 md:gap-4" v-if="$route.path !== '/'">
        <router-link to="/" class="self-start md:hidden inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-bold text-gray-300 hover:text-white transition group">
            <svg class="w-3 h-3 text-ogame-accent group-hover:-translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            <span>{{ t('nav_back') }}</span>
        </router-link>

        <div class="flex flex-col">
            <h1 class="text-xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight truncate">
                <span v-if="$route.path === '/metal'">{{ t('metal_calc_title') }}</span>
                <span v-else-if="$route.path === '/pack'">{{ t('pack_calc_title') }}</span>
                <span v-else-if="$route.path === '/shopping'">Ogame Shopping List</span>
            </h1>
        </div>
      </div>

      <div v-else class="flex-grow hidden md:block">
      </div>

      <div class="flex-shrink-0 flex items-center gap-3">
        
        <div id="header-actions" class="flex gap-2"></div>

        <div v-if="$route.path !== '/'" class="w-px h-8 bg-white/10 mx-1 hidden md:block"></div>

        <div class="relative">
            <button @click="isMenuOpen = !isMenuOpen" 
                class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-white/10 transition text-gray-300 shadow-sm"
                aria-label="Change language"
            >
                <span class="text-base leading-none">{{ currentLang === 'it' ? '🇮🇹' : '🇬🇧' }}</span>
                <span class="text-xs font-bold uppercase tracking-wider hidden md:block">{{ currentLang }}</span>
                <svg class="w-3 h-3 text-gray-500 transition-transform duration-200" :class="{'rotate-180': isMenuOpen}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>

            <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="transform -translate-y-2 opacity-0"
                enter-to-class="transform translate-y-0 opacity-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="transform translate-y-0 opacity-100"
                leave-to-class="transform -translate-y-2 opacity-0"
            >
                <div v-if="isMenuOpen" class="absolute right-0 top-full mt-2 w-36 bg-[#161b22]/95 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                    <div class="p-1.5 space-y-1">
                        <button @click="changeLang('it')" class="w-full text-left px-3 py-2.5 text-xs font-bold flex items-center gap-3 rounded-lg hover:bg-white/10 transition group" :class="currentLang === 'it' ? 'bg-cyan-900/20 text-cyan-400' : 'text-gray-400'">
                            <span class="text-lg leading-none grayscale group-hover:grayscale-0 transition" :class="{'grayscale-0': currentLang === 'it'}">🇮🇹</span> <span>Italiano</span>
                        </button>
                        <button @click="changeLang('en')" class="w-full text-left px-3 py-2.5 text-xs font-bold flex items-center gap-3 rounded-lg hover:bg-white/10 transition group" :class="currentLang === 'en' ? 'bg-cyan-900/20 text-cyan-400' : 'text-gray-400'">
                            <span class="text-lg leading-none grayscale group-hover:grayscale-0 transition" :class="{'grayscale-0': currentLang === 'en'}">🇬🇧</span> <span>English</span>
                        </button>
                    </div>
                </div>
            </Transition>
            
            <div v-if="isMenuOpen" @click="isMenuOpen = false" class="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none"></div>
        </div>

      </div>
    </div>
  </header>
</template>