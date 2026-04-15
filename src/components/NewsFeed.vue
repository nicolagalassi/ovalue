<template>
  <section class="news-feed rounded-2xl border border-white/5 bg-[#0b0e14]/80 backdrop-blur-md p-4 md:p-6 mb-2" aria-label="News Feed">
    <!-- Header -->
    <div class="news-feed__header">
      <div class="news-feed__title-group">
        <span class="news-feed__icon" aria-hidden="true">📡</span>
        <h2 class="news-feed__title">{{ t('news_feed_title') }}</h2>
      </div>
      <div class="news-feed__controls">
        <span v-if="lastUpdated" class="news-feed__last-updated">
          {{ t('news_feed_updated') }}: {{ formatTime(lastUpdated) }}
        </span>
        <button
          class="news-feed__refresh-btn"
          :class="{ 'news-feed__refresh-btn--spinning': loading }"
          :disabled="loading"
          :aria-label="t('news_feed_refresh')"
          @click="fetchFeed(true)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.36-3.36L23 10M1 14l5.13 4.36A9 9 0 0018.49 15"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading && items.length === 0" class="news-feed__skeleton-list" aria-busy="true">
      <div v-for="n in 4" :key="n" class="news-feed__skeleton-item">
        <div class="news-feed__skeleton-tag"></div>
        <div class="news-feed__skeleton-line news-feed__skeleton-line--long"></div>
        <div class="news-feed__skeleton-line news-feed__skeleton-line--short"></div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error && items.length === 0" class="news-feed__error" role="alert">
      <span class="news-feed__error-icon">⚠</span>
      <div>
        <p class="news-feed__error-text">{{ t('news_feed_error') }}</p>
        <button class="news-feed__retry-btn" @click="fetchFeed(true)">{{ t('news_feed_retry') }}</button>
      </div>
    </div>

    <!-- News items or empty -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
      <TransitionGroup name="news-item">
        <a
          v-for="(item, index) in visibleItems"
          :key="item.link"
          :href="item.link"
          target="_blank"
          rel="noopener noreferrer"
          class="relative overflow-hidden group rounded-xl border p-5 flex flex-col justify-start min-h-[130px] transition-all duration-300 hover:-translate-y-1"
          :class="{
            'bg-[#ff2a6d]/[0.08] border-[#ff2a6d]/40 shadow-[0_4px_20px_rgba(255,42,109,0.15)] hover:border-[#ff2a6d]/80 hover:shadow-[0_4px_30px_rgba(255,42,109,0.25)]': normalizeCat(item.category) === 'offer',
            'bg-[#00f0ff]/[0.05] border-[#00f0ff]/20 shadow-[0_4px_20px_rgba(0,240,255,0.05)] hover:border-[#00f0ff]/50 hover:shadow-[0_4px_30px_rgba(0,240,255,0.15)]': normalizeCat(item.category) !== 'offer'
          }"
          :style="{ '--index': index }"
        >
          <!-- Background glow for offer -->
          <div v-if="normalizeCat(item.category) === 'active_offer'" class="absolute -right-10 -top-10 w-32 h-32 bg-[#ff2a6d] rounded-full blur-[70px] opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none"></div>
          
          <div class="relative z-10 w-full">
            <div class="flex justify-between items-start mb-3">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border"
                :class="{
                  'bg-[#ff2a6d]/20 text-[#ff3a7a] border-[#ff2a6d]/40': normalizeCat(item.category) === 'active_offer',
                  'bg-[#ffb800]/10 text-amber-500 border-amber-500/40': normalizeCat(item.category) === 'active_event',
                  'bg-[#9d00ff]/10 text-purple-400 border-purple-500/40': normalizeCat(item.category) === 'future_offer' || normalizeCat(item.category) === 'future_event',
                  'bg-[#00f0ff]/10 text-cyan-400 border-cyan-400/30': normalizeCat(item.category) !== 'active_offer' && normalizeCat(item.category) !== 'active_event' && !normalizeCat(item.category).includes('future')
                }"
              >
                <span v-if="normalizeCat(item.category) === 'active_offer'" class="text-sm leading-none drop-shadow-[0_0_5px_rgba(255,42,109,0.5)]">🔥</span>
                <span v-else-if="normalizeCat(item.category) === 'future_offer' || normalizeCat(item.category) === 'future_event'" class="text-sm leading-none drop-shadow-[0_0_5px_rgba(157,0,255,0.5)]">⏳</span>
                {{ t('news_cat_' + normalizeCat(item.category)) || item.category }}
              </span>
              <time class="text-[10px] font-mono text-gray-500 whitespace-nowrap ml-2">{{ formatDate(item.pubDate) }}</time>
            </div>
            <h3 class="text-sm font-bold text-white group-hover:text-blue-50 transition-colors drop-shadow-md leading-snug pr-6" :class="{'text-[15px] text-[#ff3a7a]': normalizeCat(item.category) === 'active_offer'}">
              {{ item.title }}
            </h3>
          </div>
          
          <div class="absolute right-4 bottom-4 flex items-center justify-center w-6 h-6 rounded-full bg-white/5 border border-white/10 text-white/50 group-hover:bg-white/10 group-hover:text-white group-hover:border-white/30 transition-all duration-300">
             <span class="text-xs group-hover:translate-x-[1px] transition-transform">→</span>
          </div>
        </a>
      </TransitionGroup>
      
      <!-- Empty state when no active offers exist -->
      <div v-if="visibleItems.length === 0" class="col-span-1 md:col-span-2 lg:col-span-3 py-10 flex flex-col items-center justify-center text-center border border-white/5 rounded-xl bg-black/20">
         <span class="text-3xl mb-3 opacity-50 grayscale">📡</span>
         <p class="text-gray-400 font-bold text-sm tracking-wider uppercase">{{ t('news_empty_title') }}</p>
         <p class="text-gray-600 text-xs mt-1 max-w-xs">{{ t('news_empty_desc') }}</p>
      </div>
    </div>

    <!-- Footer link -->
    <div class="news-feed__footer">
      <a
        href="https://board.en.ogame.gameforge.com"
        target="_blank"
        rel="noopener noreferrer"
        class="news-feed__forum-link"
      >
        {{ t('news_feed_visit_forum') }}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
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

