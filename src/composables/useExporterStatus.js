// Stato dello script Exporter per l'interfaccia (navbar, banner, Home).
// - rilevato: l'exporter ha mandato un ping/evento (in questa pagina o in passato,
//   syncDiagnostics) oppure un profilo è già stato sincronizzato;
// - da aggiornare: la versione che comunica è più vecchia dell'ultima, letta in build
//   dall'@version dello userscript (__EXPORTER_LATEST__, vite.config.js). Se lo script
//   è rilevato ma non comunica la versione è anteriore alla 4.5.0: da aggiornare.
import { computed } from 'vue';
import { useSyncDiagnostics } from './syncDiagnostics';
import { useProfiles } from './useProfiles';

import { EXPORTER_LATEST, isOlderVersion } from './exporterVersion';

export function useExporterStatus() {
    const { exporterPing, exporterSeen } = useSyncDiagnostics();
    const { profiles } = useProfiles();
    const exporterDetected = computed(() =>
        !!exporterSeen.value || !!exporterPing.value ||
        (profiles.value || []).some(p => p && p.lastSync)
    );
    const exporterVersion = computed(() =>
        exporterSeen.value?.version || exporterPing.value?.version || null
    );
    const exporterOutdated = computed(() => {
        if (!exporterDetected.value || !EXPORTER_LATEST) return false;
        if (!exporterVersion.value) return true;
        return isOlderVersion(exporterVersion.value, EXPORTER_LATEST);
    });
    return { exporterDetected, exporterVersion, exporterOutdated, exporterLatest: EXPORTER_LATEST };
}
