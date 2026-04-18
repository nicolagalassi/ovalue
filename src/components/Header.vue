<script setup>
import { ref } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useProfiles } from '../composables/useProfiles';

const { currentLang, setLanguage, t } = useLanguage();
const { 
    profiles, activeProfileId, activeProfile, 
    createProfile, renameProfile, deleteProfile, 
    switchProfile, exportProfiles, importProfiles 
} = useProfiles();

const isLangMenuOpen = ref(false);
const isProfileMenuOpen = ref(false);
const isProfileModalOpen = ref(false);
const modalTitle = ref('');
const modalInput = ref('');
const modalAction = ref('create'); // 'create' or 'rename'
const editingProfileId = ref('');

const changeLang = (lang) => {
    setLanguage(lang);
    isLangMenuOpen.value = false;
};

const handleCreateProfile = () => {
    modalTitle.value = t('prompt_new_profile');
    modalInput.value = '';
    modalAction.value = 'create';
    isProfileModalOpen.value = true;
    isProfileMenuOpen.value = false;
};

const handleRenameProfile = (id, oldName) => {
    modalTitle.value = t('prompt_rename');
    modalInput.value = oldName;
    modalAction.value = 'rename';
    editingProfileId.value = id;
    isProfileModalOpen.value = true;
    isProfileMenuOpen.value = false;
};

const confirmProfileModal = () => {
    if (!modalInput.value.trim()) return;
    
    if (modalAction.value === 'create') {
        createProfile(modalInput.value.trim());
    } else {
        renameProfile(editingProfileId.value, modalInput.value.trim());
    }
    
    isProfileModalOpen.value = false;
};

const handleDeleteProfile = (id) => {
    if (confirm(t('confirm_delete_profile'))) deleteProfile(id);
};

const handleExportAll = () => {
    exportProfiles();
};

const handleImportAll = (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const success = importProfiles(e.target.result);
            if (success) {
                alert(t('msg_import_success'));
                isProfileMenuOpen.value = false;
            } else {
                alert(t('msg_import_error'));
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }
};

const triggerImportAll = () => document.getElementById('globalImportInput').click();
</script>

