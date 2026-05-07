<script setup>
import { ref, computed } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useProfiles } from '../composables/useProfiles';

const { currentLang, setLanguage, t } = useLanguage();
const {
    profiles, activeProfileId, activeProfile, knownServers,
    createProfile, renameProfile, deleteProfile,
    switchProfile, exportProfiles, importProfiles,
    toggleAutoSync, setSyncServer, duplicateProfile, importManual
} = useProfiles();

const lastSyncFormatted = computed(() => {
    const ts = activeProfile.value?.lastSync;
    if (!ts) return null;
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

// ── Modal profilo ──────────────────────────────────────────────────────────
const modalOpen = ref(false);
const modalTitle = ref('');
const modalInput = ref('');
const modalAction = ref('create');
const editingProfileId = ref('');

const openCreate = () => {
    modalTitle.value = t('prompt_new_profile');
    modalInput.value = '';
    modalAction.value = 'create';
    modalOpen.value = true;
};

const openRename = (id, name) => {
    modalTitle.value = t('prompt_rename');
    modalInput.value = name;
    modalAction.value = 'rename';
    editingProfileId.value = id;
    modalOpen.value = true;
};

const confirmModal = () => {
    if (!modalInput.value.trim()) return;
    if (modalAction.value === 'create') createProfile(modalInput.value.trim());
    else renameProfile(editingProfileId.value, modalInput.value.trim());
    modalOpen.value = false;
};

const handleDelete = (id) => {
    if (confirm(t('confirm_delete_profile'))) deleteProfile(id);
};

// ── Backup Import/Export ───────────────────────────────────────────────────
const handleBackupImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const ok = importProfiles(e.target.result);
        alert(ok ? t('msg_import_success') : t('msg_import_error'));
    };
    reader.readAsText(file);
    event.target.value = '';
};

// ── Import manuale OGame ───────────────────────────────────────────────────
const importText = ref('');
const importModalOpen = ref(false);

