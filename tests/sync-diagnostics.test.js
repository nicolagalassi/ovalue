import { describe, it, expect, beforeEach } from 'vitest';
import { useSyncDiagnostics, generateDiagnosticReport } from '../src/composables/syncDiagnostics';

describe('syncDiagnostics', () => {
    const store = new Map();
    globalThis.localStorage = {
        getItem: (k) => store.get(k) || null,
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
        clear: () => store.clear()
    };

    beforeEach(() => {
        localStorage.clear();
        const { clearSyncLog } = useSyncDiagnostics();
        clearSyncLog();
    });

    it('records sync events and captures error outcomes', () => {
        const { syncLog, logSync } = useSyncDiagnostics();

        logSync('live', [
            { server: 's199-it.ogame.gameforge.com', outcome: 'imported', planets: 10, daily: 1000000 },
            { server: 's200-it.ogame.gameforge.com', outcome: 'error', error: 'Dati pianeti non validi' }
        ]);

        expect(syncLog.value.length).toBe(1);
        expect(syncLog.value[0].results.length).toBe(2);
        expect(syncLog.value[0].results[1].outcome).toBe('error');
        expect(syncLog.value[0].results[1].error).toBe('Dati pianeti non validi');
    });

    it('generates a readable diagnostic report', () => {
        const { logSync } = useSyncDiagnostics();
        logSync('load', [
            { server: 's199-it.ogame.gameforge.com', outcome: 'error', error: 'Parsing fallito' }
        ]);

        const report = generateDiagnosticReport({
            profiles: [
                { id: 'p1', name: 'Vega', syncServer: 's199-it.ogame.gameforge.com', autoSync: true, lastSync: Date.now() }
            ],
            activeProfileId: 'p1',
            blockedServers: [],
            knownServers: ['s199-it.ogame.gameforge.com']
        });

        expect(report).toContain('=== OVALUE REPORT DIAGNOSTICA SYNC ===');
        expect(report).toContain('Vega');
        expect(report).toContain('ERRORE -> Parsing fallito');
    });
});
