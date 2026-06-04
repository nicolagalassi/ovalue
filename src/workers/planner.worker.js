import { runPlanner } from '../composables/useStrategy';

self.onmessage = ({ data }) => {
    try {
        const result = runPlanner(data.initialState, data.options);
        self.postMessage({ ok: true, result });
    } catch (err) {
        self.postMessage({ ok: false, error: err.message });
    }
};
