<script setup>
import { computed } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useProfiles } from '../composables/useProfiles';
import { useOgameFormulas } from '../composables/useOgameFormulas';
import Footer from '../components/Footer.vue';
import ToolIcon from '../components/ToolIcon.vue';
import { useExporterStatus } from '../composables/useExporterStatus';
import { EXPORTER_INSTALL_URL } from '../data/links';
import { TOOLS } from '../data/tools';

const { t, currentLang } = useLanguage();
// Exodus speaks Italian and English only: Italian stays Italian, every other language opens it in English
const fusionHref = () => `/fusion/?lang=${currentLang.value === 'it' ? 'it' : 'en'}`;
const { activeProfile } = useProfiles();
const { formatNum } = useOgameFormulas();
const { exporterDetected } = useExporterStatus();
const installSteps = ['home_step_install', 'home_step_overview', 'home_step_back'];

// Piano salvato dal Production Planner per questo profilo (solo lettura)
const plan = computed(() => {
    const id = activeProfile.value?.id;
    if (!id) return null;
    try {
        const s = JSON.parse(localStorage.getItem('ovalue_strategy_state') || '{}')[id];
        const steps = s?.result?.steps?.length || 0;
        return steps ? { steps, done: Array.isArray(s.doneSteps) ? s.doneSteps.length : 0, final: s.result.finalProd || 0 } : null;
    } catch { return null; }
});

const planets = computed(() => activeProfile.value?.production?.planets?.length || 0);
const daily = computed(() => activeProfile.value?.production?.daily || 0);

// "Aggiornato 3 ore fa"
const syncedAgo = computed(() => {
    const ts = activeProfile.value?.lastSync;
    if (!ts) return '';
    const diff = (Date.now() - ts) / 1000;
    const rtf = new Intl.RelativeTimeFormat(currentLang.value || 'it', { numeric: 'auto' });
    if (diff < 3600) return rtf.format(-Math.max(1, Math.round(diff / 60)), 'minute');
    if (diff < 86400) return rtf.format(-Math.round(diff / 3600), 'hour');
    return rtf.format(-Math.round(diff / 86400), 'day');
});

// Dato vivo di ogni strumento, dal profilo attivo
const toolStat = (id) => {
    const p = activeProfile.value;
    if (!p?.lastSync) return null;
    if (id === 'metal' && daily.value) return { v: formatNum(daily.value), k: t('lbl_met_day') };
    if (id === 'pack') {
        const n = p.packExchange?.queue?.length || 0;
        return n ? { v: formatNum(n), k: t('lbl_in_queue') } : null;
    }
    if (id === 'shopping') {
        const n = (p.shoppingList?.cart || []).reduce((s, i) => s + (i.mult || 1), 0);
        return n ? { v: formatNum(n), k: t('lbl_in_cart') } : null;
    }
    if (id === 'strategy' && plan.value) return { v: `${plan.value.done}/${plan.value.steps}`, k: t('home_plan_steps') };
    return null;
};
</script>

