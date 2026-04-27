<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { useProfiles } from '../composables/useProfiles';

const { t } = useLanguage();
const { activeProfile } = useProfiles();

const now = ref(Date.now());
let timer;

onMounted(() => {
    timer = setInterval(() => { now.value = Date.now(); }, 60000);
});
onUnmounted(() => clearInterval(timer));

const formatTimeRemaining = (timestamp) => {
    if (!timestamp) return t('exp_permanent') || 'Permanente';
    const diff = timestamp - now.value;
    if (diff <= 0) return t('exp_expired') || 'Scaduto';
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    if (d > 0) return `${d}g ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

const getStatus = (timestamp) => {
    if (!timestamp) return 'permanent';
    const diff = timestamp - now.value;
    if (diff <= 0) return 'expired';
    if (diff <= 1000 * 60 * 60 * 24) return 'critical';
    if (diff <= 1000 * 60 * 60 * 24 * 10) return 'warning';
    return 'ok';
};

const dotClass = (ts) => ({
    permanent: 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]',
    expired:   'bg-red-500/50',
    critical:  'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)] animate-pulse',
    warning:   'bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.7)]',
    ok:        'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]',
}[getStatus(ts)]);

const badgeClass = (ts) => ({
    permanent: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    expired:   'text-red-400/60 bg-red-400/5 border-red-400/15',
    critical:  'text-red-400 bg-red-400/10 border-red-400/30',
    warning:   'text-orange-400 bg-orange-400/10 border-orange-400/25',
    ok:        'text-green-400 bg-green-400/10 border-green-400/20',
}[getStatus(ts)]);

const barClass = (ts) => ({
    permanent: 'bg-cyan-500',
    expired:   'bg-red-500/40',
    critical:  'bg-red-500',
    warning:   'bg-orange-400',
    ok:        'bg-green-500',
}[getStatus(ts)]);

const rowClass = (ts) => {
    const s = getStatus(ts);
    if (s === 'critical') return 'bg-red-500/[0.03] hover:bg-red-500/[0.06]';
    if (s === 'expired')  return 'opacity-50 hover:opacity-70';
    return 'hover:bg-white/[0.025]';
};

const getPercentage = (expires, totalDuration) => {
    if (!expires || !totalDuration) return 100;
    const diff = expires - now.value;
    if (diff <= 0) return 0;
    return Math.min(100, Math.max(0, (diff / totalDuration) * 100));
};

// Riconosce slot fleet/expedition e restituisce il bonus slot
const getSlotBonus = (name) => {
    if (!name) return null;
    const isFleet = /slot.*(flott|fleet)|fleet.*slot/i.test(name);
    const isExp   = /slot.*(sped|expedit)|expedit.*slot/i.test(name);
    if (!isFleet && !isExp) return null;

    const tier = /oro|gold/i.test(name)     ? 'gold'
               : /argent|silver/i.test(name) ? 'silver'
               : /bronz|bronze/i.test(name)  ? 'bronze'
               : null;
    if (!tier) return null;

    if (isFleet) return { label: `+${{ gold:6, silver:4, bronze:2 }[tier]}`, sub: 'flotta' };
    if (isExp)   return { label: `+${{ gold:3, silver:2, bronze:1 }[tier]}`, sub: 'sped.' };
    return null;
};

const sortByUrgency = (items) => [...items].sort((a, b) => {
    const sA = getStatus(a.expires);
    const sB = getStatus(b.expires);
    const priority = { critical: 0, warning: 1, expired: 2, ok: 3, permanent: 4 };
    if (priority[sA] !== priority[sB]) return priority[sA] - priority[sB];
    if (a.expires && b.expires) return a.expires - b.expires;
    return 0;
});

const officers = computed(() => {
    if (!activeProfile.value?.expirations) return [];
    const off = activeProfile.value.expirations.officers || {};
    const list = Object.keys(off).map(name => ({ name, ...off[name] })).filter(o => o.expires !== null);
    return sortByUrgency(list);
});

const globalItems = computed(() => {
    if (!activeProfile.value?.expirations) return [];
    const items = activeProfile.value.expirations.globalItems || [];
    const filtered = items.filter(i => {
        if (i.expires === null) return false;
        return !/(Amplificatore|Metallo|Cristallo|Deuterio|Metal|Crystal|Deuterium|Resource Amplifier)/i.test(i.name);
    });
    return sortByUrgency(filtered);
});

const allItems = computed(() => [...officers.value, ...globalItems.value]);

const criticalCount = computed(() => allItems.value.filter(i => getStatus(i.expires) === 'critical').length);
const warningCount  = computed(() => allItems.value.filter(i => getStatus(i.expires) === 'warning').length);
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 md:px-6 mt-6 md:mt-10 pb-16">

    <!-- Page Header -->
    <div class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase italic">
          {{ t('card_expirations_title') }}
        </h1>
        <p class="text-xs text-gray-500 mt-1">{{ t('card_expirations_desc') }}</p>
      </div>

      <!-- Status summary badges -->
      <div class="flex items-center gap-2 flex-shrink-0 mt-1">
        <span v-if="criticalCount > 0" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/30 text-red-400">
          <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          {{ criticalCount }}
        </span>
        <span v-if="warningCount > 0" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-orange-500/10 border border-orange-500/25 text-orange-400">
          <span class="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
          {{ warningCount }}
        </span>
      </div>
    </div>

    <!-- No profile -->
    <div v-if="!activeProfile" class="card-glass p-8 text-center text-gray-500 text-sm">
      Nessun profilo selezionato.
    </div>

    <div v-else class="space-y-8">

      <!-- Officers -->
      <section v-if="officers.length > 0 || true">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            Ufficiali
          </span>
          <div class="flex-grow h-px bg-white/5"></div>
          <span class="text-[10px] text-gray-600 font-mono">{{ officers.length }}</span>
        </div>

        <div v-if="officers.length === 0" class="px-4 py-5 rounded-xl border border-dashed border-white/8 text-center text-xs text-gray-600 italic">
          Nessun ufficiale nell'ultimo export.
        </div>

        <div v-else class="bg-[#0b0e14]/80 border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
          <div
            v-for="(off, i) in officers"
            :key="i"
            class="flex items-center gap-3 px-4 py-3 transition-colors duration-200"
            :class="rowClass(off.expires)"
          >
            <!-- Status dot -->
            <div class="w-2 h-2 rounded-full flex-shrink-0" :class="dotClass(off.expires)"></div>

            <!-- Name + slot bonus (se ufficiale con slot - raro, ma copriamo) -->
            <span class="flex-grow text-sm font-medium text-white/90 truncate">{{ off.name }}</span>
            <template v-if="getSlotBonus(off.name)">
                <span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 flex-shrink-0">
                    {{ getSlotBonus(off.name).label }} {{ getSlotBonus(off.name).sub }}
                </span>
            </template>

            <!-- Progress bar (desktop only) -->
            <div v-if="off.expires && getStatus(off.expires) !== 'expired'" class="hidden sm:block w-24 h-[3px] bg-black/60 rounded-full overflow-hidden flex-shrink-0">
              <div class="h-full rounded-full transition-all duration-1000 ease-linear"
                   :class="barClass(off.expires)"
                   :style="{ width: getPercentage(off.expires, off.totalDuration) + '%' }">
              </div>
            </div>

            <!-- Time badge -->
            <span class="text-[10px] font-black uppercase tracking-wider font-mono flex-shrink-0 px-2 py-0.5 rounded border"
                  :class="badgeClass(off.expires)">
              {{ formatTimeRemaining(off.expires) }}
            </span>
          </div>
        </div>
      </section>

      <!-- Global Items -->
      <section>
        <div class="flex items-center gap-3 mb-3">
          <span class="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
            Item Globali
          </span>
          <div class="flex-grow h-px bg-white/5"></div>
          <span class="text-[10px] text-gray-600 font-mono">{{ globalItems.length }}</span>
        </div>

        <div v-if="globalItems.length === 0" class="px-4 py-5 rounded-xl border border-dashed border-white/8 text-center text-xs text-gray-600 italic">
          Nessun item globale nell'ultimo export.
        </div>

        <div v-else class="bg-[#0b0e14]/80 border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
          <div
            v-for="(item, i) in globalItems"
            :key="i"
            class="flex items-center gap-3 px-4 py-3 transition-colors duration-200"
            :class="rowClass(item.expires)"
          >
            <div class="w-2 h-2 rounded-full flex-shrink-0" :class="dotClass(item.expires)"></div>

            <span class="flex-grow text-sm font-medium text-white/90 truncate">{{ item.name }}</span>
            <template v-if="getSlotBonus(item.name)">
                <span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 flex-shrink-0">
                    {{ getSlotBonus(item.name).label }} {{ getSlotBonus(item.name).sub }}
                </span>
            </template>

            <div v-if="item.expires && getStatus(item.expires) !== 'expired'" class="hidden sm:block w-24 h-[3px] bg-black/60 rounded-full overflow-hidden flex-shrink-0">
              <div class="h-full rounded-full transition-all duration-1000 ease-linear"
                   :class="barClass(item.expires)"
                   :style="{ width: getPercentage(item.expires, item.totalDuration) + '%' }">
              </div>
            </div>

            <span class="text-[10px] font-black uppercase tracking-wider font-mono flex-shrink-0 px-2 py-0.5 rounded border"
                  :class="badgeClass(item.expires)">
              {{ formatTimeRemaining(item.expires) }}
            </span>
          </div>
        </div>
      </section>

      <!-- Legend -->
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 border-t border-white/5">
        <span class="flex items-center gap-1.5 text-[10px] text-gray-600">
          <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> &lt; 1 giorno
        </span>
        <span class="flex items-center gap-1.5 text-[10px] text-gray-600">
          <span class="w-1.5 h-1.5 rounded-full bg-orange-400"></span> &lt; 10 giorni
        </span>
        <span class="flex items-center gap-1.5 text-[10px] text-gray-600">
          <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> Attivo
        </span>
        <span class="flex items-center gap-1.5 text-[10px] text-gray-600">
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Permanente
        </span>
        <span class="flex items-center gap-1.5 text-[10px] text-gray-600">
          <span class="w-1.5 h-1.5 rounded-full bg-red-500/50"></span> Scaduto
        </span>
      </div>

    </div>
  </div>
</template>