const confirmImportOGame = () => {
    const text = importText.value.trim();
    if (!text) return;
    try {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start === -1 || end < start) throw new Error('JSON non trovato');
        const data = JSON.parse(text.substring(start, end + 1));
        const ok = importManual(data);
        if (ok) {
            alert(t('settings_import_success'));
            importText.value = '';
            importModalOpen.value = false;
        } else {
            alert(t('settings_import_error') + 'Dati non validi');
        }
    } catch (e) {
        alert(t('settings_import_error') + e.message);
    }
};
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 md:px-6 mt-6 md:mt-10 pb-16 space-y-10">

    <!-- Page Header -->
    <div>
      <h1 class="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase italic">{{ t('settings_title') }}</h1>
      <p class="text-xs text-gray-500 mt-1">{{ t('settings_subtitle') }}</p>
    </div>

    <!-- ── PROFILI ──────────────────────────────────────────────────────── -->
    <section>
      <div class="flex items-center gap-3 mb-4">
        <span class="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          {{ t('settings_section_profiles') }}
        </span>
        <div class="flex-grow h-px bg-white/5"></div>
        <span class="text-[10px] text-gray-600 font-mono">{{ profiles.length }}</span>
      </div>

      <div class="bg-[#0b0e14]/80 border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5 mb-3">
        <div
          v-for="p in profiles" :key="p.id"
          class="flex items-center gap-3 px-4 py-3 transition-colors duration-200 group"
          :class="activeProfileId === p.id ? 'bg-blue-500/[0.06]' : 'hover:bg-white/[0.025]'"
        >
          <div class="w-2 h-2 rounded-full flex-shrink-0 transition-all"
               :class="activeProfileId === p.id ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]' : 'bg-gray-700'">
          </div>

          <button @click="switchProfile(p.id)" class="flex-grow text-left min-w-0">
            <div class="text-sm font-bold truncate" :class="activeProfileId === p.id ? 'text-blue-300' : 'text-white/80 hover:text-white'">
              {{ p.name }}
            </div>
            <div class="text-[10px] text-gray-600 truncate">
              {{ p.syncServer ? p.syncServer.split('.')[0] : t('settings_no_server') }}
            </div>
          </button>

          <span v-if="activeProfileId === p.id" class="text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/10 border border-blue-400/20 px-1.5 py-0.5 rounded flex-shrink-0">
            {{ t('settings_active') }}
          </span>

          <span class="text-[9px] font-black uppercase tracking-widest flex-shrink-0 px-1.5 py-0.5 rounded border"
                :class="p.autoSync ? 'text-green-400 bg-green-400/10 border-green-400/20' : 'text-gray-600 bg-white/5 border-white/10'">
            {{ p.autoSync ? t('sync_auto') : t('sync_manual') }}
          </span>

          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button @click="openRename(p.id, p.name)" class="p-1.5 text-gray-500 hover:text-yellow-400 transition rounded" :title="t('btn_rename')">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button @click="duplicateProfile(p.id)" class="p-1.5 text-gray-500 hover:text-cyan-400 transition rounded" :title="t('btn_duplicate')">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </button>
            <button v-if="profiles.length > 1" @click="handleDelete(p.id)" class="p-1.5 text-gray-500 hover:text-red-400 transition rounded" :title="t('btn_delete')">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <button @click="openCreate"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition text-xs font-black uppercase tracking-widest">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          {{ t('btn_new_profile') }}
        </button>
        <button @click="exportProfiles"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition text-xs font-black uppercase tracking-widest">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          {{ t('profile_export_all') }}
        </button>
        <label class="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition text-xs font-black uppercase tracking-widest cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
          {{ t('profile_import_all') }}
          <input type="file" accept=".json" @change="handleBackupImport" class="hidden">
        </label>
      </div>
    </section>

    <!-- ── SINCRONIZZAZIONE ────────────────────────────────────────────── -->
    <section v-if="activeProfile">
      <div class="flex items-center gap-3 mb-4">
        <span class="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          {{ t('settings_section_sync') }} — {{ activeProfile.name }}
        </span>
        <div class="flex-grow h-px bg-white/5"></div>
      </div>

      <div class="bg-[#0b0e14]/80 border border-white/5 rounded-xl divide-y divide-white/5">
        <!-- Toggle AutoSync -->
        <div class="flex items-center justify-between px-5 py-4">
          <div>
            <div class="text-sm font-bold text-white/90">{{ t('settings_sync_auto_title') }}</div>
            <div class="text-[11px] text-gray-500 mt-0.5">{{ t('settings_sync_auto_desc') }}</div>
          </div>
          <button @click="toggleAutoSync"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ml-4"
            :class="activeProfile.autoSync ? 'bg-green-500' : 'bg-gray-700'"
          >
            <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                  :class="activeProfile.autoSync ? 'translate-x-6' : 'translate-x-1'"></span>
          </button>
        </div>

        <!-- Server selector -->
        <div class="px-5 py-4">
          <div class="text-sm font-bold text-white/90 mb-1">{{ t('settings_server_title') }}</div>
          <div class="text-[11px] text-gray-500 mb-3">{{ t('settings_server_desc') }}</div>
          <div v-if="knownServers.length > 0">
            <select
              :value="activeProfile.syncServer ?? ''"
              @change="setSyncServer($event.target.value)"
              class="w-full text-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-gray-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="" class="bg-[#161b22] text-gray-500">{{ t('settings_server_none') }}</option>
              <option v-for="srv in knownServers" :key="srv" :value="srv" class="bg-[#161b22]">
                {{ srv.split('.')[0] }} ({{ srv }})
              </option>
            </select>
          </div>
          <div v-else class="text-[11px] text-gray-600 italic">{{ t('settings_no_server_hint') }}</div>
        </div>

        <!-- Last sync -->
        <div class="flex items-center justify-between px-5 py-4">
          <div class="text-sm font-bold text-white/90">{{ t('settings_last_sync') }}</div>
          <span class="text-[11px] font-mono" :class="lastSyncFormatted ? 'text-gray-400' : 'text-gray-600'">
            {{ lastSyncFormatted ?? t('sync_never') }}
          </span>
        </div>
      </div>
    </section>

    <!-- ── IMPORTA DA OGAME ────────────────────────────────────────────── -->
    <section v-if="activeProfile">
      <div class="flex items-center gap-3 mb-4">
        <span class="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"/></svg>
          {{ t('settings_section_import') }}
        </span>
        <div class="flex-grow h-px bg-white/5"></div>
      </div>

      <div class="bg-[#0b0e14]/80 border border-white/5 rounded-xl p-5 space-y-4">
        <p class="text-[11px] text-gray-500 italic">{{ t('settings_import_desc') }}</p>
        <textarea
          v-model="importText"
          class="input-glass w-full h-36 p-3 font-mono text-xs resize-none"
          placeholder='{"planets": [...], "settings": {...}}'
        ></textarea>
        <div class="flex justify-end gap-3">
          <button @click="importText = ''" class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 font-bold transition text-xs">
            {{ t('btn_cancel') }}
          </button>
          <button @click="confirmImportOGame"
            class="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-wider transition shadow-[0_0_15px_rgba(6,182,212,0.3)] text-xs">
            {{ t('btn_import_now') }}
          </button>
        </div>
      </div>
    </section>

    <!-- ── LINGUA ──────────────────────────────────────────────────────── -->
    <section>
      <div class="flex items-center gap-3 mb-4">
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/></svg>
          {{ t('settings_section_lang') }}
        </span>
        <div class="flex-grow h-px bg-white/5"></div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <button @click="setLanguage('it')"
          class="flex items-center gap-3 px-4 py-3 rounded-xl border transition font-bold text-sm"
          :class="currentLang === 'it' ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'"
        >
          <span class="text-xl leading-none">🇮🇹</span> Italiano
        </button>
        <button @click="setLanguage('en')"
          class="flex items-center gap-3 px-4 py-3 rounded-xl border transition font-bold text-sm"
          :class="currentLang === 'en' ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'"
        >
          <span class="text-xl leading-none">🇬🇧</span> English
        </button>
      </div>
    </section>

  </div>

  <!-- Modal profilo -->
  <Transition name="fade">
    <div v-if="modalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="modalOpen = false"></div>
      <div class="card-glass w-full max-w-md p-8 relative z-10 border border-white/10 shadow-2xl">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            </div>
            <h2 class="text-lg font-black text-white uppercase tracking-tighter">{{ modalTitle }}</h2>
          </div>
          <button @click="modalOpen = false" class="text-gray-500 hover:text-white transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <input
          v-model="modalInput"
          @keyup.enter="confirmModal"
          autofocus
          class="input-glass w-full px-4 py-3 text-white font-bold mb-6"
          :placeholder="t('prompt_new_profile')"
        >
        <div class="flex justify-end gap-3">
          <button @click="modalOpen = false" class="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition text-sm">
            {{ t('btn_cancel') }}
          </button>
          <button @click="confirmModal" class="px-8 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider transition shadow-[0_0_15px_rgba(37,99,235,0.4)] text-sm">
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
