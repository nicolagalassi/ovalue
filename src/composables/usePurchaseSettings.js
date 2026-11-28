// Impostazioni d'acquisto condivise da Pack Exchange, Production Planner e Shopping List:
// risorse già possedute (stock), sconto shop sui pacchetti, bonus evento MO e bonus del
// metodo di pagamento. Vivono nel profilo (packExchange), così si inseriscono una volta
// sola e valgono in tutti gli strumenti.
import { computed } from 'vue';
import { useProfiles } from './useProfiles';

let saveTimer = null;

export function usePurchaseSettings() {
    const { activeProfile, saveProfiles } = useProfiles();
    const pe = () => activeProfile.value?.packExchange;
    const save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveProfiles, 400); };

    const setting = (key, fallback) => computed({
        get: () => pe()?.settings?.[key] ?? fallback,
        set: (v) => { if (!pe()) return; pe().settings = { ...pe().settings, [key]: v }; save(); },
    });

    const stock = computed({
        get: () => ({ metal: 0, crystal: 0, deuterium: 0, ...(pe()?.stock || {}) }),
        set: (v) => { if (!pe()) return; pe().stock = { metal: v.metal || 0, crystal: v.crystal || 0, deuterium: v.deuterium || 0 }; save(); },
    });

    return {
        stock,
        shopDiscount: setting('shopDiscount', 0),
        moBonus: setting('moBonus', 0),
        paymentBonus: setting('paymentBonus', true),
    };
}
