---
name: OValue
description: Suite di strumenti per ottimizzare il gameplay OGame — produzione, pacchetti, acquisti, pianificazione.
colors:
  bg: "#070c18"
  surface: "#0a101e"
  panel: "#0d1525"
  raised: "#131d31"
  line: "#1e293b"
  line-strong: "#334155"
  accent-cyan: "#00f0ff"
  on-accent: "#04121a"
  success: "#34d399"
  danger: "#fb7185"
  warning: "#fbbf24"
  text-primary: "#e2e8f0"
  text-secondary: "#94a3b8"
  tool-mine: "#38bdf8"
  tool-pack: "#fbbf24"
  tool-shopping: "#a78bfa"
  tool-strategy: "#34d399"
typography:
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
  small:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.3
  section-header:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.12em"
  stat:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
  stat-xl:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.1
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent-cyan}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "36px"
  button-tint:
    backgroundColor: "color-mix(tool 8%)"
    textColor: "tool color"
    rounded: "{rounded.sm}"
    padding: "0 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
  button-danger:
    backgroundColor: "#e11d48"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.lg}"
    border: "1px {colors.line}"
  tag:
    rounded: "4px"
    padding: "2px 6px"
---

# Design System: OValue

Le classi del sistema stanno in `src/style.css` (`@layer components`, prefisso `ov-`), i token colore in `tailwind.config.js` (`ogame.*`). Questo documento descrive ciò che il codice usa: se divergono, vale il codice e va aggiornato questo file.

## 1. Overview

**Creative North Star: "Lo Schermo delle Operazioni"**

OValue è il pannello di controllo che un comandante di flotta tiene aperto a fianco della partita. Non deve impressionare: deve essere leggibile per ore, dare il numero cercato in pochi secondi e poi uscire di scena. La superficie è scura per ridurre l'affaticamento durante sessioni lunghe, non per estetica cyberpunk. Il colore ha una sola funzione: comunicare stato o appartenenza a uno strumento.

**Key Characteristics:**
- Sfondo piatto (niente nebulose, stelle o gradienti di pagina) e pannelli piatti con bordo sottile.
- La risposta è sempre in vista: barra dei risultati fissa in fondo agli strumenti di calcolo.
- Un solo pulsante pieno (ciano) per schermata; tutto il resto è tinto o neutro.
- Un solo pattern di intestazione di sezione, un solo selettore a segmenti, un solo stile di tag.
- Nessun glow a riposo.

## 2. Colors

### Superfici (dal più scuro al più chiaro)
| Token | Valore | Uso |
|---|---|---|
| `ogame-bg` | `#070c18` | Pagina e header |
| `ogame-surface` | `#0a101e` | Input, aree incassate dentro i pannelli |
| `ogame-panel` | `#0d1525` | Pannelli, card, gruppi apribili |
| `ogame-raised` | `#131d31` | Elemento attivo (segmento, voce selezionata), barra dei risultati, toast |
| `ogame-line` | `#1e293b` | Bordi dei pannelli e divisori |
| `slate-700` (`#334155`) | Bordi degli input |

### Primario
- **Ciano** (`#00f0ff`): solo il pulsante primario, la voce di navigazione attiva (sottolineatura), il focus da tastiera e le azioni "+" di aggiunta. Testo sopra il ciano: `#04121a`.

### Colori degli strumenti
Servono a orientarsi: il giocatore deve capire a colpo d'occhio in quale strumento si trova. Definiti una sola volta in `src/data/tools.js` (colore, icona, immagine di gioco); `App.vue` imposta `--tool` sulla pagina corrente. Il colore compare in: icona e sottolineatura della voce attiva nel menu, riquadro con icona accanto al titolo (`PageHead` / `.ov-tile`), velo leggero in cima alla pagina, bordo superiore dei pannelli e della barra dei risultati, punto delle intestazioni di sezione (`--tc`), pulsanti tinti, fascia delle card in Home. Mai per testo corrente.
- **Sky** `#38bdf8`: Production Core
- **Amber** `#fbbf24`: Pack Exchange
- **Violet** `#a78bfa`: Shopping List e costi in Materia Oscura
- **Emerald** `#34d399`: Production Planner

