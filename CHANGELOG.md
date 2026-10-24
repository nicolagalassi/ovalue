# Changelog

Tutte le modifiche degne di nota a questo progetto sono documentate qui.
Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.1.0/).

## App — Production Planner

### Aggiunto
- **Nomi dei pianeti nei blocchi della roadmap.** Gli upgrade raggruppati indicavano
  solo il numero di pianeti ("Metallo 48 ×8"), senza dire su quali intervenire.
- **Potenziamento Collezionista Rocktal (ricerca LF T18)** fra i candidati del planner.
  Non dà metallo diretto: amplifica il `collFactor`, che agisce su bonus di classe
  (+25%), moltiplicatore crawler e cap crawler del Geologo. Candidabile solo con
  classe simulata Collezionista; il guadagno è **misurato** ricalcolando la produzione
  di tutti i pianeti, non stimato con una formula chiusa. Badge "indiretto" nella
  roadmap e nel selettore, perché un Δ positivo senza bonus metallo sembrerebbe un errore.
- **Cache del piano per profilo.** Target, selezione ricerche LF, lifeform per pianeta,
  risultato e spunte sopravvivono al cambio pagina. Scrittura posticipata di 400 ms
  (il piano pesa ~150 KB) con flush su smontaggio e `pagehide`; pruning ai 5 profili
  più recenti.
- **Avviso dati non allineati.** Al calcolo si registra un'impronta del Production Core:
  se i dati cambiano dopo, il piano resta visibile e compare un avviso con pulsante
  *Ricalcola*, invece di sparire in silenzio.

### Corretto
- **Raggruppamento della roadmap**: univa qualsiasi step consecutivo dello stesso tipo
  ignorando il livello, producendo range aggregati (es. `15 → 17`) che non
  corrispondono ad alcun upgrade reale. Ora unisce solo salti di livello identici.
- La classe `other` mostrava la chiave grezza `opt_other`: mappata su `opt_general`.

### Cambiato
- Roadmap più leggibile: nomi pianeti 12px, nome ricerca e tagliando tier 11px,
  contatore `×N` e badge più contrastati. Selettore ricerche LF su griglia a colonne
  (prima `flex-wrap`, con le chip sfalsate per via dei nomi di lunghezza diversa).

## App — Shopping List

### Aggiunto
- Icone OGame per i nuovi item: amplificatori di risorse e spedizioni, computer
  spedizioni, mercante di risorse, relocazione, offerte mercante ferri vecchi.
- **Stima in euro del carrello** sul taglio di Materia Oscura selezionato, con il
  numero di tagli interi necessari. Il selettore tagli MO è diventato selezionabile.
- Totale del carrello spostato **sopra** la lista e ingrandito: prima era in fondo,
  oltre lo scroll. Ora scorre solo l'elenco degli articoli.

### Cambiato
- Amplificatori di risorse/spedizioni e computer spedizioni non sono più marcati
  "Bronzo": in gioco portano quell'etichetta ma non esistono altri tagli, quindi sono
  item unici. I carrelli salvati vengono normalizzati al caricamento.

## App — Production Core

### Aggiunto
- Campo **Ampl. Risorse** (ex "Item Aggiuntivi") con i tagli reali 15/20/25/30/40%
  al posto dell'input libero, e corrispondente target nella modifica massiva. I valori
  fuori scala già salvati restano selezionabili.

### Corretto
- Le tendine native si chiudevano e riaprivano da sole: ad ogni re-render Vue riscrive
  l'attributo `value` di tutte le `<option>` anche se identico, e una mutazione DOM
  dentro un `<select>` aperto ne invalida il popup in Chrome. Risolto con `v-memo`
  sulle liste di opzioni (Pack Exchange, Production Core, Impostazioni).

## OValue Exporter — [4.2.0]

### Corretto
- **Amplificatore risorse *per spedizioni* escluso** dalla produzione dei pianeti.
  Condivide il prefisso con l'amplificatore di produzione
  (`Amplificatore risorse per spedizioni (25 %)` vs `Amplificatore di risorse (20 %) Bronzo`)
  e veniva conteggiato come bonus minerario, gonfiando la produzione simulata. Ora
  finisce nel tracker scadenze, dov'è corretto.
- **Riconoscimento sul solo nome dell'item.** I tooltip DOM hanno forma
  `Nome|<html descrizione>`: la descrizione dell'amplificatore risorse cita
  "metallo, cristallo e deuterio" e termina con "Bronzo", e veniva letta come
  amplificatore di metallo Bronzo (+10%). Ora si confronta solo la parte prima della `|`.
- La percentuale deve essere seguita da `%` ed essere compresa fra 1 e 100: evita di
  agganciare numeri casuali presenti nel nome.
- Pagina Impero: fra più item sullo stesso pianeta si tiene il valore più alto
  (`Math.max`), come già faceva l'amplificatore di metallo.

## OValue Exporter — [4.0.0]

### Aggiunto
- **Production Core dentro lo script** (`util/OValue_Exporter_v4.user.js`). Un riquadro
  riassuntivo in **cima al pannello** (sotto nick e classe) mostra la **produzione di
  metallo su 24h** calcolata dai pianeti già raccolti, **senza aprire l'app**.
- **Simulatore di classe con un solo toggle.** Due pulsanti — Collezionista ⟷
  Generale/Esploratore — per vedere la produzione «what-if» al variare della classe
  (es. da Esploratore a Collezionista), con **delta assoluto e percentuale** rispetto
  alla classe attuale. Generale ed Esploratore sono accorpati in un unico tasto perché
  danno lo stesso metallo (solo Collezionista modifica la produzione mineraria),
  coerentemente con il modello di OValue.
