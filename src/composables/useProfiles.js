import { ref, computed } from 'vue';

// Global state shared across all instances of useProfiles
const profiles = ref([]);
const activeProfileId = ref('');
const knownServers = ref([]);
let syncListenerAttached = false;

// Helper to create a default production data object
const createDefaultProduction = () => ({
    settings: {
        ecoSpeed: 8,
        playerClass: 'collector',
        rocktalEnhancement: 0,
        allyClass: 'none',
        plasma: 0,
        geologist: false,
        staff: false,
        lfBonus: 0
    },
    planets: []
});

// Helper to create a default pack exchange data object
const createDefaultPackExchange = () => ({
    settings: {
        rateMet: 3,
        rateCry: 2,
        rateDeut: 1,
        packValue: 300000000,
        shopDiscount: 0,
        moBonus: 0,
        paymentBonus: true,
        smartRounding: false,
        bldCostRdc: 0,
        lfRsrLabLevel: 0,
        minLevel: 0
    },
    stock: { metal: 0, crystal: 0, deuterium: 0 },
    queue: []
});

// Helper to create a default shopping list data object
const createDefaultShoppingList = () => ({
    cart: [],
    activeEvent: 'none'
});

// Helper to create a default expirations data object
const createDefaultExpirations = () => ({
    officers: {},
    globalItems: []
});

// Calcola la produzione giornaliera di metallo dato un profilo production completo.
// Replica la stessa formula di MetalCalc.vue per aggiornare production.daily al momento dell'import.
const calcDailyProduction = (settings, planets) => {
    if (!Array.isArray(planets) || planets.length === 0) return 0;
    const collFactor = 1 + ((settings.rocktalEnhancement || 0) / 100);
    const ecoSpeed = settings.ecoSpeed || 1;
    let hourly = 0;
    planets.forEach(p => {
        const met = parseInt(p.metal) || 0;
        const pos = parseInt(p.pos) || 8;
        let posMult = 1.0;
        if (pos === 8) posMult = 1.35;
        else if (pos === 7 || pos === 9) posMult = 1.23;
        else if (pos === 6 || pos === 10) posMult = 1.17;
        const natProd  = Math.floor(30 * ecoSpeed * posMult);
        const mineBase = met <= 0 ? 0 : Math.floor(30 * ecoSpeed * posMult * met * Math.pow(1.1, met));
        let totPerc = (settings.plasma || 0) * 1;
        if (settings.geologist) totPerc += 10;
        if (settings.staff)     totPerc += 2;
        if (settings.playerClass === 'collector') totPerc += 25 * collFactor;
        if (settings.allyClass  === 'trader')     totPerc += 5;
        totPerc += (parseInt(p.item) || 0) + (parseInt(p.itemCustom) || 0);
        if (p.lifeform === 'rocktal') totPerc += (parseInt(p.magma) || 0) * 2;
        else if (p.lifeform === 'humans') totPerc += (parseInt(p.human) || 0) * 1.5;
        totPerc += settings.lfBonus || 0;
        const isCollector = settings.playerClass === 'collector';
        const mineSum = met + (parseInt(p.crystal) || 0) + (parseInt(p.deuterium) || 0);
        let maxCraw = mineSum * 8;
        if (isCollector && settings.geologist)
            maxCraw = Math.floor(maxCraw * (1 + 0.1 * collFactor));
        const actCraw = Math.min(parseInt(p.crawlers) || 0, maxCraw);
        if (actCraw > 0) {
            let mult = 0.02;
            if (isCollector) {
                mult *= (1 + (50 * collFactor) / 100);
                if (p.overload) mult *= 1.5;
            }
            totPerc += Math.min(actCraw * mult, 50);
        }
        hourly += natProd + mineBase + Math.floor(mineBase * (totPerc / 100));
    });
    return Math.floor(hourly * 24);
};