### Stato
- **Emerald** `emerald-400`: positivo, coperto, automatico, target raggiunto.
- **Amber** `amber-400`: avviso, aggiornamento disponibile, equiparato.
- **Rose** `rose-400` (testo) / `rose-600` (pulsante): mancante, errore, azione distruttiva.

### Testo
- **Primario** `#e2e8f0` (`slate-200/100`).
- **Secondario** `#94a3b8` (`slate-400`): etichette, descrizioni, unità, segnaposto. È il grigio più scuro ammesso per testo informativo (≥ 4,5:1 su tutte le superfici). `slate-500` e più scuri solo per elementi disattivati.

### Named Rules
**La Regola del Glow Guadagnato.** Nessuna ombra colorata a riposo. Un elemento che brilla senza interazione è sbagliato.

**La Regola dei Colori degli Strumenti.** I quattro accenti sono fissi; non si inventano accenti nuovi. Le scomposizioni di dati (per esempio le fonti di produzione nella card pianeta) possono usare una palette categorica propria, ma solo dentro il grafico e la sua legenda.

## 3. Typography

**Font:** `ui-sans-serif, system-ui` per tutto; `ui-monospace` solo per l'intestazione di sezione e per valori machine-readable (log di sincronizzazione, nomi server, intestazioni di tabella).

### Scala
| Ruolo | Dimensione / peso | Classe |
|---|---|---|
| Titolo pagina | 20px / 700 | `.ov-title` |
| Numero risultato grande | 26–30px / 700, `tabular-nums` | `.ov-stat-v` con `!text-2xl/3xl` |
| Numero risultato | 20px / 700, `tabular-nums` | `.ov-stat-v` |
| Titolo card / riga | 15px / 600 | `text-[15px] font-semibold` |
| Corpo | 14px / 400 | `text-sm` |
| Corpo piccolo | 13px | `text-[13px]` (sottotitoli `.ov-sub`, righe di tabella) |
| Piccolo | 12px | `text-xs` (segmenti, chip) |
| Etichetta campo / stat | 11px / 500 | `.ov-label`, `.ov-stat-k` |
| Intestazione di sezione | 11px / 700 mono, maiuscolo, tracking 0.12em | `.ov-sh` |

11px è il minimo per qualunque testo informativo. Tutti i numeri allineati in colonna usano `tabular-nums`. I numeri usano sempre il separatore delle migliaia (`formatInt`) e le percentuali la virgola italiana (`formatPct`), entrambi in `src/composables/useOgameFormulas.js`. L'euro va dopo il numero: `1.125 €`.

### Named Rules
**La Regola del Nessun Font.** Nessun font caricato: lo stack di sistema è l'intero budget tipografico.

**La Regola del Maiuscolo Riservato.** Il maiuscolo esiste solo nell'intestazione di sezione `.ov-sh`, nei tag `.ov-tag` e nelle intestazioni di tabella. Pulsanti, titoli ed etichette sono in forma normale.

## 4. Elevation

La profondità viene dai livelli di superficie, non dalle ombre. Le uniche ombre ammesse sono quelle dei livelli flottanti, sempre scure:
- Menu a tendina: `0 12px 40px rgba(0,0,0,0.8)`
- Finestre di dialogo: `0 16px 48px rgba(0,0,0,0.6)`
- Toast: `0 12px 40px rgba(0,0,0,0.6)`

Niente `backdrop-blur` su pannelli, finestre o toast.

## 5. Components

### Pulsanti (`.ov-btn`)
Altezza 36px (`.ov-btn-sm` 30px), raggio 6px, testo 13px semibold in forma normale. Pressione: `scale(0.97)` in 150ms.
- **`.ov-btn-primary`**: ciano pieno. Uno per schermata o per area (calcola, aggiungi alla lista, nuovo pianeta, conferma).
- **`.ov-btn-tint`**: colore dello strumento (`--tc`) all'8% di sfondo e 25% di bordo. Azioni secondarie.
- **`.ov-btn-ghost`**: trasparente con bordo `line`. Annulla, svuota, reset.
- **`.ov-btn-danger`**: rose pieno. Solo per confermare un'azione distruttiva dentro una finestra.

### Intestazione di sezione (`.ov-sh`)
Punto del colore dello strumento (`--tc`) + etichetta mono 11px maiuscola + filetto che riempie lo spazio. Un contenuto a destra va in `.ov-sh-r`. `.ov-sh-noline` toglie il filetto.

