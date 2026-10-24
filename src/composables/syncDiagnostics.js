// Diagnostica della sincronizzazione con l'OValue Exporter.
// Tiene un piccolo log locale (localStorage) di cosa è arrivato dall'exporter e
// cosa ne ha fatto OValue, server per server, così chi ha problemi può vederlo
// nelle Impostazioni e copiarlo. Nessun dato lascia il browser.
import { ref } from 'vue';

const LOG_KEY = 'ovalue_sync_log';
const PING_KEY = 'ovalue_exporter_ping';
const LOG_MAX = 30;
// Oltre questa età i dati raccolti nel gioco si considerano vecchi (spia ambra)
export const STALE_DATA_MS = 24 * 60 * 60 * 1000;

const readLog = () => {
    try { return JSON.parse(localStorage.getItem(LOG_KEY)) || []; } catch { return []; }
};

const readPing = () => {
    try { return JSON.parse(localStorage.getItem(PING_KEY)) || null; } catch { return null; }
};

const syncLog = ref(readLog());
const exporterPing = ref(readPing());
// Exporter visto in questa pagina (evento o dati in attesa al caricamento)
const exporterSeen = ref(null);   // { at, version }

if (typeof window !== 'undefined') {
    window.addEventListener('ovalue-exporter-ping', (e) => {
        if (e && e.detail) {
            exporterPing.value = e.detail;
            markExporterSeen(e.detail.version);
        }
    });
}

// Esiti possibili per un server:
//   imported | created | blocked | autosync_off | empty | error
//
// Ogni apertura di ovalue.net produce un sync. Senza compressione 30 refresh
// identici spingerebbero fuori dal registro l'errore che serve diagnosticare;
// quindi un evento con lo stesso esito del precedente (stessi server, stessi esiti,
// stessi errori) aggiorna la voce in cima invece di aggiungerne una: `count` dice
// quante volte si è ripetuto, `firstAt` da quando.
const signature = (results) => (results || [])
    .map(r => `${r.server || ''}|${r.outcome || ''}|${r.error || ''}`)
    .sort()
    .join(';');

const logSync = (source, results) => {
    const now = Date.now();
    const top = syncLog.value[0];
    if (top && signature(top.results) === signature(results)) {
        const merged = {
            ...top,
            at: now,
            source,
            results,                                   // dettagli più recenti (pianeti, produzione)
            firstAt: top.firstAt || top.at,
            count: (top.count || 1) + 1
        };
        syncLog.value = [merged, ...syncLog.value.slice(1)];
    } else {
        syncLog.value = [{ at: now, source, results }, ...syncLog.value].slice(0, LOG_MAX);
    }
    try { localStorage.setItem(LOG_KEY, JSON.stringify(syncLog.value)); } catch { /* quota: il log è accessorio */ }
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

// Genera un report testuale completo da copiare e incollare per il supporto
export const generateDiagnosticReport = ({ profiles = [], activeProfileId = '', blockedServers = [], knownServers = [] } = {}) => {
    const now = new Date().toISOString();
    const lines = [
        '=== OVALUE REPORT DIAGNOSTICA SYNC ===',
        `Data/Ora ISO: ${now}`,
        `Data/Ora locale: ${new Date().toLocaleString()}`,
        `URL: ${typeof window !== 'undefined' ? window.location.href : 'n/a'}`,
        `User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a'}`,
        '',
        '--- STATO EXPORTER ---'
    ];

    const ping = exporterPing.value;
    const seen = exporterSeen.value;
    if (ping) {
        lines.push(`Rilevato: SI (ping attivo v${ping.version || 'sconosciuta'})`);
        lines.push(`Ultimo ping: ${new Date(ping.at).toLocaleTimeString()}`);
        lines.push(`Universi in Tampermonkey (${ping.serversCount ?? 0}): ${(ping.servers || []).join(', ') || 'Nessuno'}`);
    } else if (seen) {
        lines.push(`Rilevato: SI (visto durante il caricamento v${seen.version || 'sconosciuta'})`);
        lines.push(`Visto alle: ${new Date(seen.at).toLocaleTimeString()}`);
    } else {
        lines.push('Rilevato: NO (nessun segnale dallo userscript in questa pagina)');
        lines.push('Nota: assicurati che Tampermonkey sia attivo e che lo script sia abilitato su questo dominio.');
    }

    lines.push('');
    lines.push(`--- SERVER NOTI (${knownServers.length}) ---`);
    lines.push(knownServers.join(', ') || 'Nessuno');

    lines.push('');
    lines.push(`--- SERVER BLOCCATI (${blockedServers.length}) ---`);
    lines.push(blockedServers.join(', ') || 'Nessuno');

    lines.push('');
    lines.push(`--- PROFILI OVALUE (${profiles.length}) ---`);
    if (profiles.length === 0) {
        lines.push('Nessun profilo presente');
    } else {
        profiles.forEach(p => {
            const isActive = p.id === activeProfileId ? '[ATTIVO] ' : '';
            const lastSyncStr = p.lastSync ? new Date(p.lastSync).toLocaleString() : 'Mai';
            const dataAtStr = p.syncDataAt ? new Date(p.syncDataAt).toLocaleString() : 'N/D';
            const planetsCount = p.production?.planets?.length ?? 0;
            lines.push(`* ${isActive}"${p.name}" (ID: ${p.id})`);
            lines.push(`  Server: ${p.syncServer || 'Nessuno'} | AutoSync: ${p.autoSync ? 'ATTIVO' : 'DISATTIVATO'}`);
            lines.push(`  Ultimo sync: ${lastSyncStr} | Dati gioco raccolti il: ${dataAtStr}`);
            lines.push(`  Pianeti: ${planetsCount} | Metallo giornaliero: ${p.production?.daily ?? 0}`);
        });
    }

    lines.push('');
    lines.push(`--- REGISTRO EVENTI SYNC (ultimi ${syncLog.value.length}) ---`);
    if (syncLog.value.length === 0) {
        lines.push('Nessun evento registrato.');
    } else {
        syncLog.value.slice(0, 15).forEach((entry, i) => {
            const timeStr = new Date(entry.at).toLocaleString();
            const rep = entry.count > 1
                ? ` ×${entry.count} dal ${new Date(entry.firstAt).toLocaleString()}`
                : '';
            lines.push(`[${i + 1}] ${timeStr}${rep} (Origine: ${entry.source || 'sconosciuta'})`);
            (entry.results || []).forEach(r => {
                if (r.outcome === 'error') {
                    lines.push(`    - ${r.server || 'Globale'}: ERRORE -> ${r.error || 'Errore sconosciuto'}`);
                } else if (r.outcome === 'imported' || r.outcome === 'created') {
                    lines.push(`    - ${r.server}: ${r.outcome.toUpperCase()} -> Profilo "${r.profile}", ${r.planets} pianeti, prod: ${r.daily}`);
                } else {
                    lines.push(`    - ${r.server || 'Server'}: ${r.outcome?.toUpperCase()} ${r.profile ? `(Profilo "${r.profile}")` : ''}`);
                }
            });
        });
    }

    lines.push('=== FINE REPORT ===');
    return lines.join('\n');
};

export function useSyncDiagnostics() {
    return {
        syncLog,
        exporterPing,
        exporterSeen,
        logSync,
        markExporterSeen,
        clearSyncLog,
        generateDiagnosticReport
    };
}
