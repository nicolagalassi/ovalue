---
target: src/views/Home.vue
total_score: 26
p0_count: 0
p1_count: 0
timestamp: 2026-06-05T21-54-13Z
slug: src-views-home-vue
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Sync dot + production chip funzionano; manca loading indicator per il news feed RSS |
| 2 | Match System / Real World | 3 | Label IT corrette; descrizione Production Core attribuisce la funzione del Pack Exchange |
| 3 | User Control and Freedom | 3 | Navigazione chiara; Ko-fi banner chiudibile; news feed toggle reversibile |
| 4 | Consistency and Standards | 3 | Corner bracket system e tool color coerenti; section header "ALTRI TOOL" usa stile diverso da SettingsView |
| 5 | Error Prevention | 2 | Nessun input su questa view; il beta banner avverte ma non previene |
| 6 | Recognition Rather Than Recall | 3 | Tool card auto-esplicative; nav con label testo |
| 7 | Flexibility and Efficiency | 2 | Nessun keyboard shortcut; nessun accesso rapido ai tool senza click |
| 8 | Aesthetic and Minimalist Design | 3 | Relativamente pulita; due banner in stack + spazio verticale eccessivo |
| 9 | Error Recovery | 2 | Non applicabile alla Home |
| 10 | Help and Documentation | 2 | Link "Come si usa" nel footer; nessun onboarding per nuovi utenti |
| **Totale** | | **26/40** | **Acceptable** |

## Anti-Patterns Verdict

LLM: Non grida "AI made this". Corner bracket system identitario, neon guadagnato, layering tonale coerente. Rischio: griglia 4-card identica per struttura (mitigata da differenziazione cromatica per-tool).

Detector: 1 finding — ai-color-palette a riga 168 (text-violet-300 on heading). Parziale falso positivo: violet è il colore canonico del tool shopping in DESIGN.md, appare solo su hover.

## Overall Impression

Sistema cromatico deliberato e coerente. Il problema principale è il layout della homepage: card in mare di spazio vuoto, hero con poco contenuto, due banner impilati. Per un'app che deve "scomparire nel task", la Home rallenta invece di accelerare.

## What's Working

1. Sistema cromatico per-tool (sky/amber/violet/emerald/rose coerente da nav a card a hover)
2. Chip di stato nel hero con progressive disclosure (nulla per nuovi, dati per ritornanti)
3. Corner decoration system — elemento identitario specifico, non generico

## Priority Issues

[P2] Spazio verticale eccessivo — card fluttuano nel vuoto. Fix: rimuovere items-center dalla sezione card, ridurre padding hero.

[P2] Tagline generica — viola "Concreto sopra astrazione". "Massimizza il valore del tuo impero" è buzzword+metafora. Fix: riscrivere concreto.

[P2] Due banner sovrapposti (Ko-fi + Beta) consumano ~132px. Fix: rendere Ko-fi banner dismissibile con localStorage.

[P3] Descrizione Production Core errata — attribuisce funzione Pack Exchange. Fix: aggiornare card_metal_desc in tutti i locale file.

[P3] Quote footer ("Il diavolo fa le pentole...") non guadagna spazio. Fix: spostare o rimuovere.

## Persona Red Flags

Alex (Power User): Tab order di 12 press per arrivare alle card. Nessun keyboard shortcut. Nessun quick-update diretto.

Sam (Keyboard/Screen Reader): Focus ring a 40% opacità quasi invisibile su dark bg. Toggle Forum OGame manca aria-expanded/aria-controls. animate-pulse senza prefers-reduced-motion.

Matteo (Giocatore OGame IT attivo): Nessun visual prompt "dati potrebbero essere vecchi" per sync manuale. I chip in hero mostrano max 4 scadenze senza indicatore di overflow.

## Minor Observations

- bg-grid-pattern definito in tailwind.config ma non usato
- Chevron news feed toggle text-slate-700 quasi invisibile a riposo
- Toggle news feed manca aria-expanded e aria-controls
- animate-pulse senza @media prefers-reduced-motion esplicito in style scoped
