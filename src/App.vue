<script setup>
import Header from './components/Header.vue';
</script>

<template>
  <div class="flex flex-col min-h-screen font-sans bg-ogame-bg text-ogame-text">
    <Header />
    <main class="flex-grow flex flex-col">
      <router-view></router-view>
    </main>
  </div>
</template>