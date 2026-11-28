<script setup>
import { useLanguage } from '../composables/useLanguage';

const { t } = useLanguage();
</script>

<template>
  <div class="not-found-root flex flex-col items-center justify-center min-h-[calc(100dvh-72px)] text-center px-4 gap-3">
    <svg class="w-14 h-14 text-slate-400" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
    </svg>
    <p class="font-mono text-sm text-slate-400">404</p>
    <h1 class="text-xl font-bold text-slate-100">{{ t('page_not_found') || 'Pagina Non Trovata' }}</h1>
    <p class="text-sm text-slate-400 max-w-md leading-relaxed">
      {{ t('page_not_found_desc') || 'La pagina che cerchi potrebbe essere stata rimossa, rinominata o non essere mai esistita.' }}
    </p>
    <router-link to="/" class="ov-btn ov-btn-primary mt-3">{{ t('nav_back') || 'Torna alla Home' }}</router-link>
  </div>
</template>

<style scoped>
</style>
