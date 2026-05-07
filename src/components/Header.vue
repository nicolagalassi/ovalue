<script setup>
import { ref, computed } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useProfiles } from '../composables/useProfiles';

const { currentLang, setLanguage, t } = useLanguage();
const { profiles, activeProfileId, activeProfile, switchProfile } = useProfiles();

const isProfileMenuOpen = ref(false);
const isLangMenuOpen = ref(false);

const lastSyncFormatted = computed(() => {
    const ts = activeProfile.value?.lastSync;
    if (!ts) return null;
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

const changeLang = (lang) => {
    setLanguage(lang);
    isLangMenuOpen.value = false;
};
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b border-white/5 backdrop-blur-md bg-[#050505]/80">
    <div class="max-w-7xl mx-auto px-4 md:px-6 py-3 flex flex-row justify-between items-center gap-3">

      <!-- Logo -->
      <div class="flex items-center flex-shrink-0" :class="{ 'hidden md:flex': $route.path !== '/' }">
        <router-link to="/" class="group flex items-center gap-3">
          <img src="/ovalue.png" alt="OValue" class="h-8 md:h-9 w-auto object-contain transition-transform group-hover:scale-105" />
        </router-link>
      </div>

      <!-- Back button (sub-pages, mobile) -->
      <div class="flex-grow min-w-0 flex items-center" v-if="$route.path !== '/'">
        <router-link to="/" class="md:hidden flex items-center justify-center w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-ogame-accent transition group" :title="t('nav_back')">
          <svg class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
        </router-link>
      </div>
      <div v-else class="flex-grow hidden md:block"></div>

      <!-- Right controls — tutti h-9 -->
      <div class="flex-shrink-0 flex items-center gap-2">

        <div id="header-actions" class="flex items-center gap-2"></div>

        <!-- Profile switcher -->
        <div class="relative" v-if="activeProfile">
          <button
            @click="isProfileMenuOpen = !isProfileMenuOpen"
            class="h-9 flex items-center gap-2 px-3 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition text-gray-300"
          >
            <svg class="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            <div class="hidden lg:flex flex-col items-start leading-none gap-0.5">
              <span class="text-[11px] font-bold uppercase tracking-wider max-w-[110px] truncate">{{ activeProfile.name }}</span>
              <span class="text-[9px]" :class="activeProfile.autoSync ? 'text-green-500/70' : 'text-gray-600'">
                {{ activeProfile.autoSync
                    ? (lastSyncFormatted ? `⟳ ${lastSyncFormatted}` : `⟳ ${t('sync_never')}`)
                    : `🔒 ${t('sync_manual')}` }}
              </span>
            </div>
            <svg class="w-3 h-3 text-gray-500 transition-transform duration-200" :class="{'rotate-180': isProfileMenuOpen}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>

          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform -translate-y-2 opacity-0"
            enter-to-class="transform translate-y-0 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="transform translate-y-0 opacity-100"
            leave-to-class="transform -translate-y-2 opacity-0"
          >
            <div v-if="isProfileMenuOpen" class="absolute right-0 top-full mt-2 w-52 bg-[#161b22]/95 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
              <div class="p-2 border-b border-white/5 bg-white/5">
                <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">{{ t('profile_manage') }}</span>
              </div>
              <div class="p-1.5 space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
                <button
                  v-for="p in profiles" :key="p.id"
                  @click="switchProfile(p.id); isProfileMenuOpen = false"
                  class="w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2.5 rounded-lg hover:bg-white/10 transition"
                  :class="activeProfileId === p.id ? 'bg-blue-900/20 text-blue-400' : 'text-gray-400'"
                >
                  <div class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="activeProfileId === p.id ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]' : 'bg-gray-600'"></div>
                  <span class="truncate">{{ p.name }}</span>
                </button>
              </div>
              <div class="p-1.5 border-t border-white/5">
                <router-link
                  to="/settings"
                  @click="isProfileMenuOpen = false"
                  class="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black text-gray-400 hover:bg-white/10 rounded-lg transition uppercase tracking-widest"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
                  {{ t('settings_manage_profiles') }}
                </router-link>
              </div>
            </div>
          </Transition>

          <div v-if="isProfileMenuOpen" @click="isProfileMenuOpen = false" class="fixed inset-0 z-40 bg-transparent"></div>
        </div>

        <!-- Language switcher -->
        <div class="relative">
          <button
            @click="isLangMenuOpen = !isLangMenuOpen"
            class="h-9 flex items-center gap-1.5 px-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-white/10 transition text-gray-300"
            aria-label="Change language"
          >
            <span class="text-base leading-none">{{ currentLang === 'it' ? '🇮🇹' : '🇬🇧' }}</span>
            <span class="text-[11px] font-bold uppercase tracking-wider hidden sm:block">{{ currentLang }}</span>
            <svg class="w-3 h-3 text-gray-500 transition-transform duration-200" :class="{'rotate-180': isLangMenuOpen}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>

          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform -translate-y-2 opacity-0"
            enter-to-class="transform translate-y-0 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="transform translate-y-0 opacity-100"
            leave-to-class="transform -translate-y-2 opacity-0"
          >
            <div v-if="isLangMenuOpen" class="absolute right-0 top-full mt-2 w-36 bg-[#161b22]/95 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
              <div class="p-1.5 space-y-0.5">
                <button @click="changeLang('it')" class="w-full text-left px-3 py-2.5 text-xs font-bold flex items-center gap-3 rounded-lg hover:bg-white/10 transition" :class="currentLang === 'it' ? 'bg-cyan-900/20 text-cyan-400' : 'text-gray-400'">
                  <span class="text-lg leading-none">🇮🇹</span> Italiano
                </button>
                <button @click="changeLang('en')" class="w-full text-left px-3 py-2.5 text-xs font-bold flex items-center gap-3 rounded-lg hover:bg-white/10 transition" :class="currentLang === 'en' ? 'bg-cyan-900/20 text-cyan-400' : 'text-gray-400'">
                  <span class="text-lg leading-none">🇬🇧</span> English
                </button>
              </div>
            </div>
          </Transition>

          <div v-if="isLangMenuOpen" @click="isLangMenuOpen = false" class="fixed inset-0 z-40 bg-transparent"></div>
        </div>

        <!-- Settings icon -->
        <router-link
          to="/settings"
          class="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:border-gray-500/50 hover:bg-white/10 transition text-gray-400 hover:text-white"
          :class="$route.path === '/settings' ? 'border-gray-500/50 text-white bg-white/10' : ''"
          title="Impostazioni"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
        </router-link>

      </div>
    </div>
  </header>
</template>
