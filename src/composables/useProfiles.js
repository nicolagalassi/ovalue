import { ref, computed } from 'vue';

// Global state shared across all instances of useProfiles
const profiles = ref([]);
const activeProfileId = ref('');

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

export function useProfiles() {
    const activeProfile = computed(() => profiles.value.find(p => p.id === activeProfileId.value));

    const loadProfiles = () => {
        const savedProfiles = localStorage.getItem('ovalue_global_profiles');
        const savedActiveId = localStorage.getItem('ovalue_global_active_id');

        if (savedProfiles) {
            profiles.value = JSON.parse(savedProfiles);
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
                        packExchange: createDefaultPackExchange()
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
    };

    const initNewProfiles = () => {
        const defProfile = {
            id: 'p' + Date.now(),
            name: 'Default',
            production: createDefaultProduction(),
            packExchange: createDefaultPackExchange()
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
            packExchange: createDefaultPackExchange()
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

    return {
        profiles,
        activeProfileId,
        activeProfile,
        loadProfiles,
        saveProfiles,
        createProfile,
        renameProfile,
        deleteProfile,
        switchProfile,
        exportProfiles,
        importProfiles
    };
}
