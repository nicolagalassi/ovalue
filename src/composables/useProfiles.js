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

    // Importa i dati dal formato dell'OValue Exporter nel profilo attivo.
    // allData = { 'serverHostname': exporterData, ... }
    const importFromExporter = (allData) => {
        const profile = activeProfile.value;
        if (!profile || !allData || typeof allData !== 'object') return false;

        // Determina quale server usare per questo profilo
        let serverKey = profile.syncServer;
        if (!serverKey || !allData[serverKey]) {
            serverKey = Object.keys(allData)[0];
            if (!serverKey) return false;
            profile.syncServer = serverKey;
        }

        const raw = allData[serverKey];
        if (!raw) return false;

        // Aggiorna la lista dei server noti e persistila per la UI
        const serverList = Object.keys(allData);
        if (serverList.length > 0) {
            knownServers.value = serverList;
            localStorage.setItem('ovalue_known_servers', JSON.stringify(serverList));
        }

        // Officers e globalItems — aggiornati SEMPRE, anche con autoSync=false
        if (raw.officers) profile.expirations.officers = { ...raw.officers };
        if (Array.isArray(raw.globalItems)) profile.expirations.globalItems = [...raw.globalItems];

        // Se autoSync è disabilitato, non toccare i dati di produzione
        if (!profile.autoSync) {
            profile.lastSync = Date.now();
            saveProfiles();
            return true;
        }

        // Mappa classe giocatore
        const classMap = { 'Collezionista': 'collector', 'Generale': 'general', 'Esploratore': 'explorer' };
        if (raw.playerClass && raw.playerClass !== 'none') {
            profile.production.settings.playerClass = classMap[raw.playerClass] ?? profile.production.settings.playerClass;
        }
        if (raw.settings?.plasma != null) profile.production.settings.plasma = Number(raw.settings.plasma);
        if (raw.universeSpeed != null) profile.production.settings.ecoSpeed = Number(raw.universeSpeed);
        if (raw.lfBonuses?.metal) profile.production.settings.lfBonus = parseFloat(raw.lfBonuses.metal) || 0;

        // Mappa officer specifici nelle impostazioni di produzione
        if (raw.officers) {
            const geologo = raw.officers['Geologo'];
            if (geologo) profile.production.settings.geologist = geologo.active === true;
            const ORDER = ['Comandante', 'Ammiraglio', 'Ingegnere', 'Geologo', 'Tecnico'];
            const allFive = ORDER.every(n => raw.officers[n]?.active === true);
            if (ORDER.some(n => raw.officers[n] !== undefined)) {
                profile.production.settings.staff = allFive;
            }
        }

        // Importa pianeti
        if (Array.isArray(raw.planets) && raw.planets.length > 0) {
            profile.production.planets = raw.planets.map(p => ({
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
                lifeform: p.lifeform ?? 'humans',
                overload: p.overload ?? false
            }));
        }

        profile.lastSync = Date.now();
        saveProfiles();
        return true;
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
        toggleAutoSync,
        setSyncServer
    };
}
