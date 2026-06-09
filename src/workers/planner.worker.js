import { runPlanner } from '../composables/useStrategy';

// Il planner gira qui per non bloccare mai il main thread.
// Messaggi in uscita:
//   { type: 'progress', progress } — periodico, per la barra di avanzamento
//   { type: 'done', result }       — risultato finale
//   { type: 'error', error }
self.onmessage = ({ data }) => {
    try {
        const result = runPlanner(data.initialState, {
            ...data.options,
            onProgress: (progress) => self.postMessage({ type: 'progress', progress })
        });
        self.postMessage({ type: 'done', result });
    } catch (err) {
        self.postMessage({ type: 'error', error: err.message });
    }
};
