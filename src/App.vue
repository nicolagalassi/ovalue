<script setup>
import { ref, onMounted } from 'vue';
import { useLanguage } from './composables/useLanguage';
import { useProfiles } from './composables/useProfiles';
import Header from './components/Header.vue';

const { t } = useLanguage();
const { loadProfiles } = useProfiles();
const showSupportBanner = ref(false);

onMounted(() => {
  loadProfiles();
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
    
    <div v-if="showSupportBanner" class="w-full bg-[#29abe0]/10 border-b border-[#29abe0]/30 py-2.5 px-3 md:px-6 z-40 relative shadow-[0_0_15px_rgba(41,171,224,0.15)] backdrop-blur-md flex items-center justify-center">
      <div class="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 justify-center text-[11px] sm:text-[13px] md:text-sm w-full pr-8">
        <div class="flex items-center gap-2">
          <span class="text-base md:text-lg">☕</span>
          <span class="text-[#29abe0] font-medium tracking-wide text-center">{{ t('support_banner_text') }}</span>
        </div>
        <a href="https://ko-fi.com/galax95" target="_blank" rel="noopener noreferrer" class="font-black text-white hover:text-[#29abe0] px-3 py-1.5 bg-[#29abe0]/20 rounded-md transition drop-shadow-[0_0_8px_rgba(41,171,224,0.4)] whitespace-nowrap">{{ t('support_banner_link') }}</a>
      </div>
      <button @click="closeBanner" class="absolute right-3 top-1/2 -translate-y-1/2 text-[#29abe0]/60 hover:text-white transition p-1.5 hover:bg-[#29abe0]/20 rounded-full flex-shrink-0 cursor-pointer">
        <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
    
    <main class="flex-grow flex flex-col relative w-full">
       <router-view />
    </main>
    
  </div>
</template>