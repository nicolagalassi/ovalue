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

const expirationChips = computed(() => {
    if (!activeProfile.value?.expirations) return [];
    const now = Date.now();
    const all = [
        ...Object.values(activeProfile.value.expirations.officers || {}).map(o => ({ name: o.name, expires: o.expires })),
        ...(activeProfile.value.expirations.globalItems || []).map(i => ({ name: i.name, expires: i.expires })),
    ].filter(e => e.expires);

    return all
        .map(e => {
            const diff = e.expires - now;
            const critical = diff > 0 && diff <= 86400000;
            const warning  = diff > 0 && diff > 86400000 && diff <= 864000000;
            if (!critical && !warning) return null;
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const d = Math.floor(h / 24);
            const label = d > 0 ? `${d}g ${h % 24}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
            return { name: e.name, expires: e.expires, critical, label };
        })
        .filter(Boolean)
        .sort((a, b) => {
            if (a.critical && !b.critical) return -1;
            if (!a.critical && b.critical) return 1;
            return a.expires - b.expires;
        })
        .slice(0, 4);
});
</script>

<template>
  <div class="flex flex-col w-full flex-grow">

    <!-- Main -->
    <div class="flex-grow flex flex-col">

      <!-- ── HERO ──────────────────────────────────────────────────────────── -->
      <div class="relative px-4 md:px-8 pt-5 md:pt-6 pb-3 flex flex-col items-center text-center overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(14,40,90,0.4),transparent)] pointer-events-none"></div>

        <div class="hero-content relative z-10">

          <!-- Tagline solo al primo accesso (nessun profilo): chi torna vede i suoi dati -->
          <p v-if="!activeProfile" class="text-sm text-slate-400 mb-4 leading-relaxed max-w-lg mx-auto text-balance">
            {{ t('index_desc') }}
          </p>

          <div v-if="activeProfile" class="flex items-center justify-center gap-2 flex-wrap">
            <div v-if="activeProfile.production?.daily" class="profile-chip">
              <span class="chip-dot bg-amber-400/60"></span>
              <span class="text-amber-300/80 font-medium">{{ formatNum(activeProfile.production.daily) }}</span>
              <span class="text-slate-500">{{ t('lbl_met_day') }}</span>
            </div>
            <router-link v-for="chip in expirationChips" :key="chip.name" to="/expirations"
              class="profile-chip cursor-pointer transition-colors"
              :class="chip.critical
                ? 'border-rose-500/20 bg-rose-500/[0.06] hover:bg-rose-500/10'
                : 'border-orange-500/15 bg-orange-500/[0.04] hover:bg-orange-500/10'">
              <span class="chip-dot" :class="chip.critical ? 'bg-rose-400 animate-pulse' : 'bg-orange-400/70'"></span>
              <span :class="chip.critical ? 'text-rose-300' : 'text-orange-300/80'">{{ chip.name }}</span>
              <span :class="chip.critical ? 'text-rose-500/70' : 'text-orange-600/80'">{{ chip.label }}</span>
            </router-link>
          </div>

        </div>
      </div>

      <!-- ── TOOL CARDS ──────────────────────────────────────────────────── -->
      <div class="px-4 md:px-6 pt-2 pb-6 md:pb-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-6xl mx-auto">

          <!-- Production Core -->
          <router-link to="/metal" class="tool-card card-1 group relative rounded-2xl overflow-hidden block bg-ogame-panel hover:bg-ogame-hover-mine transition-colors duration-300">
            <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div class="py-8 md:py-10 px-6 flex flex-col items-center text-center gap-4">
              <div class="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-sky-950/60 border border-sky-500/25 flex items-center justify-center group-hover:border-sky-400/50 group-hover:bg-sky-950/80 group-hover:shadow-[0_0_30px_rgba(56,189,248,0.12)] transition-all duration-300">
                <svg class="w-8 h-8 md:w-10 md:h-10 text-sky-400/70 group-hover:text-sky-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
              </div>
              <div class="flex-grow">
                <h2 class="text-lg md:text-xl font-bold text-slate-200 group-hover:text-sky-300 transition-colors uppercase tracking-tight mb-2">{{ t('card_metal_title') }}</h2>
                <p class="text-sm text-slate-500 leading-snug px-2">{{ t('card_metal_desc') }}</p>
                <div v-if="activeProfile?.production?.daily" class="mt-3 text-sm text-sky-400/70 font-medium">
                  {{ formatNum(activeProfile.production.daily) }} <span class="text-slate-600 font-normal">{{ t('lbl_met_day') }}</span>
                </div>
              </div>
              <span class="text-xs font-semibold text-slate-600 group-hover:text-sky-400 uppercase tracking-widest transition-colors flex items-center gap-1">
                {{ t('btn_open') }} <span class="text-base leading-none group-hover:translate-x-0.5 transition-transform inline-block">›</span>
              </span>
            </div>
          </router-link>

          <!-- Pack Exchange -->
          <router-link to="/pack" class="tool-card card-2 group relative rounded-2xl overflow-hidden block bg-ogame-panel hover:bg-ogame-hover-pack transition-colors duration-300">
            <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div class="py-8 md:py-10 px-6 flex flex-col items-center text-center gap-4">
              <div class="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-amber-950/60 border border-amber-500/25 flex items-center justify-center group-hover:border-amber-400/50 group-hover:bg-amber-950/80 group-hover:shadow-[0_0_30px_rgba(251,191,36,0.12)] transition-all duration-300">
                <svg class="w-8 h-8 md:w-10 md:h-10 text-amber-400/70 group-hover:text-amber-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div class="flex-grow">
                <h2 class="text-lg md:text-xl font-bold text-slate-200 group-hover:text-amber-300 transition-colors uppercase tracking-tight mb-2">{{ t('card_pack_title') }}</h2>
                <p class="text-sm text-slate-500 leading-snug px-2">{{ t('card_pack_desc') }}</p>
                <div v-if="activeProfile?.packExchange?.queue?.length" class="mt-3 text-sm text-amber-400/70 font-medium">
                  {{ activeProfile.packExchange.queue.length }} <span class="text-slate-600 font-normal">{{ t('lbl_in_queue') }}</span>
                </div>
              </div>
              <span class="text-xs font-semibold text-slate-600 group-hover:text-amber-400 uppercase tracking-widest transition-colors flex items-center gap-1">
                {{ t('btn_open') }} <span class="text-base leading-none group-hover:translate-x-0.5 transition-transform inline-block">›</span>
              </span>
            </div>
          </router-link>

          <!-- Shopping List -->
          <router-link to="/shopping" class="tool-card card-3 group relative rounded-2xl overflow-hidden block bg-ogame-panel hover:bg-ogame-hover-shopping transition-colors duration-300">
            <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div class="py-8 md:py-10 px-6 flex flex-col items-center text-center gap-4">
              <div class="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-violet-950/60 border border-violet-500/25 flex items-center justify-center group-hover:border-violet-400/50 group-hover:bg-violet-950/80 group-hover:shadow-[0_0_30px_rgba(139,92,246,0.12)] transition-all duration-300">
                <svg class="w-8 h-8 md:w-10 md:h-10 text-violet-400/70 group-hover:text-violet-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              </div>
              <div class="flex-grow">
                <h2 class="text-lg md:text-xl font-bold text-slate-200 group-hover:text-violet-300 transition-colors uppercase tracking-tight mb-2">{{ t('shopping_title') }}</h2>
                <p class="text-sm text-slate-500 leading-snug px-2">{{ t('card_shopping_desc') }}</p>
                <div v-if="activeProfile?.shoppingList?.cart?.length" class="mt-3 text-sm text-violet-400/70 font-medium">
                  {{ activeProfile.shoppingList.cart.length }} <span class="text-slate-600 font-normal">{{ t('lbl_in_cart') }}</span>
                </div>
              </div>
              <span class="text-xs font-semibold text-slate-600 group-hover:text-violet-400 uppercase tracking-widest transition-colors flex items-center gap-1">
                {{ t('btn_open') }} <span class="text-base leading-none group-hover:translate-x-0.5 transition-transform inline-block">›</span>
              </span>
            </div>
          </router-link>

          <!-- Production Planner -->
          <router-link to="/strategy" class="tool-card card-4 group relative rounded-2xl overflow-hidden block bg-ogame-panel hover:bg-ogame-hover-strategy transition-colors duration-300">
            <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div class="py-8 md:py-10 px-6 flex flex-col items-center text-center gap-4">
              <div class="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-emerald-950/60 border border-emerald-500/25 flex items-center justify-center group-hover:border-emerald-400/50 group-hover:bg-emerald-950/80 group-hover:shadow-[0_0_30px_rgba(52,211,153,0.12)] transition-all duration-300">
                <svg class="w-8 h-8 md:w-10 md:h-10 text-emerald-400/70 group-hover:text-emerald-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
              </div>
              <div class="flex-grow">
                <h2 class="text-lg md:text-xl font-bold text-slate-200 group-hover:text-emerald-300 transition-colors uppercase tracking-tight mb-2">{{ t('card_strategy_title') }}</h2>
                <p class="text-sm text-slate-500 leading-snug px-2">{{ t('card_strategy_desc') }}</p>
              </div>
              <span class="text-xs font-semibold text-slate-600 group-hover:text-emerald-400 uppercase tracking-widest transition-colors flex items-center gap-1">
                {{ t('btn_open') }} <span class="text-base leading-none group-hover:translate-x-0.5 transition-transform inline-block">›</span>
              </span>
            </div>
          </router-link>

        </div>
      </div>

      <!-- ── EXTERNAL LINKS — riga compatta ───────────────────────────────── -->
      <div class="px-4 md:px-6 py-3 max-w-4xl mx-auto w-full">
        <div class="flex items-center justify-center gap-2 flex-wrap">
          <a href="https://ostats.eu/" target="_blank" rel="noopener noreferrer"
             class="ext-link group">
            <img src="/Immagini%20Ogame/ostats-logo-v3.png" :alt="''" aria-hidden="true" class="h-4 w-4 object-contain opacity-60 group-hover:opacity-100 transition-opacity" />
            <span>{{ t('card_ostats_title') }}</span>
            <svg class="w-3 h-3 text-slate-700 group-hover:text-slate-400 transition-colors" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </a>
          <a href="https://www.ogameutilities.it/index.html" target="_blank" rel="noopener noreferrer"
             class="ext-link group">
            <img src="/Immagini%20Ogame/ogame%20util.ico" :alt="''" aria-hidden="true" class="h-4 w-4 object-contain opacity-60 group-hover:opacity-100 transition-opacity" />
            <span>{{ t('card_ou_title') }}</span>
            <svg class="w-3 h-3 text-slate-700 group-hover:text-slate-400 transition-colors" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </a>
          <router-link to="/settings" class="ext-link group">
            <svg class="w-3.5 h-3.5 text-rose-500/60 group-hover:text-rose-400 transition-colors" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span>{{ t('home_report_title') }}</span>
          </router-link>
          <a href="https://ko-fi.com/galax95" target="_blank" rel="noopener noreferrer"
             class="ext-link ext-link-kofi group" :title="t('support_banner_text')">
            <svg class="w-3.5 h-3.5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 8h1a4 4 0 010 8h-1"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4" stroke-linecap="round"/>
              <line x1="10" y1="1" x2="10" y2="4" stroke-linecap="round"/>
              <line x1="14" y1="1" x2="14" y2="4" stroke-linecap="round"/>
            </svg>
            <span>{{ t('support_banner_link') }}</span>
          </a>
        </div>
      </div>

      <!-- ── NEWS — scomparsa ─────────────────────────────────────────────── -->
      <div class="px-4 md:px-6 pb-8 max-w-4xl mx-auto w-full">

        <!-- Toggle header -->
        <button
          @click="showNewsFeed = !showNewsFeed"
          :aria-expanded="showNewsFeed"
          aria-controls="news-feed-panel"
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
          enter-active-class="transition-all duration-300 ease-out overflow-hidden"
          enter-from-class="opacity-0 max-h-0"
          enter-to-class="opacity-100 max-h-[2000px]"
          leave-active-class="transition-all duration-200 ease-in overflow-hidden"
          leave-from-class="opacity-100 max-h-[2000px]"
          leave-to-class="opacity-0 max-h-0"
        >
          <div v-if="showNewsFeed" id="news-feed-panel" class="pt-3">
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

/* ── External links riga compatta ────────────────────────────────── */
.ext-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(100, 116, 139, 0.15);
  background: rgba(255, 255, 255, 0.02);
  font-size: 12px;
  font-weight: 500;
  color: rgba(148, 163, 184, 0.75);
  text-decoration: none;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.ext-link:hover {
  color: rgba(226, 232, 240, 0.95);
  border-color: rgba(148, 163, 184, 0.3);
  background: rgba(255, 255, 255, 0.04);
}
.ext-link:focus-visible { outline: 2px solid rgba(96,165,250,0.9); outline-offset: 2px; }

/* Pillola Ko-fi: tinta ambra calda, coerente col bottone tazzina dell'header */
.ext-link-kofi {
  border-color: rgba(251, 191, 36, 0.18);
  background: rgba(251, 191, 36, 0.04);
  color: rgba(252, 211, 77, 0.75);
}
.ext-link-kofi:hover {
  border-color: rgba(251, 191, 36, 0.4);
  background: rgba(251, 191, 36, 0.08);
  color: rgba(253, 230, 138, 0.95);
}

/* ── Tool cards entrance ─────────────────────────────────────────── */
@keyframes cardIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.card-1 { animation: cardIn 0.5s ease-out 0.2s both; }
.card-2 { animation: cardIn 0.5s ease-out 0.3s both; }
.card-3 { animation: cardIn 0.5s ease-out 0.4s both; }
.card-4 { animation: cardIn 0.5s ease-out 0.5s both; }
.tool-card { cursor: pointer; }
.tool-card:focus-visible { outline: 2px solid rgba(96,165,250,0.9); outline-offset: 3px; }

/* ── Focus visible ───────────────────────────────────────────────── */
.profile-chip:focus-visible { outline: 2px solid rgba(96,165,250,0.9); outline-offset: 2px; border-radius: 999px; }
.news-toggle:focus-visible { outline: 2px solid rgba(96,165,250,0.9); outline-offset: 2px; border-radius: 4px; }

/* ── Reduced motion ──────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .hero-content { animation: none; }
  .card-1, .card-2, .card-3, .card-4 { animation: none; }
  .chip-dot { animation: none !important; }
}
</style>
