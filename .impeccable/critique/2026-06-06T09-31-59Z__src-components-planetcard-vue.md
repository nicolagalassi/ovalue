---
timestamp: 2026-06-06T09-31-59Z
slug: src-components-planetcard-vue
---
---
score: 25
p0: 0
p1: 2
p2: 7
p3: 3
---

# MetalCalc.vue + PlanetCard.vue — Critique 25/40

## P1 — Must fix

### mc-1 · Side-stripe accent bars (absolute ban)
**Heuristic:** Consistency & Standards  
**Location:** MetalCalc.vue:211, 353  
Due `<span class="w-[2px] h-4 bg-sky-400/60 rounded-full flex-shrink-0">` usati come accent sinistro nelle intestazioni di sezione. Pattern side-stripe espressamente vietato.  
**Fix:** Sostituire con icona SVG inline o togliere l'accent, lasciando solo il testo.

### mc-2 · Eyebrow pattern nelle mini-card Collector (absolute ban)
**Heuristic:** Aesthetic & Minimalist Design  
**Location:** MetalCalc.vue:289, 293, 297  
Le tre mini-card del breakdown Collector usano `text-[9px] text-slate-600 uppercase tracking-wider font-semibold` — esattamente il pattern eyebrow vietato.  
**Fix:** Eliminare le card e mostrare i tre valori in una riga orizzontale con label inline e testo normale.

---

## P2 — Should fix

### mc-3 · Token non standard text-gray-300
**Heuristic:** Consistency & Standards  
**Location:** MetalCalc.vue:195  
`text-gray-300` (Tailwind base) invece di `text-ogame-text` o `text-slate-300`.  
**Fix:** Sostituire con `text-ogame-text`.

### mc-4 · text-slate-600 contrasto insufficiente (~2.4:1)
**Heuristic:** Accessibility / Contrast  
**Location:** MetalCalc.vue:277; PlanetCard.vue:165, 172, 179, 242, 254  
slate-600 (#475569) su ogame-bg (#070c18) produce ~2.4:1, sotto il minimo 4.5:1 per testo piccolo.  
**Fix:** Portare a `text-slate-400` (contrasto ~5.4:1) o almeno `text-slate-500`.

### mc-5 · Toggle LF research globale (expand all-or-nothing)
**Heuristic:** User Control & Freedom  
**Location:** MetalCalc.vue:378-383, PlanetCard.vue:294  
L'evento toggle-lf-research è globale: espande o collassa la sezione LF su TUTTI i pianeti contemporaneamente.  
**Fix:** Stato `showLfResearch` locale in PlanetCard come `ref(false)`, eliminare il prop e l'event globale.

### mc-6 · Reset confirm senza testo descrittivo
**Heuristic:** Error Recovery  
**Location:** MetalCalc.vue:425-438  
Il dialog mostra solo "Reset?" senza spiegare cosa andrà perso.  
**Fix:** Aggiungere `msg_reset_confirm` ("Tutti i pianeti verranno rimossi. L'azione non è reversibile.") sotto il titolo.

### mc-7 · Overload toggle senza aria-label
**Heuristic:** Accessibility  
**Location:** PlanetCard.vue:274-282  
Il `<label>` wrapping il checkbox overload non associa un testo — solo "150%" privo di contesto.  
**Fix:** Aggiungere `:aria-label="t('lbl_overload')"` al label o collegare con `<label :for>`.

### mc-8 · SVG crawler decorativa non aria-hidden
**Heuristic:** Accessibility  
**Location:** PlanetCard.vue:266  
La svg nella riga crawler manca di `aria-hidden="true"`.  
**Fix:** Aggiungere `aria-hidden="true"` all'svg.

### mc-9 · v-for :key="index" su lista dinamica
**Heuristic:** Consistency & Standards  
**Location:** MetalCalc.vue:371  
Index come key su lista dove gli elementi vengono inseriti/rimossi causa glitch transizioni e potenziale riuso scorretto.  
**Fix:** Aggiungere `id: Date.now()` (o `crypto.randomUUID()`) in `createPlanet()` e usare `:key="planet.id"`.

---

## P3 — Polish

### mc-10 · Abbreviazioni hardcoded "Ric. LF" / "Tech LF" non i18n
**Location:** PlanetCard.vue:114-116  
Stringhe in italiano hardcoded.  
**Fix:** Aggiungere chiavi `lbl_lf_research_abbr` e `lbl_lf_tech_abbr` a tutti i quattro file locale.

### mc-11 · Mobile intro toggle usa metal_calc_title come label
**Location:** MetalCalc.vue:184  
Pulsante mobile mostra il titolo pagina come testo del toggle — ridondante.  
**Fix:** Usare chiave `metal_calc_about` ("Informazioni") o solo icona info con aria-label.

### mc-12 · Dialog reset manca aria-label
**Location:** MetalCalc.vue:425  
Dialog senza heading e senza aria-label/labelledby.  
**Fix:** Aggiungere `aria-label="{{ t('btn_reset') }}"` al div `role="dialog"`.