// Converte le stringhe di durata OGame in Unix timestamp ms.
// OGame IT usa: s=settimane (se prima di g/o/m) o secondi (se dopo), g=giorni, o=ore, m=minuti.
// Restituisce null per valori permanenti/assenti.
const parseTimeRemainingToExpires = (timeRemaining) => {
    if (!timeRemaining) return null;
    const s = String(timeRemaining).trim();
    if (/^(permanente|permanent|∞|-|)$/i.test(s)) return null;

    let ms = 0;
    const tokens = [...s.matchAll(/(\d+)\s*([a-zA-Z]+)/g)];

    if (tokens.length > 0) {
        let seenSubWeek = false; // true dopo aver incontrato g/d/o/h/m
        for (const [, numStr, unit] of tokens) {
            const n = parseInt(numStr);
            const u = unit.toLowerCase();
            if (u === 'w' || u.startsWith('week') || u.startsWith('sett')) {
                // EN: w/week(s)  IT: sett(imane)
                ms += n * 604800000;
            } else if (u === 'd' || u === 'g' || u === 't' ||
                       u.startsWith('day') || u.startsWith('gior') ||
                       u === 'j' || u.startsWith('jour') || u.startsWith('tag')) {
                // EN: d/day(s)  IT: g/gior(ni)  FR: j/jour(s)  DE: t/Tag(e)
                seenSubWeek = true; ms += n * 86400000;
            } else if (u === 'o' || u === 'h' || u.startsWith('or') || u.startsWith('hour') ||
                       u.startsWith('std')) {
                // IT: o/or(e)  EN/FR/DE: h/hour(s)/Std.
                seenSubWeek = true; ms += n * 3600000;
            } else if (u === 'm' || u.startsWith('min')) {
                seenSubWeek = true; ms += n * 60000;
            } else if (u.startsWith('sec') || u.startsWith('sek')) {
                // EN: sec  DE: Sek.
                ms += n * 1000;
            } else if (u === 's') {
                // 's' ambiguo: dopo g/d/o/h/m → secondi; altrimenti → settimane (IT)
                if (seenSubWeek) ms += n * 1000;
                else             ms += n * 604800000;
            }
        }
    } else {
        const parts = s.match(/(\d+):(\d+)(?::(\d+))?/);
        if (parts) {
            ms += parseInt(parts[1]) * 3600000;
            ms += parseInt(parts[2]) * 60000;
            if (parts[3]) ms += parseInt(parts[3]) * 1000;
        }
    }

    return ms > 0 ? Date.now() + ms : null;
};

