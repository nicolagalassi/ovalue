<script setup>
import { useLanguage } from '../composables/useLanguage';
import Footer from '../components/Footer.vue';

const { t } = useLanguage();
</script>

<template>
  <div class="flex flex-col items-center p-4 flex-grow w-full min-h-0">
    
    <div class="text-center relative w-full max-w-6xl mt-4 md:mt-6 2xl:mt-10 mb-8 md:mb-10 2xl:mb-20 transition-all duration-300">
        
        <img 
            src="/ovalue.png" 
            alt="OValue Logo" 
            class="mx-auto w-full max-w-[280px] md:max-w-[450px] 2xl:max-w-[700px] h-auto object-contain hover:scale-105 transition duration-500"
        >
        
        <p class="text-ogame-accent text-lg md:text-xl 2xl:text-2xl max-w-3xl mx-auto leading-relaxed mt-4 md:mt-6 italic font-serif transition-all duration-300">
            {{ t('footer_quote') }}
        </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl w-full mx-auto my-auto">
        
        <div class="bg-ogame-panel border border-ogame-border rounded-2xl p-6 2xl:p-8 hover:border-ogame-accent transition duration-300 shadow-2xl flex flex-col group relative overflow-hidden">
            <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition transform group-hover:scale-110">
                <svg class="w-24 h-24 md:w-28 md:h-28 2xl:w-32 2xl:h-32 text-ogame-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            </div>
            <h2 class="text-xl md:text-2xl font-bold text-white mb-2 z-10">{{ t('card_metal_title') }}</h2>
            <p class="text-gray-400 mb-4 md:mb-6 flex-grow z-10 text-sm md:text-base">{{ t('card_metal_desc') }}</p>
            <router-link to="/metal" class="inline-flex justify-center items-center px-4 py-2 md:px-6 md:py-3 bg-ogame-accent hover:bg-blue-600 text-white font-bold rounded-lg transition z-10 text-sm md:text-base">
                <span>{{ t('btn_open') }}</span> <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </router-link>
        </div>

        <div class="bg-ogame-panel border border-ogame-border rounded-2xl p-6 2xl:p-8 hover:border-ogame-warning transition duration-300 shadow-2xl flex flex-col group relative overflow-hidden">
            <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition transform group-hover:scale-110">
                <svg class="w-24 h-24 md:w-28 md:h-28 2xl:w-32 2xl:h-32 text-ogame-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h2 class="text-xl md:text-2xl font-bold text-white mb-2 z-10">{{ t('card_pack_title') }}</h2>
            <p class="text-gray-400 mb-4 md:mb-6 flex-grow z-10 text-sm md:text-base">{{ t('card_pack_desc') }}</p>
            <router-link to="/pack" class="inline-flex justify-center items-center px-4 py-2 md:px-6 md:py-3 bg-ogame-warning hover:bg-yellow-600 text-white font-bold rounded-lg transition z-10 text-sm md:text-base">
                <span>{{ t('btn_open') }}</span> <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </router-link>
        </div>

    </div>

    <Footer class="mt-4 md:mt-8" />
  </div>
</template>