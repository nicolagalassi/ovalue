// Diagnostica della sincronizzazione con l'OValue Exporter.
// Tiene un piccolo log locale (localStorage) di cosa è arrivato dall'exporter e
// cosa ne ha fatto OValue, server per server, così chi ha problemi può vederlo
// nelle Impostazioni e copiarlo. Nessun dato lascia il browser.
import { ref } from 'vue';

const LOG_KEY = 'ovalue_sync_log';
const LOG_MAX = 30;
// Oltre questa età i dati raccolti nel gioco si considerano vecchi (spia ambra)
export const STALE_DATA_MS = 24 * 60 * 60 * 1000;

const readLog = () => {
    try { return JSON.parse(localStorage.getItem(LOG_KEY)) || []; } catch { return []; }
};

const syncLog = ref(readLog());
// Exporter visto in questa pagina (evento o dati in attesa al caricamento)
const exporterSeen = ref(null);   // { at, version }

// Esiti possibili per un server: vedi i18n diag_outcome_*
//   imported | created | blocked | autosync_off | empty
const logSync = (source, results) => {
    const entry = { at: Date.now(), source, results };
    syncLog.value = [entry, ...syncLog.value].slice(0, LOG_MAX);
    try { localStorage.setItem(LOG_KEY, JSON.stringify(syncLog.value)); } catch { /* quota */ }
};

const markExporterSeen = (version) => {
    exporterSeen.value = { at: Date.now(), version: version || null };
};

const clearSyncLog = () => {
    syncLog.value = [];
    try { localStorage.removeItem(LOG_KEY); } catch { /* */ }
};

// Momento in cui l'exporter ha raccolto i dati nel gioco (exporter ≥4.5.0 lo invia;
// per le versioni precedenti si ripiega sull'ultima lettura dell'API impero).
export const exporterDataTime = (raw) =>
    Number(raw?._savedAt) || Number(raw?._lastEmpireAPIFetch) || null;

export function useSyncDiagnostics() {
    return { syncLog, exporterSeen, logSync, markExporterSeen, clearSyncLog };
}
