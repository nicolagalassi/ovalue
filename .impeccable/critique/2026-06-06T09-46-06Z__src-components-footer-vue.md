---
target: footer.vue
total_score: 35
p0_count: 0
p1_count: 1
timestamp: 2026-06-06T09-46-06Z
slug: src-components-footer-vue
---
---
score: 35
p0: 0
p1: 1
p2: 2
p3: 2
---

# Footer.vue — Critique 35/40

## P1

### ftr-1 · Copyright contrasto ~2.85:1 (fail WCAG AA)
text-slate-600 text-[10px] su ogame-bg — #475569 su #070c18.
Fix: text-slate-400

## P2

### ftr-2 · max-w-3xl vs max-w-7xl del resto dell'app
Footer visivamente staccato su schermi wide.
Fix: max-w-7xl

### ftr-3 · SVG GitHub senza aria-hidden
SVG decorativa letta dallo screen reader accanto al testo "GitHub".
Fix: aria-hidden="true" sulla svg

## P3

### ftr-4 · Separatore text-slate-700 ~1.9:1 contrasto
Fix: text-slate-500 o rimuovere

### ftr-5 · target="_blank" senza hint screen reader
Fix: aria-label con indicazione nuova scheda
