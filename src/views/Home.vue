<script setup>
import { useLanguage } from '../composables/useLanguage';
import Footer from '../components/Footer.vue';

const { t } = useLanguage();
</script>

<template>
  <div class="flex flex-col items-center p-4 flex-grow w-full min-h-0 relative overflow-hidden">
    
    <div class="text-center relative w-full max-w-6xl mt-10 md:mt-16 mb-12 md:mb-20 z-10">
        <div class="relative inline-block group">
            <div class="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <img 
                src="/ovalue.png" 
                alt="OValue Logo" 
                class="relative mx-auto w-full max-w-[280px] md:max-w-[450px] h-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
        </div>
        
        <p class="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mt-6 italic font-serif border-t border-white/5 pt-6">
            {{ t('footer_quote') }}
        </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full mx-auto z-10 px-4">
        
        <div class="group relative rounded-3xl bg-[#11141d]/60 backdrop-blur-md border border-white/5 hover:border-cyan-500/50 hover:shadow-[0_0_40px_rgba(0,240,255,0.15)] transition-all duration-500 flex flex-col overflow-hidden">
            <div class="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 group-hover:scale-110 transition duration-700">
                <svg class="w-32 h-32 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            </div>
            
            <div class="p-8 flex flex-col h-full relative z-10">
                <h2 class="text-3xl font-bold text-white mb-2 group-hover:text-cyan-400 transition">{{ t('card_metal_title') }}</h2>
                <div class="w-12 h-1 bg-cyan-500 rounded mb-4"></div>
                <p class="text-gray-400 mb-8 text-sm md:text-base leading-relaxed">{{ t('card_metal_desc') }}</p>
                
                <router-link to="/metal" class="mt-auto inline-flex justify-center items-center px-6 py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-bold rounded-xl transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                    <span>{{ t('btn_open') }}</span> 
                    <svg class="w-5 h-5 ml-2 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </router-link>
            </div>
        </div>

        <div class="group relative rounded-3xl bg-[#11141d]/60 backdrop-blur-md border border-white/5 hover:border-amber-500/50 hover:shadow-[0_0_40px_rgba(245,158,11,0.15)] transition-all duration-500 flex flex-col overflow-hidden">
            <div class="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 group-hover:scale-110 transition duration-700">
                <svg class="w-32 h-32 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            
            <div class="p-8 flex flex-col h-full relative z-10">
                <h2 class="text-3xl font-bold text-white mb-2 group-hover:text-amber-400 transition">{{ t('card_pack_title') }}</h2>
                <div class="w-12 h-1 bg-amber-500 rounded mb-4"></div>
                <p class="text-gray-400 mb-8 text-sm md:text-base leading-relaxed">{{ t('card_pack_desc') }}</p>
                
                <router-link to="/pack" class="mt-auto inline-flex justify-center items-center px-6 py-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold rounded-xl transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <span>{{ t('btn_open') }}</span> 
                    <svg class="w-5 h-5 ml-2 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </router-link>
            </div>
        </div>

    </div>

    <Footer class="mt-auto pt-20" />
  </div>
</template>