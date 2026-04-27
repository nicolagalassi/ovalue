<template>
  <section aria-label="News Feed">

    <!-- Section header -->
    <div class="flex items-center gap-3 mb-4">
      <span class="w-8 md:w-12 h-[1px] bg-gradient-to-r from-transparent to-gray-800 flex-shrink-0"></span>
      <h3 class="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-[0.2em] whitespace-nowrap flex items-center gap-2">
        <svg class="w-3 h-3 text-ogame-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.143 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/>
        </svg>
        {{ t('news_feed_title') }}
      </h3>
      <span class="flex-grow h-[1px] bg-gradient-to-l from-transparent to-gray-800"></span>
      <div class="flex items-center gap-2 flex-shrink-0">
        <span v-if="lastUpdated" class="text-[10px] font-mono text-gray-600 hidden sm:block">{{ formatTime(lastUpdated) }}</span>
        <button
          @click="fetchFeed(true)"
          :disabled="loading"
          :aria-label="t('news_feed_refresh')"
          class="flex items-center justify-center w-6 h-6 rounded-lg bg-white/5 border border-white/10 hover:border-ogame-accent/50 hover:bg-ogame-accent/10 text-ogame-accent transition disabled:opacity-40 disabled:cursor-default"
        >
          <svg class="w-3 h-3" :class="{ 'animate-spin': loading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.36-3.36L23 10M1 14l5.13 4.36A9 9 0 0018.49 15"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading && items.length === 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-busy="true">
      <div v-for="n in 3" :key="n" class="bg-[#0b0e14]/80 border border-white/5 rounded-xl p-4 space-y-3">
        <div class="skeleton h-4 w-16 rounded-md"></div>
        <div class="skeleton h-3.5 w-full rounded-md"></div>
        <div class="skeleton h-3 w-2/3 rounded-md"></div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error && items.length === 0" class="flex items-center gap-4 px-5 py-6 bg-amber-500/5 border border-amber-500/20 rounded-xl" role="alert">
      <svg class="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <div>
        <p class="text-sm text-gray-300">{{ t('news_feed_error') }}</p>
        <button @click="fetchFeed(true)" class="mt-2 text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/60 px-3 py-1 rounded-lg transition">
          {{ t('news_feed_retry') }}
        </button>
      </div>
    </div>

    <!-- News grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
      <TransitionGroup name="news-item">
        <a
          v-for="(item, index) in visibleItems"
          :key="item.link"
          :href="item.link"
          target="_blank"
          rel="noopener noreferrer"
          class="group relative rounded-xl border p-4 flex flex-col gap-2.5 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden min-h-[110px]"
          :class="cardClasses(item)"
          :style="{ '--index': index }"
        >
          <!-- Glow blob for active offers -->
          <div v-if="normalizeCat(item.category) === 'active_offer'"
            class="absolute -right-8 -top-8 w-28 h-28 bg-[#ff2a6d] rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
          </div>

          <!-- Top line accent -->
          <div class="absolute left-0 top-0 right-0 h-[2px] rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            :class="accentLine(item)">
          </div>

          <!-- Badge + date -->
          <div class="relative z-10 flex items-center justify-between gap-2">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border flex-shrink-0"
              :class="badgeClasses(item)"
            >
              <span v-if="normalizeCat(item.category) === 'active_offer'">🔥</span>
              <span v-else-if="normalizeCat(item.category).includes('future')">⏳</span>
              {{ t('news_cat_' + normalizeCat(item.category)) || item.category }}
            </span>
            <time class="text-[10px] font-mono text-gray-600 whitespace-nowrap">{{ formatDate(item.pubDate) }}</time>
          </div>

          <!-- Title -->
          <h3 class="relative z-10 text-sm font-bold leading-snug transition-colors line-clamp-2"
            :class="normalizeCat(item.category) === 'active_offer' ? 'text-[#ff3a7a] group-hover:text-[#ff6090]' : 'text-white/90 group-hover:text-white'"
          >{{ item.title }}</h3>

          <!-- External link hint -->
          <div class="mt-auto relative z-10 flex justify-end">
            <svg class="w-3.5 h-3.5 text-gray-700 group-hover:text-ogame-accent transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          </div>
        </a>
      </TransitionGroup>

      <!-- Empty state -->
      <div v-if="visibleItems.length === 0" class="col-span-full py-10 flex flex-col items-center gap-3 border border-white/5 rounded-xl bg-black/20">
        <svg class="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.143 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/>
        </svg>
        <p class="text-gray-500 font-bold text-sm uppercase tracking-wider">{{ t('news_empty_title') }}</p>
        <p class="text-gray-600 text-xs max-w-xs text-center leading-relaxed">{{ t('news_empty_desc') }}</p>
      </div>
    </div>

    <!-- Footer forum link -->
    <div class="flex justify-end">
      <a
        href="https://board.en.ogame.gameforge.com"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 text-[11px] text-gray-600 hover:text-ogame-accent transition-colors"
      >
        {{ t('news_feed_visit_forum') }}
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
        </svg>
      </a>
    </div>

  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLanguage } from '../composables/useLanguage'
import { fetchOGameFeed } from '../services/rssFeedService.js'

const { t } = useLanguage()

