<script setup>
import { useToast } from '../composables/useToast';
const { toasts, dismiss } = useToast();
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none" aria-live="polite" aria-atomic="false">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-sm min-w-[240px] max-w-[360px]"
          :class="{
            'bg-ogame-panel/95 border-sky-500/30 text-sky-200':   toast.type === 'info',
            'bg-ogame-panel/95 border-emerald-500/30 text-emerald-200': toast.type === 'success',
            'bg-ogame-panel/95 border-rose-500/30 text-rose-200': toast.type === 'error',
          }"
          role="status"
        >
          <span class="flex-shrink-0 text-base leading-none">
            <template v-if="toast.type === 'success'">✓</template>
            <template v-else-if="toast.type === 'error'">✕</template>
            <template v-else>ℹ</template>
          </span>
          <span class="text-sm font-semibold flex-1">{{ toast.msg }}</span>
          <button
            @click="dismiss(toast.id)"
            class="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity p-0.5"
            :aria-label="'Chiudi notifica'"
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
.toast-enter-active { transition: all 0.25s cubic-bezier(0, 0, 0.2, 1); }
.toast-leave-active { transition: all 0.2s cubic-bezier(0.4, 0, 1, 1); }
.toast-enter-from  { opacity: 0; transform: translateY(0.75rem) scale(0.97); }
.toast-leave-to    { opacity: 0; transform: translateY(0.5rem) scale(0.97); }

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active, .toast-leave-active { transition: opacity 0.15s; }
  .toast-enter-from, .toast-leave-to { transform: none; }
}
</style>
