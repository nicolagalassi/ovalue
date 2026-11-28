// Comportamento comune di finestre, cassetti e menu a tendina:
// - Esc chiude, ovunque si trovi il focus;
// - (lock) la pagina sotto non scorre finché sono aperti;
// - (trap) il focus entra nella finestra, Tab resta dentro, alla chiusura torna
//   all'elemento che l'aveva aperta.
import { watch, nextTick, onBeforeUnmount } from 'vue';

let openCount = 0;
const lock = () => { if (openCount++ === 0) document.body.style.overflow = 'hidden'; };
const unlock = () => { if (openCount > 0 && --openCount === 0) document.body.style.overflow = ''; };

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// La finestra aperta più di recente: i dialog sono teletrasportati in fondo al body
const topDialog = () => {
    const all = document.querySelectorAll('[role="dialog"]');
    return all.length ? all[all.length - 1] : null;
};

// openRef: ref booleano che indica se l'overlay è aperto
export function useOverlay(openRef, { lock: useLock = true, trap = true } = {}) {
    let active = false;
    let returnTo = null;

    const onKey = (e) => {
        if (e.key === 'Escape') { openRef.value = false; return; }
        if (!trap || e.key !== 'Tab') return;
        const dlg = topDialog();
        if (!dlg) return;
        const items = [...dlg.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (!dlg.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    const set = (open) => {
        if (open && !active) {
            active = true;
            returnTo = document.activeElement;
            if (useLock) lock();
            window.addEventListener('keydown', onKey);
            if (trap) nextTick(() => {
                const dlg = topDialog();
                (dlg?.querySelector('[autofocus]') || dlg?.querySelector(FOCUSABLE))?.focus();
            });
        } else if (!open && active) {
            active = false;
            if (useLock) unlock();
            window.removeEventListener('keydown', onKey);
            // Il focus torna dove era, se quell'elemento è ancora nella pagina
            if (returnTo && document.contains(returnTo) && typeof returnTo.focus === 'function') returnTo.focus();
            returnTo = null;
        }
    };
    watch(openRef, set, { immediate: true });
    onBeforeUnmount(() => set(false));
}
