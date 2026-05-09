<script setup>
import { ref, computed } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useProfiles } from '../composables/useProfiles';
import { useOgameFormulas } from '../composables/useOgameFormulas';
import Footer from '../components/Footer.vue';
import NewsFeed from '../components/NewsFeed.vue';

const { t } = useLanguage();
const { activeProfile } = useProfiles();
const { formatNum } = useOgameFormulas();
const showNewsFeed = ref(false);

const criticalCount = computed(() => {
    if (!activeProfile.value?.expirations) return 0;
    const now = Date.now();
    const officers = Object.values(activeProfile.value.expirations.officers || {})
        .filter(o => o.expires && (o.expires - now) > 0 && (o.expires - now) <= 86400000).length;
    const items = (activeProfile.value.expirations.globalItems || [])
        .filter(i => i.expires && (i.expires - now) > 0 && (i.expires - now) <= 86400000).length;
    return officers + items;
});
</script>

<template>
  <div class="flex flex-col w-full flex-grow">

    <!-- Beta banner -->
    <div class="w-full bg-amber-900/20 border-b border-amber-700/15 px-4 py-2 flex items-center justify-center gap-2.5">
      <div class="w-1.5 h-1.5 rounded-full bg-amber-500/60"></div>
      <p class="text-[11px] text-amber-400/80 text-center">
        <span class="font-semibold text-amber-300/90 uppercase tracking-wider">Beta</span>
        <span class="mx-2 text-amber-700/60">—</span>
        {{ t('banner_beta') }}
      </p>
    </div>

    <!-- Main -->
    <div class="flex-grow flex flex-col">

      <!-- ── HERO ──────────────────────────────────────────────────────────── -->
      <div class="relative px-4 md:px-8 pt-8 md:pt-10 pb-4 flex flex-col items-center text-center overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(14,40,90,0.4),transparent)] pointer-events-none"></div>

        <div class="hero-content relative z-10">

          <!-- Tagline + profile chips in a compact pill bar -->
          <p class="text-sm text-slate-400 mb-4 leading-relaxed">
            {{ t('index_desc') }}
          </p>

          <div v-if="activeProfile" class="flex items-center justify-center gap-2 flex-wrap">
            <div class="profile-chip">
              <span class="chip-dot bg-sky-400/60"></span>
              <span>{{ activeProfile.name }}</span>
            </div>
            <div v-if="activeProfile.production?.daily" class="profile-chip">
              <span class="chip-dot bg-amber-400/60"></span>
              <span class="text-amber-300/80 font-medium">{{ formatNum(activeProfile.production.daily) }}</span>
              <span class="text-slate-500">met/d</span>
            </div>
            <router-link v-if="criticalCount > 0" to="/expirations"
              class="profile-chip border-rose-500/20 bg-rose-500/[0.06] hover:bg-rose-500/10 cursor-pointer transition-colors">
              <span class="chip-dot bg-rose-400 animate-pulse"></span>
              <span class="text-rose-300">{{ criticalCount }} alert</span>
            </router-link>
            <div v-if="activeProfile.lastSync" class="profile-chip">
              <span class="chip-dot bg-emerald-400/60"></span>
              <span class="text-slate-400">sync {{ new Date(activeProfile.lastSync).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) }}</span>
            </div>
          </div>

        </div>
      </div>

      <!-- ── TOOL CARDS ──────────────────────────────────────────────────── -->
      <div class="px-4 md:px-6 pb-4 md:pb-6 flex-grow flex items-center">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-4xl mx-auto">

          <!-- Production Core -->
          <router-link to="/metal" class="tool-card card-1 group relative rounded-2xl overflow-hidden block bg-[#0d1525] hover:bg-[#0f1a30] transition-colors duration-300">
            <div class="corner-tl absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-sky-500/25 transition-all duration-300 group-hover:w-7 group-hover:h-7 group-hover:border-sky-400/60"></div>
            <div class="corner-tr absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-sky-500/25 transition-all duration-300 group-hover:w-7 group-hover:h-7 group-hover:border-sky-400/60"></div>
            <div class="corner-bl absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-sky-500/25 transition-all duration-300 group-hover:w-7 group-hover:h-7 group-hover:border-sky-400/60"></div>
            <div class="corner-br absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-sky-500/25 transition-all duration-300 group-hover:w-7 group-hover:h-7 group-hover:border-sky-400/60"></div>
            <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div class="py-10 md:py-14 px-6 flex flex-col items-center text-center gap-5">
              <div class="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-sky-950/60 border border-sky-500/25 flex items-center justify-center group-hover:border-sky-400/50 group-hover:bg-sky-950/80 group-hover:shadow-[0_0_30px_rgba(56,189,248,0.12)] transition-all duration-400">
                <svg class="w-10 h-10 md:w-12 md:h-12 text-sky-400/70 group-hover:text-sky-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
              </div>
              <div class="flex-grow">
                <h2 class="text-lg md:text-xl font-bold text-slate-200 group-hover:text-sky-300 transition-colors uppercase tracking-tight mb-2">{{ t('card_metal_title') }}</h2>
                <p class="text-sm text-slate-500 leading-snug px-2">{{ t('card_metal_desc') }}</p>
                <div v-if="activeProfile?.production?.daily" class="mt-3 text-sm text-sky-400/70 font-medium">
                  {{ formatNum(activeProfile.production.daily) }} <span class="text-slate-600 font-normal">met/d</span>
                </div>
              </div>
              <span class="text-xs font-semibold text-slate-600 group-hover:text-sky-400 uppercase tracking-widest transition-colors flex items-center gap-1">
                {{ t('btn_open') }} <span class="text-base leading-none group-hover:translate-x-0.5 transition-transform inline-block">›</span>
              </span>
            </div>
          </router-link>

          <!-- Pack Exchange -->
          <router-link to="/pack" class="tool-card card-2 group relative rounded-2xl overflow-hidden block bg-[#0d1525] hover:bg-[#130f08] transition-colors duration-300">
            <div class="corner-tl absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-amber-500/25 transition-all duration-300 group-hover:w-7 group-hover:h-7 group-hover:border-amber-400/60"></div>
            <div class="corner-tr absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-amber-500/25 transition-all duration-300 group-hover:w-7 group-hover:h-7 group-hover:border-amber-400/60"></div>
            <div class="corner-bl absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-amber-500/25 transition-all duration-300 group-hover:w-7 group-hover:h-7 group-hover:border-amber-400/60"></div>
            <div class="corner-br absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-amber-500/25 transition-all duration-300 group-hover:w-7 group-hover:h-7 group-hover:border-amber-400/60"></div>
            <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div class="py-10 md:py-14 px-6 flex flex-col items-center text-center gap-5">
              <div class="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-amber-950/60 border border-amber-500/25 flex items-center justify-center group-hover:border-amber-400/50 group-hover:bg-amber-950/80 group-hover:shadow-[0_0_30px_rgba(251,191,36,0.12)] transition-all duration-400">
                <svg class="w-10 h-10 md:w-12 md:h-12 text-amber-400/70 group-hover:text-amber-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div class="flex-grow">
                <h2 class="text-lg md:text-xl font-bold text-slate-200 group-hover:text-amber-300 transition-colors uppercase tracking-tight mb-2">{{ t('card_pack_title') }}</h2>
                <p class="text-sm text-slate-500 leading-snug px-2">{{ t('card_pack_desc') }}</p>
                <div v-if="activeProfile?.packExchange?.queue?.length" class="mt-3 text-sm text-amber-400/70 font-medium">
                  {{ activeProfile.packExchange.queue.length }} <span class="text-slate-600 font-normal">in coda</span>
                </div>
              </div>
              <span class="text-xs font-semibold text-slate-600 group-hover:text-amber-400 uppercase tracking-widest transition-colors flex items-center gap-1">
                {{ t('btn_open') }} <span class="text-base leading-none group-hover:translate-x-0.5 transition-transform inline-block">›</span>
              </span>
            </div>
          </router-link>

          <!-- Shopping List -->
          <router-link to="/shopping" class="tool-card card-3 group relative rounded-2xl overflow-hidden block bg-[#0d1525] hover:bg-[#0e0c1a] transition-colors duration-300">
            <div class="corner-tl absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-violet-500/25 transition-all duration-300 group-hover:w-7 group-hover:h-7 group-hover:border-violet-400/60"></div>
            <div class="corner-tr absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-violet-500/25 transition-all duration-300 group-hover:w-7 group-hover:h-7 group-hover:border-violet-400/60"></div>
            <div class="corner-bl absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-violet-500/25 transition-all duration-300 group-hover:w-7 group-hover:h-7 group-hover:border-violet-400/60"></div>
            <div class="corner-br absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-violet-500/25 transition-all duration-300 group-hover:w-7 group-hover:h-7 group-hover:border-violet-400/60"></div>
            <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div class="py-10 md:py-14 px-6 flex flex-col items-center text-center gap-5">
              <div class="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-violet-950/60 border border-violet-500/25 flex items-center justify-center group-hover:border-violet-400/50 group-hover:bg-violet-950/80 group-hover:shadow-[0_0_30px_rgba(139,92,246,0.12)] transition-all duration-400">
                <svg class="w-10 h-10 md:w-12 md:h-12 text-violet-400/70 group-hover:text-violet-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              </div>
              <div class="flex-grow">
                <h2 class="text-lg md:text-xl font-bold text-slate-200 group-hover:text-violet-300 transition-colors uppercase tracking-tight mb-2">{{ t('shopping_title') }}</h2>
                <p class="text-sm text-slate-500 leading-snug px-2">{{ t('card_shopping_desc') }}</p>
                <div v-if="activeProfile?.shoppingList?.cart?.length" class="mt-3 text-sm text-violet-400/70 font-medium">
                  {{ activeProfile.shoppingList.cart.length }} <span class="text-slate-600 font-normal">nel carrello</span>
                </div>
              </div>
              <span class="text-xs font-semibold text-slate-600 group-hover:text-violet-400 uppercase tracking-widest transition-colors flex items-center gap-1">
                {{ t('btn_open') }} <span class="text-base leading-none group-hover:translate-x-0.5 transition-transform inline-block">›</span>
              </span>
            </div>
          </router-link>

        </div>
      </div>

      <!-- ── EXTERNAL LINKS ────────────────────────────────────────────────── -->
      <div class="px-4 md:px-6 py-4 max-w-4xl mx-auto w-full">
        <div class="flex items-center gap-3 mb-4">
          <div class="h-px flex-grow bg-gradient-to-r from-transparent to-slate-700/30"></div>
          <span class="text-[10px] font-medium uppercase tracking-widest text-slate-600">{{ t('lbl_external_links') }}</span>
          <div class="h-px flex-grow bg-gradient-to-l from-transparent to-slate-700/30"></div>
        </div>
        <div class="grid grid-cols-2 gap-4">

          <!-- OStats -->
          <a href="https://ostats.eu/" target="_blank" rel="noopener noreferrer"
             class="ext-card group relative rounded-xl overflow-hidden block bg-[#0d1525]">
            <div class="corner-tl absolute top-0 left-0 w-4 h-4 border-t border-l border-slate-600/30 transition-all duration-300 group-hover:w-5 group-hover:h-5 group-hover:border-sky-500/40"></div>
            <div class="corner-br absolute bottom-0 right-0 w-4 h-4 border-b border-r border-slate-600/30 transition-all duration-300 group-hover:w-5 group-hover:h-5 group-hover:border-sky-500/40"></div>
            <div class="border border-slate-700/25 hover:border-slate-600/50 rounded-xl transition-all duration-250 hover:-translate-y-0.5 flex items-center gap-4 px-5 py-4">
              <div class="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-slate-800/60 border border-slate-700/40 p-2">
                <img src="/Immagini%20Ogame/ostats-logo-v3.png" :alt="t('card_ostats_title')" class="h-full w-full object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
              <div class="min-w-0 flex-grow">
                <h4 class="text-sm font-semibold text-slate-300 group-hover:text-slate-100 transition-colors tracking-tight">{{ t('card_ostats_title') }}</h4>
                <p class="text-[11px] text-slate-600 leading-snug mt-0.5">{{ t('card_ostats_desc') }}</p>
              </div>
              <svg class="w-3.5 h-3.5 text-slate-700 group-hover:text-sky-400 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </div>
          </a>

          <!-- OGame Utilities -->
          <a href="https://www.ogameutilities.it/index.html" target="_blank" rel="noopener noreferrer"
             class="ext-card group relative rounded-xl overflow-hidden block bg-[#0d1525]">
            <div class="corner-tl absolute top-0 left-0 w-4 h-4 border-t border-l border-slate-600/30 transition-all duration-300 group-hover:w-5 group-hover:h-5 group-hover:border-violet-500/40"></div>
            <div class="corner-br absolute bottom-0 right-0 w-4 h-4 border-b border-r border-slate-600/30 transition-all duration-300 group-hover:w-5 group-hover:h-5 group-hover:border-violet-500/40"></div>
            <div class="border border-slate-700/25 hover:border-slate-600/50 rounded-xl transition-all duration-250 hover:-translate-y-0.5 flex items-center gap-4 px-5 py-4">
              <div class="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-slate-800/60 border border-slate-700/40 p-2">
                <img src="/Immagini%20Ogame/ogame%20util.ico" :alt="t('card_ou_title')" class="h-full w-full object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
              <div class="min-w-0 flex-grow">
                <h4 class="text-sm font-semibold text-slate-300 group-hover:text-slate-100 transition-colors tracking-tight">{{ t('card_ou_title') }}</h4>
                <p class="text-[11px] text-slate-600 leading-snug mt-0.5">{{ t('card_ou_desc') }}</p>
              </div>
              <svg class="w-3.5 h-3.5 text-slate-700 group-hover:text-violet-400 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </div>
          </a>

        </div>
      </div>

      <!-- ── NEWS — scomparsa ─────────────────────────────────────────────── -->
      <div class="px-4 md:px-6 pb-8 max-w-4xl mx-auto w-full">

        <!-- Toggle header -->
        <button
          @click="showNewsFeed = !showNewsFeed"
          class="news-toggle group w-full flex items-center gap-3 py-3 transition-colors"
          :class="showNewsFeed ? 'text-slate-300' : 'text-slate-600 hover:text-slate-400'"
        >
          <div class="h-px flex-grow bg-gradient-to-r from-transparent" :class="showNewsFeed ? 'to-slate-600/40' : 'to-slate-700/25'"></div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.143 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/></svg>
            <span class="text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap">Forum OGame</span>
            <svg class="w-3 h-3 transition-transform duration-300 text-slate-700" :class="{'rotate-180': showNewsFeed}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </div>
          <div class="h-px flex-grow bg-gradient-to-l" :class="showNewsFeed ? 'from-slate-600/40' : 'from-slate-700/25'"></div>
        </button>

        <!-- News content — animato -->
        <Transition
          enter-active-class="transition-all duration-400 ease-out overflow-hidden"
          enter-from-class="opacity-0 max-h-0"
          enter-to-class="opacity-100 max-h-[2000px]"
          leave-active-class="transition-all duration-250 ease-in overflow-hidden"
          leave-from-class="opacity-100 max-h-[2000px]"
          leave-to-class="opacity-0 max-h-0"
        >
          <div v-if="showNewsFeed" class="pt-3">
            <NewsFeed />
          </div>
        </Transition>
      </div>

    </div>

    <Footer class="flex-shrink-0 w-full" />
  </div>
</template>

<style scoped>
/* ── Hero entrance ───────────────────────────────────────────────── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.hero-content { animation: fadeUp 0.5s ease-out 0.05s both; }

/* ── Profile chips ───────────────────────────────────────────────── */
.profile-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 999px;
  background: rgba(255,255,255,0.02);
  font-size: 11px;
  color: rgba(148, 163, 184, 0.8);
  letter-spacing: 0.02em;
  text-decoration: none;
}
.chip-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Tool cards entrance ─────────────────────────────────────────── */
@keyframes cardIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.card-1 { animation: cardIn 0.5s ease-out 0.2s both; }
.card-2 { animation: cardIn 0.5s ease-out 0.3s both; }
.card-3 { animation: cardIn 0.5s ease-out 0.4s both; }
.tool-card { cursor: pointer; }
.tool-card:focus-visible { outline: 1px solid rgba(96,165,250,0.4); outline-offset: 2px; }
</style>
