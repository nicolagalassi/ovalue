import { ref, computed } from 'vue';
import { applyExportToProduction } from './exporterImport';
import { useToast } from './useToast';
import { useLanguage } from './useLanguage';
import { useSyncDiagnostics, exporterDataTime } from './syncDiagnostics';

// Global state shared across all instances of useProfiles
const profiles = ref([]);
const activeProfileId = ref('');
const knownServers = ref([]);
let syncListenerAttached = false;

// Server i cui dati in arrivo dall'exporter vengono ignorati: ci finiscono quando
// si elimina il profilo collegato, per non vederlo ricreato al sync successivo.
// Reattivo perché la Diagnostica lo mostra e permette di ricollegarli.
const BLOCKED_KEY = 'ovalue_blocked_servers';
const readBlocked = () => {
    try { return JSON.parse(localStorage.getItem(BLOCKED_KEY) || '[]'); } catch { return []; }
};
const blockedServers = ref(readBlocked());
const writeBlocked = (list) => {
    blockedServers.value = list;
    try { localStorage.setItem(BLOCKED_KEY, JSON.stringify(list)); } catch { /* quota */ }
};

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

export function useProfiles() {
    const { show: showToast } = useToast();
    const { t } = useLanguage();
    const { logSync, markExporterSeen } = useSyncDiagnostics();
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
                // Il tracker scadenze non esiste più: i suoi dati non servono
                delete p.expirations;
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
            try {
                const parsed = JSON.parse(pending);
                importFromExporter(parsed, 'load');
            } catch (err) {
                logSync('load', [{ outcome: 'error', error: `Parsing dati in attesa all'avvio fallito: ${err?.message || err}` }]);
            }
            localStorage.removeItem('ovalue_exporter_pending');
        }

        // Sync live: con OValue già aperto, l'exporter (scheda ovalue.net) rilancia
        // l'evento ogni volta che la scheda di OGame salva dati nuovi.
        if (!syncListenerAttached) {
            syncListenerAttached = true;
            window.addEventListener('ovalue-exporter-sync', (e) => {
                let data = null;
                const rawPending = localStorage.getItem('ovalue_exporter_pending');
                if (rawPending) {
                    try {
                        data = JSON.parse(rawPending);
                    } catch (err) {
                        logSync('live', [{ outcome: 'error', error: `Parsing ovalue_exporter_pending fallito: ${err?.message || err}` }]);
                    }
                }
                if (!data && e && e.detail) {
                    try {
                        data = typeof e.detail === 'string' ? JSON.parse(e.detail) : e.detail;
                    } catch (err) {
                        logSync('live', [{ outcome: 'error', error: `Parsing event.detail fallito: ${err?.message || err}` }]);
                    }
                }
                localStorage.removeItem('ovalue_exporter_pending');
                if (data) {
                    try {
                        if (importFromExporter(data, 'live')) {
                            showToast(t('msg_exporter_synced'), 'success');
                        }
                    } catch (err) {
                        logSync('live', [{ outcome: 'error', error: `Crash durante importFromExporter: ${err?.message || err}` }]);
                    }
                } else {
                    logSync('live', [{ outcome: 'error', error: 'Evento sync ricevuto ma nessun dato trovato nel payload' }]);
                }
            });
        }
    };

    const initNewProfiles = () => {
        const defProfile = {
            id: 'p' + Date.now(),
            name: 'Default',
            playerName: '',
            production: createDefaultProduction(),
            packExchange: createDefaultPackExchange(),
            shoppingList: createDefaultShoppingList(),
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
            playerName: '',
            production: createDefaultProduction(),
            packExchange: createDefaultPackExchange(),
            shoppingList: createDefaultShoppingList(),
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
            const syncServer = profiles.value[idx].syncServer;
            profiles.value.splice(idx, 1);
            if (activeProfileId.value === id) {
                activeProfileId.value = profiles.value[0].id;
            }
            if (syncServer) {
                const blocked = readBlocked();
                if (!blocked.includes(syncServer)) writeBlocked([...blocked, syncServer]);
                localStorage.removeItem('ovalue_exporter_pending');
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
    const importFromExporter = (allData, source = 'load') => {
        if (!allData || typeof allData !== 'object' || Array.isArray(allData)) {
            logSync(source, [{ outcome: 'error', error: 'Dati ricevuti non validi o formato non supportato' }]);
            return false;
        }
        const results = [];   // esito per server, per la diagnostica

        const blocked = readBlocked();
        blockedServers.value = blocked;

        // Aggiorna lista server noti
        const serverList = Object.keys(allData);
        if (serverList.length > 0) {
            knownServers.value = serverList;
            localStorage.setItem('ovalue_known_servers', JSON.stringify(serverList));
        }

        let didImport = false;

        for (const [serverKey, raw] of Object.entries(allData)) {
            if (!raw) { results.push({ server: serverKey, outcome: 'empty' }); continue; }
            const diag = { server: serverKey, version: raw._exporterVersion || null, dataAt: exporterDataTime(raw) };

            try {
                // Trova o crea automaticamente un profilo per questo server
                if (blocked.includes(serverKey)) { results.push({ ...diag, outcome: 'blocked' }); continue; }
                let profile = profiles.value.find(p => p.syncServer === serverKey);
                if (!profile) {
                    const universeName = raw.universeName || serverKey.split('.')[0];
                    const newP = {
                        id: 'p' + Date.now() + Math.random().toString(36).slice(2, 5),
                        name: universeName,
                        playerName: raw.playerName || '',
                        production: createDefaultProduction(),
                        packExchange: createDefaultPackExchange(),
                        shoppingList: createDefaultShoppingList(),
                        autoSync: true,
                        lastSync: null,
                        syncServer: serverKey
                    };
                    profiles.value.push(newP);
                    profile = newP;
                    // Switcha automaticamente al profilo appena creato
                    activeProfileId.value = profile.id;
                    diag.created = true;
                }

                // Sync disattivato: non si importa e non si tocca lastSync (prima veniva
                // aggiornato e il profilo sembrava sincronizzato anche senza dati nuovi)
                if (!profile.autoSync) {
                    results.push({ ...diag, profile: profile.name, outcome: 'autosync_off' });
                    continue;
                }

                // Impostazioni di produzione, pianeti e produzione giornaliera
                applyExportToProduction(profile.production, raw);

                if (raw.playerName) profile.playerName = raw.playerName;
                profile.lastSync = Date.now();
                profile.syncDataAt = diag.dataAt;   // quando l'exporter ha raccolto i dati nel gioco
                results.push({ ...diag, profile: profile.name, outcome: diag.created ? 'created' : 'imported',
                               planets: profile.production.planets?.length ?? 0, daily: profile.production.daily });
                didImport = true;
            } catch (err) {
                results.push({
                    ...diag,
                    outcome: 'error',
                    error: err?.message || String(err)
                });
            }
        }

        markExporterSeen(Object.values(allData).find(r => r?._exporterVersion)?._exporterVersion);
        logSync(source, results);
        if (didImport) saveProfiles();
        return didImport;
    };

    // Importa dati grezzi OGame direttamente nel profilo attivo (import manuale da textarea).
    // Accetta lo stesso formato JSON prodotto dall'Exporter senza richiedere il wrapper server.
    const importManual = (rawData) => {
        const profile = activeProfile.value;
        if (!profile || !rawData || typeof rawData !== 'object') return false;

        applyExportToProduction(profile.production, rawData);

        if (rawData.playerName) profile.playerName = rawData.playerName;
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

    const unblockServer = (serverHostname) => {
        const blocked = readBlocked();
        if (blocked.includes(serverHostname)) writeBlocked(blocked.filter(s => s !== serverHostname));
    };

    const setSyncServer = (serverHostname) => {
        const profile = activeProfile.value;
        if (!profile) return;
        profile.syncServer = serverHostname;
        if (serverHostname) unblockServer(serverHostname);
        saveProfiles();
    };

    // Ricollega un server bloccato (o comunque in arrivo dall'exporter) a un profilo
    // GIÀ esistente, invece di farne creare uno nuovo. Caso tipico: si è eliminato il
    // profilo del server e ne resta un altro (es. "Default") su cui si vogliono i dati.
    // - nessun altro profilo resta agganciato allo stesso server (il match è il primo trovato);
    // - l'auto-sync viene attivato: collegare un server significa volerne i dati, e
    //   con l'auto-sync spento l'import verrebbe di nuovo ignorato.
    const linkServerToProfile = (serverHostname, profileId) => {
        const target = profiles.value.find(p => p.id === profileId);
        if (!target || !serverHostname) return false;
        profiles.value.forEach(p => {
            if (p.id !== profileId && p.syncServer === serverHostname) p.syncServer = null;
        });
        target.syncServer = serverHostname;
        target.autoSync = true;
        unblockServer(serverHostname);
        activeProfileId.value = target.id;
        saveProfiles();
        return true;
    };

    const setPlayerName = (name) => {
        const profile = activeProfile.value;
        if (!profile) return;
        profile.playerName = name;
        saveProfiles();
    };

    return {
        profiles,
        activeProfileId,
        activeProfile,
        knownServers,
        blockedServers,
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
        setSyncServer,
        linkServerToProfile,
        setPlayerName
    };
}