- **Pannello più leggibile:** la produzione è in evidenza in alto; nick e classe
  vivono nell'hero e non sono più duplicati nella sezione Panoramica.
  - I numeri usano **le stesse formule** del production core dell'app
    (`calcDailyProduction` / `calcLFResearchBonus`): la simulazione non modifica **alcun**
    dato di gioco ed è pura visualizzazione (nessuna nuova chiamata al server, nessun
    timer/loop, nessuna azione di gioco).
- Il nuovo script è il **successore dell'exporter**: tutte le funzioni di raccolta ed
  **esportazione** dati verso OValue restano invariate.

## OValue Exporter — [3.9.0]

### Aggiunto
- **Ricerche LF attive e livelli letti dall'API.** Le ricerche LF attive per pianeta
  (`selectedSpeciesTechnologyIds`, filtrate alle sole ricerche) e tutti i livelli
  (`speciesResearches`, incluse le non attive) arrivano da `accountInfo`: le sezioni
  «Bonus LF» e «Ricerche LF» del pannello si completano **da sole** al caricamento
  della Panoramica, **senza aprire la pagina Bonus LF né i singoli pianeti**.
  - Il **bonus metallo** non è un valore inviato dallo script: è una **percentuale
    calcolata da OValue** dai livelli delle ricerche LF **attive** di ogni pianeta
    (più edifici amplificatori e livello LF). Lo script fornisce le ricerche attive e
    i livelli; il calcolatore produce la %.
  - La pagina Bonus LF resta solo un fallback per l'aggregato %, che il calcolatore
    ignora quando ha le ricerche per pianeta.

### Cambiato
- Il pannello non mostra più un fuorviante «0%» nella sezione LifeForm quando i dati
  arrivano dall'API; indica invece che bonus e ricerche sono letti dall'API.

## OValue Exporter — [3.8.0]

### Aggiunto
- **Classe alleanza** (Guerriero / Commerciante / Ricercatore), prima non catturata,
  ora esportata verso OValue. La classe **Commerciante** applica il **+5%** alla
  produzione mineraria nel calcolatore.
  - Fonte primaria: `accountInfo.allianceClassId` (mappa ufficiale
    **1 = Guerriero, 2 = Commerciante, 3 = Ricercatore**).
  - Fallback: lettura dal DOM della pagina Alleanza (classi CSS neutre rispetto alla
    lingua, con fallback sui tooltip IT/EN/DE/FR).
  - Mostrata nel pannello, sezione Panoramica (etichette IT/EN/DE/FR).
- `util/accountinfo-sample.json` — esempio anonimizzato della risposta `accountInfo`
  di OGame v13, come documentazione dello schema letto dallo script.

### Cambiato
- **Fonte dati dell'impero → `accountInfo` (OGame v13 External Data Export)** come
  sorgente primaria per miniere, crawler, edifici/ricerche Forme di Vita, livelli LF,
  plasma e classi. Una sola risposta contiene tutti i pianeti.
  - Letta **una volta** al caricamento pagina, mai in polling, senza `cp=`
    (conforme ad `AGENTS.md` §4.1/§4.2).
  - Nuovi helper: `callAccountInfo()`, `accToFlatPlanet()`, `applyAccountInfoMeta()`,
    `fetchApiPlanets()`.
  - Livelli LF per specie (`701–704` → 1–4), classe giocatore e classe alleanza
    arrivano direttamente da `accountInfo`.
- Helper condiviso `parseLfFromApi()` che elimina la logica duplicata di decodifica
  delle chiavi LF tra i percorsi di raccolta.

### Corretto
- **Endpoint impero non più funzionante su v13**: il vecchio
  `page=ajax&component=empire` restituiva `405 Method Not Allowed` su OGame 13.0.0,
  rompendo l'idratazione miniere/LF cross-pianeta al caricamento pagina. Sostituito
  da `accountInfo`; l'endpoint legacy resta solo come fallback per server pre-v13.

### Conformità
- Tutte le nuove chiamate partono solo al caricamento pagina, mai su
  timer/loop/auto-refresh, mai con `cp=`. Ogni scelta rilevante è commentata con
  riferimento ad `AGENTS.md`.

## App OValue

### Cambiato
- `src/composables/useProfiles.js`: entrambi i percorsi di import mappano
  `allianceClass` → `production.settings.allyClass` (`trader` → `trader`, altrimenti
  `none`).

## Documentazione

### Aggiunto
- `AGENTS.md` — regole di conformità del team OGame Origin per i tool di terze parti.
- `API-NOTES.md` — mappa delle API OGame usabili dal tool, con i vincoli di conformità
  al punto d'uso; annotato il 405 dell'endpoint `empire` su v13.
- Callout in `CLAUDE.md` che rimandano ad `AGENTS.md` e `API-NOTES.md`.

---

### Riferimento — ID ufficiali (verificati su `alaingilbert/ogame`)

| Campo | Mappatura |
|---|---|
| `characterClassId` | 1 = Collezionista · 2 = Generale · 3 = Esploratore |
| `allianceClassId` | 1 = Guerriero · 2 = Commerciante · 3 = Ricercatore |
| specie `701–704` | Humans · Rocktal · Mechas · Kaelesh |

[3.8.0]: https://github.com/nicolagalassi/ovalue