// ── Config ──────────────────────────────────────────────────────────────────
const CACHE_KEY    = 'ogame_news_cache'
const CACHE_TTL_MS = 5 * 60 * 1000   // 5 minutes
const AUTO_REFRESH = 10 * 60 * 1000  // 10 minutes
const previewCount = 5

// ── State ────────────────────────────────────────────────────────────────────
const items       = ref([])
const loading     = ref(false)
const error       = ref(null)
const lastUpdated = ref(null)
const expanded    = ref(false)

// ── Computed ─────────────────────────────────────────────────────────────────
const visibleItems = computed(() => {
  const filtered = items.value.filter(item => {
    const cat = normalizeCat(item.category);
    if (cat.includes('past')) return false;
    return cat.includes('active') || cat.includes('future') || cat === 'update' || cat === 'universe' || cat === 'maintenance';
  });

  filtered.sort((a, b) => {
    const catA = normalizeCat(a.category);
    const catB = normalizeCat(b.category);
    const scoreA = catA.includes('active') ? 3 : (catA.includes('future') ? 2 : 1);
    const scoreB = catB.includes('active') ? 3 : (catB.includes('future') ? 2 : 1);
    
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
  });

  return filtered.slice(0, 6);
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalizeCat(cat) {
  if (!cat) return 'default'
  const c = cat.toLowerCase()
  if (c === 'active offer') return 'active_offer'
  if (c === 'active event') return 'active_event'
  if (c === 'future offer') return 'future_offer'
  if (c === 'future event') return 'future_event'
  if (c === 'past offer') return 'past_offer'
  if (c === 'past event') return 'past_event'
  
  if (c.includes('changelog') || c.includes('version') || c.includes('update')) return 'update'
  if (c.includes('maint'))   return 'maintenance'
  if (c.includes('universe') || c.includes('new uni')) return 'universe'
  return 'default'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(d)
  } catch { return dateStr }
}

function formatTime(dateStr) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(dateStr))
  } catch { return '' }
}

// ── Cache helpers ─────────────────────────────────────────────────────────────
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
  } catch { /* quota exceeded — ignore */ }
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
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
    const result  = await fetchOGameFeed()
    items.value   = result
    lastUpdated.value = new Date().toISOString()
    writeCache(result)
  } catch (err) {
    console.error('[NewsFeed] fetch error:', err)
    error.value = err.message || 'Unknown error'
    // keep stale data if available
    const cached = readCache()
    if (cached) items.value = cached.data
  } finally {
    loading.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
let timer
onMounted(() => {
  fetchFeed()
  timer = setInterval(() => fetchFeed(), AUTO_REFRESH)
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
/* ─── Design tokens (scoped overrides) ───────────────────────────── */
.news-feed {
  --nf-bg:          transparent;
  --nf-surface:     rgba(10, 22, 40, 0.4);
  --nf-border:      rgba(255, 255, 255, 0.05);
  --nf-border-glow: rgba(0, 240, 255, 0.3);
  --nf-accent:      #00f0ff;
  --nf-amber:       #ffb800;
  --nf-red:         #ff2a6d;
  --nf-green:       #00ff9d;
  --nf-text:        #e2e8f0;
  --nf-text-dim:    #64748b;
  --nf-mono:        'JetBrains Mono', 'Fira Mono', 'Courier New', monospace;
  --nf-radius:      12px;

  padding: 0;
  overflow: hidden;
  font-family: var(--nf-font-sans, system-ui, sans-serif);
  position: relative;
}

/* subtle scanline texture */
.news-feed::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 3px,
    rgba(0, 30, 60, 0.12) 3px,
    rgba(0, 30, 60, 0.12) 4px
  );
  pointer-events: none;
  z-index: 0;
}

/* ─── Header ─────────────────────────────────────────────────────── */
.news-feed__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid var(--nf-border);
  position: relative;
  z-index: 1;
  gap: 12px;
}

