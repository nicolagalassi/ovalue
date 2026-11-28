<script setup>
import { onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { toolByPath } from './data/tools';
import { useProfiles } from './composables/useProfiles';
import Header from './components/Header.vue';
import ExporterBanner from './components/ExporterBanner.vue';
import MaintenanceView from './views/MaintenanceView.vue';
import AppToast from './components/AppToast.vue';

// ── MANUTENZIONE ─────────────────────────────────────────────────────────────
// Imposta su true per mostrare la pagina di manutenzione a tutti gli utenti.
// Cambia in false per ripristinare il sito normale.
const MAINTENANCE_MODE = false;
// ─────────────────────────────────────────────────────────────────────────────

const { loadProfiles } = useProfiles();

// Strumento della pagina corrente: il suo colore (--tool) guida header, titolo e barre
const route = useRoute();
const tool = computed(() => toolByPath(route.path));

onMounted(() => {
  if (MAINTENANCE_MODE) return; // non inizializzare nulla in manutenzione
  loadProfiles();
});
</script>

<template>
  <!-- ── MANUTENZIONE ── -->
  <MaintenanceView v-if="MAINTENANCE_MODE" />

  <!-- ── SITO NORMALE ── -->
  <div v-else class="ov-app min-h-screen min-h-dvh flex flex-col font-sans antialiased text-slate-200 selection:bg-sky-500/20"
       :data-tool="tool?.id" :style="tool ? { '--tool': tool.color } : null">
    <Header />
    <ExporterBanner />

    <main class="flex-grow flex flex-col relative w-full">
      <router-view />
    </main>
  </div>

  <AppToast />
</template>
