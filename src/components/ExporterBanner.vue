<script setup>
// Avviso "installa lo script" mostrato su tutte le pagine (tranne la Home, che ha il
// suo riquadro) finché lo script non è rilevato e nessun profilo è stato sincronizzato.
// Si chiude per la sessione e torna alla visita successiva: chi lo ignora la prima volta
// lo rivede. Compare dopo un attimo, per dare tempo al ping dell'exporter già installato.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useLanguage } from '../composables/useLanguage';
import { useExporterStatus } from '../composables/useExporterStatus';
import { EXPORTER_INSTALL_URL } from '../data/links';

const DISMISS_KEY = 'ovalue_exporter_banner_dismissed';
const { t } = useLanguage();
const route = useRoute();
const { exporterDetected } = useExporterStatus();

const ready = ref(false);
const dismissed = ref(false);
try { dismissed.value = sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { /* storage bloccato */ }

let timer = null;
onMounted(() => { timer = setTimeout(() => { ready.value = true; }, 1500); });
onBeforeUnmount(() => clearTimeout(timer));

const visible = computed(() =>
    ready.value && !dismissed.value && !exporterDetected.value && route.path !== '/'
);

const dismiss = () => {
    dismissed.value = true;
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* storage bloccato */ }
};
</script>

<template>
  <Transition name="banner">
    <div v-if="visible" role="region" :aria-label="t('banner_script_title')"
         class="w-full border-b border-sky-500/25 bg-sky-500/[0.07]">
      <div class="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="flex items-start gap-3 flex-grow min-w-0">
          <svg class="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <div class="min-w-0">
            <p class="text-sm font-bold text-sky-200">{{ t('banner_script_title') }}</p>
            <p class="text-xs text-slate-400 leading-relaxed">{{ t('banner_script_desc') }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0 sm:ml-auto">
          <a :href="EXPORTER_INSTALL_URL" target="_blank" rel="noopener noreferrer"
             class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/[0.18] hover:bg-sky-500/[0.28] border border-sky-400/40 hover:border-sky-300/60 text-sky-200 text-xs font-bold uppercase tracking-wider transition-colors">
            <svg class="w-4 h-4" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            {{ t('btn_download_script') }}
          </a>
          <button type="button" @click="dismiss"
                  class="px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-colors">
            {{ t('banner_script_later') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.banner-enter-active { transition: opacity 200ms ease, transform 200ms ease; }
.banner-enter-from { opacity: 0; transform: translateY(-4px); }
.banner-leave-active { transition: opacity 150ms ease; }
.banner-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) {
  .banner-enter-active, .banner-leave-active { transition: none !important; }
}
</style>
