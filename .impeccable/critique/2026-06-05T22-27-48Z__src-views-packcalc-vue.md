---
timestamp: 2026-06-05T22-27-48Z
slug: src-views-packcalc-vue
---
# Critique: PackCalc.vue
Score: 24/40

## Issues Fixed
- P1: border-l-4 intro section + 8× border-l-2 panels + border-t-2 result card + barra assoluta inset queue items — tutti rimossi; queue items ora usano border colorato completo
- P1: drop-shadow amber a riposo su packsNeeded (r.636) → spostato su group-hover, testo text-amber-400
- P2: h1 italic + drop-shadow bianco (r.301) → rimossi
- P2: intro toggle mancavano aria-expanded/aria-controls (r.311) → aggiunti
- P3: gray-on-color (r.488) → falso positivo, nessuna azione

## Heuristics
Visibility:4 Match:4 Control:4 Consistency:2 ErrorPrev:3 Recognition:3 Flexibility:4 Aesthetic:2 Recovery:4 Help:3
