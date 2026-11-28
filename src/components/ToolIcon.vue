<script setup>
defineProps({ tool: { type: Object, required: true } });
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path v-for="d in tool.icon" :key="d" :d="d" />
  </svg>
</template>