<template>
  <div class="flex flex-col w-full flex-grow">

    <div class="flex-grow w-full max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-8 flex flex-col gap-6">
      <h1 class="sr-only">OValue</h1>

      <!-- ── Profilo attivo: chi sono e i numeri che contano ─────────────── -->
      <section v-if="activeProfile?.lastSync" class="home-hero ov-panel p-5 md:p-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div class="min-w-0">
          <div class="ov-label">{{ t('home_profile') }}</div>
          <div class="mt-1 text-2xl md:text-[28px] font-bold text-slate-100 leading-tight truncate" :title="activeProfile.name">{{ activeProfile.name }}</div>
          <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-400">
            <span v-if="activeProfile.syncServer && activeProfile.syncServer.split('.')[0] !== activeProfile.name" class="inline-flex items-center gap-1.5">
              {{ activeProfile.syncServer.split('.')[0] }}
            </span>
            <span class="inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>{{ t('home_synced') }} {{ syncedAgo }}</span>
          </div>
        </div>
        <dl class="grid grid-cols-2 sm:grid-cols-3 gap-px rounded-lg overflow-hidden bg-ogame-line border border-ogame-line">
          <div class="bg-ogame-surface px-4 py-3 min-w-0 col-span-2 sm:col-span-1">
            <dt class="ov-label">{{ t('home_daily') }}</dt>
            <dd class="mt-0.5 text-xl font-bold tabular-nums text-sky-300">{{ formatNum(daily) }}</dd>
          </div>
          <div class="bg-ogame-surface px-4 py-3 min-w-0">
            <dt class="ov-label">{{ t('home_planets') }}</dt>
            <dd class="mt-0.5 text-xl font-bold tabular-nums text-slate-100">{{ planets }}</dd>
          </div>
          <div class="bg-ogame-surface px-4 py-3 min-w-0">
            <dt class="ov-label">{{ t('home_plan') }}</dt>
            <dd class="mt-0.5 text-xl font-bold tabular-nums" :class="plan ? 'text-emerald-300' : 'text-slate-500'">
              {{ plan ? `${plan.done}/${plan.steps}` : '—' }}
            </dd>
          </div>
        </dl>
      </section>

      <!-- ── Primo accesso: passi per installare lo script ────────────────── -->
      <template v-else>
        <p class="text-[15px] text-slate-300 max-w-2xl text-balance leading-relaxed">{{ t('index_desc') }}</p>
        <div v-if="!exporterDetected" class="ov-panel p-5 md:p-6 grid gap-4">
          <h2 class="text-lg md:text-xl font-bold text-slate-100 text-balance">{{ t('home_script_title') }}</h2>
          <ol class="grid gap-3 sm:grid-cols-3">
            <li v-for="(key, i) in installSteps" :key="key" class="flex sm:flex-col gap-3 sm:gap-2">
              <span class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                    :class="i === 0 ? 'bg-ogame-accent text-ogame-bg' : 'bg-ogame-raised text-slate-300 border border-slate-700'">{{ i + 1 }}</span>
              <span class="text-sm text-slate-300 leading-snug">{{ t(key) }}</span>
            </li>
          </ol>
          <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <a :href="EXPORTER_INSTALL_URL" target="_blank" rel="noopener noreferrer" class="ov-btn ov-btn-primary">
              <svg class="w-4 h-4 flex-shrink-0" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              {{ t('btn_download_script') }}
            </a>
            <span class="text-xs text-slate-400 leading-snug">{{ t('home_script_note') }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-emerald-400">{{ t('home_script_detected_hint') }}</p>
      </template>

      <!-- ── Strumenti ─────────────────────────────────────────────────────── -->
      <section class="grid gap-3">
        <h2 class="ov-sh" style="--tc:#00f0ff">{{ t('home_tools') }}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <router-link v-for="tool in TOOLS" :key="tool.to" :to="tool.to"
                       class="tool-card group ov-panel overflow-hidden flex flex-col"
                       :style="{ '--tool': tool.color }">
            <!-- Fascia superiore nel colore dello strumento, con l'immagine di gioco -->
            <div class="tool-band relative h-16 sm:h-24 flex items-center sm:items-end justify-between px-5 sm:pb-3">
              <span class="ov-tile"><ToolIcon :tool="tool" class="w-5 h-5" /></span>
              <img :src="tool.img" alt="" aria-hidden="true" loading="lazy"
                   class="tool-img absolute right-4 top-2 sm:top-3 w-12 h-12 sm:w-[72px] sm:h-[72px] rounded-lg object-cover" />
            </div>
            <div class="px-5 pt-3 pb-5 flex flex-col gap-2 flex-grow">
              <h3 class="text-base font-bold text-slate-100">{{ t(tool.titleKey) }}</h3>
              <p class="text-[13px] text-slate-400 leading-snug flex-grow">{{ t(tool.descKey) }}</p>
              <div class="mt-2 flex items-end justify-between gap-3 pt-3 border-t border-ogame-line">
                <div v-if="toolStat(tool.id)" class="min-w-0">
                  <div class="text-lg font-bold tabular-nums text-slate-100 leading-none">{{ toolStat(tool.id).v }}</div>
                  <div class="text-[11px] text-slate-400 mt-1">{{ toolStat(tool.id).k }}</div>
                </div>
                <span v-else class="text-[12px] text-slate-500">{{ t('home_no_data') }}</span>
                <span class="tool-open text-[13px] font-semibold inline-flex items-center gap-1 flex-none">
                  {{ t('btn_open') }}
                  <svg class="w-3.5 h-3.5 transition-transform duration-150" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.25" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6"/></svg>
                </span>
              </div>
            </div>
          </router-link>
        </div>
      </section>

      <!-- ── PIANO FUSIONI: sito statico sotto /fusion/, caricamento completo (non router-link) ── -->
      <a :href="fusionHref()"
         class="fusion-banner ov-panel group flex items-center gap-4 px-5 py-4 hover:border-amber-400/40 transition-colors duration-150">
        <span class="ov-tile" style="--tool:#fbbf24" aria-hidden="true">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4"/></svg>
        </span>
        <div class="flex-grow min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-100">{{ t('home_fusion_title') }}</span>
            <span class="ov-tag ov-tag-warn">2026</span>
          </div>
          <span class="block text-sm text-slate-400 mt-0.5">{{ t('home_fusion_desc') }}</span>
        </div>
        <span class="ov-btn ov-btn-ghost ov-btn-sm flex-none">{{ t('btn_open') }}&nbsp;↗&#xFE0E;</span>
      </a>

      <!-- ── Link esterni ─────────────────────────────────────────────────── -->
      <div class="flex items-center gap-2 flex-wrap">
        <a href="https://ostats.eu/" target="_blank" rel="noopener noreferrer" class="ov-btn ov-btn-ghost ov-btn-sm">
          <img src="/Immagini%20Ogame/ostats-logo-v3.png" alt="" aria-hidden="true" class="h-4 w-4 object-contain" />
          {{ t('card_ostats_title') }}&nbsp;↗&#xFE0E;
        </a>
        <a href="https://www.ogameutilities.it/index.html" target="_blank" rel="noopener noreferrer" class="ov-btn ov-btn-ghost ov-btn-sm">
          <img src="/Immagini%20Ogame/ogame%20util.ico" alt="" aria-hidden="true" class="h-4 w-4 object-contain" />
          {{ t('card_ou_title') }}&nbsp;↗&#xFE0E;
        </a>
        <router-link to="/settings" class="ov-btn ov-btn-ghost ov-btn-sm">{{ t('home_report_title') }}</router-link>
        <a href="https://ko-fi.com/galax95" target="_blank" rel="noopener noreferrer" class="ov-btn ov-btn-tint ov-btn-sm"
           style="--tc: #fbbf24" :title="t('support_banner_text')">{{ t('support_banner_link') }}&nbsp;↗&#xFE0E;</a>
      </div>
    </div>

    <Footer class="flex-shrink-0 w-full" />
  </div>
</template>

<style scoped>
.home-hero {
  background:
    radial-gradient(ellipse 50% 140% at 0% 0%, rgb(0 240 255 / 0.07), transparent 70%),
    theme('colors.ogame.panel');
}
.tool-card {
  transition: border-color 150ms, transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tool-band {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--tool) 16%, transparent), color-mix(in srgb, var(--tool) 4%, transparent));
  border-bottom: 1px solid color-mix(in srgb, var(--tool) 22%, transparent);
}
.tool-img {
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--tool) 35%, transparent);
  transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tool-open { color: var(--tool); }
@media (hover: hover) and (pointer: fine) {
  .tool-card:hover { border-color: color-mix(in srgb, var(--tool) 45%, transparent); transform: translateY(-2px); }
  .tool-card:hover .tool-img { transform: scale(1.04); }
  .tool-card:hover .tool-open svg { transform: translateX(2px); }
}
.tool-card:active { transform: scale(0.99); }
.tool-card:focus-visible, .fusion-banner:focus-visible { outline: 2px solid rgb(0 240 255 / 0.7); outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) {
  .tool-card, .tool-img { transition: border-color 150ms; }
  .tool-card:hover, .tool-card:active, .tool-card:hover .tool-img { transform: none; }
}
</style>
