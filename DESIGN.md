---
name: OValue
description: Suite di strumenti per ottimizzare il gameplay OGame — produzione, scambi, scadenze.
colors:
  bg: "#070c18"
  surface: "#0a101e"
  panel: "#0d1525"
  header: "#070c18"
  border: "#334155"
  accent-cyan: "#00f0ff"
  success: "#00ff9d"
  danger: "#ff2a6d"
  warning: "#ffb800"
  dm-violet: "#9d00ff"
  text-primary: "#e2e8f0"
  text-muted: "#94a3b8"
  text-dim: "#64748b"
  tool-mine: "#38bdf8"
  tool-pack: "#fbbf24"
  tool-shopping: "#a78bfa"
  tool-strategy: "#34d399"
  tool-expirations: "#fb7185"
typography:
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.625rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.2em"
  data:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.accent-cyan}"
    textColor: "#000000"
    rounded: "{rounded.sm}"
    padding: "8px 24px"
  button-primary-hover:
    backgroundColor: "#00c8d4"
    textColor: "#000000"
  button-tinted:
    backgroundColor: "rgba(14, 165, 233, 0.08)"
    textColor: "{colors.tool-mine}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "rgba(255, 255, 255, 0.05)"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  chip-status:
    backgroundColor: "rgba(148, 163, 184, 0.05)"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.full}"
    padding: "3px 9px"
  badge:
    backgroundColor: "rgba(56, 189, 248, 0.10)"
    textColor: "{colors.tool-mine}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
---

# Design System: OValue

## 1. Overview

**Creative North Star: "Lo Schermo delle Operazioni"**

OValue è il pannello di controllo che un comandante di flotta tiene aperto a fianco della partita. Non ha bisogno di impressionare: deve essere leggibile a ore di distanza, rispondere allo stato del gioco in tempo reale, e uscire di scena non appena il giocatore ha trovato il numero che cercava. La superficie è scura non per estetica cyberpunk ma per ridurre l'affaticamento visivo durante sessioni lunghe. Il colore ha una sola funzione: comunicare stato.

Il sistema è costruito su quattro livelli di profondità tonale, senza ombre classiche. Il neon esiste in questo sistema, ma è guadagnato: appare solo sull'hover o sugli elementi attivi, mai a riposo. A riposo, tutto è flat. Questa economia del glow è la regola più importante del sistema: violarla produce l'estetica da "neon site AI-generated" che il prodotto esplicitamente rifiuta.

Il vocabolario visivo è coerente tra tutti gli strumenti. Stesso bottone, stessa card, stesso badge, stesso pattern di sezione. La coerenza riduce il carico cognitivo; il giocatore sa già dove guardare prima di aprire una schermata.

**Key Characteristics:**
- 4 livelli di profondità tonale: header → bg → panel → card (nessuna ombra classica)
- Colore semantico: ogni stato, ogni tool, ogni alert ha il suo token
- Font mono riservato esclusivamente a etichette machine-readable (timestamp, ID giocatore, nome server)
- Corner decoration system: brackets angolari animati sulle card principali
- Neon glow solo su hover e stati attivi: mai a riposo

## 2. Colors: Il Sistema Operativo

La palette è una gerarchia cromati cromatica scura: sfondo quasi-nero con tinta blu-fredda, tre livelli di panel, cinque colori di stato semantici, cinque accenti per tool. Il colore è un sistema, non una decorazione.

### Primary
- **Cyber Cyan** (`#00f0ff`): Il solo colore primario del sistema. CTA buttons, stati di selezione attiva, link principali. Usato con neon glow solo in hover; a riposo come colore puro senza glow. Massimo 10% della superficie su qualsiasi schermata.

### Secondary
- **Neon Emerald** (`#00ff9d`): Valori positivi, auto-sync attivo, stati di successo.
- **Neon Coral** (`#ff2a6d`): Errori, azioni distruttive, alert critici, scadenze imminenti.
- **Neon Gold** (`#ffb800`): Warning, elementi in coda, informazioni temporali.
- **Deep Violet** (`#9d00ff`): Dark Matter, ufficiali, contenuti premium. Non usato per stato generico.

