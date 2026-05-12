<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useProfiles } from '../composables/useProfiles';

const { t } = useLanguage();
const { activeProfile } = useProfiles();

const now = ref(Date.now());
let timer;
onMounted(() => { timer = setInterval(() => { now.value = Date.now(); }, 30000); });
onUnmounted(() => clearInterval(timer));

const getStatus = (ts) => {
    if (!ts) return 'permanent';
    const diff = ts - now.value;
    if (diff <= 0) return 'expired';
    if (diff <= 86400000) return 'critical';
    if (diff <= 864000000) return 'warning';
    return 'ok';
};

const formatTime = (ts) => {
    if (!ts) return t('exp_permanent') || 'Permanente';
    const diff = ts - now.value;
    if (diff <= 0) return t('exp_expired') || 'Scaduto';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff / 3600000) % 24);
    const m = Math.floor((diff / 60000) % 60);
    if (d > 0) return `${d}g ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

const isNotResource = (name) =>
    !/(Amplificatore|Metallo|Cristallo|Deuterio|Metal|Crystal|Deuterium|Resource Amplifier)/i.test(name);

const allItems = computed(() => {
    if (!activeProfile.value?.expirations) return [];
    // Traduce il nome dell'ufficiale: supporta vecchio formato IT ('Geologo') e
    // nuovo formato CSS-class neutro ('geologist') usato dall'esportatore ≥3.3.0
    const translateOfficer = (key) => {
        const locKey = 'officer_' + key;
        const translated = t(locKey);
        return translated !== locKey ? translated : key; // fallback al nome grezzo
    };
    // Solo item con scadenza reale — i permanenti (expires: null) vengono esclusi
    const officers = Object.entries(activeProfile.value.expirations.officers || {})
        .filter(([, o]) => o.expires !== null)
        .map(([name, o]) => ({ name: translateOfficer(name), expires: o.expires, type: 'officer' }));
    const items = (activeProfile.value.expirations.globalItems || [])
        .filter(i => isNotResource(i.name) && i.expires !== null)
        .map(i => ({ name: i.name, expires: i.expires, type: 'item' }));
    const priority = { critical: 0, warning: 1, expired: 2, ok: 3, permanent: 4 };
    return [...officers, ...items].sort((a, b) => {
        const pa = priority[getStatus(a.expires)];
        const pb = priority[getStatus(b.expires)];
        if (pa !== pb) return pa - pb;
        if (a.expires && b.expires) return a.expires - b.expires;
        return 0;
    });
});

const counts = computed(() => ({
    critical: allItems.value.filter(i => getStatus(i.expires) === 'critical').length,
    warning:  allItems.value.filter(i => getStatus(i.expires) === 'warning').length,
    ok:       allItems.value.filter(i => getStatus(i.expires) === 'ok').length,
    expired:  allItems.value.filter(i => getStatus(i.expires) === 'expired').length,
}));

const statusLabel = computed(() => ({
    critical:  (t('exp_status_critical')  || 'CRITICO').toUpperCase(),
    warning:   (t('exp_status_warning')   || 'IN SCADENZA').toUpperCase(),
    ok:        (t('exp_status_ok')        || 'ATTIVO').toUpperCase(),
    expired:   (t('exp_status_expired')   || 'SCADUTO').toUpperCase(),
    permanent: (t('exp_status_permanent') || 'PERMANENTE').toUpperCase(),
}));
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 md:px-6 mt-6 md:mt-10 pb-16">

    <!-- Page Header -->
    <div class="mb-8 text-center relative">
      <h1 class="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
        {{ t('card_expirations_title') }}
      </h1>
      <div class="mt-2 h-[3px] w-24 rounded-full mx-auto opacity-70"
           :class="counts.critical > 0 ? 'bg-gradient-to-r from-red-500 to-rose-400' : 'bg-gradient-to-r from-rose-600 to-rose-500'">
      </div>
    </div>

    <!-- Status summary chips -->
    <div class="flex flex-wrap items-center justify-center gap-2 mb-8">
      <div v-if="counts.critical > 0"
           class="stat-chip border-red-500/30 bg-red-500/[0.08]">
        <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.9)] flex-shrink-0"></span>
        <span class="text-red-400">{{ counts.critical }}</span>
        <span class="text-red-600">{{ t('exp_chip_critical') }}</span>
      </div>
      <div v-if="counts.warning > 0"
           class="stat-chip border-orange-500/25 bg-orange-500/[0.06]">
        <span class="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_5px_rgba(251,146,60,0.6)] flex-shrink-0"></span>
        <span class="text-orange-400">{{ counts.warning }}</span>
        <span class="text-orange-700">{{ t('exp_chip_warning') }}</span>
      </div>
      <div v-if="counts.ok > 0"
           class="stat-chip border-green-500/20 bg-green-500/[0.05]">
        <span class="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></span>
        <span class="text-green-400">{{ counts.ok }}</span>
        <span class="text-green-800">{{ t('exp_chip_ok') }}</span>
      </div>
      <div v-if="counts.expired > 0"
           class="stat-chip border-white/[0.08]">
        <span class="w-1.5 h-1.5 rounded-full bg-red-500/40 flex-shrink-0"></span>
        <span class="text-gray-600">{{ counts.expired }}</span>
        <span class="text-gray-700">{{ t('exp_chip_expired') }}</span>
      </div>
      <div v-if="allItems.length === 0"
           class="stat-chip border-white/[0.05]">
        <span class="text-gray-600 font-mono">{{ t('exp_no_data_chip') }}</span>
      </div>
    </div>

    <!-- Items grid -->
    <div v-if="allItems.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div
        v-for="(item, i) in allItems" :key="i"
        class="item-card group relative rounded-lg overflow-hidden"
        :class="{
          'border-red-500/20 bg-red-500/[0.03]':    getStatus(item.expires) === 'critical',
          'border-orange-500/15 bg-orange-500/[0.02]': getStatus(item.expires) === 'warning',
          'border-white/[0.04] bg-white/[0.01]':    getStatus(item.expires) === 'ok',
          'border-white/[0.03]':                    getStatus(item.expires) === 'permanent' || getStatus(item.expires) === 'expired',
        }"
      >
        <!-- Corner brackets — color matches status -->
        <div class="corner-tl absolute top-0 left-0 w-3 h-3 border-t border-l transition-all duration-300 group-hover:w-4 group-hover:h-4"
             :class="{
               'border-red-500/50 group-hover:border-red-400/80':    getStatus(item.expires) === 'critical',
               'border-orange-500/40 group-hover:border-orange-400/70': getStatus(item.expires) === 'warning',
               'border-green-500/30 group-hover:border-green-400/60': getStatus(item.expires) === 'ok',
               'border-white/10':                                    getStatus(item.expires) === 'permanent' || getStatus(item.expires) === 'expired',
             }"></div>
        <div class="corner-br absolute bottom-0 right-0 w-3 h-3 border-b border-r transition-all duration-300 group-hover:w-4 group-hover:h-4"
             :class="{
               'border-red-500/30':    getStatus(item.expires) === 'critical',
               'border-orange-500/25': getStatus(item.expires) === 'warning',
               'border-green-500/20':  getStatus(item.expires) === 'ok',
               'border-white/5':       getStatus(item.expires) === 'permanent' || getStatus(item.expires) === 'expired',
             }"></div>

        <!-- Left accent bar -->
        <div class="absolute left-0 top-0 bottom-0 w-[2px] rounded-l-lg"
             :class="{
               'bg-gradient-to-b from-red-500/20 via-red-500/70 to-red-500/20':       getStatus(item.expires) === 'critical',
               'bg-gradient-to-b from-orange-500/20 via-orange-400/50 to-orange-500/20': getStatus(item.expires) === 'warning',
               'bg-gradient-to-b from-green-500/10 via-green-500/40 to-green-500/10':  getStatus(item.expires) === 'ok',
               'bg-white/5':                                                           getStatus(item.expires) === 'permanent' || getStatus(item.expires) === 'expired',
             }"></div>

        <div class="pl-4 pr-4 py-3.5 flex items-center gap-3">
          <!-- Status dot -->
          <div class="w-2 h-2 rounded-full flex-shrink-0"
               :class="{
                 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)] animate-pulse': getStatus(item.expires) === 'critical',
                 'bg-orange-400 shadow-[0_0_5px_rgba(251,146,60,0.6)]':           getStatus(item.expires) === 'warning',
                 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.4)]':             getStatus(item.expires) === 'ok',
                 'bg-cyan-400/40':                                                getStatus(item.expires) === 'permanent',
                 'bg-red-500/30':                                                 getStatus(item.expires) === 'expired',
               }"></div>

          <!-- Name + type -->
          <div class="flex-grow min-w-0">
            <div class="text-[12px] font-bold text-white/80 truncate leading-tight">{{ item.name }}</div>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="text-[8px] font-black uppercase tracking-widest font-mono"
                    :class="{
                      'text-red-500/70':    getStatus(item.expires) === 'critical',
                      'text-orange-500/60': getStatus(item.expires) === 'warning',
                      'text-green-500/50':  getStatus(item.expires) === 'ok',
                      'text-cyan-500/40':   getStatus(item.expires) === 'permanent',
                      'text-gray-600':      getStatus(item.expires) === 'expired',
                    }">
                {{ statusLabel[getStatus(item.expires)] }}
              </span>
              <span class="text-[8px] text-gray-700 font-mono">·</span>
              <span class="text-[8px] text-gray-700 font-mono uppercase tracking-wider">{{ item.type === 'officer' ? t('exp_type_officer') : t('exp_type_item') }}</span>
            </div>
          </div>

          <!-- Time remaining -->
          <div class="flex-shrink-0 text-right">
            <span class="text-[13px] font-black font-mono leading-none"
                  :class="{
                    'text-red-400':    getStatus(item.expires) === 'critical',
                    'text-orange-400': getStatus(item.expires) === 'warning',
                    'text-green-400':  getStatus(item.expires) === 'ok',
                    'text-gray-600':   getStatus(item.expires) === 'permanent',
                    'text-red-500/40': getStatus(item.expires) === 'expired',
                  }">
              {{ formatTime(item.expires) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center justify-center py-24 gap-6">
      <div class="empty-hud relative w-24 h-24 flex items-center justify-center">
        <div class="absolute inset-0 border border-white/5 rounded-lg"></div>
        <div class="absolute top-0 left-0 w-4 h-4 border-t border-l border-rose-500/30"></div>
        <div class="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-rose-500/30"></div>
        <svg class="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <div class="text-center">
        <p class="text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] font-mono">{{ t('exp_empty_title') }}</p>
        <p class="text-[10px] text-gray-700 mt-1 font-mono">{{ t('exp_empty_hint') }}</p>
      </div>
    </div>

  </div>
</template>

<style scoped>
.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 4px;
  border-width: 1px;
  border-style: solid;
  font-size: 9px;
  font-family: monospace;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.item-card {
  border-width: 1px;
  border-style: solid;
  transition: background-color 0.2s, border-color 0.2s;
}

@keyframes itemIn {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
}

.item-card {
  animation: itemIn 0.3s ease-out both;
}

.item-card:nth-child(1)  { animation-delay: 0.05s; }
.item-card:nth-child(2)  { animation-delay: 0.08s; }
.item-card:nth-child(3)  { animation-delay: 0.11s; }
.item-card:nth-child(4)  { animation-delay: 0.14s; }
.item-card:nth-child(5)  { animation-delay: 0.17s; }
.item-card:nth-child(6)  { animation-delay: 0.20s; }
.item-card:nth-child(7)  { animation-delay: 0.23s; }
.item-card:nth-child(8)  { animation-delay: 0.26s; }
.item-card:nth-child(9)  { animation-delay: 0.29s; }
.item-card:nth-child(n+10) { animation-delay: 0.32s; }
</style>
