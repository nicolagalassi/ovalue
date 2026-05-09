<script setup>
import { ref, onMounted } from 'vue';
import { useLanguage } from './composables/useLanguage';
import { useProfiles } from './composables/useProfiles';
import Header from './components/Header.vue';
import MaintenanceView from './views/MaintenanceView.vue';

// ── MANUTENZIONE ─────────────────────────────────────────────────────────────
// Imposta su true per mostrare la pagina di manutenzione a tutti gli utenti.
// Cambia in false per ripristinare il sito normale.
const MAINTENANCE_MODE = false;
// ─────────────────────────────────────────────────────────────────────────────

const { t } = useLanguage();
const { loadProfiles } = useProfiles();
const showSupportBanner = ref(false);

onMounted(() => {
  if (MAINTENANCE_MODE) return; // non inizializzare nulla in manutenzione
  loadProfiles();
  if (localStorage.getItem('hide_support_banner') !== 'true') {
    showSupportBanner.value = true;
  }
});

function closeBanner() {
  showSupportBanner.value = false;
  localStorage.setItem('hide_support_banner', 'true');
}
</script>

<template>
  <!-- ── MANUTENZIONE ── -->
  <MaintenanceView v-if="MAINTENANCE_MODE" />

  <!-- ── SITO NORMALE ── -->
  <div v-else class="min-h-screen flex flex-col font-sans antialiased text-slate-200 selection:bg-sky-500/20">
    <Header />

    <!-- Support banner -->
    <div v-if="showSupportBanner" class="w-full bg-sky-950/40 border-b border-sky-700/20 py-2 px-4 md:px-6 z-40 relative backdrop-blur-sm flex items-center justify-center">
      <div class="flex items-center gap-3 text-sm">
        <span class="text-lg leading-none">☕</span>
        <span class="text-slate-400 text-[12px]">{{ t('support_banner_text') }}</span>
        <a href="https://ko-fi.com/galax95" target="_blank" rel="noopener noreferrer"
           class="text-sky-400 hover:text-sky-300 text-[12px] font-semibold border-b border-sky-400/30 hover:border-sky-300/50 transition-colors whitespace-nowrap">
          {{ t('support_banner_link') }}
        </a>
      </div>
      <button @click="closeBanner"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-white/5">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <main class="flex-grow flex flex-col relative w-full">
      <router-view />
    </main>
  </div>
</template>
