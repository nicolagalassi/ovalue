// Versione dello script Exporter: modulo puro (niente Vue, niente localStorage),
// usato da useExporterStatus e dai test.

/* global __EXPORTER_LATEST__ */
export const EXPORTER_LATEST = typeof __EXPORTER_LATEST__ !== 'undefined' ? __EXPORTER_LATEST__ : null;

// true se la versione `a` è più vecchia di `b` ("4.5.4" < "4.6.0"). Parti mancanti = 0.
export const isOlderVersion = (a, b) => {
    const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
    const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const x = pa[i] || 0, y = pb[i] || 0;
        if (x !== y) return x < y;
    }
    return false;
};
