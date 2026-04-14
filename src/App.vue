<script setup>
import { ref, onMounted } from 'vue';
import { useLanguage } from './composables/useLanguage';
import Header from './components/Header.vue';

const { t } = useLanguage();
const showSupportBanner = ref(false);

onMounted(() => {
  if (localStorage.getItem('hide_support_banner') !== 'true') {
    showSupportBanner.value = true;
  }
});

function closeBanner() {
  showSupportBanner.value = false;
  localStorage.setItem('hide_support_banner', 'true');
}
</script>

<template>
  <div class="min-h-screen flex flex-col font-sans antialiased bg-[#050505] text-gray-200 selection:bg-cyan-500/30">
    <Header />
    
    <div v-if="showSupportBanner" class="w-full bg-[#29abe0]/10 border-b border-[#29abe0]/30 py-2.5 px-4 flex justify-between items-center z-40 relative shadow-[0_0_15px_rgba(41,171,224,0.15)] backdrop-blur-md">
      <div class="flex items-center gap-3 w-full justify-center text-[13px] md:text-sm">
        <span class="text-lg">☕</span>
        <span class="text-[#29abe0] font-medium tracking-wide">{{ t('support_banner_text') }}</span>
        <a href="https://ko-fi.com/galax95" target="_blank" rel="noopener noreferrer" class="ml-1 font-black text-white hover:text-[#29abe0] px-3 py-1 bg-[#29abe0]/20 rounded-md transition drop-shadow-[0_0_8px_rgba(41,171,224,0.4)]">{{ t('support_banner_link') }}</a>
      </div>
      <button @click="closeBanner" class="absolute right-4 md:right-6 text-[#29abe0]/60 hover:text-white transition p-1 hover:bg-[#29abe0]/20 rounded-full">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
    
    <main class="flex-grow flex flex-col relative w-full">
       <router-view />
    </main>
    
  </div>
</template>