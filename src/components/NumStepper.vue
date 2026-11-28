<script setup>
// Campo numerico con − / + ai lati: per correggere un livello di uno senza digitare.
// I pulsanti stanno dentro il bordo del campo, così occupa lo stesso spazio di prima.
import { useLanguage } from '../composables/useLanguage';
const props = defineProps({
    modelValue: { type: [Number, String], default: 0 },
    min: { type: Number, default: 0 },
    max: { type: Number, default: Infinity },
    id: String,
    ariaLabel: String,
    inputClass: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);
const { t } = useLanguage();
const clamp = (v) => Math.min(props.max, Math.max(props.min, v));
const step = (d) => emit('update:modelValue', clamp((parseInt(props.modelValue) || 0) + d));
const onInput = (e) => {
    const v = parseInt(e.target.value);
    emit('update:modelValue', isNaN(v) ? '' : v);
};
</script>

<template>
  <div class="num-stepper relative">
    <input :id="id" type="number" inputmode="numeric" :min="min" :max="Number.isFinite(max) ? max : undefined"
           :value="modelValue" @input="onInput" @focus="$event.target.select()" :aria-label="ariaLabel"
           class="input-glass w-full text-center tabular-nums !px-6" :class="inputClass" />
    <button type="button" tabindex="-1" class="ns-btn left-0.5" :aria-label="t('btn_decrease')"
            :disabled="(parseInt(modelValue) || 0) <= min" @click="step(-1)">−</button>
    <button type="button" tabindex="-1" class="ns-btn right-0.5" :aria-label="t('btn_increase')"
            :disabled="(parseInt(modelValue) || 0) >= max" @click="step(1)">+</button>
  </div>
</template>

<style scoped>
.ns-btn {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 1.375rem; height: calc(100% - 6px); border-radius: 4px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 15px; line-height: 1; color: theme('colors.slate.400');
  transition: color 150ms, background-color 150ms;
}
.ns-btn:disabled { opacity: 0.35; cursor: default; }
.ns-btn:active:not(:disabled) { transform: translateY(-50%) scale(0.92); }
@media (hover: hover) and (pointer: fine) {
  .ns-btn:hover:not(:disabled) { color: theme('colors.slate.100'); background: rgb(255 255 255 / 0.06); }
}
@media (pointer: coarse) { .ns-btn { width: 1.75rem; } .num-stepper input { padding-inline: 1.9rem !important; } }
/* niente frecce native: ci sono − e + */
.num-stepper input::-webkit-outer-spin-button, .num-stepper input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.num-stepper input[type=number] { -moz-appearance: textfield; appearance: textfield; }
</style>
