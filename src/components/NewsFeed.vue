<template>
  <section aria-label="News Feed">

    <!-- Loading skeleton -->
    <div v-if="loading && items.length === 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div v-for="n in 3" :key="n" class="bg-[#0d1525] border border-slate-700/25 rounded-xl p-4 space-y-3">
        <div class="skeleton h-3.5 w-16 rounded"></div>
        <div class="skeleton h-3 w-full rounded"></div>
        <div class="skeleton h-3 w-2/3 rounded"></div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error && items.length === 0"
         class="flex items-center gap-4 px-5 py-5 bg-amber-900/10 border border-amber-700/20 rounded-xl">
      <svg class="w-4 h-4 text-amber-500/70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <p class="text-sm text-slate-400 flex-grow">{{ t('news_feed_error') }}</p>
      <button @click="fetchFeed(true)"
              class="text-xs text-amber-400/70 hover:text-amber-300 border border-amber-700/30 hover:border-amber-500/50 px-3 py-1 rounded-lg transition flex-shrink-0">
        {{ t('news_feed_retry') }}
      </button>
    </div>

    <!-- News grid -->
    <div v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
        <TransitionGroup name="news-item">
          <a
            v-for="(item, index) in visibleItems"
            :key="item.link"
            :href="item.link"
            target="_blank"
            rel="noopener noreferrer"
            class="news-card group relative rounded-xl overflow-hidden block bg-[#0d1525] transition-all duration-300 hover:-translate-y-0.5"
            :class="cardBorder(item)"
            :style="{ '--index': index }"
          >
            <!-- Category color top bar -->
            <div class="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                 :class="accentLine(item)"></div>

            <div class="p-4 flex flex-col gap-2 min-h-[110px]">
              <!-- Badge + date -->
              <div class="flex items-center justify-between gap-2">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border flex-shrink-0"
                      :class="badgeClasses(item)">
                  <span v-if="normalizeCat(item.category) === 'active_offer'">🔥</span>
                  <span v-else-if="normalizeCat(item.category).includes('future')">⏳</span>
                  {{ t('news_cat_' + normalizeCat(item.category)) || item.category }}
                </span>
                <time class="text-[10px] font-mono text-slate-600 whitespace-nowrap">{{ formatDate(item.pubDate) }}</time>
              </div>

              <!-- Title -->
              <h3 class="text-sm font-semibold leading-snug line-clamp-2 flex-grow"
                  :class="normalizeCat(item.category) === 'active_offer' ? 'text-rose-300 group-hover:text-rose-200' : 'text-slate-300 group-hover:text-slate-100'">
                {{ item.title }}
              </h3>

              <!-- Arrow -->
              <div class="flex justify-end mt-auto">
                <svg class="w-3.5 h-3.5 text-slate-700 group-hover:text-sky-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </div>
            </div>
          </a>
        </TransitionGroup>
      </div>

      <!-- Empty state -->
      <div v-if="visibleItems.length === 0"
           class="py-8 flex flex-col items-center gap-3 border border-slate-700/20 rounded-xl bg-[#0d1525]/50">
        <svg class="w-7 h-7 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.143 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/>
        </svg>
        <p class="text-slate-500 text-xs uppercase tracking-wider">{{ t('news_empty_title') }}</p>
      </div>

      <!-- Footer row -->
      <div class="flex items-center justify-between mt-1">
        <span v-if="lastUpdated" class="text-[10px] font-mono text-slate-700">
          {{ t('news_feed_updated') }} {{ formatTime(lastUpdated) }}
        </span>
        <div class="flex items-center gap-3 ml-auto">
          <button @click="fetchFeed(true)" :disabled="loading"
                  class="text-[10px] text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1 disabled:opacity-40">
            <svg class="w-3 h-3" :class="{'animate-spin': loading}" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.36-3.36L23 10M1 14l5.13 4.36A9 9 0 0018.49 15"/>
            </svg>
            {{ t('news_feed_refresh') }}
          </button>
          <a href="https://board.en.ogame.gameforge.com" target="_blank" rel="noopener noreferrer"
             class="text-[10px] text-slate-600 hover:text-sky-400 transition-colors flex items-center gap-1">
            {{ t('news_feed_visit_forum') }}
            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </a>
        </div>
      </div>
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

function cardBorder(item) {
  const cat = normalizeCat(item.category)
  if (cat === 'active_offer') return 'border border-rose-500/20 hover:border-rose-400/40'
  if (cat === 'active_event') return 'border border-amber-600/20 hover:border-amber-500/40'
  if (cat.includes('future')) return 'border border-violet-600/20 hover:border-violet-500/35'
  return 'border border-slate-700/25 hover:border-slate-600/50'
}

function accentLine(item) {
  const cat = normalizeCat(item.category)
  if (cat === 'active_offer') return 'bg-gradient-to-r from-transparent via-rose-500/70 to-transparent'
  if (cat === 'active_event') return 'bg-gradient-to-r from-transparent via-amber-500/60 to-transparent'
  if (cat.includes('future')) return 'bg-gradient-to-r from-transparent via-violet-500/60 to-transparent'
  return 'bg-gradient-to-r from-transparent via-sky-500/40 to-transparent'
}

function badgeClasses(item) {
  const cat = normalizeCat(item.category)
  if (cat === 'active_offer') return 'bg-rose-500/10 text-rose-400 border-rose-500/25'
  if (cat === 'active_event') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  if (cat.includes('future')) return 'bg-violet-500/10 text-violet-400 border-violet-500/20'
  return 'bg-sky-500/[0.08] text-sky-400/80 border-sky-500/15'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try { return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short' }).format(new Date(dateStr)) }
  catch { return dateStr }
}

function formatTime(dateStr) {
  try { return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr)) }
  catch { return '' }
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
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })) }
  catch { /* quota exceeded */ }
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
  background: linear-gradient(90deg,
    rgba(148,163,184,0.04) 0%,
    rgba(148,163,184,0.08) 50%,
    rgba(148,163,184,0.04) 100%
  );
  background-size: 400px 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}

/* Card entrance */
.news-item-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
  transition-delay: calc(var(--index, 0) * 50ms);
}
.news-item-enter-from { opacity: 0; transform: translateY(8px); }
.news-item-leave-active { transition: opacity 0.15s ease; }
.news-item-leave-to { opacity: 0; }
</style>
