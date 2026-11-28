<script setup>
// Intestazione di pagina di uno strumento: riquadro con icona nel colore dello strumento,
// titolo e sottotitolo. Lo slot "title" aggiunge elementi accanto al titolo,
// lo slot predefinito contenuti a destra (schede, azioni).
import ToolIcon from './ToolIcon.vue';
import { TOOLS } from '../data/tools';
const props = defineProps({ tool: { type: String, required: true }, title: String, sub: String });
const def = TOOLS.find(t => t.id === props.tool);
</script>

<template>
  <div class="ov-pagehead">
    <div class="flex items-center gap-3 min-w-0">
      <span class="ov-tile" aria-hidden="true"><ToolIcon :tool="def" class="w-5 h-5" /></span>
      <div class="min-w-0">
        <h1 class="ov-title">{{ title }}<slot name="title" /></h1>
        <p v-if="sub" class="ov-sub">{{ sub }}</p>
      </div>
    </div>
    <slot />
  </div>
</template>
