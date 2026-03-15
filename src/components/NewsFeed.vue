<template>
  <section class="news-feed card-glass group transition-all duration-500 hover:shadow-neon-blue" aria-label="News Feed">
    <!-- Header -->
    <div class="news-feed__header">
      <div class="news-feed__title-group">
        <span class="news-feed__icon" aria-hidden="true">📡</span>
        <h2 class="news-feed__title">{{ t('news_feed_title') }}</h2>
        <span class="news-feed__subtitle">{{ t('news_feed_subtitle') }}</span>
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
    <div v-else class="news-feed__scroll-container">
      <TransitionGroup name="news-item" tag="ul" class="news-feed__list" role="list">
        <li
          v-for="(item, index) in visibleItems"
          :key="item.link"
          class="news-feed__item"
          :style="{ '--index': index }"
        >
          <a
            class="news-feed__item-link"
            :href="item.link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div class="news-feed__item-header">
              <span class="news-feed__item-category" :data-category="normalizeCat(item.category)">
                {{ item.category || t('news_feed_default_category') }}
              </span>
              <time class="news-feed__item-date" :datetime="item.pubDate">
                {{ formatDate(item.pubDate) }}
              </time>
            </div>
            <p class="news-feed__item-title">{{ item.title }}</p>
            <span class="news-feed__item-arrow" aria-hidden="true">→</span>
          </a>
        </li>
      </TransitionGroup>
    </div>

    <!-- Show more / less -->
    <div v-if="!loading && !error && items.length > previewCount" class="news-feed__toggle">
      <button class="news-feed__toggle-btn" @click="expanded = !expanded">
        <span v-if="!expanded">{{ t('news_feed_show_more') }}</span>
        <span v-else>{{ t('news_feed_show_less') }}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5"
          :style="{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
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
const visibleItems = computed(() =>
  expanded.value ? items.value : items.value.slice(0, previewCount)
)

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalizeCat(cat) {
  if (!cat) return 'default'
  const c = cat.toLowerCase()
  if (c.includes('event') || c.includes('happy')) return 'event'
  if (c.includes('news') || c.includes('info'))  return 'news'
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

.news-feed__scroll-container {
  max-height: 320px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--nf-accent) transparent;
}

.news-feed__scroll-container::-webkit-scrollbar {
  width: 4px;
}

.news-feed__scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.news-feed__scroll-container::-webkit-scrollbar-thumb {
  background: var(--nf-accent);
  border-radius: 10px;
}

/* ─── Item ───────────────────────────────────────────────────────── */
.news-feed__item {
  border-bottom: 1px solid var(--nf-border);
}

.news-feed__item:last-child {
  border-bottom: none;
}

.news-feed__item-link {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  align-items: center;
  column-gap: 12px;
  row-gap: 2px;
  padding: 8px 16px;
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
}

.news-feed__item-link::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: var(--nf-accent);
  transform: scaleY(0);
  transform-origin: top;
  transition: transform 0.2s ease;
}

.news-feed__item-link:hover {
  background: rgba(0, 191, 255, 0.05);
}

.news-feed__item-link:hover::before {
  transform: scaleY(1);
}

.news-feed__item-header {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.news-feed__item-category {
  font-family: var(--nf-mono);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 3px;
  border: 1px solid currentColor;
  flex-shrink: 0;
}

/* Category colour palette */
[data-category="event"]       { color: #ffb800; border-color: rgba(255,184,0,0.3); background: rgba(255,184,0,0.06); }
[data-category="update"]      { color: #00ff9d; border-color: rgba(0,255,157,0.3); background: rgba(0,255,157,0.06); }
[data-category="maintenance"] { color: #ff8c42; border-color: rgba(255,140,66,0.3); background: rgba(255,140,66,0.06); }
[data-category="news"]        { color: #00f0ff; border-color: rgba(0,240,255,0.3); background: rgba(0,240,255,0.06); }
[data-category="universe"]    { color: #9d00ff; border-color: rgba(157,0,255,0.3); background: rgba(157,0,255,0.06); }
[data-category="default"]     { color: #64748b; border-color: rgba(100,116,139,0.3); background: rgba(100,116,139,0.06); }

.news-feed__item-date {
  font-family: var(--nf-mono);
  font-size: 10px;
  color: var(--nf-text-dim);
  white-space: nowrap;
}

.news-feed__item-title {
  grid-column: 1;
  grid-row: 2;
  margin: 0;
  font-size: 11.5px;
  line-height: 1.35;
  color: var(--nf-text);
  transition: color 0.15s;
}

.news-feed__item-link:hover .news-feed__item-title {
  color: #e8f4ff;
}

.news-feed__item-arrow {
  grid-column: 2;
  grid-row: 1 / 3;
  font-size: 16px;
  color: var(--nf-text-dim);
  transition: color 0.15s, transform 0.15s;
  align-self: center;
}

.news-feed__item-link:hover .news-feed__item-arrow {
  color: var(--nf-accent);
  transform: translateX(3px);
}

/* ─── Toggle ─────────────────────────────────────────────────────── */
.news-feed__toggle {
  padding: 10px 18px;
  border-top: 1px solid var(--nf-border);
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.news-feed__toggle-btn {
  background: transparent;
  border: none;
  color: var(--nf-accent);
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.06em;
  padding: 3px 6px;
  border-radius: 4px;
  transition: background 0.15s;
}

.news-feed__toggle-btn:hover {
  background: rgba(0, 191, 255, 0.08);
}

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