.news-feed__title-group {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.news-feed__icon {
  font-size: 16px;
  flex-shrink: 0;
}

.news-feed__title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--nf-accent);
  white-space: nowrap;
}

.news-feed__subtitle {
  font-size: 11px;
  color: var(--nf-text-dim);
  font-family: var(--nf-mono);
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.news-feed__controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.news-feed__last-updated {
  font-family: var(--nf-mono);
  font-size: 10px;
  color: var(--nf-text-dim);
  white-space: nowrap;
}

.news-feed__refresh-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--nf-border);
  border-radius: 8px;
  color: var(--nf-accent);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.news-feed__refresh-btn:hover:not(:disabled) {
  border-color: var(--nf-accent);
  background: rgba(0, 240, 255, 0.1);
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.2);
}

.news-feed__refresh-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.news-feed__refresh-btn--spinning svg {
  animation: spin 0.7s linear infinite;
}

/* ─── Skeleton ───────────────────────────────────────────────────── */
.news-feed__skeleton-list {
  padding: 8px 0;
  position: relative;
  z-index: 1;
}

.news-feed__skeleton-item {
  padding: 12px 18px;
  border-bottom: 1px solid var(--nf-border);
  display: flex;
  flex-direction: column;
  gap: 7px;
}

@keyframes shimmer {
  from { background-position: -400px 0; }
  to   { background-position:  400px 0; }
}

.news-feed__skeleton-tag,
.news-feed__skeleton-line {
  border-radius: 3px;
  background: linear-gradient(
    90deg,
    rgba(0,191,255,0.04) 0%,
    rgba(0,191,255,0.10) 50%,
    rgba(0,191,255,0.04) 100%
  );
  background-size: 400px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.news-feed__skeleton-tag {
  width: 64px;
  height: 14px;
}

.news-feed__skeleton-line {
  height: 12px;
}
.news-feed__skeleton-line--long  { width: 88%; }
.news-feed__skeleton-line--short { width: 48%; }

/* ─── Error ──────────────────────────────────────────────────────── */
.news-feed__error {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 20px 18px;
  position: relative;
  z-index: 1;
}

.news-feed__error-icon {
  font-size: 18px;
  flex-shrink: 0;
  color: var(--nf-amber);
  margin-top: 1px;
}

.news-feed__error-text {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--nf-text);
}

.news-feed__retry-btn {
  background: transparent;
  border: 1px solid var(--nf-amber);
  border-radius: var(--nf-radius);
  color: var(--nf-amber);
  cursor: pointer;
  font-size: 12px;
  padding: 4px 12px;
  transition: background 0.2s;
}

.news-feed__retry-btn:hover {
  background: rgba(240, 165, 0, 0.12);
}

/* ─── List ───────────────────────────────────────────────────────── */
.news-feed__list {
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;
  z-index: 1;
}

/* Category colour palette */
/* Note: Using tailwind and inline classes now, but preserving these just in case */

/* ─── Footer ─────────────────────────────────────────────────────── */
.news-feed__footer {
  padding: 6px 16px;
  background: rgba(0,0,0,0.2);
  border-top: 1px solid var(--nf-border);
  display: flex;
  justify-content: flex-end;
  position: relative;
  z-index: 1;
}

.news-feed__forum-link {
  font-size: 11px;
  color: var(--nf-text-dim);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 5px;
  letter-spacing: 0.05em;
  transition: color 0.15s;
}

.news-feed__forum-link:hover {
  color: var(--nf-accent);
  text-shadow: 0 0 8px rgba(0, 240, 255, 0.4);
}

/* ─── TransitionGroup animations ─────────────────────────────────── */
.news-item-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
  transition-delay: calc(var(--index) * 40ms);
}

.news-item-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.news-item-leave-active {
  transition: opacity 0.2s ease;
  position: absolute;
  width: 100%;
}

.news-item-leave-to {
  opacity: 0;
}

/* ─── Responsive ─────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .news-feed__subtitle,
  .news-feed__last-updated { display: none; }

  .news-feed__item-link { padding: 10px 14px; }
  .news-feed__header     { padding: 12px 14px; }
}
</style>
