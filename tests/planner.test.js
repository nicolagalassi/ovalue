// Invarianti del Production Planner sugli export reali.
import { describe, it, expect } from 'vitest';
import {
    runPlanner, buildInitialState, buildCandidates, simulateDailyProduction, toMSU,
    isStepDoneInProfile, rewindPlanProgress, applyStepToState
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
