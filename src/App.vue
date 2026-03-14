<script setup>
import Header from './components/Header.vue';
</script>

<template>
  <div class="min-h-screen flex flex-col font-sans antialiased bg-[#050505] text-gray-200 selection:bg-cyan-500/30">
    <Header />
    
    <main class="flex-grow flex flex-col relative w-full overflow-x-hidden">
       <router-view />
    </main>
    
  </div>
</template>