### Tertiary (Accenti Tool)
Ogni tool ha il suo accento cromatico fisso, usato per card, stati attivi e dot di navigazione.
- **Mission Sky** (`#38bdf8`): Calcolatore miniere (Produzione).
- **Ops Amber** (`#fbbf24`): Ottimizzatore scambi (Pack Exchange).
- **Signal Violet** (`#a78bfa`): Lista spesa (Shopping List).
- **Grid Emerald** (`#34d399`): Pianificatore strategia.
- **Alert Rose** (`#fb7185`): Tracker scadenze ufficiali.

### Neutral
- **Void** (`#0b0e14`): Sfondo pagina. Il livello più basso.
- **Nav-Dark** (`#070c18`): Header sticky. Più scuro del void per separarsi senza ombra.
- **Hull** (`#151923`): Sfondo panel. Primo strato sopra il void.
- **Deep Panel** (`#0d1525`): Superfici card. Strato tra hull e void, tinta più blu.
- **Mesh** (`#2d3748`): Bordi e divisori. Visibili ma non dominanti.
- **Data** (`#e2e8f0`): Testo primario. Contrasto sufficiente su tutti i layer panel.
- **Muted** (`#94a3b8`): Testo secondario, descrizioni.
- **Dim** (`#64748b`): Testo disabilitato, placeholder, label divisori.

### Named Rules
**La Regola del Glow Guadagnato.** Il neon è un reward, non un default. A riposo, i colori semantici compaiono come tinta (rgba bassa opacità) o come testo puro. Il `box-shadow` con rgba neon è permesso solo su `:hover` e su elementi attivi/selezionati. Se un glow è visibile senza interazione, è sbagliato.

**La Regola dei Cinque Tool.** Gli accenti tool sono fissi: sky=miniere, amber=pack, violet=shopping, emerald=strategia, rose=scadenze. Non si inventano nuovi accenti tool; si usa il vocabolario esistente.

## 3. Typography

**Body / UI Font:** `ui-sans-serif, system-ui, -apple-system, sans-serif`
**Label / Mono Font:** `ui-monospace, SFMono-Regular, Menlo, monospace`

**Character:** Un sistema tipografico senza font custom. La personalità viene da contrasto di peso (400 → 900), tracking aggressivo su label mono, e trattamento uppercase riservato. Il font system-ui è l'intero budget tipografico.

### Hierarchy
- **Headline** (700, 1.25rem, lh 1.2, tracking -0.025em): Titoli di pagina, heading sezioni principali.
- **Title** (700, 1rem, lh 1.3): Titoli card, intestazioni tool.
- **Body** (400, 0.875rem / 14px, lh 1.5): Descrizioni, testo paragrafo. Max 65ch su prose.
- **Label / Section Header** (900, 0.625rem / 10px, mono, tracking 0.2em, UPPERCASE): Separatori di sezione, badge di stato, micro-etichette. Mono, black weight, spacing estremo.
- **Data** (600, 0.6875rem / 11px): Valori numerici inline, timestamp, nomi server. Contrasto alto, peso semibold.

### Named Rules
**La Regola del Nessun Font.** Zero font custom caricati. Nessun @font-face, nessun CDN tipografico. Il sistema-ui stack è l'unica dichiarazione font. La personalità visiva viene da peso, spaziatura e trattamento uppercase, non dalla scelta del font.

**La Regola del Mono Riservato.** Il font mono (`font-mono`) è usato esclusivamente per contenuto machine-readable: timestamp di sincronizzazione, nomi profilo nell'header, dati numerici nel contesto di sezione monospace. Non per decorazione.

## 4. Elevation

OValue usa il layering tonale come unico sistema di profondità. Le superfici non hanno ombre classiche a riposo: la profondità è comunicata dal colore di sfondo, non dalla luce simulata. Il sistema ha quattro livelli distinti di luminosità:

| Livello | Colore | Uso |
|---|---|---|
| 0 — Nav | `#070c18` | Header sticky: sempre il livello più basso |
| 1 — Void | `#0b0e14` | Background pagina |
| 2 — Panel | `#151923` / `#0d1525` | Card e sezioni |
| 3 — Surface active | tinta hover +2-3% luminosità | Hover state delle card |

### Shadow Vocabulary
- **Dropdown overlay** (`0 12px 40px rgba(0,0,0,0.8)`): Hard dark shadow esclusivamente per elementi floating (dropdown menu, modal). Separa il layer dal contesto senza glow. Unica ombra classica nel sistema.
- **Neon hover glow** (es. `0 0 30px rgba(56,189,248,0.12)`): Glow su hover di card e CTA button. Sempre rgba ≤ 30% opacità. Earned, non default.

### Named Rules
**La Regola Flat-By-Default.** Le superfici sono piatte a riposo. L'unica ombra strutturale è quella dei floating layer (dropdown/modal). Il neon hover glow non è un'ombra classica: è feedback di stato.

## 5. Components

### Bottoni

I bottoni esistono in due famiglie. La prima è la famiglia tintata: sfondo colorato a opacità molto bassa, bordo nella stessa tinta, testo nel colore pieno. La seconda è il CTA solido, riservato all'azione primaria di importanza critica.

- **Shape:** Gently curved (12px radius per la famiglia tintata; 6px per il CTA solido)
- **Famiglia Tintata:** `bg-[color]/10 border border-[color]/20 text-[color] hover:bg-[color]/20` — il colore varia per contesto (sky, green, amber). Zero padding extra; il confine è il colore, non la forma.
- **CTA Solido:** `bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-wider` con `shadow-[0_0_15px_rgba(6,182,212,0.3)]` su hover. Usato solo per azioni di conferma irreversibile o importazione primaria.
- **Ghost:** `bg-white/5 hover:bg-white/10 text-slate-400` — azione secondaria neutra (annulla, reset).
- **Tutti gli stati:** 150ms transition-colors. Focus-visible con outline 1px a 2px offset. Disabled: `opacity-40 cursor-not-allowed`.

### Chip / Badge

- **Profile chip** (inline status): `border border-slate-500/20 bg-white/[0.02] rounded-full px-2.5 py-0.5 text-[11px]` — punto colorato + valore + unità. Colore varia per urgenza.
- **Status badge** (sezione): `text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border` — tinta colore corrispondente. Es: sky per attivo, green per success, slate per manual.

### Tool Cards (Signature Component)

Il componente identitario del sistema. `rounded-2xl` (16px), sfondo `#0d1525`, corner decoration system: quattro brackets angolari (`border-t-2 border-l-2` ecc.) animati che crescono su hover (`w-5 h-5` → `w-7 h-7`). Top glow line (`h-px bg-gradient` dal colore tool) visibile solo su hover. Struttura interna: icon container quadrato con tinta tool + icona SVG → titolo UPPERCASE bold → descrizione → "Apri ›" label.

La transizione di colore del card bg su hover è specifica per tool (es. miniere: `#0f1a30`, pack: `#130f08`): la card si tinge leggermente verso il colore del suo strumento.

### Card / Panel Sezione

- **Corner Style:** Gently curved (12px / `rounded-xl`)
- **Background:** `#0d1525` o `bg-[#0b0e14]/80` con `border border-white/5`
- **Shadow:** Nessuna ombra. Profondità da contrasto tonale col background pagina.
- **Padding interno:** `px-5 py-4` (20px / 16px) per sezioni dense; `p-5` per pannelli card.
- **Divider:** `divide-y divide-slate-700/20` tra row items dello stesso container.

### Input / Select

- **Style:** `bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-gray-300` — superficie traslucida scura.
- **Focus:** `focus:border-sky-500/40 focus:outline-none` — border shift verso cyan, nessun ring aggressivo.
- **Textarea:** Stessa famiglia, `resize-none`, font-mono per contenuto tecnico.
- **Select:** Stesso style input. Option bg: `#161b22` (simile panel-deep).

