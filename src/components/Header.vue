<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useLanguage } from '../composables/useLanguage';
import { useProfiles } from '../composables/useProfiles';
import { useExporterStatus } from '../composables/useExporterStatus';
import { EXPORTER_INSTALL_URL } from '../data/links';

const { currentLang, setLanguage, t } = useLanguage();
const { profiles, activeProfileId, activeProfile, switchProfile } = useProfiles();
const route = useRoute();
const { exporterDetected, exporterVersion, exporterOutdated, exporterLatest } = useExporterStatus();
// Stato del pulsante dello script: 'install' (non rilevato), 'update' (versione vecchia), 'ok'
const scriptState = computed(() =>
    !exporterDetected.value ? 'install' : (exporterOutdated.value ? 'update' : 'ok'));
const scriptTitle = computed(() => {
    if (scriptState.value === 'install') return t('nav_install_script_title');
    if (scriptState.value === 'update') return t('nav_update_script_title')
        .replace('{latest}', exporterLatest || '?')
        .replace('{current}', exporterVersion.value || '?');
    return t('nav_script_installed_title') + (exporterVersion.value ? ` (v${exporterVersion.value})` : '');
});
const scriptLabel = computed(() => ({
    install: t('nav_install_script'), update: t('nav_update_script'), ok: t('nav_script')
})[scriptState.value]);
const scriptBtnClass = {
    install: 'bg-sky-500/[0.12] border-sky-400/40 text-sky-300 hover:bg-sky-500/[0.2] hover:border-sky-300/60 shadow-[0_0_14px_rgba(56,189,248,0.18)]',
    update:  'bg-amber-500/[0.10] border-amber-400/40 text-amber-300 hover:bg-amber-500/[0.18] hover:border-amber-300/60 shadow-[0_0_14px_rgba(251,191,36,0.15)]',
    ok:      'bg-white/[0.03] border-white/[0.07] text-slate-500 hover:bg-white/[0.06] hover:border-white/10 hover:text-slate-300'
};

const isProfileMenuOpen = ref(false);
const isLangMenuOpen = ref(false);
const isMobileMenuOpen = ref(false);

watch(() => route.path, () => { isMobileMenuOpen.value = false; });

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
    { to: '/metal',       labelKey: 'card_metal_title',       activeColor: 'text-sky-400',     dotColor: 'bg-sky-400'     },
    { to: '/pack',        labelKey: 'card_pack_title',        activeColor: 'text-amber-400',   dotColor: 'bg-amber-400'   },
    { to: '/shopping',    labelKey: 'shopping_title',         activeColor: 'text-violet-400',  dotColor: 'bg-violet-400'  },
    { to: '/strategy',    labelKey: 'card_strategy_title',    activeColor: 'text-emerald-400', dotColor: 'bg-emerald-400' },
];
</script>

