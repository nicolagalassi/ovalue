# OValue — OGame Tools Suite

> Strumenti avanzati per [OGame](https://ogame.gameforge.com): calcolatore produzione miniere, ottimizzatore pacchetti, lista della spesa, scadenziario ufficiali e planner strategico.

---

## Funzionalità

### Production Core `/metal`
Calcola la produzione oraria e giornaliera di metallo per ogni pianeta tenendo conto di:
- Livello miniera, posizione planetaria (P6–P10), velocità economia
- Classe giocatore (Collezionista con moltiplicatori reali), plasma, geologo, staff
- Crawler con cap automatico e modalità overload
- Item amplificatori (10–40%) e item custom
- Edifici e ricerche LifeForm (Humans, Rock'tal, Mecha, Kaelesh)
- Bonus collezionista da ricerche T18 LF calcolato automaticamente
- Import dati reali dal profilo tramite l'exporter

### Pack Exchange `/pack`
Converte il costo di strutture, ricerche e navi in pacchetti MO (Materia Oscura):
- Database completo edifici, ricerche, navi, difese e tecnologie LF
- Tassi di cambio metallo/cristallo/deuterio configurabili
- Sconto per livello Nexus Minerario e laboratorio LF
- Coda acquisti con totali aggregati per categoria
- Importazione diretta dalla roadmap del planner

### Shopping List `/shopping`
Lista della spesa per un evento o sessione di acquisti:
- Selezione multipla da database OGame completo
- Calcolo costo totale in risorse e pacchetti equivalenti
- Supporto eventi speciali con moltiplicatori

### Production Planner `/strategy` *(Alpha)*
Algoritmo greedy che pianifica il percorso ottimale per raggiungere un target di produzione giornaliera:
- Valuta miniere, plasma, edifici LF e ricerche LF a ogni step
- Ordina per ROI (ritorno sull'investimento in giorni/mesi/anni)
- Modalità valore pacchetto dinamico o fisso
- Roadmap step-by-step con raggruppamento blocchi economici
- Riepilogo upgrade per pianeta
- Import della roadmap nella coda Pack Exchange

### Scadenziario `/expirations`
Monitora le scadenze di ufficiali e item globali dell'account:
- Stato attivo/inattivo per ogni ufficiale
- Countdown per item a tempo
- Evidenziazione elementi in scadenza imminente

---

## OValue Exporter (Userscript)

`util/OValue_Exporter_v3.user.js` è uno userscript Greasemonkey/Tampermonkey da installare nel browser. Si inietta nelle pagine di OGame e raccoglie automaticamente i dati dell'account.

**Dati raccolti:**
- Classe giocatore, ufficiali e relative scadenze
- Livelli miniere, cristallo e deuterio per ogni pianeta
- Specie LifeForm per pianeta e livelli edifici LF
- Ricerche LF attive per pianeta (dalla pagina `lfresearch`)
- Bonus metallo e collezionista totali
- Plasma, crawler, item amplificatori, item globali a tempo
- Livelli edifici amplificatori ricerche (Metropolis, HPT, CMP, Clone Lab)

**Installazione:** installa lo userscript dal link nella pagina Production Core, poi naviga le pagine di OGame indicate (Panoramica, LifeForm, Ricerche LF, Impero). Il pannello OValue nel menu di navigazione guida il processo e mostra lo stato di raccolta per ogni sezione.

### Pannello in-game
Il pannello è agganciato al lato sinistro dell'interfaccia OGame:
- Sezioni collassabili (Panoramica, LifeForm, Ricerche LF, Impero)
- Badge di stato per ogni sezione (Letto / Mancante)
- Trascinabile via drag sull'header
- Pulsante **Esporta** — copia il JSON negli appunti per l'import in OValue
- Pulsante **Svuota Cache** — azzera i dati salvati per il server corrente

---

## Profili

OValue supporta profili multipli, uno per server OGame. Ogni profilo è indipendente e persiste in `localStorage`. La sincronizzazione tra tab avviene tramite `StorageEvent`.

**Shape del profilo:**
```
{
  name, lastSync,
  production:   { settings, planets[], daily },
  packExchange: { settings, stock, queue[] },
  shoppingList: { cart[], activeEvent },
  expirations:  { officers{}, globalItems[] }
}
```

---

## Stack tecnico

| Tecnologia | Uso |
|---|---|
| Vue 3 + `<script setup>` | Framework UI, composables reattivi |
| Vue Router 4 | Routing lazy-loaded con meta SEO |
| Tailwind CSS 3 | Styling con tema custom `ogame.*` |
| Vite 7 + vite-plugin-pwa | Build e Progressive Web App |
| `localStorage` | Persistenza profili (no Vuex/Pinia) |

---

## Avvio locale

```bash
npm install
npm run dev       # dev server → http://localhost:5173
npm run build     # build produzione in dist/
npm run preview   # anteprima build locale
```

---

## i18n

Quattro lingue supportate in `src/locales/`: **IT** (primaria), **EN**, **DE**, **FR**.  
DE e FR sono parziali — le chiavi mancanti ricadono in cascata su EN poi IT.

Convenzioni chiavi: `lbl_*` label, `btn_*` bottoni, `msg_*` messaggi, `opt_*` opzioni select.

---

## Struttura del progetto

```
src/
├── composables/
│   ├── useProfiles.js       # stato globale + persistenza localStorage
│   ├── useOgameFormulas.js  # formule di gioco (miniere, crawler, LF)
│   ├── useStrategy.js       # algoritmo greedy planner
│   └── useLanguage.js       # i18n con fallback chain
├── data/
│   └── ogame_db.js          # database completo edifici/ricerche/navi (~25 KB)
├── views/                   # pagine lazy-loaded
├── components/
│   └── PlanetCard.vue       # card pianeta con ricerche LF collassabili
├── locales/                 # it.json, en.json, de.json, fr.json
└── services/
    └── rssFeedService.js    # feed RSS OGame con fallback CORS proxy

util/
├── OValue_Exporter_v3.user.js   # userscript raccolta dati OGame
└── ogame_shop_data.json         # prezzi shop di riferimento
```

---

## Licenza

MIT