const CACHE_KEY    = 'ogame_news_cache'
const CACHE_TTL_MS = 5 * 60 * 1000
const AUTO_REFRESH = 10 * 60 * 1000

const items       = ref([])
const loading     = ref(false)
const error       = ref(null)
const lastUpdated = ref(null)

const visibleItems = computed(() => {
  const filtered = items.value.filter(item => {
    const cat = normalizeCat(item.category)
    if (cat.includes('past')) return false
    return cat.includes('active') || cat.includes('future') || cat === 'update' || cat === 'universe' || cat === 'maintenance'
  })

  filtered.sort((a, b) => {
    const catA = normalizeCat(a.category)
    const catB = normalizeCat(b.category)
    const scoreA = catA.includes('active') ? 3 : (catA.includes('future') ? 2 : 1)
    const scoreB = catB.includes('active') ? 3 : (catB.includes('future') ? 2 : 1)
    if (scoreA !== scoreB) return scoreB - scoreA
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  })

  return filtered.slice(0, 6)
})

function normalizeCat(cat) {
  if (!cat) return 'default'
  const c = cat.toLowerCase()
  if (c === 'active offer')  return 'active_offer'
  if (c === 'active event')  return 'active_event'
  if (c === 'future offer')  return 'future_offer'
  if (c === 'future event')  return 'future_event'
  if (c === 'past offer')    return 'past_offer'
  if (c === 'past event')    return 'past_event'
  if (c.includes('changelog') || c.includes('version') || c.includes('update')) return 'update'
  if (c.includes('maint'))   return 'maintenance'
  if (c.includes('universe') || c.includes('new uni')) return 'universe'
  return 'default'
}

function cardClasses(item) {
  const cat = normalizeCat(item.category)
  if (cat === 'active_offer')  return 'bg-[#ff2a6d]/[0.06] border-[#ff2a6d]/25 hover:border-[#ff2a6d]/60 hover:shadow-[0_8px_24px_rgba(255,42,109,0.18)]'
  if (cat === 'active_event')  return 'bg-amber-500/[0.04] border-amber-500/15 hover:border-amber-500/45 hover:shadow-[0_8px_24px_rgba(245,158,11,0.12)]'
  if (cat.includes('future'))  return 'bg-purple-500/[0.04] border-purple-500/15 hover:border-purple-500/40 hover:shadow-[0_8px_24px_rgba(168,85,247,0.12)]'
  return 'bg-[#0b0e14]/80 border-white/5 hover:border-ogame-accent/25 hover:shadow-[0_8px_24px_rgba(0,240,255,0.07)]'
}

function accentLine(item) {
  const cat = normalizeCat(item.category)
  if (cat === 'active_offer')  return 'bg-gradient-to-r from-transparent via-[#ff2a6d]/70 to-transparent'
  if (cat === 'active_event')  return 'bg-gradient-to-r from-transparent via-amber-500/70 to-transparent'
  if (cat.includes('future'))  return 'bg-gradient-to-r from-transparent via-purple-500/70 to-transparent'
  return 'bg-gradient-to-r from-transparent via-ogame-accent/50 to-transparent'
}

function badgeClasses(item) {
  const cat = normalizeCat(item.category)
  if (cat === 'active_offer')  return 'bg-[#ff2a6d]/15 text-[#ff3a7a] border-[#ff2a6d]/35'
  if (cat === 'active_event')  return 'bg-amber-500/10 text-amber-400 border-amber-500/25'
  if (cat.includes('future'))  return 'bg-purple-500/10 text-purple-400 border-purple-500/25'
  return 'bg-ogame-accent/10 text-ogame-accent border-ogame-accent/20'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short' }).format(new Date(dateStr))
  } catch { return dateStr }
}

function formatTime(dateStr) {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr))
  } catch { return '' }
}

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL_MS) return null
    return { data, ts }
  } catch { return null }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch { /* quota exceeded */ }
}

async function fetchFeed(force = false) {
  if (!force) {
    const cached = readCache()
    if (cached) {
      items.value       = cached.data
      lastUpdated.value = new Date(cached.ts).toISOString()
      return
    }
  }
  loading.value = true
  error.value   = null
  try {
    const result      = await fetchOGameFeed()
    items.value       = result
    lastUpdated.value = new Date().toISOString()
    writeCache(result)
  } catch (err) {
    error.value = err.message || 'Unknown error'
    const cached = readCache()
    if (cached) items.value = cached.data
  } finally {
    loading.value = false
  }
}

let timer
onMounted(() => {
  fetchFeed()
  timer = setInterval(() => fetchFeed(), AUTO_REFRESH)
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
/* Skeleton shimmer */
@keyframes shimmer {
  from { background-position: -400px 0; }
  to   { background-position:  400px 0; }
}
.skeleton {
  background: linear-gradient(90deg, rgba(0,191,255,0.04) 0%, rgba(0,191,255,0.10) 50%, rgba(0,191,255,0.04) 100%);
  background-size: 400px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

/* TransitionGroup */
.news-item-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
  transition-delay: calc(var(--index, 0) * 40ms);
}
.news-item-enter-from { opacity: 0; transform: translateY(-6px); }
.news-item-leave-active { transition: opacity 0.2s ease; position: absolute; width: 100%; }
.news-item-leave-to { opacity: 0; }
</style>