### Navigation

Header sticky (`#070c18/95` + `backdrop-blur-xl + border-b border-slate-700/20`). Altezza `h-14`. Link nav: `text-[11px] font-semibold uppercase tracking-wider rounded-md px-3 py-1.5`. Stato attivo: colore tool + `bg-white/5` + dot colorato 4px a sinistra del testo. Hover: `text-slate-200 hover:bg-white/[0.04]`. Mobile: collassa, mostra solo back-link `← Home`.

### Section Header Pattern

Pattern trasversale a tutte le schermate: `[colored dot/icon 2px] + [mono label 10px black tracking-widest] + [flex-grow h-px bg-white/5]`. Il divider line è parte della header, non un elemento separato. Il colore del dot rispecchia il contesto (sky per profili, purple per sync, ecc.).

### Toggle Switch

- Standard pill toggle: `h-6 w-11 rounded-full` — green quando attivo, gray-700 quando off.
- Thumb bianco: `h-4 w-4 rounded-full bg-white shadow translate-x-1/6` (transform).
- `transition-colors` 200ms.

## 6. Do's and Don'ts

### Do:
- **Do** usare i 4 livelli tonali (`#070c18 → #0b0e14 → #151923 → #0d1525`) per comunicare profondità. La gerarchia viene dal colore, non dall'ombra.
- **Do** limitare il Cyber Cyan (`#00f0ff`) al 10% massimo di qualsiasi schermata: CTA, selezione attiva, link primari.
- **Do** assegnare il colore tool corretto a ogni nuovo strumento: sky=miniere, amber=pack, violet=shopping, emerald=strategia, rose=scadenze.
- **Do** usare font mono esclusivamente per contenuto machine-readable: timestamp, ID, server name, valori numerici in contesto mono.
- **Do** tenere il neon glow a rgba ≤ 30% opacità, solo su hover e stati attivi.
- **Do** nascondere azioni distruttive con `opacity-0 group-hover:opacity-100` finché l'utente non segnala intento.
- **Do** applicare `reduced-motion` rispettando `@media (prefers-reduced-motion: reduce)` su tutte le animazioni di ingresso.

### Don't:
- **Don't** aggiungere glow o neon a riposo — il glow si guadagna con l'interazione. Un elemento che brilla senza hover è sbagliato per definizione.
- **Don't** usare gradient text (`background-clip: text`). Il testo è un colore solido. Gerarchia tramite peso e dimensione, non effetti decorativi.
- **Don't** caricare font custom. Il sistema usa `ui-sans-serif` e `ui-monospace` come unico stack tipografico.
- **Don't** inventare accenti tool fuori dal vocabolario definito. Se si aggiunge un sesto strumento, si sceglie uno dei cinque esistenti o si definisce un nuovo token nel sistema, non si usa un colore ad hoc.
- **Don't** usare `border-left` o `border-right` > 1px come stripe colorata su card, row o alert. Il pattern di OValue usa sfondo tintato + bordo completo.
- **Don't** replicare l'estetica OGame originale (texture, gif animate, layout a tabelle, colori fluorescenti fissi). OValue è un tool moderno che si affianca al gioco, non un sito fan anni '90.
- **Don't** produrre il neon site AI-generated: gradients su ogni elemento, glow permanente ovunque, palette ciano/viola/magenta a piena saturazione. Il neon in OValue è parsimonioso, gerachico, guadagnato.
- **Don't** usare glassmorphism come default di superficie. `backdrop-blur` è permesso solo per l'header sticky (`backdrop-blur-xl`), non per card o panel.
- **Don't** usare l'eyebrow kicker UPPERCASE con tracking come scaffold universale. Il pattern section-header (dot + mono label + divider) è il vocabolario di OValue; non va applicato sopra ogni heading di ogni view come se fosse decorazione generica.
