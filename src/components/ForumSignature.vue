<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { drawSignature, BG_PRESETS, NICK_COLORS } from '../composables/useForumSignature';
import { getOrCreateSig, syncSignature } from '../services/signatureService';

const { t } = useLanguage();

const props = defineProps({
    totals:   { type: Object, required: true  },
    maxMine:  { type: Number, default: 0      },
    lfBonus:  { type: Number, default: 0      },
    collBonus:{ type: Number, default: 0      },
    settings: { type: Object, required: true  },
    nickname: { type: String, default: ''     },
    universe: { type: String, default: ''     },
});

// ─── Persistenza preferenze ──────────────────────────────────────────────────
const loadPrefs = () => {
    try { return JSON.parse(localStorage.getItem('ovalue_sig_prefs') || '{}'); } catch { return {}; }
};
const savePrefs = () => {
    localStorage.setItem('ovalue_sig_prefs', JSON.stringify({
        selectedBg:    selectedBg.value,
        nicknameColor: nicknameColor.value,
        showClass:     showClass.value,
        showEco:       showEco.value,
        showUniverse:  showUniverse.value,
        showMine:      showMine.value,
        showLfBonus:   showLfBonus.value,
        showCollBonus: showCollBonus.value,
    }));
};

const _p = loadPrefs();

// ─── Stato componente ────────────────────────────────────────────────────────
const canvasRef   = ref(null);
const showPanel   = ref(false);
const fontLoaded  = ref(false);
const urlCopied   = ref(false);
const syncing     = ref(false);
const syncError   = ref(false);
const sigId       = ref(localStorage.getItem('ovalue_sig_id') || null);

// Preferenze visuali
const selectedBg    = ref(_p.selectedBg    ?? 0);
const nicknameColor = ref(_p.nicknameColor ?? '#e2e8f0');
const showClass     = ref(_p.showClass     ?? true);
const showEco       = ref(_p.showEco       ?? true);
const showUniverse  = ref(_p.showUniverse  ?? true);
const showMine      = ref(_p.showMine      ?? true);
const showLfBonus   = ref(_p.showLfBonus   ?? true);
const showCollBonus = ref(_p.showCollBonus ?? true);

const isCollector = computed(() => props.settings?.playerClass === 'collector');

// ─── Font Orbitron ───────────────────────────────────────────────────────────
const loadFont = async () => {
    try {
        const f = new FontFace('Orbitron', 'url(/fonts/Orbitron-Bold.woff2)', { weight: '700' });
        await f.load();
        document.fonts.add(f);
    } catch (_) { /* fallback monospace */ }
    fontLoaded.value = true;
};

// ─── Costruzione dati firma ───────────────────────────────────────────────────
const buildData = () => ({
    nickname:      props.nickname  || props.universe || 'Player',
    universe:      props.universe  || '',
    daily:         props.totals?.daily  || 0,
    maxMine:       props.maxMine,
    lfBonus:       props.lfBonus,
    collBonus:     props.collBonus,
    isCollector:   isCollector.value,
    playerClass:   props.settings?.playerClass || 'other',
    ecoSpeed:      props.settings?.ecoSpeed || 8,
    nicknameColor: nicknameColor.value,
    showClass:     showClass.value,
    showEco:       showEco.value,
    showUniverse:  showUniverse.value,
    showMine:      showMine.value,
    showLfBonus:   showLfBonus.value,
    showCollBonus: showCollBonus.value,
});

// ─── Ridisegno canvas ────────────────────────────────────────────────────────
const redraw = () => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    drawSignature(canvas.getContext('2d'), buildData(), selectedBg.value, fontLoaded.value);
};

watch(
    [
        () => props.totals, () => props.maxMine, () => props.lfBonus,
        () => props.collBonus, () => props.settings,
        () => props.nickname, () => props.universe,
        selectedBg, fontLoaded,
        nicknameColor, showClass, showEco, showUniverse, showMine, showLfBonus, showCollBonus,
    ],
    redraw,
    { deep: true },
);

// ─── Sync a Supabase (debounced) ─────────────────────────────────────────────
let syncTimer = null;

const doSync = async () => {
    const id = sigId.value;
    const wk = localStorage.getItem('ovalue_sig_write_key');
    if (!id || !wk) return;
    syncing.value   = true;
    syncError.value = false;
    try {
        await syncSignature(id, wk, buildData(), selectedBg.value);
    } catch (_) {
        syncError.value = true;
    } finally {
        syncing.value = false;
    }
};

