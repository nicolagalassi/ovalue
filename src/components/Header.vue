<script setup>
import { TOOLS } from '../data/tools';
import ToolIcon from './ToolIcon.vue';
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useLanguage } from '../composables/useLanguage';
import { useProfiles } from '../composables/useProfiles';
import { useExporterStatus } from '../composables/useExporterStatus';
import { EXPORTER_INSTALL_URL } from '../data/links';
import { useOverlay } from '../composables/useOverlay';

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
// Avviso statico: nessun glow e nessun punto pulsante (il colore basta a segnalarlo)
const scriptBtnClass = {
    install: 'bg-sky-500/[0.08] border-sky-400/30 text-sky-300 hover:bg-sky-500/[0.14] hover:border-sky-300/50',
    update:  'bg-amber-500/[0.07] border-amber-400/30 text-amber-300 hover:bg-amber-500/[0.14] hover:border-amber-300/50',
    ok:      'bg-transparent border-ogame-line text-slate-400 hover:border-slate-600 hover:text-slate-200'
};

const isProfileMenuOpen = ref(false);
const isLangMenuOpen = ref(false);
const isMobileMenuOpen = ref(false);
// Esc chiude i menu ovunque sia il focus, che poi torna al pulsante
useOverlay(isProfileMenuOpen, { lock: false, trap: false });
useOverlay(isLangMenuOpen, { lock: false, trap: false });
useOverlay(isMobileMenuOpen, { lock: true, trap: false });

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

// Voci di navigazione: i quattro strumenti, ognuno col suo colore e la sua icona
const navLinks = TOOLS;
</script>