<template>
  <header 
    class="sticky top-0 z-50 w-full transition-all duration-300 border-b border-white/5 backdrop-blur-md bg-[#050505]/80"
  >
    <div class="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex flex-row justify-between items-center gap-4">
      
      <!-- Logo Container -->
      <div class="flex items-center flex-shrink-0" :class="{ 'hidden md:flex': $route.path !== '/' }">
         <router-link to="/" class="group flex items-center gap-3">
             <img src="/ovalue.png" alt="OValue" class="h-8 md:h-10 w-auto object-contain transition-transform group-hover:scale-105" />
         </router-link>
      </div>

      <!-- Navigation / Breadcrumbs for internal pages -->
      <div class="flex-grow min-w-0 flex flex-col md:flex-row md:items-center gap-3 md:gap-4" v-if="$route.path !== '/'">
        <router-link to="/" class="self-start md:hidden inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-bold text-gray-300 hover:text-white transition group">
            <svg class="w-3 h-3 text-ogame-accent group-hover:-translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            <span>{{ t('nav_back') }}</span>
        </router-link>
      </div>

      <div v-else class="flex-grow hidden md:block">
      </div>

      <div class="flex-shrink-0 flex items-center gap-3">
        
        <div id="header-actions" class="flex gap-2"></div>

        <div v-if="$route.path !== '/'" class="w-px h-8 bg-white/10 mx-1 hidden md:block"></div>

        <router-link 
          to="/help" 
          class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-ogame-accent/50 hover:bg-white/10 transition text-gray-300 shadow-sm group"
          :title="t('help_title')"
        >
          <svg class="w-4 h-4 text-ogame-accent group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="text-xs font-bold tracking-wider hidden sm:block">{{ t('nav_help') }}</span>
        </router-link>

        <!-- Profiles Switcher -->
        <div class="relative" v-if="activeProfile">
            <button @click="isProfileMenuOpen = !isProfileMenuOpen" 
                class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition text-gray-300 shadow-sm"
                :title="t('profile_active')"
            >
                <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                <span class="text-xs font-bold uppercase tracking-wider hidden lg:block max-w-[120px] truncate">{{ activeProfile.name }}</span>
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
                <div v-if="isProfileMenuOpen" class="absolute right-0 top-full mt-2 w-64 bg-[#161b22]/95 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                    <div class="p-2 border-b border-white/5 bg-white/5">
                        <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">{{ t('profile_manage') }}</span>
                    </div>
                    <div class="p-1.5 space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                        <div v-for="p in profiles" :key="p.id" class="flex items-center gap-1 group/p">
                            <button @click="switchProfile(p.id); isProfileMenuOpen = false" 
                                class="flex-grow text-left px-3 py-2 text-xs font-bold flex items-center gap-3 rounded-lg hover:bg-white/10 transition"
                                :class="activeProfileId === p.id ? 'bg-blue-900/20 text-blue-400' : 'text-gray-400'"
                            >
                                <div class="w-1.5 h-1.5 rounded-full" :class="activeProfileId === p.id ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]' : 'bg-gray-600'"></div>
                                <span class="truncate">{{ p.name }}</span>
                            </button>
                            <div class="flex opacity-0 group-hover/p:opacity-100 transition px-1">
                                <button @click="handleRenameProfile(p.id, p.name)" class="p-1.5 text-gray-500 hover:text-yellow-400 transition" :title="t('btn_rename')">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                </button>
                                <button v-if="profiles.length > 1" @click="handleDeleteProfile(p.id)" class="p-1.5 text-gray-500 hover:text-red-400 transition" :title="t('btn_delete')">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="p-1.5 border-t border-white/5 space-y-1">
                        <button @click="handleCreateProfile" class="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black text-green-400 hover:bg-green-400/10 rounded-lg transition uppercase tracking-widest">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            {{ t('btn_new_profile') }}
                        </button>
                        <div class="h-px bg-white/5 mx-2"></div>
                        <button @click="handleExportAll" class="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black text-blue-400 hover:bg-blue-400/10 rounded-lg transition uppercase tracking-widest">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            {{ t('profile_export_all') }}
                        </button>
                        <button @click="triggerImportAll" class="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black text-amber-400 hover:bg-amber-400/10 rounded-lg transition uppercase tracking-widest">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                            {{ t('profile_import_all') }}
                        </button>
                        <input type="file" id="globalImportInput" accept=".json" @change="handleImportAll" class="hidden">
                    </div>
                </div>
            </Transition>
            <div v-if="isProfileMenuOpen" @click="isProfileMenuOpen = false" class="fixed inset-0 z-40 bg-transparent"></div>
        </div>

        <div class="relative">
            <button @click="isLangMenuOpen = !isLangMenuOpen" 
                class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-white/10 transition text-gray-300 shadow-sm"
                aria-label="Change language"
            >
                <span class="text-base leading-none">{{ currentLang === 'it' ? '🇮🇹' : '🇬🇧' }}</span>
                <span class="text-xs font-bold uppercase tracking-wider hidden md:block">{{ currentLang }}</span>
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
                    <div class="p-1.5 space-y-1">
                        <button @click="changeLang('it')" class="w-full text-left px-3 py-2.5 text-xs font-bold flex items-center gap-3 rounded-lg hover:bg-white/10 transition" :class="currentLang === 'it' ? 'bg-cyan-900/20 text-cyan-400' : 'text-gray-400'">
                            <span class="text-lg leading-none grayscale group-hover:grayscale-0 transition" :class="{'grayscale-0': currentLang === 'it'}">🇮🇹</span> <span>Italiano</span>
                        </button>
                        <button @click="changeLang('en')" class="w-full text-left px-3 py-2.5 text-xs font-bold flex items-center gap-3 rounded-lg hover:bg-white/10 transition" :class="currentLang === 'en' ? 'bg-cyan-900/20 text-cyan-400' : 'text-gray-400'">
                            <span class="text-lg leading-none grayscale group-hover:grayscale-0 transition" :class="{'grayscale-0': currentLang === 'en'}">🇬🇧</span> <span>English</span>
                        </button>
                    </div>
                </div>
            </Transition>
            
            <div v-if="isLangMenuOpen" @click="isLangMenuOpen = false" class="fixed inset-0 z-40 bg-transparent"></div>
        </div>

      </div>
    </div>
  </header>

  <!-- Profile Modal -->
  <Transition name="fade">
      <div v-if="isProfileModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="isProfileModalOpen = false"></div>
          <div class="card-glass w-full max-w-md p-8 relative z-10 border border-white/10 shadow-2xl animate-in zoom-in duration-300">
              <div class="flex items-center justify-between mb-6">
                  <div class="flex items-center gap-3">
                      <div class="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                      </div>
                      <h2 class="text-xl font-black text-white uppercase tracking-tighter">{{ modalTitle }}</h2>
                  </div>
                  <button @click="isProfileModalOpen = false" class="text-gray-500 hover:text-white transition">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
              </div>
              
              <div class="mb-6">
                  <input 
                    v-model="modalInput" 
                    @keyup.enter="confirmProfileModal"
                    autofocus
                    class="input-glass w-full px-4 py-3 text-white font-bold" 
                    :placeholder="t('prompt_new_profile')"
                  >
              </div>
              
              <div class="flex justify-end gap-3">
                  <button @click="isProfileModalOpen = false" class="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition">
                      {{ t('help_btn_close') }}
                  </button>
                  <button @click="confirmProfileModal" class="px-8 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider transition shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                      OK
                  </button>
              </div>
          </div>
      </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>