const scheduleSync = (delay = 3000) => {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(doSync, delay);
};

// Dati produzione → sync 3s
watch(
    [() => props.totals, () => props.maxMine, () => props.lfBonus,
     () => props.collBonus, () => props.settings, () => props.nickname, () => props.universe],
    () => { if (sigId.value) scheduleSync(3000); },
    { deep: true },
);

// Preferenze visive → salva + sync 600ms
watch(
    [selectedBg, nicknameColor, showClass, showEco, showUniverse, showMine, showLfBonus, showCollBonus],
    () => {
        savePrefs();
        if (sigId.value) scheduleSync(600);
    },
);

// ─── Mount ───────────────────────────────────────────────────────────────────
onMounted(async () => {
    await loadFont();
    redraw();
    try {
        const { sigId: id } = await getOrCreateSig();
        sigId.value = id;
        doSync();
    } catch (_) {
        syncError.value = true;
    }
});

onBeforeUnmount(() => clearTimeout(syncTimer));

// ─── BBCode / URL ────────────────────────────────────────────────────────────
const forumUrl    = computed(() => sigId.value ? `${window.location.origin}/api/sig/${sigId.value}.png` : '');
const forumBBCode = computed(() => {
    if (!forumUrl.value) return '';
    const site = window.location.origin;
    return `[url=${site}][img]${forumUrl.value}[/img][/url]`;
});

const copyBBCode = async () => {
    if (!forumBBCode.value) return;
    try {
        await navigator.clipboard.writeText(forumBBCode.value);
        urlCopied.value = true;
        setTimeout(() => { urlCopied.value = false; }, 2500);
    } catch (_) {}
};

// ─── Download PNG ────────────────────────────────────────────────────────────
const downloadPng = () => {
    const a = document.createElement('a');
    a.download = 'ovalue-firma.png';
    a.href = canvasRef.value.toDataURL('image/png');
    a.click();
};
</script>

