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
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

const changeLang = (lang) => {
    setLanguage(lang);
    isLangMenuOpen.value = false;
};

const navLinks = [
    { to: '/metal',       labelKey: 'card_metal_title',       activeColor: 'text-sky-400',    dotColor: 'bg-sky-400'    },
    { to: '/pack',        labelKey: 'card_pack_title',        activeColor: 'text-amber-400',  dotColor: 'bg-amber-400'  },
    { to: '/shopping',    labelKey: 'shopping_title',         activeColor: 'text-violet-400', dotColor: 'bg-violet-400' },
    { to: '/expirations', labelKey: 'card_expirations_title', activeColor: 'text-rose-400',   dotColor: 'bg-rose-400'   },
];
</script>

<template>
  <header class="sticky top-0 z-50 w-full bg-[#070c18]/95 backdrop-blur-xl border-b border-slate-700/20">
    <div class="max-w-7xl mx-auto px-5 md:px-8 h-14 flex items-center gap-4">

      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-2.5 flex-shrink-0 group">
        <img src="/ovalue.png" alt="OValue" class="h-7 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
      </router-link>

      <!-- Divider -->
      <div class="hidden md:block w-px h-5 bg-slate-700/40 flex-shrink-0"></div>

      <!-- Desktop nav -->
      <nav class="hidden md:flex items-center gap-0.5 flex-grow">
        <router-link
          v-for="link in navLinks" :key="link.to"
          :to="link.to"
          class="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider rounded-md transition-all duration-150"
          :class="$route.path === link.to
            ? link.activeColor + ' bg-white/5'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'"
        >
          <span v-if="$route.path === link.to" class="w-1 h-1 rounded-full flex-shrink-0" :class="link.dotColor"></span>
          {{ t(link.labelKey) }}
        </router-link>
      </nav>

      <!-- Mobile: back button -->
      <div v-if="$route.path !== '/'" class="md:hidden flex-grow">
        <router-link to="/" class="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-xs font-medium">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          Home
        </router-link>
      </div>
      <div v-else class="md:hidden flex-grow"></div>

      <!-- Right controls -->
      <div class="flex items-center gap-2 flex-shrink-0">

        <div id="header-actions" class="flex items-center gap-2"></div>

        <!-- Profile switcher -->
        <div class="relative" v-if="activeProfile">
          <button
            @click="isProfileMenuOpen = !isProfileMenuOpen"
            class="h-8 flex items-center gap-2 px-3 rounded-lg bg-white/[0.04] border border-slate-700/40 hover:border-slate-600/60 hover:bg-white/[0.06] transition-all text-slate-300"
          >
            <svg class="w-3 h-3 text-sky-400/80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            <span class="hidden lg:block text-[11px] font-medium max-w-[90px] truncate">{{ activeProfile.name }}</span>
            <span class="hidden lg:block text-[9px]" :class="activeProfile.autoSync ? 'text-emerald-400/70' : 'text-slate-600'">
              {{ activeProfile.autoSync ? (lastSyncFormatted ? `⟳ ${lastSyncFormatted}` : '⟳ —') : 'manual' }}
            </span>
            <svg class="w-2.5 h-2.5 text-slate-600 transition-transform duration-200" :class="{'rotate-180': isProfileMenuOpen}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </button>

          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <div v-if="isProfileMenuOpen" class="absolute right-0 top-full mt-1.5 w-52 bg-[#0b1220]/98 border border-slate-700/30 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 overflow-hidden backdrop-blur-2xl">
              <div class="px-3 py-2 border-b border-slate-700/20 flex items-center justify-between">
                <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{{ t('profile_manage') }}</span>
              </div>
              <div class="p-1 space-y-0.5 max-h-52 overflow-y-auto custom-scrollbar">
                <button
                  v-for="p in profiles" :key="p.id"
                  @click="switchProfile(p.id); isProfileMenuOpen = false"
                  class="w-full text-left px-3 py-2 text-[11px] font-medium flex items-center gap-2 rounded-lg hover:bg-white/[0.04] transition-colors"
                  :class="activeProfileId === p.id ? 'text-sky-300' : 'text-slate-400 hover:text-slate-200'"
                >
                  <div class="w-1 h-1 rounded-full flex-shrink-0" :class="activeProfileId === p.id ? 'bg-sky-400' : 'bg-slate-600'"></div>
                  <span class="truncate">{{ p.name }}</span>
                </button>
              </div>
              <div class="p-1 border-t border-slate-700/20">
                <router-link
                  to="/settings"
                  @click="isProfileMenuOpen = false"
                  class="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-medium text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] rounded-lg transition-colors uppercase tracking-wider"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
                  {{ t('settings_manage_profiles') }}
                </router-link>
              </div>
            </div>
          </Transition>
          <div v-if="isProfileMenuOpen" @click="isProfileMenuOpen = false" class="fixed inset-0 z-40"></div>
        </div>

        <!-- Language -->
        <div class="relative">
          <button
            @click="isLangMenuOpen = !isLangMenuOpen"
            class="h-8 flex items-center gap-1.5 px-2.5 rounded-lg bg-white/[0.04] border border-slate-700/40 hover:border-slate-600/60 hover:bg-white/[0.06] transition-all text-slate-400"
          >
            <span class="text-sm leading-none">{{ { it: '🇮🇹', en: '🇬🇧', de: '🇩🇪', fr: '🇫🇷' }[currentLang] ?? '🌐' }}</span>
            <svg class="w-2.5 h-2.5 text-slate-600 transition-transform duration-200" :class="{'rotate-180': isLangMenuOpen}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
          <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="isLangMenuOpen" class="absolute right-0 top-full mt-1.5 w-36 bg-[#0b1220]/98 border border-slate-700/30 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 overflow-hidden backdrop-blur-2xl">
              <div class="p-1 space-y-0.5">
                <button v-for="[code, flag, label] in [['it','🇮🇹','Italiano'],['en','🇬🇧','English'],['de','🇩🇪','Deutsch'],['fr','🇫🇷','Français']]"
                        :key="code"
                        @click="changeLang(code)"
                        class="w-full text-left px-3 py-2 text-[11px] font-medium flex items-center gap-2.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                        :class="currentLang === code ? 'text-sky-300 bg-sky-500/[0.06]' : 'text-slate-400 hover:text-slate-200'">
                  <span class="text-base leading-none">{{ flag }}</span>
                  <span>{{ label }}</span>
                </button>
              </div>
            </div>
          </Transition>
          <div v-if="isLangMenuOpen" @click="isLangMenuOpen = false" class="fixed inset-0 z-40"></div>
        </div>

        <!-- Settings -->
        <router-link
          to="/settings"
          class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] border border-slate-700/40 hover:border-slate-600/60 hover:bg-white/[0.06] transition-all"
          :class="$route.path === '/settings' ? 'text-slate-200 border-slate-600/60 bg-white/[0.06]' : 'text-slate-500 hover:text-slate-300'"
          title="Impostazioni"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
        </router-link>

      </div>
    </div>
  </header>
</template>
