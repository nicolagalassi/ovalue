<script setup>
import { onMounted } from 'vue';
import { useProfiles } from './composables/useProfiles';
import Header from './components/Header.vue';
import MaintenanceView from './views/MaintenanceView.vue';
import AppToast from './components/AppToast.vue';

// ── MANUTENZIONE ─────────────────────────────────────────────────────────────
// Imposta su true per mostrare la pagina di manutenzione a tutti gli utenti.
// Cambia in false per ripristinare il sito normale.
const MAINTENANCE_MODE = false;
// ─────────────────────────────────────────────────────────────────────────────

const { loadProfiles } = useProfiles();

onMounted(() => {
  if (MAINTENANCE_MODE) return; // non inizializzare nulla in manutenzione
  loadProfiles();
});
</script>

<template>
  <!-- ── MANUTENZIONE ── -->
  <MaintenanceView v-if="MAINTENANCE_MODE" />

  <!-- ── SITO NORMALE ── -->
  <div v-else class="min-h-screen flex flex-col font-sans antialiased text-slate-200 selection:bg-sky-500/20">
    <Header />

    <main class="flex-grow flex flex-col relative w-full">
      <router-view />
    </main>
  </div>

  <AppToast />
</template>
