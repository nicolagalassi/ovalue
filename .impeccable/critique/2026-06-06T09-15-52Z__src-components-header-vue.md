---
target: header.vue
total_score: 30
p0_count: 0
p1_count: 0
timestamp: 2026-06-06T09-15-52Z
slug: src-components-header-vue
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Dot indicator + sync timestamp + chevron rotation + active color |
| 2 | Match System / Real World | 3 | Nav labels OGame-appropriate; Ko-fi icon-only senza testo |
| 3 | User Control and Freedom | 3 | Dismiss su click esterno; nessun Esc keyboard per chiudere dropdown |
| 4 | Consistency and Standards | 4 | Entrambi i dropdown condividono struttura, shadow, item style, checkmark |
| 5 | Error Prevention | 3 | Nessuna azione distruttiva nell'header; profile switch reversibile |
| 6 | Recognition Rather Than Recall | 3 | Nav testuale; settings/Ko-fi icon-only ma riconoscibili; nessun tooltip |
| 7 | Flexibility and Efficiency | 2 | Nessuna shortcut tastiera; nessun Cmd+K |
| 8 | Aesthetic and Minimalist Design | 4 | Compatto, senza clutter, ogni elemento guadagna il suo spazio |
| 9 | Error Recovery | 3 | N/A per header puro; azioni reversibili |
| 10 | Help and Documentation | 1 | Nessun meccanismo di aiuto — atteso per nav, zero tooltip ovunque |
| **Totale** | | **30/40** | **Good** |

## Anti-Patterns Verdict

**LLM**: Non urla AI. Color coding per sezione (sky/amber/violet/rose/emerald) è deliberata. Unica nota di slop: `text-[9px] font-black uppercase tracking-[0.2em]` come label-intestazione nei dropdown — il "tiny uppercase tracked eyebrow" anti-pattern, contenuto all'interno del dropdown collassato.

**Detector**: 6 findings `gray-on-color`, tutti false positives da ternari `:class` mutuamente esclusivi.

## Priority Issues

**[P2] Dropdown transitions senza `prefers-reduced-motion`** — Entrambe le `<Transition>` (linee 91-97 e 144) usano opacity + translate-y senza guard. Fix: aggiungere `@media (prefers-reduced-motion: reduce)` nello `<style scoped>` che azzera le transition sui selettori Vue generati.

**[P2] Mobile back-arrow: touch target ~20px** — Il router-link back-arrow (linee 61-64) ha target reale ~16px di altezza. Fix: aggiungere `py-3 -my-3` per espandere il touch target a ≥44px senza modificare il layout.

**[P2] SVG decorativi senza `aria-hidden`** — Tutti gli `<svg>` dentro bottoni con `aria-label` mancano di `aria-hidden="true"` + `focusable="false"`. Screen reader legge il contenuto SVG.

**[P3] Nessun `@keydown.escape` per chiudere i dropdown** — Pattern ARIA menu prevede Esc per exit. Fix: listener `@keydown.escape` sul trigger button di ogni dropdown.

## Persona Red Flags

**Sam**: Focus non intrappolato nel menu aperto; checkmark SVG senza aria-hidden su item attivi.

**Casey**: Nessuna navigazione mobile tra tool — back arrow → Home → tap card aggiunge 3-4 tap per ogni cambio sezione. Touch target back-arrow critico.

**Alex**: Nessuna shortcut tastiera per navigazione rapida.

## Minor Observations

- Tiny uppercase eyebrow dentro dropdown: marginal slop tell.
- `<div id="header-actions">` sempre presente nel DOM anche vuoto.
- Chevron language button `text-slate-700` su `bg-ogame-bg`: contrasto ~1.3:1, puramente decorativo.