<template>
  <div class="card-glass border-l-2 border-l-violet-500/40 bg-violet-500/[0.02]">

    <!-- ── Header / toggle ────────────────────────────────────────────────── -->
    <button @click="showPanel = !showPanel"
            class="w-full flex items-center justify-between px-5 py-3.5 text-violet-400 hover:text-violet-300 transition-colors">
      <div class="flex items-center gap-2.5">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 15.828V13zM3 21h18"/>
        </svg>
        <span class="text-[11px] font-black uppercase tracking-widest">{{ t('sig_title') }}</span>
        <span v-if="syncing"
              class="flex items-center gap-1 text-[9px] text-violet-400/60 animate-pulse">
          <span class="w-1.5 h-1.5 rounded-full bg-violet-400/60 inline-block"/>
          {{ t('sig_syncing') }}
        </span>
        <span v-else-if="syncError"
              class="text-[9px] text-red-400/70">{{ t('sig_sync_error') }}</span>
        <span v-else-if="sigId"
              class="flex items-center gap-1 text-[9px] text-emerald-400/50">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400/50 inline-block"/>
          sync
        </span>
      </div>
      <svg class="w-4 h-4 transition-transform duration-200 flex-shrink-0"
           :class="{ 'rotate-180': showPanel }"
           fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
      </svg>
    </button>

    <!-- ── Body ──────────────────────────────────────────────────────────── -->
    <div v-show="showPanel" class="px-5 pb-5 space-y-4 border-t border-slate-700/20 pt-4">

      <!-- Anteprima canvas -->
      <div class="flex justify-center overflow-hidden rounded-lg">
        <canvas ref="canvasRef" width="500" height="150"
                class="rounded-lg max-w-full"
                style="image-rendering: crisp-edges; box-shadow: 0 0 20px rgba(0,0,0,0.6);"/>
      </div>

      <!-- ── Riga opzioni: sfondo + colore nick ─────────────────────────── -->
      <div class="grid grid-cols-2 gap-4">

        <!-- Sfondo -->
        <div>
          <label class="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">
            {{ t('sig_bg_label') }}
          </label>
          <div class="flex gap-1.5 flex-wrap">
            <button v-for="(bg, i) in BG_PRESETS" :key="bg.key"
                    @click="selectedBg = i"
                    class="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all border"
                    :class="selectedBg === i
                      ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                      : 'bg-[#0a101e] border-slate-700/30 text-slate-500 hover:text-slate-300 hover:border-slate-600/50'">
              {{ t('sig_bg_' + i) }}
            </button>
          </div>
        </div>

        <!-- Colore nickname -->
        <div>
          <label class="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">
            {{ t('sig_nick_color') }}
          </label>
          <div class="flex gap-2 items-center flex-wrap">
            <button v-for="color in NICK_COLORS" :key="color"
                    @click="nicknameColor = color"
                    class="w-6 h-6 rounded-full border-2 transition-all flex-shrink-0"
                    :style="{ backgroundColor: color, boxShadow: nicknameColor === color ? `0 0 8px ${color}` : 'none' }"
                    :class="nicknameColor === color
                      ? 'border-white scale-110'
                      : 'border-transparent hover:border-white/40'"/>
          </div>
        </div>
      </div>

      <!-- ── Elementi visibili ──────────────────────────────────────────── -->
      <div>
        <label class="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">
          {{ t('sig_visibility') }}
        </label>
        <div class="space-y-2">
          <!-- Info giocatore -->
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-[9px] text-slate-600 w-20 flex-shrink-0">{{ t('sig_player_info') }}</span>
            <button @click="showUniverse = !showUniverse"
                    class="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border"
                    :class="showUniverse
                      ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                      : 'bg-[#0a101e] border-slate-700/20 text-slate-600 line-through'">
              {{ t('sig_show_universe') }}
            </button>
            <button @click="showClass = !showClass"
                    class="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border"
                    :class="showClass
                      ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                      : 'bg-[#0a101e] border-slate-700/20 text-slate-600 line-through'">
              {{ t('sig_show_class') }}
            </button>
            <button @click="showEco = !showEco"
                    class="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border"
                    :class="showEco
                      ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                      : 'bg-[#0a101e] border-slate-700/20 text-slate-600 line-through'">
              {{ t('sig_show_eco') }}
            </button>
          </div>
          <!-- Stats account -->
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-[9px] text-slate-600 w-20 flex-shrink-0">{{ t('sig_stats') }}</span>
            <button @click="showMine = !showMine"
                    class="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border"
                    :class="showMine
                      ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                      : 'bg-[#0a101e] border-slate-700/20 text-slate-600 line-through'">
              {{ t('sig_show_mine') }}
            </button>
            <button @click="showLfBonus = !showLfBonus"
                    class="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border"
                    :class="showLfBonus
                      ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                      : 'bg-[#0a101e] border-slate-700/20 text-slate-600 line-through'">
              {{ t('sig_show_lf') }}
            </button>
            <button v-if="isCollector"
                    @click="showCollBonus = !showCollBonus"
                    class="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border"
                    :class="showCollBonus
                      ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                      : 'bg-[#0a101e] border-slate-700/20 text-slate-600 line-through'">
              {{ t('sig_show_coll') }}
            </button>
          </div>
        </div>
      </div>

      <!-- BBCode forum -->
      <div v-if="sigId">
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            {{ t('sig_bbcode_label') }}
          </label>
          <span class="text-[9px] text-emerald-400/55 font-mono">{{ t('sig_auto_update_note') }}</span>
        </div>
        <div class="flex gap-2">
          <input readonly :value="forumBBCode"
                 class="flex-1 bg-[#0a101e] border border-slate-700/30 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 min-w-0 focus:outline-none select-all cursor-text"
                 @click="$event.target.select()"/>
          <button @click="copyBBCode"
                  class="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all"
                  :class="urlCopied
                    ? 'bg-violet-500/20 text-violet-300'
                    : 'bg-violet-500/10 hover:bg-violet-500/20 text-violet-400'">
            <svg v-if="!urlCopied" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ urlCopied ? t('sig_copied') : t('sig_copy_url') }}
          </button>
        </div>
        <p class="text-[10px] text-slate-600 mt-1.5 flex items-center gap-1.5">
          <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ t('sig_tip') }}
        </p>
      </div>

      <div v-else class="text-center py-1">
        <span class="text-xs text-slate-600 animate-pulse">{{ t('sig_initializing') }}</span>
      </div>

      <!-- Download PNG -->
      <div class="flex justify-end pt-1">
        <button @click="downloadPng"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 transition-all border border-sky-500/20">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          {{ t('sig_download') }}
        </button>
      </div>
    </div>
  </div>
</template>
