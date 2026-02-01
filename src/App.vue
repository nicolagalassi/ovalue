<script setup>
import Header from './components/Header.vue';
</script>

<template>
  <div class="min-h-screen flex flex-col font-sans antialiased">
    <Header />
    
    <main class="flex-grow flex flex-col">
       <router-view />
    </main>
    
    </div>
</template>