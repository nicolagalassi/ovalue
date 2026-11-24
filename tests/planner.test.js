// Invarianti del Production Planner sugli export reali.
import { describe, it, expect } from 'vitest';
import {
    runPlanner, buildInitialState, buildCandidates, simulateDailyProduction,
    simulateProductionScore, toMSU, isStepDoneInProfile, rewindPlanProgress, applyStepToState
} from '../src/composables/useStrategy';
import { profileFromFixture } from './helpers';

const OPTS = { includeMines: true, includePlasma: true, includeLf: true, includeLfResearch: true, caps: {} };

const collectorState = (name) => {
    const profile = profileFromFixture(name);
    const state = buildInitialState(profile, []);
    state.settings.playerClass = 'collector';
    return { profile, state };
};

describe('planner — modalità produzione', () => {
    const { state } = collectorState('amico');
    const P0 = simulateDailyProduction(state);
    const plan = runPlanner(state, { ...OPTS, target: Math.floor(P0 * 1.05), maxSteps: 400 });

    it('raggiunge il target', () => {
        expect(plan.reachedTarget).toBe(true);
        expect(plan.initialProd).toBe(P0);
        expect(plan.finalProd).toBeGreaterThanOrEqual(Math.floor(P0 * 1.05));
    });

    it('i Δ degli step coincidono con un ricalcolo da zero (valutazione incrementale esatta)', () => {
        const replay = JSON.parse(JSON.stringify(state));
        let prev = simulateDailyProduction(replay);
        for (const st of plan.steps) {
            applyStepToState(replay, st);
            const now = simulateDailyProduction(replay);
            expect(now - prev).toBe(st.deltaProd);
            prev = now;
        }
        expect(prev).toBe(plan.finalProd);
    });

    it('MSU totali = somma dei costi degli step', () => {
        const sum = plan.steps.reduce((a, st) => a + toMSU(st.cost, state.pack), 0);
        expect(sum).toBeCloseTo(plan.cumulativeMSU, 0);
    });
});

describe('planner — obiettivo di spesa', () => {
    const { state } = collectorState('nembus');
    const P0 = simulateDailyProduction(state);
    const goalMSU = 800 * P0;           // obiettivo da ~800 pacchetti
    const plan = runPlanner(state, { ...OPTS, goalMSU, maxSteps: 3000 });

    it('si ferma da solo nel punto ottimale', () => {
        expect(plan.stoppedReason).toBe('goal_optimal');
        const g = plan.goal;
        expect(g.investedPacks + g.goalPacks).toBeLessThanOrEqual(g.directPacks);
    });

    it('allo stop nessun upgrade fa più risparmiare pacchi (controverifica)', () => {
        const fin = JSON.parse(JSON.stringify(state));
        plan.steps.forEach(st => applyStepToState(fin, st));
        const P = simulateDailyProduction(fin);
        for (const c of buildCandidates(fin, OPTS)) {
            const bk = c.applyMut(fin);
            const d = simulateDailyProduction(fin) - P;
            c.revertMut(fin, bk);
            if (d <= 0) continue;
            const spent = toMSU(c.cost, fin.pack) / P;
            const saved = goalMSU / P - goalMSU / (P + d);
            expect(saved - spent).toBeLessThanOrEqual(1e-6);
        }
    });
});

describe('planner — avanzamento del piano', () => {
    const { profile, state } = collectorState('amico');
    const P0 = simulateDailyProduction(state);
    const plan = runPlanner(state, { ...OPTS, target: Math.floor(P0 * 1.03), maxSteps: 200 });
    const fingerprint = (prof, steps) => JSON.stringify(rewindPlanProgress(buildInitialState(prof, []), steps));

    // "Import" dopo aver fatto i primi step in gioco: si alzano i livelli nel profilo
    const after = JSON.parse(JSON.stringify(profile));
    const done = Math.min(10, plan.steps.length);
    plan.steps.slice(0, done).forEach(st => applyStepToState(after.production, st));

    it('riconosce come fatti esattamente gli step applicati', () => {
        const flags = plan.steps.map(st => isStepDoneInProfile(st, after.production));
        expect(flags.slice(0, done).every(Boolean)).toBe(true);
        expect(flags.slice(done).some(Boolean)).toBe(false);
    });

    it('funziona anche con i pianeti in ordine diverso (abbinamento per nome)', () => {
        const shuffled = JSON.parse(JSON.stringify(after));
        shuffled.production.planets.reverse();
        expect(plan.steps.filter(st => isStepDoneInProfile(st, shuffled.production)).length).toBe(done);
    });

    it('l\'avanzamento del piano non conta come "dati cambiati"', () => {
        expect(fingerprint(after, plan.steps)).toBe(fingerprint(profile, null));
    });

    it('un cambiamento estraneo al piano sì', () => {
        const other = JSON.parse(JSON.stringify(after));
        other.production.planets[0].item = 10;
        expect(fingerprint(other, plan.steps)).not.toBe(fingerprint(profile, null));
    });
});

