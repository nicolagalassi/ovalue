---
timestamp: 2026-06-06T09-40-16Z
slug: src-components-planetcard-vue
---
---
score: 36
p0: 0
p1: 0
p2: 0
p3: 0
---

# MetalCalc.vue + PlanetCard.vue — Post-Polish 36/40

Tutti i P1 e P2 risolti. P3 risolti.

## Risolti

- mc-1: Side-stripe accent bars rimossi, sostituiti con SVG icon (settings gear, globe)
- mc-2: Eyebrow Collector breakdown eliminato, sostituito con riga inline label+valore
- mc-3: text-gray-300 → text-slate-300
- mc-4: text-slate-600/text-slate-700 → text-slate-400 su tutte le label (mine, item, ally class, crawler max, production detail)
- mc-5: showLfResearch ora locale in PlanetCard (ref(false)), prop/event globale rimosso
- mc-6: Reset confirm aggiunto msg_reset_confirm + aria-label sul dialog
- mc-7: Overload label aggiunto :aria-label
- mc-8: Crawler SVG aria-hidden="true"
- mc-9: createPlanet() genera id univoco, clonePlanet riassegna id, watch idempotente su profile sync; :key="planet.id"
- mc-10: "Ric. LF" / "Tech LF" → t('lbl_lf_research_abbr') / t('lbl_lf_tech_abbr') in tutti i locale
- mc-11: Mobile intro toggle usa metal_calc_about invece di metal_calc_title
- mc-12: Dialog reset :aria-label="t('btn_reset')"
