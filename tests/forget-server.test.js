// Eliminazione dei dati di un universo bloccato: il giro attraversa due codici.
// L'app scrive la richiesta, l'exporter (userscript) cancella i dati dallo storage di
// Tampermonkey e risponde col ping; solo allora l'app sblocca il server.
// Qui gira il VERO codice di entrambi: la sezione BRIDGE MODE dello userscript con
// le API GM_* simulate, e useProfiles dell'app.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { userscriptPath } from './helpers';

// Browser minimo condiviso: localStorage e window con eventi
const store = new Map();
globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
};
const win = new EventTarget();
win.location = { hostname: 'ovalue.net', reload() {} };
globalThis.window = win;
globalThis.CustomEvent ??= class extends Event { constructor(t, o) { super(t); this.detail = o?.detail; } };

// Storage di Tampermonkey simulato
const gm = new Map();
const GM = {
    GM_getValue: (k, def) => (gm.has(k) ? structuredClone(gm.get(k)) : def),
    GM_setValue: (k, v) => gm.set(k, structuredClone(v)),
    GM_deleteValue: (k) => gm.delete(k),
    GM_addValueChangeListener: () => {},
    GM_info: { script: { version: '4.5.2' } }
};

// Esegue la sezione BRIDGE MODE come all'apertura di ovalue.net
const runExporterOnOValue = () => {
    const src = readFileSync(userscriptPath, 'utf8');
    const start = src.indexOf('// ── BRIDGE MODE');
    const end = src.indexOf('// ── LINGUA', start);
    if (start < 0 || end < 0) throw new Error('Marcatori BRIDGE MODE / LINGUA non trovati nello userscript');
    const fn = new Function(...Object.keys(GM), src.slice(start, end));
    fn(...Object.values(GM));
};

const SRV = (n) => `s${n}-it.ogame.gameforge.com`;
const exportData = (n) => ({ universeName: `U${n}`, planets: [{ id: 1, name: 'P', pos: 8, metal: 30, crystal: 25, deuterium: 20 }] });

describe('eliminazione dati di un server bloccato (app ↔ exporter)', () => {
    let api;

    beforeAll(async () => {
        const { useProfiles } = await import('../src/composables/useProfiles');
        api = useProfiles();
        // Situazione dello screenshot: 3 universi vecchi bloccati + quello che si gioca
        [279, 254, 278, 269].forEach(n => gm.set('ovalue_data_' + SRV(n), exportData(n)));
        gm.set('ovalue_servers', [279, 254, 278, 269].map(SRV));
        localStorage.setItem('ovalue_blocked_servers', JSON.stringify([279, 254, 278].map(SRV)));
        api.loadProfiles();
        runExporterOnOValue();   // apertura normale di OValue
    });

    it('i server bloccati restano bloccati finché l\'exporter non conferma', () => {
        api.forgetServers([SRV(279), SRV(254)]);
        // Nessun exporter ha ancora evaso la richiesta: niente si sblocca
        expect(api.blockedServers.value).toEqual([279, 254, 278].map(SRV));
        expect(Object.keys(api.forgetPending.value).sort()).toEqual([SRV(254), SRV(279)]);
    });

    it('l\'exporter cancella i dati e col ping l\'app sblocca e dimentica i server', async () => {
        await new Promise(r => setTimeout(r, 5));   // il ping deve essere successivo alla richiesta
        runExporterOnOValue();                          // l'exporter evade le richieste in sospeso
        await new Promise(r => setTimeout(r, 0));      // il watch di Vue sul ping è asincrono
        expect(gm.has('ovalue_data_' + SRV(279))).toBe(false);
        expect(gm.has('ovalue_data_' + SRV(254))).toBe(false);
        expect(gm.get('ovalue_servers')).toEqual([278, 269].map(SRV));
        // Dati degli altri universi intatti
        expect(gm.has('ovalue_data_' + SRV(278))).toBe(true);
        expect(gm.has('ovalue_data_' + SRV(269))).toBe(true);

        expect(api.blockedServers.value).toEqual([SRV(278)]);
        expect(api.forgetPending.value).toEqual({});
        expect(api.knownServers.value).not.toContain(SRV(279));
        // Nessun profilo ricreato per i server eliminati
        expect(api.profiles.value.some(p => [SRV(279), SRV(254)].includes(p.syncServer))).toBe(false);
    });

    it('ignora richieste che non sono hostname di OGame', async () => {
        localStorage.setItem('ovalue_exporter_forget', JSON.stringify(['ovalue_servers', '../x', SRV(278)]));
        await new Promise(r => setTimeout(r, 5));
        runExporterOnOValue();
        expect(gm.get('ovalue_servers')).toEqual([SRV(269)]);
        expect(gm.has('ovalue_data_' + SRV(269))).toBe(true);
    });
});