<template>
  <header class="sticky top-0 z-50 w-full bg-ogame-bg border-b border-ogame-line">
    <div class="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center gap-3 md:gap-4">

      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-2.5 flex-shrink-0 group">
        <img src="/ovalue.png" alt="OValue" class="h-7 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
      </router-link>

      <!-- Desktop nav: voce attiva sottolineata in ciano -->
      <nav class="hidden lg:flex items-stretch self-stretch gap-0.5 flex-grow min-w-0 ml-2" :aria-label="t('nav_main')">
        <router-link
          v-for="link in navLinks" :key="link.to"
          :to="link.to"
          :aria-current="$route.path === link.to ? 'page' : undefined"
          class="nav-link group flex items-center gap-2 px-2 xl:px-3 text-[13px] whitespace-nowrap border-b-2 transition-colors duration-150"
          :class="$route.path === link.to
            ? 'text-slate-100 font-semibold'
            : 'text-slate-400 font-medium border-transparent hover:text-slate-200'"
          :style="{ '--lc': link.color, borderColor: $route.path === link.to ? link.color : undefined }"
        >
          <ToolIcon :tool="link" class="nav-ico w-4 h-4 flex-none" />
          {{ t(link.titleKey) }}
        </router-link>
      </nav>

      <!-- Mobile: spazio tra logo e controlli (il logo porta già alla Home) -->
      <div class="lg:hidden flex-grow"></div>

      <!-- Right controls -->
      <div class="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">

        <div id="header-actions" class="flex items-center gap-1.5 empty:hidden"></div>

        <!-- Script Exporter: sempre visibile. Azzurro finché lo script non è rilevato,
             ambra se la versione installata è vecchia, poi discreto (reinstalla/aggiorna). -->
        <a :href="EXPORTER_INSTALL_URL" target="_blank" rel="noopener noreferrer"
           :title="scriptTitle" :aria-label="scriptTitle"
           class="hdr-btn relative h-10 lg:h-8 min-w-10 lg:min-w-8 flex items-center justify-center gap-1.5 px-2.5 rounded-md transition-colors duration-150"
           :class="scriptBtnClass[scriptState]">
          <span v-if="scriptState !== 'ok'" class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                :class="scriptState === 'update' ? 'bg-amber-400' : 'bg-sky-400'" aria-hidden="true"></span>
          <svg class="w-3.5 h-3.5 flex-shrink-0" :class="scriptState !== 'ok' ? 'xl:hidden' : ''" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          <span class="text-xs font-medium whitespace-nowrap"
                :class="scriptState === 'ok' ? 'hidden 2xl:inline' : 'hidden xl:inline'">
            {{ scriptLabel }}<span v-if="scriptState === 'update' && exporterLatest" class="tabular-nums">&nbsp;{{ exporterLatest }}</span>
          </span>
        </a>

        <!-- Hamburger (mobile only) -->
        <button
          @click="isMobileMenuOpen = !isMobileMenuOpen; isProfileMenuOpen = false; isLangMenuOpen = false"
          @keydown.escape="isMobileMenuOpen = false"
          :aria-expanded="isMobileMenuOpen"
          :aria-label="t('nav_main')"
          aria-haspopup="true"
          class="lg:hidden hdr-btn w-10 h-10 flex items-center justify-center rounded-md transition-colors duration-150"
          :class="isMobileMenuOpen
            ? 'bg-white/[0.07] border-white/15 text-slate-200'
            : 'bg-transparent border-ogame-line text-slate-400 hover:border-slate-600 hover:text-slate-200'"
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
            class="hdr-btn group h-10 lg:h-8 flex items-center gap-2 px-3 rounded-md transition-colors duration-150"
            :class="isProfileMenuOpen ? 'bg-ogame-raised border-slate-600 text-slate-100' : 'bg-transparent border-ogame-line text-slate-200 hover:border-slate-600'"
          >
            <span class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  :class="activeProfile.autoSync ? 'bg-emerald-400' : 'bg-slate-600'"></span>
            <span class="hidden xl:block text-[13px] font-semibold max-w-[110px] truncate">{{ activeProfile.name }}</span>
            <span v-if="activeProfile.autoSync && lastSyncFormatted"
                  class="hidden xl:block text-xs text-slate-400 tabular-nums">{{ lastSyncFormatted }}</span>
            <svg class="hidden sm:block w-2.5 h-2.5 text-slate-400 transition-transform duration-150" :class="{'rotate-180': isProfileMenuOpen}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </button>

          <Transition name="menu">
            <div v-if="isProfileMenuOpen" role="menu" class="absolute right-0 top-full mt-2 w-56 bg-ogame-bg border border-slate-700/40 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden">
              <div class="px-3.5 py-2.5 border-b border-slate-700/30 flex items-center gap-2">
                <svg class="w-3 h-3 text-sky-500/60" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                <span class="ov-sh ov-sh-noline" style="--tc:#38bdf8">{{ t('profile_manage') }}</span>
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
                  class="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] rounded-lg transition-colors"
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
            class="hdr-btn h-10 lg:h-8 flex items-center gap-1.5 px-2.5 rounded-md transition-colors duration-150"
            :class="isLangMenuOpen ? 'bg-ogame-raised border-slate-600' : 'bg-transparent border-ogame-line hover:border-slate-600'"
          >
            <span class="text-xs font-semibold text-slate-200 uppercase">{{ currentLang }}</span>
            <svg class="hidden sm:block w-2 h-2 text-slate-400 transition-transform duration-200" :class="{'rotate-180': isLangMenuOpen}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
          <Transition name="menu">
            <div v-if="isLangMenuOpen" role="menu" class="absolute right-0 top-full mt-2 w-40 bg-ogame-bg border border-slate-700/40 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden">
              <div class="px-3.5 py-2.5 border-b border-slate-700/30">
                <span class="ov-sh ov-sh-noline" style="--tc:#94a3b8">{{ t('settings_section_lang') }}</span>
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
           class="hidden lg:flex hdr-btn lg:w-8 lg:h-8 items-center justify-center rounded-md bg-transparent border border-ogame-line hover:border-amber-500/40 text-slate-400 hover:text-amber-300 transition-colors duration-150"
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
          class="hidden lg:flex hdr-btn lg:w-8 lg:h-8 items-center justify-center rounded-md transition-colors duration-150"
          :class="$route.path === '/settings'
            ? 'bg-ogame-raised border-slate-600 text-slate-100'
            : 'bg-transparent border-ogame-line text-slate-400 hover:border-slate-600 hover:text-slate-200'"
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
      <div v-if="isMobileMenuOpen" class="lg:hidden fixed inset-x-0 top-14 bottom-0 z-40">
        <div
          class="absolute inset-0 bg-black/50"
          @click="isMobileMenuOpen = false"
          aria-hidden="true"
        ></div>
        <div class="relative border-b border-ogame-line bg-ogame-bg shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
          <nav :aria-label="t('nav_main')" class="px-3 py-2">
            <router-link
              v-for="link in navLinks" :key="link.to"
              :to="link.to"
              :aria-current="$route.path === link.to ? 'page' : undefined"
              @click="isMobileMenuOpen = false"
              class="flex items-center gap-3 px-4 py-3.5 rounded-lg transition-colors text-sm font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
              :class="$route.path === link.to
                ? 'text-slate-100 bg-white/[0.06]'
                : 'text-slate-300 active:bg-white/[0.05] focus-visible:bg-white/[0.05]'"
            >
              <ToolIcon :tool="link" class="w-5 h-5 flex-shrink-0" :style="{ color: link.color }" />
              {{ t(link.titleKey) }}
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
  transition: opacity 150ms cubic-bezier(0.23, 1, 0.32, 1), transform 150ms cubic-bezier(0.23, 1, 0.32, 1);
  transform-origin: top right;
}
.menu-enter-from {
  opacity: 0;
  transform: translateY(-4px) scale(0.97);
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
    transition: opacity 150ms !important;
    transform: none !important;
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
    transition: opacity 150ms !important;
    transform: none !important;
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
.nav-ico { color: rgb(148 163 184 / 0.7); transition: color 150ms; }
.nav-link[aria-current="page"] .nav-ico { color: var(--lc); }
@media (hover: hover) and (pointer: fine) { .nav-link:hover .nav-ico { color: var(--lc); } }
</style>
