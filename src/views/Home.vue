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
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 2xl:gap-8 max-w-7xl w-full">
            
            <!-- Tool 1: Production Core -->
            <router-link to="/metal" class="group relative bg-[#0b0e14]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:-translate-y-1 py-4 md:py-5 flex flex-col justify-center">
                
                <div class="absolute -right-6 -bottom-6 2xl:-right-10 2xl:-bottom-10 text-cyan-500/5 group-hover:text-cyan-500/10 group-hover:scale-110 group-hover:-rotate-12 transition duration-700 ease-in-out pointer-events-none">
                     <svg class="w-32 h-32 md:w-40 md:h-40 2xl:w-80 2xl:h-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                </div>
                
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-600 to-transparent opacity-50 group-hover:opacity-100 transition"></div>
                
                <div class="flex flex-row items-center w-full px-5 md:px-6 relative z-10 gap-4 md:gap-5">
                    <div class="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl bg-cyan-900/20 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                        <svg class="w-5 h-5 md:w-6 md:h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                    </div>

                    <div class="flex-grow min-w-0">
                        <h2 class="text-base md:text-lg font-bold text-white group-hover:text-cyan-400 transition mb-0.5 md:mb-1 flex items-center gap-2 break-words whitespace-normal leading-tight">
                            {{ t('card_metal_title') }}
                        </h2>
                        <p class="text-[11px] md:text-xs text-gray-500 leading-tight mb-2 pr-0 break-words whitespace-normal">
                            {{ t('card_metal_desc') }}
                        </p>
                        <span class="text-[10px] md:text-xs 2xl:text-sm font-bold text-cyan-600 uppercase tracking-wider group-hover:text-cyan-400 transition flex items-center gap-1">
                            {{ t('btn_open') }} <span class="text-base md:text-lg leading-none">›</span>
                        </span>
                    </div>
                </div>
            </router-link>

            <!-- Tool 2: Pack Exchange -->
            <router-link to="/pack" class="group relative bg-[#0b0e14]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] hover:-translate-y-1 py-4 md:py-5 flex flex-col justify-center">
                
                <div class="absolute -right-6 -bottom-6 2xl:-right-10 2xl:-bottom-10 text-amber-500/5 group-hover:text-amber-500/10 group-hover:scale-110 group-hover:-rotate-12 transition duration-700 ease-in-out pointer-events-none">
                     <svg class="w-32 h-32 md:w-40 md:h-40 2xl:w-80 2xl:h-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>

                <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-600 to-transparent opacity-50 group-hover:opacity-100 transition"></div>
                
                <div class="flex flex-row items-center w-full px-5 md:px-6 relative z-10 gap-4 md:gap-5">
                    <div class="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-900/20 border border-amber-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                        <svg class="w-5 h-5 md:w-6 md:h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>

                    <div class="flex-grow min-w-0">
                        <h2 class="text-base md:text-lg font-bold text-white group-hover:text-amber-400 transition mb-0.5 md:mb-1 flex items-center gap-2 break-words whitespace-normal leading-tight">
                            {{ t('card_pack_title') }}
                        </h2>
                        <p class="text-[11px] md:text-xs text-gray-500 leading-tight mb-2 pr-0 break-words whitespace-normal">
                            {{ t('card_pack_desc') }}
                        </p>
                        <span class="text-[10px] md:text-xs 2xl:text-sm font-bold text-amber-600 uppercase tracking-wider group-hover:text-amber-400 transition flex items-center gap-1">
                            {{ t('btn_open') }} <span class="text-base md:text-lg leading-none">›</span>
                        </span>
                    </div>
                </div>
            </router-link>

            <!-- Tool 3: Shopping List -->
            <router-link to="/shopping" class="group relative bg-[#0b0e14]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:-translate-y-1 py-4 md:py-5 flex flex-col justify-center">
                
                <div class="absolute -right-6 -bottom-6 2xl:-right-10 2xl:-bottom-10 text-purple-500/5 group-hover:text-purple-500/10 group-hover:scale-110 group-hover:-rotate-12 transition duration-700 ease-in-out pointer-events-none">
                     <svg class="w-32 h-32 md:w-40 md:h-40 2xl:w-80 2xl:h-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>

                <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600 to-transparent opacity-50 group-hover:opacity-100 transition"></div>
                
                <div class="flex flex-row items-center w-full px-5 md:px-6 relative z-10 gap-4 md:gap-5">
                    <div class="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-900/20 border border-purple-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                        <svg class="w-5 h-5 md:w-6 md:h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    </div>

                    <div class="flex-grow min-w-0">
                        <h2 class="text-base md:text-lg font-bold text-white group-hover:text-purple-400 transition mb-0.5 md:mb-1 flex items-center gap-2 break-words whitespace-normal leading-tight">
                            {{ t('shopping_title') }}
                        </h2>
                        <p class="text-[11px] md:text-xs text-gray-500 leading-tight mb-2 pr-0 break-words whitespace-normal">
                            {{ t('card_shopping_desc') }}
                        </p>
                        <span class="text-[10px] md:text-xs 2xl:text-sm font-bold text-purple-600 uppercase tracking-wider group-hover:text-purple-400 transition flex items-center gap-1">
                            {{ t('btn_open') }} <span class="text-base md:text-lg leading-none">›</span>
                        </span>
                    </div>
                </div>
            </router-link>

        </div>
    </div>

    <!-- ── External References ──────────────────────────────────────────── -->
    <div class="w-full max-w-7xl px-4 md:px-6 py-4 md:py-8 z-10 mx-auto">
        <h3 class="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 md:mb-6 flex items-center gap-3">
            <span class="w-8 md:w-12 h-[1px] bg-gradient-to-r from-transparent to-gray-800"></span>
            {{ t('lbl_external_links') }}
            <span class="flex-grow h-[1px] bg-gradient-to-l from-transparent to-gray-800"></span>
        </h3>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- OStats Link -->
            <a href="https://ostats.eu/" target="_blank" rel="noopener noreferrer" class="group relative bg-[#0b0e14]/40 backdrop-blur-sm border border-white/5 rounded-xl p-4 transition-all duration-300 hover:border-cyan-500/35 hover:bg-[#0b0e14]/60 flex items-center gap-4">
                <div class="flex-shrink-0 h-12 md:h-14 flex items-center rounded-xl bg-[#0b0e14]/95 px-2.5 py-1.5 border border-white/15 ring-1 ring-inset ring-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_14px_-4px_rgba(0,0,0,0.45)] group-hover:border-cyan-400/45 group-hover:ring-cyan-400/20 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_22px_-4px_rgba(34,211,238,0.22)] group-hover:scale-[1.03] transition-all">
                    <img
                        src="/Immagini%20Ogame/ostats-logo-v3.png"
                        :alt="t('card_ostats_title')"
                        class="h-full w-auto max-h-10 md:max-h-12 max-w-[min(11.5rem,48vw)] object-contain object-left drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] contrast-[1.06]"
                    />
                </div>
                <div class="min-w-0">
                    <h4 class="text-white text-sm md:text-base font-bold group-hover:text-cyan-400 transition">{{ t('card_ostats_title') }}</h4>
                    <p class="text-[10px] md:text-xs text-gray-500 truncate">{{ t('card_ostats_desc') }}</p>
                </div>
                <div class="ml-auto text-gray-600 group-hover:text-cyan-400 transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </div>
            </a>

            <!-- OgameUtilities Link -->
            <a href="https://www.ogameutilities.it/index.html" target="_blank" rel="noopener noreferrer" class="group relative bg-[#0b0e14]/40 backdrop-blur-sm border border-white/5 rounded-xl p-4 transition-all duration-300 hover:border-indigo-500/35 hover:bg-[#0b0e14]/60 flex items-center gap-4">
                <div class="flex-shrink-0 h-12 w-12 md:h-14 md:w-14 flex items-center justify-center rounded-xl bg-[#0b0e14]/95 p-2 border border-white/15 ring-1 ring-inset ring-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_14px_-4px_rgba(0,0,0,0.45)] group-hover:border-indigo-400/45 group-hover:ring-indigo-400/20 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_22px_-4px_rgba(129,140,248,0.22)] group-hover:scale-[1.03] transition-all">
                    <img
                        src="/Immagini%20Ogame/ogame%20util.ico"
                        :alt="t('card_ou_title')"
                        width="48"
                        height="48"
                        class="max-h-full max-w-full h-9 w-9 md:h-10 md:w-10 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]"
                    />
                </div>
                <div class="min-w-0">
                    <h4 class="text-white text-sm md:text-base font-bold group-hover:text-indigo-400 transition">{{ t('card_ou_title') }}</h4>
                    <p class="text-[10px] md:text-xs text-gray-500 truncate">{{ t('card_ou_desc') }}</p>
                </div>
                <div class="ml-auto text-gray-600 group-hover:text-indigo-400 transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
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