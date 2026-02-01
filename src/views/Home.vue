<script setup>
import { useLanguage } from '../composables/useLanguage';
import Footer from '../components/Footer.vue';

const { t } = useLanguage();
</script>

<template>
  <div class="flex flex-col items-center w-full h-[calc(100vh-85px)] relative overflow-hidden bg-[#050505]">
    
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-white/5 to-transparent z-0"></div>
    
    <div class="flex-shrink-0 text-center relative w-full max-w-7xl z-10 px-4 py-4 2xl:py-12 flex flex-col justify-center">
        <div class="relative inline-block group mx-auto">
            <div class="absolute -inset-4 bg-gradient-to-r from-cyan-900/40 to-purple-900/40 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
            <img 
                src="/ovalue.png" 
                alt="OValue Logo" 
                class="relative w-48 2xl:w-[450px] h-auto object-contain drop-shadow-2xl transition-all duration-500"
            >
        </div>
        
        <p class="text-gray-500 text-xs 2xl:text-xl max-w-md 2xl:max-w-2xl mx-auto mt-2 2xl:mt-6 italic font-serif opacity-70">
            {{ t('footer_quote') }}
        </p>
    </div>

    <div class="flex-grow flex items-center justify-center w-full px-4 z-10 min-h-0">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 2xl:gap-10 max-w-5xl 2xl:max-w-6xl w-full">
            
            <router-link to="/metal" class="group relative bg-[#0b0e14]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:-translate-y-1 h-32 2xl:h-64 flex items-center">
                
                <div class="absolute -right-6 -bottom-6 2xl:-right-10 2xl:-bottom-10 text-cyan-500/5 group-hover:text-cyan-500/10 group-hover:scale-110 group-hover:-rotate-12 transition duration-700 ease-in-out pointer-events-none">
                     <svg class="w-40 h-40 2xl:w-80 2xl:h-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                </div>
                
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-600 to-transparent opacity-50 group-hover:opacity-100 transition"></div>
                
                <div class="flex flex-row items-center w-full px-6 2xl:px-10 relative z-10 gap-5 2xl:gap-8">
                    <div class="flex-shrink-0 w-12 h-12 2xl:w-20 2xl:h-20 rounded-lg 2xl:rounded-xl bg-cyan-900/20 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                        <svg class="w-6 h-6 2xl:w-10 2xl:h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                    </div>

                    <div class="flex-grow">
                        <h2 class="text-lg 2xl:text-3xl font-bold text-white group-hover:text-cyan-400 transition mb-1 2xl:mb-3 flex items-center gap-2">
                            {{ t('card_metal_title') }}
                        </h2>
                        <p class="text-xs 2xl:text-lg text-gray-500 leading-tight mb-2 2xl:mb-4 max-w-[80%]">
                            {{ t('card_metal_desc') }}
                        </p>
                        <span class="text-[10px] 2xl:text-sm font-bold text-cyan-600 uppercase tracking-wider group-hover:text-cyan-400 transition flex items-center gap-1">
                            {{ t('btn_open') }} <span class="text-lg leading-none">›</span>
                        </span>
                    </div>
                </div>
            </router-link>

            <router-link to="/pack" class="group relative bg-[#0b0e14]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] hover:-translate-y-1 h-32 2xl:h-64 flex items-center">
                
                <div class="absolute -right-6 -bottom-6 2xl:-right-10 2xl:-bottom-10 text-amber-500/5 group-hover:text-amber-500/10 group-hover:scale-110 group-hover:-rotate-12 transition duration-700 ease-in-out pointer-events-none">
                     <svg class="w-40 h-40 2xl:w-80 2xl:h-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>

                <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-600 to-transparent opacity-50 group-hover:opacity-100 transition"></div>
                
                <div class="flex flex-row items-center w-full px-6 2xl:px-10 relative z-10 gap-5 2xl:gap-8">
                    <div class="flex-shrink-0 w-12 h-12 2xl:w-20 2xl:h-20 rounded-lg 2xl:rounded-xl bg-amber-900/20 border border-amber-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                        <svg class="w-6 h-6 2xl:w-10 2xl:h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>

                    <div class="flex-grow">
                        <h2 class="text-lg 2xl:text-3xl font-bold text-white group-hover:text-amber-400 transition mb-1 2xl:mb-3 flex items-center gap-2">
                            {{ t('card_pack_title') }}
                        </h2>
                        <p class="text-xs 2xl:text-lg text-gray-500 leading-tight mb-2 2xl:mb-4 max-w-[80%]">
                            {{ t('card_pack_desc') }}
                        </p>
                        <span class="text-[10px] 2xl:text-sm font-bold text-amber-600 uppercase tracking-wider group-hover:text-amber-400 transition flex items-center gap-1">
                            {{ t('btn_open') }} <span class="text-lg leading-none">›</span>
                        </span>
                    </div>
                </div>
            </router-link>

        </div>
    </div>

    <Footer class="flex-shrink-0 w-full transition-all duration-500 scale-90 2xl:scale-100 origin-bottom" />
  </div>
</template>