export function useProfiles() {
    const activeProfile = computed(() => profiles.value.find(p => p.id === activeProfileId.value));

    const loadProfiles = () => {
        const savedProfiles = localStorage.getItem('ovalue_global_profiles');
        const savedActiveId = localStorage.getItem('ovalue_global_active_id');

        // Load known servers list (populated by the exporter bridge)
        try {
            const savedServers = localStorage.getItem('ovalue_known_servers');
            if (savedServers) knownServers.value = JSON.parse(savedServers);
        } catch (e) {}

        if (savedProfiles) {
            profiles.value = JSON.parse(savedProfiles);

            // Migration for existing profiles
            profiles.value.forEach(p => {
                if (!p.production) p.production = createDefaultProduction();
                if (!p.packExchange) p.packExchange = createDefaultPackExchange();
                if (!p.shoppingList) p.shoppingList = createDefaultShoppingList();
                if (!p.expirations) p.expirations = createDefaultExpirations();
                // Sync fields migration
                if (p.autoSync === undefined) p.autoSync = true;
                if (p.lastSync === undefined) p.lastSync = null;
                if (p.syncServer === undefined) p.syncServer = null;
            });

            activeProfileId.value = savedActiveId || (profiles.value[0]?.id || '');
        } else {
            // Migration from old MetalCalc profiles
            const oldProfiles = localStorage.getItem('ovalue_production_profiles');
            const oldActiveId = localStorage.getItem('ovalue_production_active_id');

            if (oldProfiles) {
                try {
                    const parsed = JSON.parse(oldProfiles);
                    profiles.value = parsed.map(p => ({
                        id: p.id,
                        name: p.name,
                        production: p.data || createDefaultProduction(),
                        packExchange: createDefaultPackExchange(),
                        shoppingList: createDefaultShoppingList(),
                        expirations: createDefaultExpirations(),
                        autoSync: true,
                        lastSync: null,
                        syncServer: null
                    }));
                    activeProfileId.value = oldActiveId || (profiles.value[0]?.id || '');
                } catch (e) {
                    console.error("Migration failed", e);
                    initNewProfiles();
                }
            } else {
                initNewProfiles();
            }
            saveProfiles();
        }

        // Check for exporter data written by the userscript bridge on page load
        const pending = localStorage.getItem('ovalue_exporter_pending');
        if (pending) {
            try { importFromExporter(JSON.parse(pending)); } catch (e) {}
            localStorage.removeItem('ovalue_exporter_pending');
        }

        // Live sync: when user has OValue tab open while browsing OGame and comes back
        if (!syncListenerAttached) {
            syncListenerAttached = true;
            window.addEventListener('ovalue-exporter-sync', (e) => {
                importFromExporter(e.detail);
                localStorage.removeItem('ovalue_exporter_pending');
            });
        }
    };

    const initNewProfiles = () => {
        const defProfile = {
            id: 'p' + Date.now(),
            name: 'Default',
            production: createDefaultProduction(),
            packExchange: createDefaultPackExchange(),
            shoppingList: createDefaultShoppingList(),
            expirations: createDefaultExpirations(),
            autoSync: true,
            lastSync: null,
            syncServer: null
        };
        profiles.value = [defProfile];
        activeProfileId.value = defProfile.id;
    };

    const saveProfiles = () => {
        localStorage.setItem('ovalue_global_profiles', JSON.stringify(profiles.value));
        localStorage.setItem('ovalue_global_active_id', activeProfileId.value);
    };

    const createProfile = (name) => {
        const newP = {
            id: 'p' + Date.now(),
            name: name,
            production: createDefaultProduction(),
            packExchange: createDefaultPackExchange(),
            shoppingList: createDefaultShoppingList(),
            expirations: createDefaultExpirations(),
            autoSync: true,
            lastSync: null,
            syncServer: null
        };
        profiles.value.push(newP);
        activeProfileId.value = newP.id;
        saveProfiles();
    };

    const renameProfile = (id, newName) => {
        const p = profiles.value.find(p => p.id === id);
        if (p) {
            p.name = newName;
            saveProfiles();
        }
    };

    const deleteProfile = (id) => {
        if (profiles.value.length <= 1) return;
        const idx = profiles.value.findIndex(p => p.id === id);
        if (idx !== -1) {
            profiles.value.splice(idx, 1);
            if (activeProfileId.value === id) {
                activeProfileId.value = profiles.value[0].id;
            }
            saveProfiles();
        }
    };

    const exportProfiles = () => {
        const data = {
            version: '2.0',
            timestamp: Date.now(),
            profiles: profiles.value,
            activeId: activeProfileId.value
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ovalue_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const importProfiles = (jsonData) => {
        try {
            const data = JSON.parse(jsonData);
            if (data.profiles && Array.isArray(data.profiles)) {
                profiles.value = data.profiles;
                activeProfileId.value = data.activeId || data.profiles[0]?.id || '';
                saveProfiles();
                return true;
            }
            return false;
        } catch (e) {
            console.error("Import failed", e);
            return false;
        }
    };

    const switchProfile = (id) => {
        activeProfileId.value = id;
        saveProfiles();
    };

    // Importa i dati dall'OValue Exporter.
    // allData = { 'serverHostname': exporterData, ... }
    // Per ogni server trova o crea automaticamente un profilo dedicato.
    const importFromExporter = (allData) => {
        if (!allData || typeof allData !== 'object') return false;

        const lfMap = { 'Humans': 'humans', 'Rocktal': 'rocktal', 'Mechas': 'mecha', 'Kaelesh': 'mecha' };
        const classMap = {
            // vecchio formato IT (esportatore ≤3.2.x)
            'Collezionista': 'collector', 'Generale': 'other', 'Esploratore': 'other',
            // nuovo formato neutro (esportatore ≥3.3.0) + EN/DE/FR
            'collector': 'collector', 'general': 'other', 'explorer': 'other',
            'Collector': 'collector', 'General': 'other', 'Explorer': 'other',
            'Sammler': 'collector', 'Allgemein': 'other', 'Entdecker': 'other',
            'Collecteur': 'collector', 'Général': 'other', 'Explorateur': 'other'
        };

        // Aggiorna lista server noti
        const serverList = Object.keys(allData);
        if (serverList.length > 0) {
            knownServers.value = serverList;
            localStorage.setItem('ovalue_known_servers', JSON.stringify(serverList));
        }

        let didImport = false;

        for (const [serverKey, raw] of Object.entries(allData)) {
            if (!raw) continue;

            // Trova o crea automaticamente un profilo per questo server
            let profile = profiles.value.find(p => p.syncServer === serverKey);
            if (!profile) {
                const universeName = raw.universeName || serverKey.split('.')[0];
                const newP = {
                    id: 'p' + Date.now() + Math.random().toString(36).slice(2, 5),
                    name: universeName,
                    production: createDefaultProduction(),
                    packExchange: createDefaultPackExchange(),
                    shoppingList: createDefaultShoppingList(),
                    expirations: createDefaultExpirations(),
                    autoSync: true,
                    lastSync: null,
                    syncServer: serverKey
                };
                profiles.value.push(newP);
                profile = newP;
                // Switcha automaticamente al profilo appena creato
                activeProfileId.value = profile.id;
            }

            // Officers/globalItems — aggiornati sempre, anche con autoSync=false
            // Converte timeRemaining (stringa OGame) → expires (Unix timestamp ms)
            if (raw.officers) {
                const converted = {};
                for (const [name, off] of Object.entries(raw.officers)) {
                    converted[name] = {
                        active: off.active,
                        expires: off.active ? parseTimeRemainingToExpires(off.timeRemaining) : null
                    };
                }
                profile.expirations.officers = converted;
            }
            if (Array.isArray(raw.globalItems)) {
                profile.expirations.globalItems = raw.globalItems.map(item => ({
                    name: item.name,
                    expires: parseTimeRemainingToExpires(item.timeRemaining),
                    totalDuration: item.totalDuration ?? null
                }));
            }

            if (!profile.autoSync) {
                profile.lastSync = Date.now();
                didImport = true;
                continue;
            }

            // Importa impostazioni di produzione
            if (raw.playerClass && raw.playerClass !== 'none') {
                profile.production.settings.playerClass = classMap[raw.playerClass] ?? profile.production.settings.playerClass;
            }
            if (raw.settings?.plasma != null) profile.production.settings.plasma = Number(raw.settings.plasma);
            if (raw.universeSpeed != null) profile.production.settings.ecoSpeed = Number(raw.universeSpeed);
            if (raw.lfBonuses?.metal) profile.production.settings.lfBonus = parseFloat(String(raw.lfBonuses.metal).replace(',', '.')) || 0;

            // Officer → impostazioni produzione
            // Compatibile con vecchio formato IT (≤3.2.x) e nuovo formato CSS-class (≥3.3.0)
            if (raw.officers) {
                const geologo = raw.officers['geologist'] || raw.officers['Geologo'];
                if (geologo) profile.production.settings.geologist = geologo.active === true;
                // Vecchio: ['Comandante','Ammiraglio','Ingegnere','Geologo','Tecnico']
                const OLD = ['Comandante', 'Ammiraglio', 'Ingegnere', 'Geologo', 'Tecnico'];
                const NEW = ['commander', 'admiral', 'engineer', 'geologist', 'technocrat'];
                const useNew = NEW.some(n => raw.officers[n] !== undefined);
                const ORDER  = useNew ? NEW : OLD;
                const allFive = ORDER.every(n => raw.officers[n]?.active === true);
                if (ORDER.some(n => raw.officers[n] !== undefined)) {
                    profile.production.settings.staff = allFive;
                }
            }

            // Importa pianeti — lfMap[rawLf] ?? 'humans' gestisce anche 'none'/null
            if (Array.isArray(raw.planets) && raw.planets.length > 0) {
                profile.production.planets = raw.planets.map(p => {
                    const rawLf = p.lifeform || (raw.planetLifeforms?.[p.id]) || null;
                    const lifeform = lfMap[rawLf] ?? 'humans';
                    return {
                        name: p.name ?? '',
                        pos: p.pos ?? 8,
                        metal: p.metal ?? 0,
                        crystal: p.crystal ?? 0,
                        deuterium: p.deuterium ?? 0,
                        magma: p.magma ?? 0,
                        human: p.human ?? 0,
                        crawlers: p.crawlers ?? 0,
                        item: p.item ?? 0,
                        itemCustom: p.itemCustom ?? 0,
                        lifeform,
                        overload: p.overload ?? false
                    };
                });
            }

            profile.production.daily = calcDailyProduction(profile.production.settings, profile.production.planets);
            profile.lastSync = Date.now();
            didImport = true;
        }

        if (didImport) saveProfiles();
        return didImport;
    };

    // Importa dati grezzi OGame direttamente nel profilo attivo (import manuale da textarea).
    // Accetta lo stesso formato JSON prodotto dall'Exporter senza richiedere il wrapper server.
    const importManual = (rawData) => {
        const profile = activeProfile.value;
        if (!profile || !rawData || typeof rawData !== 'object') return false;

        const lfMap = { 'Humans': 'humans', 'Rocktal': 'rocktal', 'Mechas': 'mecha', 'Kaelesh': 'mecha' };
        const classMap = {
            // vecchio formato IT (esportatore ≤3.2.x)
            'Collezionista': 'collector', 'Generale': 'other', 'Esploratore': 'other',
            // nuovo formato neutro (esportatore ≥3.3.0) + EN/DE/FR
            'collector': 'collector', 'general': 'other', 'explorer': 'other',
            'Collector': 'collector', 'General': 'other', 'Explorer': 'other',
            'Sammler': 'collector', 'Allgemein': 'other', 'Entdecker': 'other',
            'Collecteur': 'collector', 'Général': 'other', 'Explorateur': 'other'
        };

        if (rawData.officers) {
            const converted = {};
            for (const [name, off] of Object.entries(rawData.officers)) {
                converted[name] = {
                    active: off.active,
                    expires: off.active ? parseTimeRemainingToExpires(off.timeRemaining) : null
                };
            }
            profile.expirations.officers = converted;
        }
        if (Array.isArray(rawData.globalItems)) {
            profile.expirations.globalItems = rawData.globalItems.map(item => ({
                name: item.name,
                expires: parseTimeRemainingToExpires(item.timeRemaining),
                totalDuration: item.totalDuration ?? null
            }));
        }

        if (rawData.playerClass && rawData.playerClass !== 'none') {
            profile.production.settings.playerClass = classMap[rawData.playerClass] ?? profile.production.settings.playerClass;
        }
        if (rawData.settings?.plasma != null) profile.production.settings.plasma = Number(rawData.settings.plasma);
        if (rawData.universeSpeed != null) profile.production.settings.ecoSpeed = Number(rawData.universeSpeed);
        if (rawData.lfBonuses?.metal) profile.production.settings.lfBonus = parseFloat(String(rawData.lfBonuses.metal).replace(',', '.')) || 0;

        if (rawData.officers) {
            const geologo = rawData.officers['Geologo'];
            if (geologo) profile.production.settings.geologist = geologo.active === true;
            const ORDER = ['Comandante', 'Ammiraglio', 'Ingegnere', 'Geologo', 'Tecnico'];
            const allFive = ORDER.every(n => rawData.officers[n]?.active === true);
            if (ORDER.some(n => rawData.officers[n] !== undefined)) {
                profile.production.settings.staff = allFive;
            }
        }

        if (Array.isArray(rawData.planets) && rawData.planets.length > 0) {
            profile.production.planets = rawData.planets.map(p => {
                const rawLf = p.lifeform || (rawData.planetLifeforms?.[p.id]) || null;
                const lifeform = lfMap[rawLf] ?? 'humans';
                return {
                    name: p.name ?? '',
                    pos: p.pos ?? 8,
                    metal: p.metal ?? 0,
                    crystal: p.crystal ?? 0,
                    deuterium: p.deuterium ?? 0,
                    magma: p.magma ?? 0,
                    human: p.human ?? 0,
                    crawlers: p.crawlers ?? 0,
                    item: p.item ?? 0,
                    itemCustom: p.itemCustom ?? 0,
                    lifeform,
                    overload: p.overload ?? false
                };
            });
        }

        profile.production.daily = calcDailyProduction(profile.production.settings, profile.production.planets);
        profile.lastSync = Date.now();
        saveProfiles();
        return true;
    };

    // Crea una copia del profilo con autoSync disabilitato (per modifiche manuali/stime)
    const duplicateProfile = (id) => {
        const source = profiles.value.find(p => p.id === id);
        if (!source) return;
        const copy = JSON.parse(JSON.stringify(source));
        copy.id = 'p' + Date.now();
        copy.name = source.name + ' (copia)';
        copy.autoSync = false;
        copy.syncServer = null;
        copy.lastSync = null;
        profiles.value.push(copy);
        activeProfileId.value = copy.id;
        saveProfiles();
    };

    const toggleAutoSync = () => {
        const profile = activeProfile.value;
        if (!profile) return;
        profile.autoSync = !profile.autoSync;
        saveProfiles();
    };

    const setSyncServer = (serverHostname) => {
        const profile = activeProfile.value;
        if (!profile) return;
        profile.syncServer = serverHostname;
        saveProfiles();
    };

    return {
        profiles,
        activeProfileId,
        activeProfile,
        knownServers,
        loadProfiles,
        saveProfiles,
        createProfile,
        renameProfile,
        deleteProfile,
        switchProfile,
        exportProfiles,
        importProfiles,
        importFromExporter,
        importManual,
        duplicateProfile,
        toggleAutoSync,
        setSyncServer
    };
}
