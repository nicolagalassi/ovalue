<script setup>
import { useLanguage } from '../composables/useLanguage';
import Footer from '../components/Footer.vue';
import NewsFeed from '../components/NewsFeed.vue';

const { t } = useLanguage();
</script>

<template>
  <div class="flex flex-col items-center justify-between w-full flex-grow h-full relative overflow-hidden bg-[#050505]">
    
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-white/5 to-transparent z-0"></div>
    
    <div class="flex-shrink-0 text-center relative w-full max-w-4xl z-10 px-4 py-4 md:py-6 flex flex-col justify-center mt-0 mx-auto">
        <div class="relative inline-block">
            <p class="text-gray-400 text-sm md:text-base lg:text-lg font-serif italic leading-relaxed tracking-wider opacity-90 drop-shadow-sm px-4">
                {{ t('footer_quote') }}
            </p>
        </div>
    </div>

    <div class="flex-grow flex items-center justify-center w-full px-4 md:px-6 z-10 py-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 2xl:gap-8 max-w-7xl w-full">
            
            <!-- Tool 1: Production Core -->
            <router-link to="/metal" class="group relative bg-[#0b0e14]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:-translate-y-1 hover:bg-[#0b0e14]/90 py-6 md:py-8 flex flex-col items-center justify-center text-center">
                
                <div class="absolute -right-6 -bottom-6 2xl:-right-10 2xl:-bottom-10 text-cyan-500/5 group-hover:text-cyan-500/10 group-hover:scale-110 group-hover:-rotate-12 transition duration-700 ease-in-out pointer-events-none">
                     <svg class="w-32 h-32 md:w-40 md:h-40 2xl:w-80 2xl:h-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                </div>
                
                <div class="absolute left-0 top-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-600 to-transparent opacity-50 group-hover:opacity-100 transition"></div>
                
                <div class="flex flex-col items-center w-full px-4 md:px-6 relative z-10 gap-3 md:gap-4">
                    <div class="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-cyan-900/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)] group-hover:scale-110 transition-transform duration-500">
                        <svg class="w-8 h-8 md:w-10 md:h-10 text-cyan-400 group-hover:text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                    </div>

                    <div class="flex-grow min-w-0 flex flex-col items-center">
                        <h2 class="text-xl md:text-2xl font-bold text-white group-hover:text-cyan-400 transition mb-1 md:mb-2 flex items-center gap-2 break-words whitespace-normal leading-tight">
                            {{ t('card_metal_title') }}
                        </h2>
                        <p class="hidden md:block text-[11px] md:text-sm text-gray-400 leading-snug mb-3 px-2 break-words whitespace-normal">
                            {{ t('card_metal_desc') }}
                        </p>
                        <span class="text-xs md:text-sm font-bold text-cyan-600 uppercase tracking-widest group-hover:text-cyan-400 transition flex items-center gap-1 mt-1">
                            {{ t('btn_open') }} <span class="text-lg md:text-xl leading-none">›</span>
                        </span>
                    </div>
                </div>
            </router-link>

            <!-- Tool 2: Pack Exchange -->
            <router-link to="/pack" class="group relative bg-[#0b0e14]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] hover:-translate-y-1 hover:bg-[#0b0e14]/90 py-6 md:py-8 flex flex-col items-center justify-center text-center">
                
                <div class="absolute -right-6 -bottom-6 2xl:-right-10 2xl:-bottom-10 text-amber-500/5 group-hover:text-amber-500/10 group-hover:scale-110 group-hover:-rotate-12 transition duration-700 ease-in-out pointer-events-none">
                     <svg class="w-32 h-32 md:w-40 md:h-40 2xl:w-80 2xl:h-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>

                <div class="absolute left-0 top-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent opacity-50 group-hover:opacity-100 transition"></div>
                
                <div class="flex flex-col items-center w-full px-4 md:px-6 relative z-10 gap-3 md:gap-4">
                    <div class="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-amber-900/20 border border-amber-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.15)] group-hover:scale-110 transition-transform duration-500">
                        <svg class="w-8 h-8 md:w-10 md:h-10 text-amber-400 group-hover:text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>

                    <div class="flex-grow min-w-0 flex flex-col items-center">
                        <h2 class="text-xl md:text-2xl font-bold text-white group-hover:text-amber-400 transition mb-1 md:mb-2 flex items-center gap-2 break-words whitespace-normal leading-tight">
                            {{ t('card_pack_title') }}
                        </h2>
                        <p class="hidden md:block text-[11px] md:text-sm text-gray-400 leading-snug mb-3 px-2 break-words whitespace-normal">
                            {{ t('card_pack_desc') }}
                        </p>
                        <span class="text-xs md:text-sm font-bold text-amber-600 uppercase tracking-widest group-hover:text-amber-400 transition flex items-center gap-1 mt-1">
                            {{ t('btn_open') }} <span class="text-lg md:text-xl leading-none">›</span>
                        </span>
                    </div>
                </div>
            </router-link>

            <!-- Tool 3: Shopping List -->
            <router-link to="/shopping" class="group relative bg-[#0b0e14]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:-translate-y-1 hover:bg-[#0b0e14]/90 py-6 md:py-8 flex flex-col items-center justify-center text-center">
                
                <div class="absolute -right-6 -bottom-6 2xl:-right-10 2xl:-bottom-10 text-purple-500/5 group-hover:text-purple-500/10 group-hover:scale-110 group-hover:-rotate-12 transition duration-700 ease-in-out pointer-events-none">
                     <svg class="w-32 h-32 md:w-40 md:h-40 2xl:w-80 2xl:h-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>

                <div class="absolute left-0 top-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent opacity-50 group-hover:opacity-100 transition"></div>
                
                <div class="flex flex-col items-center w-full px-4 md:px-6 relative z-10 gap-3 md:gap-4">
                    <div class="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-purple-900/20 border border-purple-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.15)] group-hover:scale-110 transition-transform duration-500">
                        <svg class="w-8 h-8 md:w-10 md:h-10 text-purple-400 group-hover:text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    </div>

                    <div class="flex-grow min-w-0 flex flex-col items-center">
                        <h2 class="text-xl md:text-2xl font-bold text-white group-hover:text-purple-400 transition mb-1 md:mb-2 flex items-center gap-2 break-words whitespace-normal leading-tight">
                            {{ t('shopping_title') }}
                        </h2>
                        <p class="hidden md:block text-[11px] md:text-sm text-gray-400 leading-snug mb-3 px-2 break-words whitespace-normal">
                            {{ t('card_shopping_desc') }}
                        </p>
                        <span class="text-xs md:text-sm font-bold text-purple-600 uppercase tracking-widest group-hover:text-purple-400 transition flex items-center gap-1 mt-1">
                            {{ t('btn_open') }} <span class="text-lg md:text-xl leading-none">›</span>
                        </span>
                    </div>
                </div>
            </router-link>

            <!-- Tool 4: Scadenziario -->
            <router-link to="/expirations" class="group relative bg-[#0b0e14]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:-translate-y-1 hover:bg-[#0b0e14]/90 py-6 md:py-8 flex flex-col items-center justify-center text-center">
                
                <div class="absolute -right-6 -bottom-6 2xl:-right-10 2xl:-bottom-10 text-emerald-500/5 group-hover:text-emerald-500/10 group-hover:scale-110 group-hover:-rotate-12 transition duration-700 ease-in-out pointer-events-none">
                     <svg class="w-32 h-32 md:w-40 md:h-40 2xl:w-80 2xl:h-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>

                <div class="absolute left-0 top-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-600 to-transparent opacity-50 group-hover:opacity-100 transition"></div>
                
                <div class="flex flex-col items-center w-full px-4 md:px-6 relative z-10 gap-3 md:gap-4">
                    <div class="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-emerald-900/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)] group-hover:scale-110 transition-transform duration-500">
                        <svg class="w-8 h-8 md:w-10 md:h-10 text-emerald-400 group-hover:text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>

                    <div class="flex-grow min-w-0 flex flex-col items-center">
                        <h2 class="text-xl md:text-2xl font-bold text-white group-hover:text-emerald-400 transition mb-1 md:mb-2 flex items-center gap-2 break-words whitespace-normal leading-tight">
                            {{ t('card_expirations_title') }}
                        </h2>
                        <p class="hidden md:block text-[11px] md:text-sm text-gray-400 leading-snug mb-3 px-2 break-words whitespace-normal">
                            {{ t('card_expirations_desc') }}
                        </p>
                        <span class="text-xs md:text-sm font-bold text-emerald-600 uppercase tracking-widest group-hover:text-emerald-400 transition flex items-center gap-1 mt-1">
                            {{ t('btn_open') }} <span class="text-lg md:text-xl leading-none">›</span>
                        </span>
                    </div>
                </div>
            </router-link>

        </div>
    </div>

    <!-- ── External References ──────────────────────────────────────────── -->
    <div class="w-full max-w-7xl px-4 md:px-6 py-4 md:py-8 z-10 mx-auto">
        <h3 class="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 md:mb-6 flex items-center gap-3">
            <span class="w-8 md:w-12 h-[1px] bg-gradient-to-r from-transparent to-gray-800 flex-shrink-0"></span>
            {{ t('lbl_external_links') }}
            <span class="flex-grow h-[1px] bg-gradient-to-l from-transparent to-gray-800"></span>
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <!-- OStats -->
            <a href="https://ostats.eu/" target="_blank" rel="noopener noreferrer"
              class="group relative bg-[#0b0e14]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] hover:-translate-y-0.5 flex items-center gap-4 px-5 py-4"
            >
                <div class="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-cyan-500/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div class="flex-shrink-0 w-16 h-10 flex items-center justify-center rounded-xl bg-black/40 border border-white/8 p-2 group-hover:border-cyan-500/30 transition-colors duration-300">
                    <img src="/Immagini%20Ogame/ostats-logo-v3.png" :alt="t('card_ostats_title')" class="h-full w-full object-contain contrast-[1.05]" />
                </div>

                <div class="flex-grow min-w-0">
                    <h4 class="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors duration-300 leading-tight">{{ t('card_ostats_title') }}</h4>
                    <p class="text-[11px] text-gray-600 mt-0.5 leading-snug">{{ t('card_ostats_desc') }}</p>
                </div>

                <div class="flex-shrink-0 flex items-center gap-1.5 text-[10px] font-black text-gray-600 group-hover:text-cyan-400 uppercase tracking-widest transition-colors duration-300">
                    <span class="hidden sm:block">{{ t('btn_visit') }}</span>
                    <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                </div>
            </a>

            <!-- OgameUtilities -->
            <a href="https://www.ogameutilities.it/index.html" target="_blank" rel="noopener noreferrer"
              class="group relative bg-[#0b0e14]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] hover:-translate-y-0.5 flex items-center gap-4 px-5 py-4"
            >
                <div class="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-indigo-500/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div class="flex-shrink-0 w-16 h-10 flex items-center justify-center rounded-xl bg-black/40 border border-white/8 p-2 group-hover:border-indigo-500/30 transition-colors duration-300">
                    <img src="/Immagini%20Ogame/ogame%20util.ico" :alt="t('card_ou_title')" class="h-full w-full object-contain" />
                </div>

                <div class="flex-grow min-w-0">
                    <h4 class="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors duration-300 leading-tight">{{ t('card_ou_title') }}</h4>
                    <p class="text-[11px] text-gray-600 mt-0.5 leading-snug">{{ t('card_ou_desc') }}</p>
                </div>

                <div class="flex-shrink-0 flex items-center gap-1.5 text-[10px] font-black text-gray-600 group-hover:text-indigo-400 uppercase tracking-widest transition-colors duration-300">
                    <span class="hidden sm:block">{{ t('btn_visit') }}</span>
                    <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                </div>
            </a>

        </div>
    </div>

    <!-- ── OGame Forum News Feed ──────────────────────────────────────────── -->
    <div class="w-full max-w-7xl px-4 md:px-6 pb-6 z-10 mx-auto">
      <NewsFeed />
    </div>

    <Footer class="flex-shrink-0 w-full transition-all duration-500" />
  </div>
</template>