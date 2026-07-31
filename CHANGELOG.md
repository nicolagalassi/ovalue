# Changelog

Tutte le modifiche degne di nota a questo progetto sono documentate qui.
Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.1.0/).

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
