<script setup>
import { useToast } from '../composables/useToast';
import { useLanguage } from '../composables/useLanguage';
const { toasts, dismiss } = useToast();
const { t } = useLanguage();
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-x-4 top-[calc(3.5rem+env(safe-area-inset-top,0px)+0.5rem)] sm:inset-x-auto sm:top-auto sm:bottom-24 sm:right-6 z-[200] flex flex-col gap-2 pointer-events-none" aria-live="polite" aria-atomic="false">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border bg-ogame-raised shadow-[0_12px_40px_rgba(0,0,0,0.6)] sm:min-w-[240px] sm:max-w-[360px]"
          :class="{
            'border-sky-500/30 text-sky-200':   toast.type === 'info',
            'border-emerald-500/30 text-emerald-200': toast.type === 'success',
            'border-rose-500/30 text-rose-200': toast.type === 'error',
          }"
          role="status"
        >
          <svg class="w-4 h-4 flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.25" viewBox="0 0 24 24">
            <path v-if="toast.type === 'success'" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            <path v-else-if="toast.type === 'error'" stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <path v-else stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span class="text-sm font-semibold flex-1">{{ toast.msg }}</span>
          <button
            @click="dismiss(toast.id)"
            class="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity p-1"
            :aria-label="t('pc_close')"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active { transition: opacity 250ms cubic-bezier(0.23, 1, 0.32, 1), transform 250ms cubic-bezier(0.23, 1, 0.32, 1); }
.toast-leave-active { transition: opacity 150ms ease-out, transform 150ms ease-out; position: absolute; right: 0; }
/* i toast rimasti scivolano nel posto lasciato libero invece di saltare */
.toast-move { transition: transform 250ms cubic-bezier(0.23, 1, 0.32, 1); }
.toast-enter-from  { opacity: 0; transform: translateY(0.75rem) scale(0.97); }
.toast-leave-to    { opacity: 0; transform: translateY(0.5rem) scale(0.97); }

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active, .toast-leave-active, .toast-move { transition: opacity 0.15s; }
  .toast-enter-from, .toast-leave-to { transform: none; }
}
</style>