// Senza ipotesi di simulazione il planner parte dalla stessa produzione del
// Production Core. Prima assumeva i crawler sempre al cap e "veritate" (un
// pianeta senza crawler) partiva ~1,8M/giorno più in alto.
describe('planner — partenza uguale al Production Core', () => {
    for (const name of ['veritate', 'nembus', 'amico']) {
        it(name, () => {
            const profile = profileFromFixture(name);
            const state = buildInitialState(profile, []);
            expect(simulateDailyProduction(state)).toBe(profile.production.daily);
            const plan = runPlanner(state, { ...OPTS, target: profile.production.daily + 1, maxSteps: 1 });
            expect(plan.initialProd).toBe(profile.production.daily);
        });
    }
});

// "Crawler al massimo" = crawler posseduti illimitati: ogni pianeta resta al cap.
// Deve dare lo stesso valore del vecchio planner, che assumeva sempre il cap
// (veritate: 358.947.959 contro 357.126.503 del Production Core).
describe('planner — ipotesi crawler al massimo', () => {
    it('veritate', () => {
        const state = buildInitialState(profileFromFixture('veritate'), []);
        state.planets.forEach(p => { p.crawlers = Number.MAX_SAFE_INTEGER; });
        expect(simulateDailyProduction(state)).toBe(358947959);
    });
});

describe('planner — obiettivo multi-risorsa', () => {
    const { state } = collectorState('amico');
    const resources = ['metal', 'crystal'];
    const score = (s) => simulateProductionScore(s, resources);
    const P0 = score(state);
    const plan = runPlanner(state, {
        ...OPTS, resources, target: Math.floor(P0 * 1.05), maxSteps: 800
    });

    it('ottimizza la somma delle risorse selezionate', () => {
        expect(plan.resources).toEqual(resources);
        expect(plan.initialProd).toBe(P0);
        expect(plan.finalProd).toBeGreaterThanOrEqual(Math.floor(P0 * 1.05));
        expect(plan.finalByRes.crystal).toBeGreaterThan(plan.initialByRes.crystal);
    });

    it('i Δ multi-risorsa coincidono con un ricalcolo da zero', () => {
        const replay = JSON.parse(JSON.stringify(state));
        let prev = score(replay);
        for (const st of plan.steps) {
            applyStepToState(replay, st);
            const now = score(replay);
            expect(now - prev).toBe(st.deltaProd);
            prev = now;
        }
        expect(prev).toBe(plan.finalProd);
    });

    it('ROI e pacchi usano il valore MSU, non la somma grezza', () => {
        const msuOf = (byRes) => toMSU([byRes.metal || 0, byRes.crystal || 0, byRes.deuterium || 0], state.pack);
        expect(plan.initialValue).toBe(msuOf(plan.initialByRes));
        expect(plan.finalValue).toBe(msuOf(plan.finalByRes));
        for (const st of plan.steps) expect(st.deltaValue).toBe(msuOf(st.deltaByRes));
    });

    it('obiettivo di spesa multi-risorsa conta i pacchi in MSU', () => {
        const spend = runPlanner(state, {
            ...OPTS, resources, goalMSU: 400 * plan.initialValue, maxSteps: 1500
        });
        const initValue = toMSU([spend.initialByRes.metal || 0, spend.initialByRes.crystal || 0, spend.initialByRes.deuterium || 0], state.pack);
        expect(spend.initialValue).toBe(initValue);
        expect(spend.goal.directPacks).toBeCloseTo(spend.goal.msu / initValue, 8);
        expect(spend.steps.every(st => st.deltaValue > 0)).toBe(true);
    });

    it('con una sola risorsa riproduce il punteggio metallo storico', () => {
        expect(simulateProductionScore(state, ['metal'])).toBe(simulateDailyProduction(state));
    });
});

// Il planner ottimizza il punteggio stimato step per step: un refresh parziale
// della cache oraria poteva far comparire step LF con delta negativo (-1% nel
// riepilogo contributi). La cache va aggiornata per tutti i pianeti dopo ogni
// cambio globale (plasma / ricerca LF).
describe('planner — coerenza dei delta con ricerche LF', () => {
    const { state } = collectorState('amico');
    const plan = runPlanner(state, {
        ...OPTS, resources: ['metal'],
        target: Math.floor(simulateDailyProduction(state) * 1.20), maxSteps: 120
    });

    it('nessuno step ha un delta negativo', () => {
        expect(plan.steps.some(st => st.deltaProd < 0)).toBe(false);
    });

    it('la somma dei delta è esattamente il guadagno totale', () => {
        const sum = plan.steps.reduce((a, st) => a + st.deltaProd, 0);
        expect(sum).toBe(plan.finalProd - plan.initialProd);
    });
});

describe('planner — ROI miniera cristallo 0→1', () => {
    it('è inferiore a un giorno con le impostazioni standard', () => {
        const state = buildInitialState(profileFromFixture('nembus'), []);
        const idx = state.planets.findIndex(p => (parseInt(p.crystal) || 0) === 0);
        expect(idx).toBeGreaterThanOrEqual(0);
        const cand = buildCandidates(state, { ...OPTS, resources: ['crystal'] })
            .find(c => c.type === 'crystal_mine' && c.planetIdx === idx && c.from === 0);
        expect(cand).toBeDefined();

        const before = simulateProductionScore(state, ['crystal']);
        const backup = cand.applyMut(state);
        const after = simulateProductionScore(state, ['crystal']);
        cand.revertMut(state, backup);

        const delta = after - before;
        expect(delta).toBeGreaterThan(0);
        expect(toMSU(cand.cost, state.pack) / delta).toBeLessThan(1);
    });
});
