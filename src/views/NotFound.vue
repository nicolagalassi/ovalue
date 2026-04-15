<script setup>
import { useLanguage } from '../composables/useLanguage';

const { t } = useLanguage();
</script>

<template>
  <div class="not-found-root flex flex-col items-center justify-center min-h-[calc(100vh-72px)] text-center px-4">
    <!-- Icona stilizzata -->
    <div class="relative mb-8 group">
      <div class="absolute inset-0 bg-cyan-500/20 blur-[50px] rounded-full group-hover:bg-cyan-500/30 transition-all duration-700"></div>
      <svg class="w-32 h-32 md:w-48 md:h-48 text-cyan-500/80 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
    </div>

    <!-- Testo 404 -->
    <h1 class="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white glow-white mb-4">
      404
    </h1>
    
    <h2 class="text-xl md:text-2xl font-bold text-gray-300 uppercase tracking-widest mb-6">
      {{ t('page_not_found') || 'Pagina Non Trovata' }}
    </h2>
    
    <p class="text-sm md:text-base text-gray-500 max-w-md mx-auto mb-10 leading-relaxed">
      {{ t('page_not_found_desc') || 'La pagina che cerchi potrebbe essere stata rimossa, rinominata o non essere mai esistita.' }}
    </p>

    <!-- Pulsante Home -->
    <router-link to="/" class="group relative px-8 py-4 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-sm font-black uppercase tracking-[0.2em] rounded-xl border border-cyan-500/30 hover:border-cyan-400 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:-translate-y-1">
      <span class="flex items-center gap-3">
        <svg class="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        {{ t('nav_back') || 'Torna alla Home' }}
      </span>
    </router-link>
  </div>
</template>

<style scoped>
.not-found-root {
  background: radial-gradient(circle at center, rgba(6, 182, 212, 0.05), transparent 60%);
}
.glow-white { 
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3); 
}
</style>
