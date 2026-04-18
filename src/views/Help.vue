<script setup>
import { ref } from 'vue';
import { useLanguage } from '../composables/useLanguage';

const { t } = useLanguage();

const activeSection = ref('production');
const openNodes = ref(new Set(['production_summary', 'pack_summary', 'shop_summary', 'profiles_summary']));

const toggleNode = (nodeId) => {
    if (openNodes.value.has(nodeId)) {
        openNodes.value.delete(nodeId);
    } else {
        openNodes.value.add(nodeId);
    }
};

const sections = [
    {
        id: 'production',
        title: 'help_prod_title',
        icon: 'M13 10V3L4 14h7v7l9-11h-7z',
        color: 'from-orange-500/20 to-orange-500/5',
        accent: 'text-orange-400',
        nodes: [
            { id: 'prod_summary', title: 'help_prod_summary', content: 'help_prod_desc' },
            { id: 'prod_how', title: 'help_prod_how_title', content: 'help_prod_how_desc' },
            { id: 'prod_import', title: 'help_prod_import_title', content: 'help_prod_import_desc', isImport: true },
            { id: 'prod_features', title: 'help_prod_features_title', content: 'help_prod_features_desc' }
        ]
    },
    {
        id: 'pack',
        title: 'help_pack_title',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        color: 'from-cyan-500/20 to-cyan-500/5',
        accent: 'text-cyan-400',
        nodes: [
            { id: 'pack_summary', title: 'help_pack_summary', content: 'help_pack_desc' },
            { id: 'pack_costs', title: 'help_pack_costs_title', content: 'help_pack_costs_desc' },
            { id: 'pack_stock', title: 'help_pack_stock_title', content: 'help_pack_stock_desc' }
        ]
    },
    {
        id: 'shop',
        title: 'help_shop_title',
        icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
        color: 'from-purple-500/20 to-purple-500/5',
        accent: 'text-purple-400',
        nodes: [
            { id: 'shop_summary', title: 'help_shop_summary', content: 'help_shop_desc' },
            { id: 'shop_warning', title: 'help_shop_warning_title', content: 'help_shop_warning_desc', isWarning: true }
        ]
    },
    {
        id: 'profiles',
        title: 'help_profiles_title',
        icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
        color: 'from-blue-500/20 to-blue-500/5',
        accent: 'text-blue-400',
        nodes: [
            { id: 'profiles_summary', title: 'help_profiles_summary', content: 'help_profiles_desc' }
        ]
    }
];

const scriptUrl = "https://update.greasyfork.org/scripts/574448/OValue%20Exporter.user.js";
</script>

<template>
  <div class="min-h-screen bg-[#050505] text-gray-200 pb-32">
    <!-- Hero Section -->
    <div class="relative overflow-hidden bg-gradient-to-b from-ogame-accent/10 to-transparent py-16 md:py-24 border-b border-white/5">
      <div class="absolute inset-0 z-0">
          <div class="absolute top-0 left-1/4 w-96 h-96 bg-ogame-accent/10 rounded-full blur-[120px]"></div>
          <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>
      
      <div class="max-w-5xl mx-auto px-6 relative z-10 text-center">
        <h1 class="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight uppercase italic">
          {{ t('help_title') }}
        </h1>
        <p class="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
          {{ t('help_intro') }}
        </p>
      </div>
    </div>

    <!-- Collapsible Tree / Accordion -->
    <div class="max-w-5xl mx-auto px-6 mt-12 space-y-6">
      
      <div v-for="section in sections" :key="section.id" 
           class="rounded-3xl bg-[#0b0e14]/50 border border-white/5 overflow-hidden transition-all duration-300"
           :class="{ 'ring-1 ring-white/10 shadow-2xl': activeSection === section.id }"
      >
        <!-- Section Header -->
        <button 
          @click="activeSection = activeSection === section.id ? null : section.id"
          class="w-full flex items-center justify-between p-6 md:p-8 hover:bg-white/5 transition group text-left"
        >
          <div class="flex items-center gap-6">
            <div :class="['w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-lg group-hover:scale-110 transition-transform', section.accent]">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="section.icon"></path>
              </svg>
            </div>
            <div>
              <h2 class="text-xl md:text-2xl font-black text-white tracking-tight uppercase italic">{{ t(section.title) }}</h2>
              <p class="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{{ t(section.nodes[0].title) }}</p>
            </div>
          </div>
          <svg 
            class="w-6 h-6 text-gray-600 transition-transform duration-300" 
            :class="{ 'rotate-180 text-ogame-accent': activeSection === section.id }" 
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        <!-- Section Content (Tree) -->
        <Transition name="expand">
          <div v-if="activeSection === section.id" class="px-6 md:px-8 pb-8">
            <div class="space-y-4 pt-4 border-t border-white/5">
              
              <div v-for="node in section.nodes" :key="node.id" class="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                <button 
                  @click="toggleNode(node.id)"
                  class="w-full flex items-center justify-between p-4 hover:bg-white/5 transition text-left"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full bg-ogame-accent shadow-[0_0_8px_rgba(0,255,204,0.4)]" v-if="openNodes.has(node.id)"></div>
                    <div class="w-2 h-2 rounded-full bg-gray-700" v-else></div>
                    <span class="text-sm font-black text-gray-200 uppercase tracking-wider">{{ t(node.title) }}</span>
                  </div>
                  <span class="text-xs font-bold text-gray-500">{{ openNodes.has(node.id) ? t('help_btn_close') : t('help_btn_open') }}</span>
                </button>

                <Transition name="expand">
                  <div v-if="openNodes.has(node.id)" class="px-4 pb-5">
                    <div class="pl-5 border-l border-white/10 ml-1 space-y-4">
                      
                      <div v-if="node.isImport" class="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                         <p class="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{{ t(node.content) }}</p>
                         <a :href="scriptUrl" target="_blank" class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20 transition-all">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            {{ t('btn_download_script') }}
                         </a>
                      </div>
                      
                      <div v-else-if="node.isWarning" class="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                         <div class="flex items-center gap-2 text-yellow-400 mb-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            <span class="text-xs font-black uppercase tracking-widest">{{ t('help_shop_warning_title') }}</span>
                         </div>
                         <p class="text-sm text-gray-300 leading-relaxed">{{ t(node.content) }}</p>
                      </div>

                      <p v-else class="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
                        {{ t(node.content) }}
                      </p>

                    </div>
                  </div>
                </Transition>
              </div>

            </div>
          </div>
        </Transition>
      </div>

    </div>

    <!-- Footer Action -->
    <div class="max-w-5xl mx-auto px-6 mt-16 text-center">
        <router-link to="/" class="inline-flex items-center gap-3 px-8 py-4 bg-ogame-accent hover:bg-ogame-accent-hover text-black font-black rounded-2xl transition transform hover:scale-105 shadow-xl shadow-ogame-accent/20 uppercase tracking-widest italic">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg>
            <span>{{ t('nav_back') }}</span>
        </router-link>
    </div>
  </div>
</template>

<style scoped>
.text-ogame-accent { color: #00ffcc; }
.bg-ogame-accent { background-color: #00ffcc; }
.bg-ogame-accent-hover { background-color: #00e6b8; }

.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease-out;
  max-height: 1000px;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
</style>
