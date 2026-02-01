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
    <div class="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-row justify-between items-center gap-4">
      
      <div class="flex-grow min-w-0 flex flex-col md:flex-row md:items-center gap-4" v-if="$route.path !== '/'">
        <router-link to="/" class="self-start inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] md:text-xs font-bold text-gray-300 hover:text-white transition group">
            <svg class="w-3 h-3 text-ogame-accent group-hover:-translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            <span>{{ t('nav_back') }}</span>
        </router-link>

        <div class="flex flex-col">
            <h1 class="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">
                <span v-if="$route.path === '/metal'">{{ t('metal_calc_title') }}</span>
                <span v-else-if="$route.path === '/pack'">{{ t('pack_calc_title') }}</span>
            </h1>
        </div>
      </div>

      <div v-else class="flex-grow">
          </div>

      <div class="flex-shrink-0 flex items-center gap-3">
        
        <div id="header-actions" class="flex gap-2"></div>

        <div v-if="$route.path !== '/'" class="w-px h-8 bg-white/10 mx-1 hidden md:block"></div>

        <div class="relative">
            <button @click="isMenuOpen = !isMenuOpen" 
                class="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-ogame-accent/50 hover:bg-white/10 transition text-gray-300"
            >
                <span class="text-xs font-bold uppercase tracking-wider">{{ currentLang }}</span>
            </button>

            <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-75 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
            >
                <div v-if="isMenuOpen" class="absolute right-0 top-full mt-2 w-32 bg-[#161b22] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-xl">
                    <div class="p-1 space-y-1">
                        <button @click="changeLang('it')" class="w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 rounded-lg hover:bg-white/5 transition" :class="currentLang === 'it' ? 'text-ogame-accent' : 'text-gray-400'">
                            <span>🇮🇹 Italiano</span>
                        </button>
                        <button @click="changeLang('en')" class="w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 rounded-lg hover:bg-white/5 transition" :class="currentLang === 'en' ? 'text-ogame-accent' : 'text-gray-400'">
                            <span>🇬🇧 English</span>
                        </button>
                    </div>
                </div>
            </Transition>
            
            <div v-if="isMenuOpen" @click="isMenuOpen = false" class="fixed inset-0 z-40"></div>
        </div>

      </div>
    </div>
  </header>
</template>