<template>
  <header class="sticky top-0 z-50 w-full bg-ogame-bg/95 backdrop-blur-md border-b border-slate-700/20">
    <div class="max-w-7xl mx-auto px-5 md:px-8 h-14 flex items-center gap-4">

      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-2.5 flex-shrink-0 group">
        <img src="/ovalue.png" alt="OValue" class="h-7 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
      </router-link>

      <!-- Divider -->
      <div class="hidden md:block w-px h-5 bg-slate-700/40 flex-shrink-0"></div>

      <!-- Desktop nav -->
      <nav class="hidden md:flex items-center gap-0.5 flex-grow" :aria-label="t('nav_main')">
        <router-link
          v-for="link in navLinks" :key="link.to"
          :to="link.to"
          :aria-current="$route.path === link.to ? 'page' : undefined"
          class="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider rounded-md transition-all duration-150"
          :class="$route.path === link.to
            ? link.activeColor + ' bg-white/5'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'"
        >
          <span v-if="$route.path === link.to" class="w-1 h-1 rounded-full flex-shrink-0" :class="link.dotColor"></span>
          {{ t(link.labelKey) }}
        </router-link>
      </nav>

      <!-- Mobile: home button (icona, stesso vocabolario degli altri hdr-btn) -->
      <div class="md:hidden flex-grow">
        <router-link
          v-if="$route.path !== '/'"
          to="/"
          aria-label="Home"
          class="hdr-btn w-10 h-10 inline-flex items-center justify-center rounded-md transition-all duration-200 bg-white/[0.03] border-white/[0.07] text-slate-500 hover:bg-white/[0.06] hover:border-white/10 hover:text-slate-300"
        >
          <svg class="w-4 h-4" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        </router-link>
      </div>

      <!-- Right controls -->
      <div class="flex items-center gap-1.5 flex-shrink-0">

        <div id="header-actions" class="flex items-center gap-1.5 empty:hidden"></div>

        <!-- Script Exporter: sempre visibile. Azzurro finché lo script non è rilevato,
             ambra se la versione installata è vecchia, poi discreto (reinstalla/aggiorna). -->
        <a :href="EXPORTER_INSTALL_URL" target="_blank" rel="noopener noreferrer"
           :title="scriptTitle" :aria-label="scriptTitle"
           class="hdr-btn relative h-10 md:h-8 min-w-10 md:min-w-8 flex items-center justify-center gap-1.5 px-2.5 rounded-md transition-all duration-200"
           :class="scriptBtnClass[scriptState]">
          <span v-if="scriptState !== 'ok'" class="absolute -top-0.5 -right-0.5 flex w-2 h-2" aria-hidden="true">
            <span class="motion-safe:animate-ping absolute inline-flex w-full h-full rounded-full opacity-60"
                  :class="scriptState === 'update' ? 'bg-amber-400' : 'bg-sky-400'"></span>
            <span class="relative inline-flex w-2 h-2 rounded-full"
                  :class="scriptState === 'update' ? 'bg-amber-400' : 'bg-sky-400'"></span>
          </span>
          <svg class="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          <span class="text-[11px] font-semibold tracking-wide whitespace-nowrap"
                :class="scriptState === 'ok' ? 'hidden lg:inline' : 'hidden sm:inline'">
            {{ scriptLabel }}
          </span>
        </a>

        <!-- Hamburger (mobile only) -->
        <button
          @click="isMobileMenuOpen = !isMobileMenuOpen; isProfileMenuOpen = false; isLangMenuOpen = false"
          @keydown.escape="isMobileMenuOpen = false"
          :aria-expanded="isMobileMenuOpen"
          :aria-label="t('nav_main')"
          aria-haspopup="true"
          class="md:hidden hdr-btn w-10 h-10 flex items-center justify-center rounded-md transition-all duration-200"
          :class="isMobileMenuOpen
            ? 'bg-white/[0.07] border-white/15 text-slate-200'
            : 'bg-white/[0.03] border-white/[0.07] text-slate-500 hover:bg-white/[0.06] hover:border-white/10 hover:text-slate-300'"
        >
          <Transition name="icon-fade" mode="out-in">
            <svg v-if="!isMobileMenuOpen" key="menu" class="w-4 h-4" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            <svg v-else key="close" class="w-4 h-4" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </Transition>
        </button>

        <!-- Profile switcher -->
        <div class="relative" v-if="activeProfile">
          <button
            @click="isProfileMenuOpen = !isProfileMenuOpen"
            @keydown.escape="isProfileMenuOpen = false"
            :aria-label="t('profile_manage')"
            :aria-expanded="isProfileMenuOpen"
            aria-haspopup="true"
            class="hdr-btn group h-10 md:h-8 flex items-center gap-2 px-3 rounded-md transition-all duration-200"
            :class="isProfileMenuOpen ? 'bg-sky-500/[0.08] border-sky-500/30 text-sky-300' : 'bg-white/[0.03] border-white/[0.07] text-slate-300 hover:bg-sky-500/[0.05] hover:border-sky-500/20 hover:text-sky-300'"
          >
            <span class="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all"
                  :class="activeProfile.autoSync ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.6)]' : 'bg-slate-600'"></span>
            <span class="hidden lg:block text-[11px] font-semibold tracking-wide max-w-[80px] truncate font-mono">{{ activeProfile.name }}</span>
            <span v-if="activeProfile.autoSync && lastSyncFormatted"
                  class="hidden xl:block text-[9px] font-mono text-slate-600 group-hover:text-sky-500/50 transition-colors">{{ lastSyncFormatted }}</span>
            <svg class="w-2.5 h-2.5 text-slate-600 group-hover:text-sky-500/60 transition-all duration-200" :class="{'rotate-180': isProfileMenuOpen}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </button>

          <Transition name="menu">
            <div v-if="isProfileMenuOpen" role="menu" class="absolute right-0 top-full mt-2 w-56 bg-ogame-bg border border-slate-700/40 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden">
              <div class="px-3.5 py-2.5 border-b border-slate-700/30 flex items-center gap-2">
                <svg class="w-3 h-3 text-sky-500/60" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                <span class="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">{{ t('profile_manage') }}</span>
              </div>
              <div class="p-1.5 space-y-0.5 max-h-52 overflow-y-auto custom-scrollbar">
                <button
                  v-for="p in profiles" :key="p.id"
                  @click="switchProfile(p.id); isProfileMenuOpen = false"
                  role="menuitem"
                  class="w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2.5 rounded-lg transition-colors"
                  :class="activeProfileId === p.id ? 'text-sky-300 bg-sky-500/[0.07]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'"
                >
                  <div class="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors" :class="activeProfileId === p.id ? 'bg-sky-400' : 'bg-slate-700'"></div>
                  <span class="truncate flex-1">{{ p.name }}</span>
                  <svg v-if="activeProfileId === p.id" class="w-3 h-3 text-sky-400 flex-shrink-0" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                </button>
              </div>
              <div class="p-1.5 border-t border-slate-700/30 space-y-0.5">
                <router-link
                  to="/settings"
                  @click="isProfileMenuOpen = false"
                  role="menuitem"
                  class="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-medium text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] rounded-lg transition-colors"
                >
                  <svg class="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
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
            @keydown.escape="isLangMenuOpen = false"
            :aria-label="t('settings_section_lang')"
            :aria-expanded="isLangMenuOpen"
            aria-haspopup="true"
            class="hdr-btn h-10 md:h-8 flex items-center gap-1.5 px-2.5 rounded-md transition-all duration-200"
            :class="isLangMenuOpen ? 'bg-white/[0.07] border-white/15' : 'bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06] hover:border-white/10'"
          >
            <span class="text-sm leading-none">{{ { it: '🇮🇹', en: '🇬🇧', de: '🇩🇪', fr: '🇫🇷' }[currentLang] ?? '🌐' }}</span>
            <svg class="w-2 h-2 text-slate-600 transition-transform duration-200" :class="{'rotate-180': isLangMenuOpen}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
          <Transition name="menu">
            <div v-if="isLangMenuOpen" role="menu" class="absolute right-0 top-full mt-2 w-40 bg-ogame-bg border border-slate-700/40 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden">
              <div class="px-3.5 py-2.5 border-b border-slate-700/30">
                <span class="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">{{ t('settings_section_lang') }}</span>
              </div>
              <div class="p-1.5 space-y-0.5">
                <button v-for="[code, flag, label] in [['it','🇮🇹','Italiano'],['en','🇬🇧','English'],['de','🇩🇪','Deutsch'],['fr','🇫🇷','Français']]"
                        :key="code"
                        @click="changeLang(code)"
                        role="menuitem"
                        class="w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2.5 rounded-lg transition-colors"
                        :class="currentLang === code ? 'text-sky-300 bg-sky-500/[0.07]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'">
                  <span class="text-base leading-none">{{ flag }}</span>
                  <span class="flex-1">{{ label }}</span>
                  <svg v-if="currentLang === code" class="w-3 h-3 text-sky-400 flex-shrink-0" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                </button>
              </div>
            </div>
          </Transition>
          <div v-if="isLangMenuOpen" @click="isLangMenuOpen = false" class="fixed inset-0 z-40"></div>
        </div>

        <!-- Ko-fi (desktop only — mobile has limited toolbar space) -->
        <a href="https://ko-fi.com/galax95" target="_blank" rel="noopener noreferrer"
           class="hidden md:flex hdr-btn md:w-8 md:h-8 items-center justify-center rounded-md bg-white/[0.03] border border-white/[0.07] hover:bg-amber-500/[0.08] hover:border-amber-500/30 text-slate-600 hover:text-amber-400 transition-all duration-200"
           :aria-label="t('support_banner_link')">
          <svg class="w-3.5 h-3.5" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 8h1a4 4 0 010 8h-1"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
            <line x1="6" y1="1" x2="6" y2="4" stroke-linecap="round"/>
            <line x1="10" y1="1" x2="10" y2="4" stroke-linecap="round"/>
            <line x1="14" y1="1" x2="14" y2="4" stroke-linecap="round"/>
          </svg>
        </a>

        <!-- Settings (desktop only: su mobile la barra è piena, è nel menu a tendina) -->
        <router-link
          to="/settings"
          class="hidden md:flex hdr-btn md:w-8 md:h-8 items-center justify-center rounded-md transition-all duration-200"
          :class="$route.path === '/settings'
            ? 'bg-white/[0.07] border-white/15 text-slate-200'
            : 'bg-white/[0.03] border-white/[0.07] text-slate-600 hover:bg-white/[0.06] hover:border-white/10 hover:text-slate-300'"
          :aria-label="t('settings_title')"
        >
          <svg class="w-3.5 h-3.5" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
        </router-link>

      </div>
    </div>
  </header>

  <!-- Mobile navigation drawer -->
  <Teleport to="body">
    <Transition name="mobile-menu">
      <div v-if="isMobileMenuOpen" class="md:hidden fixed inset-x-0 top-14 bottom-0 z-40">
        <div
          class="absolute inset-0 bg-black/50"
          @click="isMobileMenuOpen = false"
          aria-hidden="true"
        ></div>
        <div class="relative border-b border-slate-700/20 bg-ogame-bg/98 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.7)]">
          <nav :aria-label="t('nav_main')" class="px-3 py-2">
            <router-link
              v-for="link in navLinks" :key="link.to"
              :to="link.to"
              :aria-current="$route.path === link.to ? 'page' : undefined"
              @click="isMobileMenuOpen = false"
              class="flex items-center gap-3 px-4 py-3.5 rounded-lg transition-colors text-sm font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
              :class="$route.path === link.to
                ? link.activeColor + ' bg-white/[0.06]'
                : 'text-slate-400 active:bg-white/[0.05] focus-visible:bg-white/[0.05]'"
            >
              <span class="w-2 h-2 rounded-full flex-shrink-0" :class="link.dotColor"></span>
              {{ t(link.labelKey) }}
            </router-link>
            <div class="border-t border-slate-700/20 mt-1.5 pt-1.5">
              <router-link to="/settings"
                 @click="isMobileMenuOpen = false"
                 class="flex items-center gap-3 px-4 py-3.5 rounded-lg transition-colors text-sm font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
                 :class="$route.path === '/settings' ? 'text-slate-200 bg-white/[0.06]' : 'text-slate-400 active:bg-white/[0.05]'">
                <svg class="w-4 h-4 flex-shrink-0" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
                {{ t('settings_title') }}
              </router-link>
              <a :href="EXPORTER_INSTALL_URL" target="_blank" rel="noopener noreferrer"
                 @click="isMobileMenuOpen = false"
                 class="flex items-center gap-3 px-4 py-3.5 rounded-lg transition-colors text-sm font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/30"
                 :class="{ install: 'text-sky-300 active:bg-sky-500/[0.06]', update: 'text-amber-300 active:bg-amber-500/[0.06]', ok: 'text-slate-400 active:bg-white/[0.05]' }[scriptState]">
                <svg class="w-4 h-4 flex-shrink-0" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                {{ scriptState === 'ok' ? t('nav_script_reinstall') : scriptLabel }}
              </a>
              <a href="https://ko-fi.com/galax95" target="_blank" rel="noopener noreferrer"
                 @click="isMobileMenuOpen = false"
                 class="flex items-center gap-3 px-4 py-3.5 rounded-lg transition-colors text-sm font-semibold text-amber-400/70 active:bg-amber-500/[0.06] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/30">
                <svg class="w-4 h-4 flex-shrink-0" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18 8h1a4 4 0 010 8h-1"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
                  <line x1="6" y1="1" x2="6" y2="4" stroke-linecap="round"/>
                  <line x1="10" y1="1" x2="10" y2="4" stroke-linecap="round"/>
                  <line x1="14" y1="1" x2="14" y2="4" stroke-linecap="round"/>
                </svg>
                {{ t('support_banner_link') }}
              </a>
            </div>
          </nav>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.hdr-btn {
  border-width: 1px;
  border-style: solid;
}

.menu-enter-active {
  transition: opacity 150ms ease, transform 150ms ease;
}
.menu-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.menu-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.menu-leave-active {
  transition: opacity 100ms ease;
}
.menu-leave-from {
  opacity: 1;
}
.menu-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .menu-enter-active,
  .menu-leave-active {
    transition: none !important;
  }
}

.mobile-menu-enter-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.mobile-menu-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.mobile-menu-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.mobile-menu-leave-active {
  transition: opacity 150ms ease;
}
.mobile-menu-leave-from {
  opacity: 1;
}
.mobile-menu-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .mobile-menu-enter-active,
  .mobile-menu-leave-active {
    transition: none !important;
  }
}

.icon-fade-enter-active,
.icon-fade-leave-active {
  transition: opacity 80ms ease;
}
.icon-fade-enter-from,
.icon-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .icon-fade-enter-active,
  .icon-fade-leave-active {
    transition: none !important;
  }
}
</style>
