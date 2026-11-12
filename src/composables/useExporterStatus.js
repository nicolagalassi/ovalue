// Stato "lo script Exporter c'è?" per l'interfaccia (navbar, banner, Home).
// Rilevato se: l'exporter ha mandato un ping/evento in questa pagina o in passato
// (syncDiagnostics), oppure un profilo è già stato sincronizzato almeno una volta.
import { computed } from 'vue';
import { useSyncDiagnostics } from './syncDiagnostics';
import { useProfiles } from './useProfiles';

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
    return { exporterDetected, exporterVersion };
}