### Pannello (`.ov-panel`)
`bg-ogame-panel`, bordo `ogame-line`, raggio 12px, padding 20px. Niente pannelli dentro pannelli: dentro si usano divisori o righe con bordo `line`.

### Gruppo apribile (`.ov-acc`)
`<details>` con `<summary>` che mostra il titolo e, in grigio, il riassunto delle scelte correnti: si capisce lo stato anche a gruppo chiuso.

### Selettore a segmenti (`.ov-seg`)
Pulsanti affiancati in un contenitore `surface`; quello attivo (`aria-pressed="true"`) ha sfondo `raised` e bordo interno. `.ov-seg-full` li allarga a tutta la riga. Cambia stato all'istante, senza animazione.

### Tag (`.ov-tag`)
Mono 10px maiuscolo su sfondo tinto al 10%: `-ok`, `-bad`, `-warn`, `-mute`.

### Statistica (`.ov-stat`)
Etichetta 11px `slate-400` sopra, numero 20px bold `tabular-nums` sotto.

### Barra dei risultati (`.ov-resultbar`)
Fissa in fondo allo schermo (`sticky bottom-0`), sfondo `raised`, bordo superiore. Contiene i 2–3 numeri che rispondono alla domanda dello strumento e, se serve, un'azione. Presente in Production Core, Pack Exchange (entrambe le schede) e Production Planner.

### Input (`.input-glass`)
Sfondo `surface`, bordo `slate-700`, raggio 6px, segnaposto `slate-400`. Focus: bordo sky + anello sottile. I campi in sola lettura calcolati in automatico hanno il bordo tratteggiato e il tag "auto".

### Finestre e cassetti
Gestiti da `useOverlay` (`src/composables/useOverlay.js`): Esc chiude, la pagina sotto non scorre, il focus entra nella finestra, Tab resta dentro e alla chiusura torna al pulsante che l'ha aperta. Fondo `bg-black/70` senza sfocatura; pannello con classe `.ov-dialog`.

### Navigazione
Header `h-14`, sfondo `bg`, bordo inferiore `line`. Voce attiva: testo `slate-100` semibold e sottolineatura ciano di 2px a tutta altezza. Controlli a destra trasparenti con bordo `line`.

## 6. Motion

- Durate: 150ms per hover e stati, 200ms per aperture, uscite più rapide delle entrate.
- Curve: entrate `cubic-bezier(0.23, 1, 0.32, 1)`; cassetto laterale `cubic-bezier(0.32, 0.72, 0, 1)`. Niente `ease-in` in uscita, niente `transition: all`.
- Menu a tendina: crescono dall'angolo del pulsante (`transform-origin: top right`), `scale(0.97)` + 4px.
- Finestre: dissolvenza 200ms con pannello da `scale(0.96)`. Cassetto del carrello: entra dal bordo destro in 300ms.
- Nessuna animazione su superfici usate di continuo (card del catalogo, gruppi apribili, segmenti, schede).
- Hover solo dove c'è un puntatore (`hoverOnlyWhenSupported`).
- Con `prefers-reduced-motion` si tolgono gli spostamenti e si tengono le dissolvenze brevi; spinner e barre di avanzamento restano.

## 7. Do's and Don'ts

### Do
- **Do** mettere la risposta in una barra fissa quando lo strumento calcola qualcosa.
- **Do** usare `--tc` col colore dello strumento per intestazioni e pulsanti tinti.
- **Do** mostrare il riassunto delle scelte nei gruppi chiusi.
- **Do** tenere i numeri con `tabular-nums`, separatore delle migliaia e virgola decimale.

### Don't
- **Don't** aggiungere glow, testo sfumato o sfocature. L'unico gradiente ammesso è il velo del colore dello strumento in cima alla pagina e nella fascia delle card in Home.
- **Don't** usare testo informativo sotto 11px o più scuro di `slate-400`.
- **Don't** mettere più di un pulsante pieno nella stessa area.
- **Don't** mettere pannelli dentro pannelli o icone grandi dentro riquadri come struttura di pagina.
- **Don't** usare etichette maiuscole sopra i titoli (kicker): il titolo parla da solo.
- **Don't** replicare l'estetica dei siti fan OGame anni '90 né quella del "neon AI".
