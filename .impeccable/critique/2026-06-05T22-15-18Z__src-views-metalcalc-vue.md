---
target: src/views/MetalCalc.vue
total_score: 26
p0_count: 0
p1_count: 1
timestamp: 2026-06-05T22-15-18Z
slug: src-views-metalcalc-vue
---
## Design Health Score — `src/views/MetalCalc.vue`

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Totals in real-time, ma nessuna conferma "salvato" |
| 2 | Match System / Real World | 3 | Terminologia OGame corretta, qualche campo senza unità visibile |
| 3 | User Control and Freedom | 2 | Nessun undo dopo reset; solo confirm() nativo |
| 4 | Consistency and Standards | 3 | Side-stripe su 2 pannelli rompe il vocabolario DESIGN.md |
| 5 | Error Prevention | 3 | Confirm sul reset, ma range input non validati |
| 6 | Recognition Rather Than Recall | 3 | Select e checkbox visibili; bulk rivela controlli giusti |
| 7 | Flexibility and Efficiency | 3 | Bulk edit eccellente; mancano shortcut da tastiera |
| 8 | Aesthetic and Minimalist Design | 2 | Glow bianco sull'h1 a riposo; gradient button fuori sistema |
| 9 | Error Recovery | 2 | Nessun undo, validazione numeri assente |
| 10 | Help and Documentation | 2 | Intro contestuale, ma zero tooltip su campi complessi |
| **Totale** | | **26/40** | **Acceptable** |

## Anti-Patterns Verdict

Detector: 1 finding — `border-l-4` riga 174 (side-tab accent border, ban assoluto). Aggiunta manuale: `border-l-2` riga 204 stesso pattern.
LLM: interfaccia non è AI slop, problemi sono violazioni puntuali al sistema.

## Priority Issues

**[P1] Side-stripe borders** (righe 174, 204): border-l-4 e border-l-2 con colore sky — ban assoluto. Fix: rimuovere, sostituire con bg-sky-500/[0.04] + bordo completo.

**[P2] Glow bianco h1 a riposo** (riga 167): drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]. Viola "Glow Guadagnato". Fix: rimuovere interamente.

**[P2] Gradient button "Add Planet"** (riga 359): from-green-600 to-emerald-600. Fuori vocabolario. Fix: bg-emerald-600 hover:bg-emerald-500 solido.

**[P2] Intro toggle aria** (riga 177): manca aria-expanded + aria-controls. Fix: aggiungere entrambi.

**[P3] Reset button aria-label** (riga 356): solo title attribute. Fix: aria-label.

## Minor Observations

- duration-500 sull'icona intro (riga 187) — troppo lento per product UI, fix: duration-200
- italic + uppercase sull'h1 (riga 167) — rimuovere italic
- card-glass / input-glass sono classi globali, verificare sync con DESIGN.md

## Persona Red Flags

Alex: no keyboard shortcut bulk apply; intro occupa spazio desktop senza dismiss permanente.
Sam: intro toggle senza aria-expanded; input senza for/id; focus ring opacity 40% potrebbe fallire contrasto 3:1.
Marco (project-specific): bulk edit non è immediatamente scopribile per nuovi utenti.
