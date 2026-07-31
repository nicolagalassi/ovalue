// ==UserScript==
// @name         OValue Exporter
// @namespace    https://greasyfork.org/it/users/1546037-nicolagalassi
// @version      3.9.0
// @description  Raccoglie i dati dell'impero navigando per le pagine e li sincronizza con OValue
// @author       OValue
// @license      MIT
// @match        https://*.ogame.gameforge.com/game/index.php*
// @match        https://ovalue.net/*
// @match        https://www.ovalue.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ogame.gameforge.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @run-at       document-idle
// @downloadURL  https://update.greasyfork.org/scripts/574448/OValue%20Exporter.user.js
// @updateURL    https://update.greasyfork.org/scripts/574448/OValue%20Exporter.meta.js
// ==/UserScript==

(async function () {
    'use strict';

    // ── BRIDGE MODE ──────────────────────────────────────────────────────────
    function syncToOValue() {
        // Sincronizza la preferenza lingua da OValue → GM_setValue
        // così l'exporter la legge su ogame.gameforge.com
        const ovLang = localStorage.getItem('ogame_lang') || 'it';
        GM_setValue('ovalue_ui_lang', ovLang);

        const servers = GM_getValue('ovalue_servers', []);
        const allData = {};
        for (const srv of servers) {
            const d = GM_getValue('ovalue_data_' + srv, null);
            if (!d) continue;
            if (d.planets && d.planetLifeforms) {
                d.planets.forEach(p => {
                    if (p.id != null && d.planetLifeforms[p.id])
                        p.lifeform = d.planetLifeforms[p.id];
                });
            }
            allData[srv] = d;
        }
        if (!Object.keys(allData).length) return;
        localStorage.setItem('ovalue_exporter_pending', JSON.stringify(allData));
        window.dispatchEvent(new CustomEvent('ovalue-exporter-sync', { detail: allData }));
    }

    if (window.location.hostname.includes('ovalue.net')) {
        syncToOValue();
        return;
    }

    // ── LINGUA ───────────────────────────────────────────────────────────────
    // Problema: ogame-language meta e html lang riflettono la lingua del SERVER (es. "it" per
    // s275-it), non la lingua di VISUALIZZAZIONE scelta dall'utente nelle impostazioni OGame.
    // Soluzione: rilevare dalla pagina stessa tramite keyword note nei tooltip degli ufficiali.

    function detectDisplayLang() {
        // 1. Tooltip ufficiali (pagina Overview) — parola chiave univoca per lingua
        //    EN "Hire Commander"  DE "Anheuern Kommandant"  FR "Embaucher Commandant"  IT "Assumi Comandante"
        const offTip = document.querySelector('#officers a[data-tooltip-title]')
            ?.getAttribute('data-tooltip-title') || '';
        if (offTip) {
            if (/\bhire\b/i.test(offTip))      return 'en';
            if (/\banheuern\b/i.test(offTip))  return 'de';
            if (/\bembaucher\b/i.test(offTip)) return 'fr';
            if (/\bassumi\b/i.test(offTip))    return 'it';
        }

        // 2. Testo label del menu di navigazione
        for (const el of document.querySelectorAll('#menuTable .textlabel, #menuTable span')) {
            const t = (el.textContent || '').trim().toLowerCase();
            if (!t) continue;
            if (/(overview|empire|research|fleet|galaxy)/i.test(t))  return 'en';
            if (/(übersicht|imperium|forschung|flotte|galaxie)/i.test(t)) return 'de';
            if (/(aperçu|recherche|flotte|galaxie)/i.test(t)) return 'fr';
            if (/(panoramica|impero|ricerca|flotta|galassia)/i.test(t)) return 'it';
        }

        return null; // non rilevato su questa pagina
    }

    // Rileva dalla pagina e salva per le sessioni successive (utile su pagine senza officers)
    const _detected = detectDisplayLang();
    if (_detected) GM_setValue('ovalue_detected_lang', _detected);

    // GAME_LANG: lingua effettiva di visualizzazione OGame
    // Priorità: rilevata dalla pagina > persistita da sessione precedente > html lang > meta > 'it'
    const GAME_LANG = (
        _detected ||
        GM_getValue('ovalue_detected_lang', null) ||
        document.documentElement.lang?.split(/[-_]/)[0]?.toLowerCase() ||
        document.querySelector('meta[name="ogame-language"]')?.content?.toLowerCase() ||
        'it'
    ).replace(/[-_].*/,'');  // normalizza "it-IT" → "it"

    // UI_LANG: lingua del pannello exporter
    // Priorità: preferenza OValue (bridge da ovalue.net) > lingua rilevata nel gioco
    const UI_LANG = (GM_getValue('ovalue_ui_lang', null) || GAME_LANG).toLowerCase();

    // L = stringhe UI del pannello nella lingua scelta

    // Testi UI per le 4 lingue supportate
    const UI = {
        it: {
            overview: '👤 Panoramica', lifeform: '🧬 LifeForm', empire: '🌍 Impero',
            badgeMissing: '✗ MANCANTE', badgeOk: '✓ LETTO',
            player: 'Giocatore', pclass: 'Classe', allyClass: 'Classe All.', planets: 'Pianeti', plasma: 'Plasma',
            absent: 'assente', permanent: 'Permanente',
            dataSourceApi: '⚡ API', dataSourceDom: '📄 DOM',
            missingPlanets: n => `⚠ Pianeti Mancanti (${n})`,
            missingLf:      n => `⚠ Razze Mancanti (${n})`,
            activeLf:       n => `Razze Attive (${n})`,
            globalItems:    n => `Item Globali (${n})`,
            bonusMetal: 'Bonus Metallo', bonusClass: 'Bonus Classe',
            lfApiNote: 'Bonus e ricerche letti dall\'API — nessuna pagina da visitare.',
            lifeformLevels: 'Livelli Forme di Vita',
            activeResearches: n => `Ricerche Attive (${n})`,
            hintActiveResearches: 'Le ricerche LF attive sono state registrate.',
            lfResearch: '🔬 Ricerche LF',
            lfResearchPlanets: (n, tot) => `Pianeti con ricerche: ${n}/${tot}`,
            hintLfResearch: 'Visita la pagina <a href="?page=ingame&component=lfresearch">Ricerche LF</a> per ogni pianeta per registrare le tecnologie attive.',
            hintOverview: 'Vai alla <a href="?page=ingame&component=overview">Panoramica</a> e attendi il caricamento.',
            hintLf: 'Vai ai <a href="?page=ingame&component=lfbonuses">Bonus LifeForm</a> e attendi il caricamento.',
            hintEmpire:          url => `Vai alla <a class="ov_empire_link" href="${url}" target="_blank">pagina Impero</a> e attendi.`,
            hintMissingPlanets:  url => `Visita la <a class="ov_empire_link" href="${url}" target="_blank">pagina Impero</a> per leggerli.`,
            hintMissingLf: 'Clicca su ciascun pianeta per registrare la specie.',
            export: '⬇ Esporta Dati OValue', reset: '🗑 Svuota Cache Universo', close: '✕',
            refresh: '↻ Aggiorna Dati',
            refreshing: '↻ Aggiornamento…',
            exportOk: '✅ Dati OValue copiati negli appunti!',
            resetConfirm: srv => `Svuotare la cache per "${srv}"?`,
            resetDone: 'Cache azzerata! Ricarica la pagina per ricominciare.'
        },
        en: {
            overview: '👤 Overview', lifeform: '🧬 LifeForm', empire: '🌍 Empire',
            badgeMissing: '✗ MISSING', badgeOk: '✓ READ',
            player: 'Player', pclass: 'Class', allyClass: 'Ally Class', planets: 'Planets', plasma: 'Plasma',
            absent: 'absent', permanent: 'Permanent',
            dataSourceApi: '⚡ API', dataSourceDom: '📄 DOM',
            missingPlanets: n => `⚠ Missing Planets (${n})`,
            missingLf:      n => `⚠ Missing Species (${n})`,
            activeLf:       n => `Active Species (${n})`,
            globalItems:    n => `Global Items (${n})`,
            bonusMetal: 'Metal Bonus', bonusClass: 'Class Bonus',
            lfApiNote: 'Bonuses and researches read from the API — no page to visit.',
            lifeformLevels: 'Lifeform Levels',
            activeResearches: n => `Active Researches (${n})`,
            hintActiveResearches: 'Active LF researches have been recorded.',
            lfResearch: '🔬 LF Research',
            lfResearchPlanets: (n, tot) => `Planets with research: ${n}/${tot}`,
            hintLfResearch: 'Visit the <a href="?page=ingame&component=lfresearch">LF Research</a> page for each planet to record active technologies.',
            hintOverview: 'Go to <a href="?page=ingame&component=overview">Overview</a> and wait for loading.',
            hintLf: 'Go to <a href="?page=ingame&component=lfbonuses">LifeForm Bonuses</a> and wait.',
            hintEmpire:         url => `Go to the <a class="ov_empire_link" href="${url}" target="_blank">Empire page</a> and wait.`,
            hintMissingPlanets: url => `Visit the <a class="ov_empire_link" href="${url}" target="_blank">Empire page</a> to collect them.`,
            hintMissingLf: 'Click each planet to register its species.',
            export: '⬇ Export OValue Data', reset: '🗑 Clear Universe Cache', close: '✕',
            refresh: '↻ Refresh Data', refreshing: '↻ Refreshing…',
            exportOk: '✅ OValue data copied to clipboard!',
            resetConfirm: srv => `Clear cache for "${srv}"?`,
            resetDone: 'Cache cleared! Reload the page to start over.'
        },
        de: {
            overview: '👤 Übersicht', lifeform: '🧬 Lebensform', empire: '🌍 Imperium',
            badgeMissing: '✗ FEHLT', badgeOk: '✓ GELESEN',
            player: 'Spieler', pclass: 'Klasse', allyClass: 'Allianz-Kl.', planets: 'Planeten', plasma: 'Plasma',
            absent: 'abwesend', permanent: 'Permanent',
            dataSourceApi: '⚡ API', dataSourceDom: '📄 DOM',
            missingPlanets: n => `⚠ Fehlende Planeten (${n})`,
            missingLf:      n => `⚠ Fehlende Spezies (${n})`,
            activeLf:       n => `Aktive Spezies (${n})`,
            globalItems:    n => `Globale Items (${n})`,
            bonusMetal: 'Metall-Bonus', bonusClass: 'Klassen-Bonus',
            lfApiNote: 'Boni und Forschungen aus der API — keine Seite nötig.',
            lifeformLevels: 'Lebensform-Stufen',
            activeResearches: n => `Aktive Forschungen (${n})`,
            hintActiveResearches: 'Aktive LF-Forschungen wurden gespeichert.',
            lfResearch: '🔬 LF-Forschungen',
            lfResearchPlanets: (n, tot) => `Planeten mit Forschung: ${n}/${tot}`,
            hintLfResearch: 'Besuche die <a href="?page=ingame&component=lfresearch">LF-Forschungsseite</a> für jeden Planeten, um aktive Technologien zu erfassen.',
            hintOverview: 'Gehe zur <a href="?page=ingame&component=overview">Übersicht</a> und warte auf das Laden.',
            hintLf: 'Gehe zu den <a href="?page=ingame&component=lfbonuses">Lebensform-Boni</a> und warte.',
            hintEmpire:         url => `Gehe zur <a class="ov_empire_link" href="${url}" target="_blank">Imperium-Seite</a> und warte.`,
            hintMissingPlanets: url => `Besuche die <a class="ov_empire_link" href="${url}" target="_blank">Imperium-Seite</a> um sie zu lesen.`,
            hintMissingLf: 'Klicke jeden Planeten an, um seine Spezies zu registrieren.',
            export: '⬇ OValue-Daten exportieren', reset: '🗑 Universum-Cache leeren', close: '✕',
            refresh: '↻ Daten aktualisieren', refreshing: '↻ Wird geladen…',
            exportOk: '✅ OValue-Daten in die Zwischenablage kopiert!',
            resetConfirm: srv => `Cache leeren für "${srv}"?`,
            resetDone: 'Cache geleert! Seite neu laden.'
        },
        fr: {
            overview: '👤 Aperçu', lifeform: '🧬 Forme de vie', empire: '🌍 Empire',
            badgeMissing: '✗ MANQUANT', badgeOk: '✓ LU',
            player: 'Joueur', pclass: 'Classe', allyClass: "Classe All.", planets: 'Planètes', plasma: 'Plasma',
            absent: 'absent', permanent: 'Permanent',
            dataSourceApi: '⚡ API', dataSourceDom: '📄 DOM',
            missingPlanets: n => `⚠ Planètes manquantes (${n})`,
            missingLf:      n => `⚠ Espèces manquantes (${n})`,
            activeLf:       n => `Espèces actives (${n})`,
            globalItems:    n => `Items globaux (${n})`,
            bonusMetal: 'Bonus métal', bonusClass: 'Bonus classe',
            lfApiNote: 'Bonus et recherches lus depuis l\'API — aucune page à visiter.',
            lifeformLevels: 'Niveaux des formes de vie',
            activeResearches: n => `Recherches actives (${n})`,
            hintActiveResearches: 'Les recherches LF actives ont été enregistrées.',
            lfResearch: '🔬 Recherches LF',
            lfResearchPlanets: (n, tot) => `Planètes avec recherches : ${n}/${tot}`,
            hintLfResearch: 'Visitez la page <a href="?page=ingame&component=lfresearch">Recherches LF</a> pour chaque planète afin d\'enregistrer les technologies actives.',
            hintOverview: "Allez à l'<a href=\"?page=ingame&component=overview\">Aperçu</a> et attendez le chargement.",
            hintLf: 'Allez aux <a href="?page=ingame&component=lfbonuses">Bonus Formes de vie</a> et attendez.',
            hintEmpire:         url => `Allez à la <a class="ov_empire_link" href="${url}" target="_blank">page Empire</a> et attendez.`,
            hintMissingPlanets: url => `Visitez la <a class="ov_empire_link" href="${url}" target="_blank">page Empire</a> pour les collecter.`,
            hintMissingLf: 'Cliquez sur chaque planète pour enregistrer son espèce.',
            export: '⬇ Exporter les données OValue', reset: '🗑 Vider le cache univers', close: '✕',
            refresh: '↻ Actualiser les données', refreshing: '↻ Chargement…',
            exportOk: '✅ Données OValue copiées dans le presse-papiers !',
            resetConfirm: srv => `Vider le cache pour "${srv}" ?`,
            resetDone: 'Cache vidé ! Rechargez la page.'
        }
    };
    const L = UI[UI_LANG] || UI[GAME_LANG] || UI.en;

    // Nomi localizzati ufficiali per ufficiali e classi giocatore (usati solo nel pannello UI)
    const OFF_NAMES = {
        it: { commander: 'Comandante', admiral: 'Ammiraglio', engineer: 'Ingegnere', geologist: 'Geologo', technocrat: 'Tecnico' },
        en: { commander: 'Commander',  admiral: 'Admiral',    engineer: 'Engineer',   geologist: 'Geologist', technocrat: 'Technocrat' },
        de: { commander: 'Kommandant', admiral: 'Admiral',    engineer: 'Ingenieur',  geologist: 'Geologe',   technocrat: 'Technokrat' },
        fr: { commander: 'Commandant', admiral: 'Amiral',     engineer: 'Ingénieur',  geologist: 'Géologue',  technocrat: 'Technocrate' }
    }[UI_LANG] || { commander: 'Commander', admiral: 'Admiral', engineer: 'Engineer', geologist: 'Geologist', technocrat: 'Technocrat' };

    const CLASS_NAMES = {
        it: { collector: 'Collezionista', general: 'Generale',  explorer: 'Esploratore' },
        en: { collector: 'Collector',     general: 'General',   explorer: 'Explorer' },
        de: { collector: 'Sammler',       general: 'Allgemein', explorer: 'Entdecker' },
        fr: { collector: 'Collecteur',    general: 'Général',   explorer: 'Explorateur' }
    }[UI_LANG] || { collector: 'Collector', general: 'General', explorer: 'Explorer' };

    // Nomi localizzati classi alleanza (solo per il pannello UI; storage resta neutro)
    const ALLY_NAMES = {
        it: { warrior: 'Guerriero', trader: 'Commerciante', researcher: 'Ricercatore' },
        en: { warrior: 'Warrior',   trader: 'Trader',       researcher: 'Researcher' },
        de: { warrior: 'Krieger',   trader: 'Händler',      researcher: 'Forscher' },
        fr: { warrior: 'Guerrier',  trader: 'Commerçant',   researcher: 'Chercheur' }
    }[UI_LANG] || { warrior: 'Warrior', trader: 'Trader', researcher: 'Researcher' };

    // ── COSTANTI ─────────────────────────────────────────────────────────────
    const SERVER_KEY  = window.location.hostname;
    const STORAGE_KEY = 'ovalue_data_' + SERVER_KEY;
    const PANEL_KEY     = 'ovalue_panel_state';
    const PANEL_POS_KEY = 'ovalue_panel_pos';
    const PANEL_COL_KEY = 'ovalue_panel_collapsed';

    const LIFEFORM_CLASS = {
        lifeform1: 'Humans',
        lifeform2: 'Rocktal',
        lifeform3: 'Mechas',
        lifeform4: 'Kaelesh'
    };

    // CSS class names = chiavi di storage (language-neutral)
    const OFFICER_ROLES = ['commander', 'admiral', 'engineer', 'geologist', 'technocrat'];

    // Classi alleanza OGame — nomi CSS interni (language-neutral), come per la classe giocatore.
    // Storage neutro: 'warrior' | 'trader' | 'researcher' | 'none'. A OValue serve soprattutto
    // 'trader' (Commerciante), che dà +5% alla produzione mineraria.
    const ALLIANCE_CLASS_CSS = ['warrior', 'trader', 'researcher'];

    // ── STATO ────────────────────────────────────────────────────────────────
    let d = GM_getValue(STORAGE_KEY, {});
    const DEFAULTS = {
        overview_collected: false, lf_collected: false, empire_collected: false, empire_api: false,
        alliance_collected: false,
        playerName: '', playerClass: 'none', allianceClass: 'none',
        universeName: '', universeSpeed: 1,
        officers: {}, lfBonuses: { metal: '0%', classBonus: '0%' },
        settings: { plasma: 0 }, planets: [], planetLifeforms: {}, globalItems: []
    };
    for (const [k, v] of Object.entries(DEFAULTS)) {
        if (d[k] === undefined)
            d[k] = typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v;
    }

    const knownServers = GM_getValue('ovalue_servers', []);
    if (!knownServers.includes(SERVER_KEY)) {
        knownServers.push(SERVER_KEY);
        GM_setValue('ovalue_servers', knownServers);
    }

    // ── HELPERS DOM ──────────────────────────────────────────────────────────
    const meta          = (name) => document.querySelector(`meta[name="${name}"]`)?.content ?? null;
    const getPlanetId   = () => { const v = meta('ogame-planet-id'); return v ? parseInt(v) : null; };
    const getPlanetType = () => meta('ogame-planet-type');
    const getPlayerName = () => meta('ogame-player-name') || document.querySelector('#playerName')?.textContent?.trim() || '';

    function getSidebarPlanets() {
        return [...document.querySelectorAll('#planetList .smallplanet')].flatMap(el => {
            const link   = el.querySelector('.planetlink');
            const nameEl = el.querySelector('.planet-name');
            if (!link) return [];
            let id = null;
            try { id = parseInt(new URL(link.href, location.origin).searchParams.get('cp')) || null; } catch (_) {}
            // OGLight nasconde le coordinate nel DOM — prendo dal tooltip se mancano
            const coordsEl = el.querySelector('.planet-koords');
            let raw = coordsEl ? coordsEl.textContent.replace(/[^0-9:]/g, '') : '';
            if (!raw.match(/^\d+:\d+:\d+$/)) {
                const tip = link.getAttribute('data-tooltip-title') || '';
                const cm  = tip.match(/\[(\d+:\d+:\d+)\]/);
                raw = cm ? cm[1] : '';
            }
            const m = raw.match(/^(\d+):(\d+):(\d+)$/);
            if (!m) return [];
            return [{ id, name: nameEl?.textContent.trim() || '', coords: raw, pos: parseInt(m[3]) }];
        });
    }

    function captureLifeformsFromSidebar() {
        const LF_TOOLTIP = {
            'humans': 'Humans', 'umani': 'Humans', 'menschen': 'Humans', 'humains': 'Humans',
            'rocktal': 'Rocktal',
            'mechas': 'Mechas', 'mecha': 'Mechas',
            'kaelesh': 'Kaelesh'
        };
        for (const el of document.querySelectorAll('#planetList .smallplanet')) {
            const link = el.querySelector('.planetlink');
            if (!link) continue;
            let id = null;
            try { id = parseInt(new URL(link.href, location.origin).searchParams.get('cp')) || null; } catch (_) {}
            if (!id) continue;
            const tip = link.getAttribute('data-tooltip-title') || '';
            const lfm = tip.match(/(?:forma di vita|lifeform|lebensform|forme de vie):\s*(\w+)/i);
            if (!lfm) continue;
            const name = LF_TOOLTIP[lfm[1].toLowerCase()] || null;
            if (name) d.planetLifeforms[id] = name;
        }
    }

    function save() { GM_setValue(STORAGE_KEY, d); }

    // ── CLASSE ALLEANZA ──────────────────────────────────────────────────────
    // Rileva la classe alleanza dal DOM già presente nella pagina che l'utente ha aperto
    // (tipicamente la pagina Alleanza). Leggere il DOM di una pagina caricata dall'utente
    // NON è una chiamata di background e non genera attività in galassia (AGENTS.md §4):
    // nessun fetch dedicato, nessun timer, nessun cambio pianeta.
    // Priorità: classe CSS language-neutral (robusta e indipendente dalla lingua) →
    // fallback su tooltip a parole chiave, ristretto agli elementi che sono davvero
    // l'indicatore di classe alleanza (evita falsi positivi su nomi membri, ecc.).
    function detectAllianceClass() {
        const candidates = document.querySelectorAll(
            '.allianceclass.sprite, .sprite.allianceclass, [class*="allianceclass"] .sprite, [class*="allianceclass"]'
        );
        for (const el of candidates) {
            const cls = ALLIANCE_CLASS_CSS.find(c => el.classList.contains(c));
            if (cls) return cls;
        }
        // Fallback lingua-dipendente (IT/EN/DE/FR) SOLO su elementi realmente marcati come classe alleanza
        for (const el of document.querySelectorAll('[class*="allianceclass"][data-tooltip-title], [class*="allianceClass"][data-tooltip-title]')) {
            const t = el.getAttribute('data-tooltip-title') || '';
            if (/(commerciante|trader|händler|handler|commer[çc]ant)/i.test(t)) return 'trader';
            if (/(guerriero|warrior|krieger|guerrier)/i.test(t))               return 'warrior';
            if (/(ricercatore|researcher|forscher|chercheur)/i.test(t))        return 'researcher';
        }
        return null;
    }

    function collectAllianceClass() {
        const detected = detectAllianceClass();
        if (!detected) return;
        d.alliance_collected = true;
        if (d.allianceClass !== detected) d.allianceClass = detected;
        save();
        updatePanel();
    }

    // ── RACCOLTA DATI ────────────────────────────────────────────────────────

    async function collectUniverseInfo() {
        d.playerName   = d.playerName   || getPlayerName();
        d.universeName = d.universeName || meta('ogame-universe-name') || '';
        if (!d.universeSpeed || d.universeSpeed === 1)
            d.universeSpeed = parseInt(meta('ogame-universe-speed')) || 1;

        if (!d.universeName || d.universeSpeed === 1) {
            try {
                const text = await (await fetch('/api/serverData.xml')).text();
                const xml  = new DOMParser().parseFromString(text, 'text/xml');
                d.universeName  = xml.querySelector('name')?.textContent  || d.universeName;
                d.universeSpeed = parseInt(xml.querySelector('speed')?.textContent) || d.universeSpeed;
            } catch (_) {}
        }
        save();
        updatePanel();
    }

    function captureLifeform(retries = 6) {
        if (getPlanetType() === 'moon') return;
        const planetId = getPlanetId();
        if (!planetId) return;

        const icon = document.querySelector('#lifeform .lifeform-item-icon');
        if (!icon) {
            if (retries > 0) setTimeout(() => captureLifeform(retries - 1), 500);
            return;
        }

        let detected = 'none';
        for (const [cls, name] of Object.entries(LIFEFORM_CLASS)) {
            if (icon.classList.contains(cls)) { detected = name; break; }
        }
        if (d.planetLifeforms[planetId] !== detected) {
            d.planetLifeforms[planetId] = detected;
            save();
            updatePanel();
        }
    }

    function collectOverview() {
        d.playerName = getPlayerName() || d.playerName;

        // Classe giocatore: usa CSS class (language-neutral), salva valore neutro
        const sprite = document.querySelector('#characterclass .sprite');
        if (sprite) {
            if      (sprite.classList.contains('miner'))    d.playerClass = 'collector';
            else if (sprite.classList.contains('warrior'))  d.playerClass = 'general';
            else if (sprite.classList.contains('explorer')) d.playerClass = 'explorer';
        }

        // Ufficiali: usa CSS class come chiave (language-neutral)
        const officers = {};
        for (const role of OFFICER_ROLES) {
            const el = document.querySelector(`#officers a.${role}`);
            if (!el) continue;
            const active   = el.classList.contains('on');
            const timerEl  = el.querySelector('.custom-timer-base.custom-timer-officer');
            let timeRemaining = timerEl?.textContent.trim() || '';

            if (!timeRemaining && active) {
                // Timer vuoto = ufficiale attivo per >6 giorni.
                // Il tempo rimanente è nel tooltip: "Hire X|Still active for more than 6 days"
                const tooltipTitle = el.getAttribute('data-tooltip-title') || '';
                const afterPipe    = tooltipTitle.split('|').slice(1).join('|');
                // Estrae qualsiasi numero direttamente associato a una parola "giorni/days/..."
                // Copre: "per altri 66 giorni", "more than 6 days", "für weitere 80 Tage", ecc.
                const m = afterPipe.match(/(\d+)\s*(?:giorni?|days?|Tage?|jours?)/i);
                if (m) {
                    timeRemaining = m[1] + 'd';
                } else if (/active|attivo|aktiv|actif/i.test(afterPipe)) {
                    timeRemaining = '>6d';
                }
            }

            if (!timeRemaining) timeRemaining = L.permanent;
            officers[role] = { active, timeRemaining };
        }
        d.officers = officers;
        d.overview_collected = true;
        // Opportunistico: alcune versioni OGame mostrano la classe alleanza in overview.
        // Se presente la leggiamo qui (stesso DOM già caricato), altrimenti resta la
        // rilevazione sulla pagina Alleanza.
        const ac = detectAllianceClass();
        if (ac) { d.allianceClass = ac; d.alliance_collected = true; }
        captureLifeformsFromSidebar();
        captureLifeform();
        save();
        updatePanel();
    }

    function collectLFBonuses() {
        const bonuses = { metal: '0%', classBonus: '0%' };
        const activeResearches = [];

        // --- Estrai bonus totali per categoria dalla sezione subCategory ---
        // La pagina usa elementi con .subCategoryTitle + .subCategoryBonus dentro wrapper vari.
        // Tentiamo sia [data-toggable] (struttura vecchia) che ricerca diretta delle coppie titolo+bonus.
        document.querySelectorAll('[data-toggable]').forEach(el => {
            const key = el.getAttribute('data-toggable');
            if (!key) return;
            if (/^\d{3,5}$/.test(key)) {
                const id = parseInt(key);
                if (id >= 1000 && id < 5000) activeResearches.push(id);
                return;
            }
            const titleEl = el.querySelector('.subCategoryTitle');
            const bonusEl = el.querySelector('.subCategoryBonus');
            if (!titleEl || !bonusEl) return;
            const title = (titleEl.getAttribute('aria-label') || titleEl.textContent).trim();
            const bonus = bonusEl.textContent.replace(/Totale:|Total:|Gesamt:|Total\s*:/gi, '').trim();
            if (!bonus) return;
            if (/^(Metallo|Metal|Metall|M[eé]tal)$/i.test(title))  bonuses.metal = bonus;
            if (/^(Collezionista|Collector|Sammler|Collecteur)$/i.test(title)) bonuses.classBonus = bonus;
        });

        // Fallback: cerca la sezione Metallo cercando la coppia titolo+bonus più vicina
        if (bonuses.metal === '0%') {
            document.querySelectorAll('.subCategoryTitle').forEach(titleEl => {
                const title = titleEl.textContent.trim();
                if (!/^(Metallo|Metal|Metall|M[eé]tal)$/i.test(title)) return;
                const parent = titleEl.closest('div, section, li') || titleEl.parentElement;
                if (!parent) return;
                const bonusEl = parent.querySelector('.subCategoryBonus');
                if (!bonusEl) return;
                bonuses.metal = bonusEl.textContent.replace(/Totale:|Total:|Gesamt:|Total\s*:/gi, '').trim() || '0%';
            });
        }

        // --- Estrai livello della lifeform attiva dalla pagina lfbonuses ---
        // Struttura: <div class="lifeform-item-icon small lifeformX"><span>LVL</span></div>
        const lfLevels = d.lfLevels || {};
        const activeIcon = document.querySelector('.lifeform-item-icon.small[class*="lifeform"]');
        if (activeIcon) {
            const cls = Array.from(activeIcon.classList).find(c => /^lifeform\d$/.test(c));
            const span = activeIcon.querySelector('span');
            if (cls && span) {
                const species = cls.replace('lifeform', '');
                const lvl = parseInt(span.textContent.trim()) || 0;
                if (lvl > 0) lfLevels[species] = lvl;
            }
        }
        // Fallback: struttura <lifeform-item> (alcune versioni OGame)
        document.querySelectorAll('lifeform-item').forEach(item => {
            const icon = item.querySelector('.lifeform-item-icon');
            const lvl  = item.querySelector('.currentlevel strong');
            if (!icon || !lvl) return;
            const cls = Array.from(icon.classList).find(c => /^lifeform\d$/.test(c));
            if (!cls) return;
            lfLevels[cls.replace('lifeform', '')] = parseInt(lvl.textContent.trim()) || 0;
        });

        d.lfBonuses = bonuses;
        d.activeResearches = activeResearches;
        d.lfLevels = lfLevels;
        d.lf_collected = true;
        captureLifeform();
        save();
        updatePanel();
    }

    // ── COSTANTI EMPIRE API ──────────────────────────────────────────────────
    // Chiavi LF edifici/ricerche: 1{specie}{tipo}{sub:02d}  tipo1=edificio tipo2=ricerca
    const LF_NUM_MAP   = { '1': 'Humans', '2': 'Rocktal', '3': 'Mechas', '4': 'Kaelesh' };
    const empireApiKey = k => /^1[1-4][12]\d{2}$/.test(k);
    const apiKeyToOgId = k => {
        const sp = parseInt(k[1]), type = parseInt(k[2]), sub = parseInt(k.slice(3));
        return String(sp * 1000 + (type === 2 ? 100 : 0) + sub);
    };
    // Edifici amplificatori LF rilevanti per OValue
    const AMP_BLD_KEYS = ['11111', '13107', '13111', '14107'];

    // Estrae ricerche + edifici amplificatori LF da un pianeta della risposta API empire.
    // Helper condiviso da applyAPIToPlanets() e collectEmpire() per evitare la duplicazione
    // della logica di decodifica chiavi (schema 1{specie}{tipo}{sub}, tipo2=ricerca).
    function parseLfFromApi(ap) {
        const lfResearch = {}, lfBuildings = {};
        for (const [k, v] of Object.entries(ap)) {
            if (empireApiKey(k) && parseInt(k[2]) === 2 && v > 0) lfResearch[apiKeyToOgId(k)] = v;
        }
        for (const k of AMP_BLD_KEYS) {
            if ((ap[k] || 0) > 0) lfBuildings[apiKeyToOgId(k)] = ap[k];
        }
        return { lfResearch, lfBuildings };
    }

    // Chiama l'API empire (LEGACY, server pre-v13). Su OGame v13 questo endpoint
    // risponde 405 Method Not Allowed → usato solo come fallback dopo accountInfo.
    async function callEmpireAPI() {
        const resp = await fetch(
            `https://${window.location.host}/game/index.php?page=ajax&component=empire&ajax=1&planetType=0&asJson=1`,
            { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
        );
        if (!resp.ok) throw new Error('empire HTTP ' + resp.status);
        const json = await resp.json();
        return JSON.parse(json.mergedArray).planets || [];
    }

    // ── ACCOUNTINFO — OGame v13 External Data Export (fonte primaria) ─────────
    // Endpoint ufficiale, unica risposta con TUTTI i pianeti: miniere, navi, difese,
    // edifici/ricerche LF, produzione oraria reale, ufficiali, classi, livelli LF.
    // ID ufficiali (verificati su alaingilbert/ogame): specie 701..704 → LF 1..4;
    // characterClassId 1=Collector 2=General 3=Discoverer; allianceClassId 1=Warrior
    // 2=Trader 3=Researcher.
    const SPECIES_TO_LF  = { 701: 'Humans', 702: 'Rocktal', 703: 'Mechas', 704: 'Kaelesh' };
    const CHAR_CLASS_ID  = { 1: 'collector', 2: 'general', 3: 'explorer' };
    const ALLY_CLASS_ID  = { 1: 'warrior', 2: 'trader', 3: 'researcher' };

    async function callAccountInfo() {
        const resp = await fetch(
            `https://${window.location.host}/game/index.php?page=componentOnly&component=externaldataexport&action=accountInfo&asJson=1`,
            { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
        );
        if (!resp.ok) throw new Error('accountInfo HTTP ' + resp.status);
        return resp.json();
    }

    // Converte un pianeta accountInfo nella forma "flat" (chiavi numeriche) che
    // applyAPIToPlanets()/collectEmpire() già consumano: così tutta la logica di
    // merge esistente resta invariata e riusiamo empireApiKey()/apiKeyToOgId().
    function accToFlatPlanet(p) {
        const flat = {};
        for (const src of ['buildings', 'ships', 'defenses', 'speciesBuildings', 'speciesResearches']) {
            for (const [k, v] of Object.entries(p[src] || {})) flat[k] = v;
        }
        flat.id = p.id; flat.planetID = p.id;
        // selectedSpeciesId 703 → lifeform '3' (LF_NUM_MAP)
        flat.lifeform = p.selectedSpeciesId ? (p.selectedSpeciesId - 700) : 0;
        flat.coords = `${p.galaxy}:${p.system}:${p.position}`;
        return flat;
    }

    // Applica i dati account-level di accountInfo (classi, livelli LF, ufficiali)
    // SENZA toccare d.planets (gestiti dai consumer della forma flat).
    function applyAccountInfoMeta(acc) {
        if (!acc) return;
        if (acc.playerName) d.playerName = d.playerName || acc.playerName;
        if (CHAR_CLASS_ID[acc.characterClassId]) d.playerClass = CHAR_CLASS_ID[acc.characterClassId];
        // Classe alleanza dall'ID ufficiale (autorevole, language-neutral, nessuna
        // dipendenza dai selettori DOM della pagina Alleanza).
        if (acc.allianceClassId != null) {
            d.allianceClass = ALLY_CLASS_ID[acc.allianceClassId] || 'none';
            d.alliance_collected = true;
        }
        // Livelli lifeform per specie (701..704 → 1..4)
        if (acc.species && acc.species.values) {
            d.lfLevels = d.lfLevels || {};
            for (const [sp, info] of Object.entries(acc.species.values)) {
                const n = String(parseInt(sp) - 700);
                if (info && info.level > 0) d.lfLevels[n] = info.level;
            }
        }
        // Ufficiali: solo bootstrap se la Panoramica non è mai stata letta — così non
        // sovrascriviamo il timeRemaining (scadenze) raccolto dal DOM overview.
        if (acc.officers && !d.overview_collected) {
            const off = {};
            for (const role of OFFICER_ROLES) {
                const on = !!acc.officers[role];
                off[role] = { active: on, timeRemaining: on ? '>6d' : '' };
            }
            d.officers = off;
        }

        // Ricerche LF ATTIVE per pianeta, direttamente dall'API — così la sezione
        // "Ricerche LF" si completa senza dover aprire ogni pianeta.
        // selectedSpeciesTechnologyIds = slot tech attivi (edifici + ricerche): filtriamo
        // le sole RICERCHE (tipo=2) e prendiamo il livello da speciesResearches.
        // I livelli di TUTTE le ricerche (attive e non) restano comunque in p.lfResearch
        // (da speciesResearches), quindi non serve leggere la pagina Impero per le LF non attive.
        if (acc.planets) {
            d.planetResearches = d.planetResearches || {};
            const activeUnion = new Set(Array.isArray(d.activeResearches) ? d.activeResearches : []);
            for (const [pid, p] of Object.entries(acc.planets)) {
                const levels = p.speciesResearches || {};
                const res = {};
                for (const tid of (p.selectedSpeciesTechnologyIds || [])) {
                    const k = String(tid);
                    if (!empireApiKey(k) || parseInt(k[2]) !== 2) continue; // solo ricerche
                    const lvl = levels[k] || 0;
                    if (lvl > 0) {
                        const ogId = apiKeyToOgId(k);
                        res[ogId] = lvl;
                        activeUnion.add(parseInt(ogId));
                    }
                }
                if (Object.keys(res).length) d.planetResearches[pid] = res;
            }
            d.activeResearches = [...activeUnion];
            if (Object.keys(d.planetResearches).length) {
                // Le ricerche attive (e i livelli) arrivano dall'API: la pagina Bonus LF
                // serviva solo per l'aggregato % di fallback, ora non necessario.
                d.lf_collected = true;
                d.lf_from_api = true;
            }
        }
    }

    // Sorgente unica di "pianeti API" in forma flat: prova accountInfo (v13),
    // poi ricade sul vecchio endpoint empire (server pre-v13). Chiamata SOLO al
    // page-load, mai in polling/loop (§4.1), una sola risposta per tutti i pianeti,
    // nessun cp= (§4.2).
    async function fetchApiPlanets() {
        try {
            const acc = await callAccountInfo();
            if (acc && acc.planets && Object.keys(acc.planets).length) {
                applyAccountInfoMeta(acc);
                const plasma = acc.researches ? acc.researches['122'] : null;
                d.empire_source = 'accountInfo';
                return Object.values(acc.planets).map(p => {
                    const flat = accToFlatPlanet(p);
                    if (plasma != null && flat['122'] == null) flat['122'] = plasma; // plasma = ricerca account-wide
                    return flat;
                });
            }
        } catch (e) {
            console.warn('[OValue Exporter] accountInfo non disponibile, fallback empire:', e.message);
        }
        // Fallback legacy (sui server v13 dà 405 → array vuoto → i consumer usano il DOM)
        d.empire_source = 'empire';
        try { return await callEmpireAPI(); } catch (_) { return []; }
    }

    // Costruisce/aggiorna d.planets dalla sidebar + dati API.
    // Usato quando non siamo sulla pagina Impero (nessun DOM .planet disponibile).
    // Preserva i dati già raccolti (items, lifeformLevel, overload) se esistenti.
    function applyAPIToPlanets(apiPlanets) {
        const sidebar = getSidebarPlanets();
        if (!sidebar.length) return false;

        d.planets = sidebar.map(sp => {
            // Cerca per id o planetID (i due campi possono essere diversi nell'API)
            const ap = apiPlanets.find(a =>
                String(a.id) === String(sp.id) || String(a.planetID) === String(sp.id)
            ) || null;

            const existing = Array.isArray(d.planets)
                ? (d.planets.find(p => p.id === sp.id) || {})
                : {};

            let lfResearch = existing.lfResearch || {}, lfBuildings = existing.lfBuildings || {};
            if (ap) {
                ({ lfResearch, lfBuildings } = parseLfFromApi(ap));
                // Salva razza dall'API se non già catturata via DOM
                const lfFromAPI = LF_NUM_MAP[String(ap.lifeform || '')] || null;
                if (lfFromAPI && !d.planetLifeforms[sp.id]) {
                    d.planetLifeforms[sp.id] = lfFromAPI;
                }
            }

            return {
                ...existing,
                id: sp.id, name: sp.name, coords: sp.coords, pos: sp.pos,
                lifeform:  d.planetLifeforms[sp.id] || existing.lifeform || null,
                metal:     ap ? (ap['1']   || 0) : (existing.metal     || 0),
                crystal:   ap ? (ap['2']   || 0) : (existing.crystal   || 0),
                deuterium: ap ? (ap['3']   || 0) : (existing.deuterium || 0),
                crawlers:  ap ? (ap['217'] || 0) : (existing.crawlers  || 0),
                human:     ap ? (ap['11106'] || 0) : (existing.human   || 0),
                magma:     ap ? (ap['12106'] || 0) : (existing.magma   || 0),
                item: existing.item || 0, itemCustom: existing.itemCustom || 0,
                overload: existing.overload || false,
                lifeformLevel: existing.lifeformLevel || 0,
                lfResearch, lfBuildings
            };
        });

        // Plasma
        const firstWithPlasma = apiPlanets.find(ap => ap['122'] != null);
        if (firstWithPlasma) d.settings.plasma = firstWithPlasma['122'] || 0;

        d.empire_collected = true;
        d.empire_api = true;
        return true;
    }

    // Recupera i dati dell'impero via API da qualsiasi pagina.
    // force=true bypassa il throttle di 3 minuti (usato dal pulsante manuale).
    async function collectEmpireFromAPI(force = false) {
        const now = Date.now();
        if (!force && (now - (d._lastEmpireAPIFetch || 0)) < 3 * 60 * 1000) return;
        d._lastEmpireAPIFetch = now;

        try {
            const apiPlanets = await fetchApiPlanets();
            if (!apiPlanets.length) return;
            applyAPIToPlanets(apiPlanets);
            save();
            updatePanel();
        } catch (e) {
            console.warn('[OValue Exporter] collectEmpireFromAPI failed:', e.message);
        }
    }

    async function collectEmpire() {
        let apiPlanets = [];
        d.empire_api = false;
        try {
            // accountInfo (v13) → fallback empire; in forma flat, così il merge DOM sotto resta invariato
            apiPlanets = await fetchApiPlanets();
            // Plasma dalla chiave globale 122
            const first = apiPlanets.find(ap => ap['122'] != null);
            if (first) d.settings.plasma = first['122'] || 0;
            d.empire_api = apiPlanets.length > 0;
        } catch (e) {
            console.warn('[OValue Exporter] Empire API fetch failed, using DOM fallback:', e.message);
        }

        // Plasma DOM fallback: solo se l'API non ha restituito dati
        if (!d.settings.plasma) {
            document.querySelectorAll('.planet').forEach(p => {
                if (d.settings.plasma) return;
                const node = p.querySelector('.values.research [class~="122"]');
                if (!node) return;
                const src = node.querySelector('a:not(.active)') || node.querySelector('span') || node;
                const m = src.textContent.replace(/\./g, '').match(/\d+/);
                if (m) d.settings.plasma = parseInt(m[0]);
            });
        }

        const sidebar = getSidebarPlanets();
        const coordToId = {};
        sidebar.forEach(sp => { if (sp.id && sp.coords) coordToId[sp.coords] = sp.id; });

        // I valori numerici stanno nella sezione .values.container (div con classe numerica),
        // non nella sezione .headers.container (ul > li con i nomi degli edifici).
        const lvl = (p, container, cls) => {
            const section = p.querySelector('.values.' + container) || p.querySelector('.' + container);
            if (!section) return 0;
            const node = section.querySelector('[class~="' + cls + '"]');
            if (!node) return 0;
            const src = node.querySelector('a:not(.active)') || node.querySelector('span') || node;
            const m = src.textContent.replace(/\./g, '').match(/\d+/);
            return m ? parseInt(m[0]) : 0;
        };

        // Estrae TUTTI i livelli delle ricerche LF da un pianeta nell'impero.
        // I valori stanno nella sezione .values.lifeformXresearch (div con classe 1{lf}2{nn}),
        // NON nella sezione .headers (ul > li che contiene i nomi delle ricerche).
        // Schema classi: 1{lifeform}2{id_due_cifre} → es. 11202 = humans research #02 → ogame_db ID 1102
        const extractLfResearchLevels = (p) => {
            const result = {};
            for (let lfNum = 1; lfNum <= 4; lfNum++) {
                const valSection = p.querySelector('.values.lifeform' + lfNum + 'research');
                if (!valSection) continue;
                valSection.querySelectorAll('div').forEach(div => {
                    const cls = Array.from(div.classList).find(c => /^1\d{4}$/.test(c));
                    if (!cls) return;
                    const src = div.querySelector('span') || div;
                    const raw = src.textContent.trim().replace(/\./g, '');
                    if (!/^\d+$/.test(raw)) return;  // salta se non è un numero puro
                    const empireLvl = parseInt(raw);
                    if (empireLvl <= 0) return;
                    const lf   = parseInt(cls[1]);
                    const type = parseInt(cls[2]);
                    const sub  = parseInt(cls.slice(3));
                    const ogId = lf * 1000 + (type === 2 ? 100 : 0) + sub;
                    result[String(ogId)] = empireLvl;
                });
            }
            return result;
        };

        // Estrae i livelli degli edifici amplificatori LF dalla sezione .values.lifeformXbuildings.
        // Schema classi: 1{lifeform}1{id_due_cifre} → es. 11111 = Metropolis (lifeform1, bld #11)
        const extractAmpBuildings = (p) => {
            const result = {};
            const bldMap = {
                '1011': { container: 'lifeform1buildings', empireId: 11111 },
                '3007': { container: 'lifeform3buildings', empireId: 13107 },
                '3011': { container: 'lifeform3buildings', empireId: 13111 },
                '4007': { container: 'lifeform4buildings', empireId: 14107 }
            };
            for (const [ogId, { container, empireId }] of Object.entries(bldMap)) {
                const valSection = p.querySelector('.values.' + container);
                if (!valSection) continue;
                const valueDiv = valSection.querySelector('[class~="' + empireId + '"]');
                if (!valueDiv) continue;
                const src = valueDiv.querySelector('span') || valueDiv;
                const m = src.textContent.replace(/\./g, '').match(/\d+/);
                if (m && parseInt(m[0]) > 0) result[ogId] = parseInt(m[0]);
            }
            return result;
        };

        // Restituisce il livello lifeform per un pianeta.
        // Priorità: d.lfLevels dalla pagina LF (più affidabile) > testo dell'empire view.
        const LF_SPECIES_NUM = { Humans: 1, Rocktal: 2, Mechas: 3, Kaelesh: 4 };
        const getLifeformLevel = (planetId, lifeformName) => {
            const speciesNum = LF_SPECIES_NUM[lifeformName];
            if (speciesNum && d.lfLevels?.[speciesNum]) return d.lfLevels[speciesNum];
            // Fallback: cerca nel testo della sezione lifeform dell'empire view
            return 0;
        };

        const planets = [];
        document.querySelectorAll('.planet:not(.summary)').forEach(p => {
            const coordsRaw = p.querySelector('.coords')?.textContent.trim() || '';
            const cm = coordsRaw.match(/(\d+):(\d+):(\d+)/);
            if (!cm) return;
            const coords   = `${cm[1]}:${cm[2]}:${cm[3]}`;
            const idMatch  = (p.id || '').match(/\d+/);
            const planetId = (idMatch ? parseInt(idMatch[0]) : null) || coordToId[coords] || null;
            const pos      = parseInt(cm[3]);

            let item = 0, itemCustom = 0;
            p.querySelectorAll('.item_img').forEach(img => {
                const t = img.getAttribute('data-tooltip-title') || '';
                // Amplificatore metallo: IT/EN/DE/FR + livello (Bronzo/Bronze/Silber/Argent = 10%, ecc.)
                if (/(?:metallo?|m[eé]tal|Metall)\s+(?:Bronzo|Bronze)\b/i.test(t) ||
                    /(?:Bronze)\s+(?:Metal|Metall)/i.test(t))                              item = Math.max(item, 10);
                if (/(?:metallo?|m[eé]tal|Metall)\s+(?:Argento|Silver|Silber|Argent)\b/i.test(t) ||
                    /(?:Silver)\s+(?:Metal|Metall)/i.test(t))                              item = Math.max(item, 20);
                if (/(?:metallo?|m[eé]tal|Metall)\s+(?:Oro|Gold|Or)\b/i.test(t) ||
                    /(?:Gold)\s+(?:Metal|Metall)/i.test(t))                                item = Math.max(item, 30);
                if (/(?:metallo?|m[eé]tal|Metall)\s+(?:Platino|Platinum|Platin|Platine)\b/i.test(t) ||
                    /(?:Platinum)\s+(?:Metal|Metall)/i.test(t))                            item = Math.max(item, 40);
                // Amplificatore risorse: IT/EN/DE/FR
                const amp = t.match(/(?:Amplificatore di risorse|Resource Amplifier|Ressourcenverstärker|Amplificateur de ressources)[^\d]*(\d+)/i);
                if (amp) itemCustom = parseInt(amp[1]);
            });

            // Dati API per questo pianeta — cerca per id O per planetID (i due campi possono differire)
            const ap = apiPlanets.find(a =>
                String(a.id) === String(planetId) || String(a.planetID) === String(planetId)
            ) || null;

            // Lifeform: solo DOM — l'API non espone la razza in modo affidabile.
            // Priorità: valore già acquisito da navigazione precedente → icona DOM → null.
            let lifeformName = planetId != null ? (d.planetLifeforms[planetId] || null) : null;
            if (!lifeformName) {
                const lfIcon = p.querySelector('.lifeform-item-icon');
                if (lfIcon) {
                    const lfCls = Array.from(lfIcon.classList).find(c => /^lifeform[1-4]$/.test(c));
                    if (lfCls) {
                        lifeformName = LF_NUM_MAP[lfCls.replace('lifeform', '')] || null;
                        if (lifeformName && planetId != null)
                            d.planetLifeforms[planetId] = lifeformName;
                    }
                }
            }

            // Miniere e crawler: API → DOM
            const metal     = ap ? (ap['1']   || 0) : lvl(p, 'supply', '1');
            const crystal   = ap ? (ap['2']   || 0) : lvl(p, 'supply', '2');
            const deuterium = ap ? (ap['3']   || 0) : lvl(p, 'supply', '3');
            const crawlers  = ap ? (ap['217'] || 0) : lvl(p, 'ships', '217');
            const human     = ap ? (ap['11106'] || 0) : lvl(p, 'lifeform1buildings', '11106');
            const magma     = ap ? (ap['12106'] || 0) : lvl(p, 'lifeform2buildings', '12106');

            // LF ricerche + edifici amplificatori: API (helper condiviso) → DOM fallback
            let lfResearch, lfBuildings;
            if (ap) {
                ({ lfResearch, lfBuildings } = parseLfFromApi(ap));
            } else {
                lfResearch  = extractLfResearchLevels(p);
                lfBuildings = extractAmpBuildings(p);
            }

            planets.push({
                id: planetId, name: p.querySelector('.planetname')?.textContent.trim() || '',
                coords, pos,
                lifeform: lifeformName,
                metal, crystal, deuterium, human, magma, crawlers,
                item, itemCustom, overload: false,
                lifeformLevel: getLifeformLevel(planetId, lifeformName),
                lfResearch, lfBuildings
            });
        });
        d.planets = planets;

        // Global items — deduplicati per nome
        const seen = new Set();
        const globalItems = [];
        document.querySelectorAll('.empireItems .item_img').forEach(img => {
            const tooltip = img.getAttribute('data-tooltip-title') || '';
            if (!tooltip) return;
            const pipeIdx = tooltip.indexOf('|');
            const name = (pipeIdx >= 0 ? tooltip.slice(0, pipeIdx) : tooltip).trim();
            if (!name || seen.has(name)) return;
            // Salta amplificatori metallo per-pianeta
            if (/(?:Amplificatore|Amplifier|Verstärker|Amplificateur).*(?:metallo?|metal|Metall|m[eé]tal)/i.test(name)) return;
            seen.add(name);

            const html = pipeIdx >= 0 ? tooltip.slice(pipeIdx + 1) : '';

            // Durata rimanente: IT / EN / DE / FR
            // EN DOM: "Time remaining: 7w 3d 8h 46m 30s"
            // IT DOM: "Durata rimanente: 7s 3g 8o 46m 30s"
            // DE DOM: "Restlaufzeit: 10w 6t 17h 16m 58s"
            // FR DOM: "Temps restant : 10s 6j 17h 18m 1s"
            const durMatch = html.match(
                /(?:Time\s+remaining|Durata\s+rimanente|Remaining\s+time|Verbleibende\s+Zeit|Restlaufzeit|Dur[eé]e\s+restante|Temps\s+restant)\s*:\s*([^<]+)/i
            );
            const timeRemaining = durMatch?.[1]?.trim()
                ?? (/permanente?|permanent/i.test(tooltip) ? L.permanent : L.permanent);

            const hiddenSpan  = img.querySelector('span.hidden[data-total-duration]');
            const totalDuration = hiddenSpan
                ? parseInt(hiddenSpan.getAttribute('data-total-duration')) * 1000
                : null;

            // Salta item permanenti — nessuna scadenza da tracciare
            if (/permanente?|permanent/i.test(timeRemaining)) return;
            globalItems.push({ name, timeRemaining, totalDuration });
        });
        d.globalItems = globalItems;
        d.empire_collected = true;
        save();
        updatePanel();
    }

    function tryCollectEmpire() {
        if (document.querySelectorAll('.planet .coords').length > 0) collectEmpire();
        else setTimeout(tryCollectEmpire, 500);
    }

    // Legge le ricerche LF attive dalla pagina lfresearch (per-pianeta).
    // Tutti gli elementi .technology.lifeformTechXXXXX visibili = ricerche attive cross-species.
    // ID encoding: lifeformTechSTPP → species S, type T (2=research), sub PP → ogId = S*1000+100+PP
    function collectLFResearch() {
        const planetId = getPlanetId();
        if (!planetId) return;

        if (!d.planetResearches) d.planetResearches = {};
        const researches = {};

        document.querySelectorAll('.technology[class*="lifeformTech"]').forEach(el => {
            const techCls = Array.from(el.classList).find(c => /^lifeformTech\d{5}$/.test(c));
            if (!techCls) return;
            const code    = techCls.replace('lifeformTech', ''); // '14201'
            if (parseInt(code[2]) !== 2) return;                 // solo ricerche (type=2), non edifici
            const species = parseInt(code[1]);
            const sub     = parseInt(code.slice(3));
            const ogId    = species * 1000 + 100 + sub;

            const lvlEl = el.querySelector('.level[data-value]');
            const level = lvlEl ? (parseInt(lvlEl.dataset.value) || 0) : 0;
            if (level > 0) researches[String(ogId)] = level;
        });

        if (Object.keys(researches).length === 0) return;
        d.planetResearches[String(planetId)] = researches;

        // Aggiorna anche d.planets se questo pianeta è già stato letto dall'impero
        if (Array.isArray(d.planets)) {
            const p = d.planets.find(p => p.id === planetId);
            if (p) p.lfResearch = { ...p.lfResearch, ...researches };
        }

        // LF level dalla pagina
        if (!d.lfLevels) d.lfLevels = {};
        const activeIcon = document.querySelector('.lifeform-item-icon.small[class*="lifeform"]');
        if (activeIcon) {
            const cls  = Array.from(activeIcon.classList).find(c => /^lifeform\d$/.test(c));
            const span = activeIcon.querySelector('span');
            if (cls && span) {
                const sp  = cls.replace('lifeform', '');
                const lvl = parseInt(span.textContent.trim()) || 0;
                if (lvl > 0) d.lfLevels[sp] = lvl;
            }
        }

        save();
        updatePanel();
    }

    // ── ROUTING ──────────────────────────────────────────────────────────────
    const params    = new URLSearchParams(location.search);
    const page      = params.get('page')      || '';
    const component = params.get('component') || '';

    collectUniverseInfo();

    if (page === 'ingame' && component === 'overview') {
        setTimeout(collectOverview, 1000);
        // Idrata mine/LF/classi di tutti i pianeti via accountInfo (v13) SOLO al page-load
        // (mai timer/loop/auto-refresh — AGENTS.md §1.3/§4), una sola risposta, senza cp=
        // (§4.2), con throttle di 3 min per non ripetere la chiamata a ogni navigazione.
        setTimeout(() => collectEmpireFromAPI(), 2000);
    } else if (page === 'ingame' && component === 'lfbonuses') {
        setTimeout(collectLFBonuses, 1000);
    } else if (page === 'ingame' && component === 'lfresearch') {
        setTimeout(collectLFResearch, 1000);
    } else if (page === 'ingame' && component === 'alliance') {
        // Classe alleanza dal DOM della pagina Alleanza aperta dall'utente (nessun fetch)
        setTimeout(collectAllianceClass, 1000);
    } else if (component === 'empire') {
        tryCollectEmpire();
    } else {
        setTimeout(captureLifeform, 500);
    }

    // ── UI ───────────────────────────────────────────────────────────────────
    const empireUrl = () => '?page=standalone&component=empire';

    const lfColor = (name) =>
        ({ Humans: '#6aafdf', Rocktal: '#df8a6a', Mechas: '#a08ad0', Kaelesh: '#8adf6a' }[name] || '#a0bcd4');

    const classColor = { collector: '#6aafdf', general: '#df8a6a', explorer: '#8adf6a' };

    const row      = (l, r) => `<div class="ov_row"><span class="ov_lbl">${l}</span><span>${r}</span></div>`;
    const subTitle = (t)    => `<div class="ov_sub">${t}</div>`;

    function getMissingPlanets() {
        if (!d.empire_collected) return [];
        const collected = new Set(d.planets.map(p => p.pos));
        return getSidebarPlanets().filter(p => !collected.has(p.pos));
    }
    function getMissingLifeforms() {
        return getSidebarPlanets().filter(p => p.id && !d.planetLifeforms[p.id]);
    }

    function updatePanel() {
        const setbadge = (id, ok) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.className = ok ? 'ov_badge ov_ok' : 'ov_badge ov_ko';
            el.textContent = ok ? L.badgeOk : L.badgeMissing;
        };
        setbadge('ov_bdg_ov',  d.overview_collected);
        setbadge('ov_bdg_lf',  d.lf_collected);
        setbadge('ov_bdg_lfr', d.planetResearches && Object.keys(d.planetResearches).length > 0);
        setbadge('ov_bdg_emp', d.empire_collected);

        const spd = document.getElementById('ov_speed');
        if (spd) spd.textContent =
            `${SERVER_KEY.split('.')[0].toUpperCase()} · ${d.universeName || '?'} · eco ${d.universeSpeed}x`;

        document.querySelectorAll('.ov_empire_link').forEach(a => {
            a.setAttribute('href', empireUrl());
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
        });

        // ── Overview body ─────────────────────────────────────────────────────
        const ovBody = document.getElementById('ov_body_ov');
        if (ovBody) {
            if (!d.overview_collected) {
                ovBody.innerHTML = `<div class="ov_hint">${L.hintOverview}</div>`;
            } else {
                const cc = classColor[d.playerClass] || '#7a9ab2';
                const cn = CLASS_NAMES[d.playerClass] || d.playerClass;
                let html = row(L.player, `<span style="color:#a0bcd4">${d.playerName || '—'}</span>`);
                html    += row(L.pclass, `<span style="color:${cc};font-weight:bold">${d.playerClass !== 'none' ? cn : '—'}</span>`);
                if (d.allianceClass && d.allianceClass !== 'none') {
                    const an = ALLY_NAMES[d.allianceClass] || d.allianceClass;
                    html += row(L.allyClass, `<span style="color:#ffb800;font-weight:bold">${an}</span>`);
                }
                for (const role of OFFICER_ROLES) {
                    const off  = d.officers[role];
                    const name = OFF_NAMES[role] || role;
                    if (!off) { html += row(`✗ ${name}`, '<span class="ov_dim">—</span>'); continue; }
                    if (!off.active) { html += row(`<span class="ov_dim">✗ ${name}</span>`, `<span class="ov_dim">${L.absent}</span>`); continue; }
                    const perm = /^(Permanente|Permanent|∞)$/i.test(off.timeRemaining);
                    html += row(`<span class="ov_ok_txt">✓ ${name}</span>`,
                        `<span class="${perm ? 'ov_perm' : 'ov_warn'}">${off.timeRemaining}</span>`);
                }
                ovBody.innerHTML = html;
            }
        }

        // ── LF body ───────────────────────────────────────────────────────────
        const lfBody = document.getElementById('ov_body_lf');
        if (lfBody) {
            if (!d.lf_collected) {
                lfBody.innerHTML = `<div class="ov_hint">${L.hintLf}</div>`;
            } else {
                // Mostra i bonus aggregati solo se davvero letti dalla pagina Bonus LF
                // (valore ≠ 0%); con i dati da accountInfo il bonus metallo è calcolato
                // da OValue dalle ricerche attive, quindi evitiamo un fuorviante "0%".
                const hasAggBonus = /[1-9]/.test(String(d.lfBonuses.metal)) || /[1-9]/.test(String(d.lfBonuses.classBonus));
                let html = '';
                if (hasAggBonus) {
                    html += row(L.bonusMetal, `<span class="ov_val">${d.lfBonuses.metal}</span>`) +
                            row(L.bonusClass, `<span class="ov_val">${d.lfBonuses.classBonus}</span>`);
                } else if (d.lf_from_api) {
                    html += `<div class="ov_hint">${L.lfApiNote}</div>`;
                }
                if (d.lfLevels && Object.keys(d.lfLevels).length) {
                    const lfNames  = { 1: 'Humans', 2: "Rock'tal", 3: 'Mechas', 4: 'Kaelesh' };
                    const lfColors = { 1: '#6fc52a', 2: '#e8a83a', 3: '#5a9ac8', 4: '#c850c0' };
                    const levels = Object.entries(d.lfLevels).map(([k, v]) =>
                        `<span style="color:${lfColors[k] || '#a0bcd4'}">${lfNames[k] || k}: <b>${v}</b></span>`).join(' · ');
                    html += subTitle(L.lifeformLevels);
                    html += `<div class="ov_row" style="display:block;padding:3px 0">${levels}</div>`;
                }
                lfBody.innerHTML = html;
            }
        }

        // ── LF Research body ─────────────────────────────────────────────────
        const lfrBody = document.getElementById('ov_body_lfr');
        if (lfrBody) {
            const pr    = d.planetResearches || {};
            const total = getSidebarPlanets().length;
            const done  = Object.keys(pr).length;
            if (done === 0) {
                lfrBody.innerHTML = `<div class="ov_hint">${L.hintLfResearch}</div>`;
            } else {
                let html = row(L.lfResearchPlanets(done, total), '');
                if (done < total) html += `<div class="ov_hint">${L.hintLfResearch}</div>`;
                lfrBody.innerHTML = html;
            }
        }

        // ── Empire body ───────────────────────────────────────────────────────
        const empBody = document.getElementById('ov_body_emp');
        if (empBody) {
            if (!d.empire_collected) {
                empBody.innerHTML = `<div class="ov_hint">${L.hintEmpire(empireUrl())}</div>`;
            } else {
                const srcLabel = d.empire_api
                    ? `<span class="ov_api_ok">${L.dataSourceApi}</span>`
                    : `<span class="ov_api_dom">${L.dataSourceDom}</span>`;
                let html = row(L.planets, `<span class="ov_val">${d.planets.length}</span> ${srcLabel}`) +
                           row(L.plasma,  `<span class="ov_val">Lv. ${d.settings.plasma}</span>`);

                const missing = getMissingPlanets();
                if (missing.length) {
                    html += subTitle(L.missingPlanets(missing.length));
                    html += `<div class="ov_hint">${L.hintMissingPlanets(empireUrl())}</div>`;
                    missing.forEach(p => { html += row(`✗ ${p.name || ''} [${p.coords}]`, '—'); });
                }

                const lfMissing = getMissingLifeforms();
                if (lfMissing.length) {
                    html += subTitle(L.missingLf(lfMissing.length));
                    html += `<div class="ov_hint">${L.hintMissingLf}</div>`;
                    lfMissing.forEach(p => {
                        const href = `?page=ingame&component=overview&cp=${p.id}`;
                        html += `<div class="ov_row ov_dim"><span class="ov_lbl">✗ <a href="${href}" style="color:#5a9aca">${p.name || p.coords}</a></span><span>—</span></div>`;
                    });
                }

                const knownLf = d.planets
                    .map(p => ({ ...p, lifeform: d.planetLifeforms[p.id] || p.lifeform }))
                    .filter(p => p.lifeform && p.lifeform !== 'none');
                if (knownLf.length) {
                    html += subTitle(L.activeLf(knownLf.length));
                    knownLf.forEach(p => {
                        html += `<div class="ov_row"><span class="ov_lbl">P${String(p.pos).padStart(2,'0')} · ${p.name||'—'}</span>` +
                                `<span style="color:${lfColor(p.lifeform)};font-weight:bold">${p.lifeform}</span></div>`;
                    });
                }

                if (d.globalItems.length) {
                    html += subTitle(L.globalItems(d.globalItems.length));
                    d.globalItems.forEach(it => {
                        const perm = /permanente?|permanent/i.test(it.timeRemaining);
                        html += row(`<span class="ov_item_name">${it.name}</span>`,
                            `<span class="${perm ? 'ov_perm' : 'ov_warn'}">${it.timeRemaining}</span>`);
                    });
                }

                empBody.innerHTML = html;
            }
        }

        document.querySelectorAll('.ov_empire_link').forEach(a => {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
        });

        updateMenuStatus();
    }

    function updateMenuStatus() {
        const circle = document.getElementById('ov_status_circle');
        if (!circle) return;
        const all = d.overview_collected && d.lf_collected && d.empire_collected;
        const any = d.overview_collected || d.lf_collected || d.empire_collected;
        if (all) {
            circle.setAttribute('fill', '#00ff9d');
            circle.setAttribute('filter', 'url(#ov_dot_glow)');
        } else if (any) {
            circle.setAttribute('fill', '#ffb800');
            circle.setAttribute('filter', 'url(#ov_dot_glow)');
        } else {
            circle.setAttribute('fill', '#334155');
            circle.removeAttribute('filter');
        }
    }

    // ── INJECT UI ─────────────────────────────────────────────────────────────
    GM_addStyle(`
        #ov_panel { position:fixed; left:0; top:0; width:232px;
            background:#151923; border-right:1px solid rgba(255,255,255,.07); z-index:9999; color:#e2e8f0;
            display:none; box-shadow:4px 0 24px rgba(0,0,0,.7);
            font-family:ui-sans-serif,system-ui,-apple-system,sans-serif; font-size:12px; user-select:none;
            flex-direction:column; }
        #ov_panel.ov_open { display:flex; }
        #ov_hdr { background:#070c18; border-bottom:1px solid rgba(255,255,255,.07);
            padding:8px 10px; display:flex; align-items:center; gap:6px;
            cursor:move; flex-shrink:0; }
        #ov_hdr_title { font-weight:700; color:#e2e8f0; font-size:10px; flex-grow:1;
            font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
            text-transform:uppercase; letter-spacing:.1em; }
        #ov_speed { font-size:9px; color:#64748b; white-space:nowrap;
            overflow:hidden; text-overflow:ellipsis; max-width:105px;
            font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
        #ov_close { background:none; border:none; color:#64748b; cursor:pointer;
            font-size:14px; line-height:1; padding:0 2px; flex-shrink:0;
            font-family:inherit; transition:color 150ms; }
        #ov_close:hover { color:#94a3b8; }
        #ov_content { flex:1; overflow-y:auto; padding:6px 8px;
            scrollbar-width:thin; scrollbar-color:#2d3748 #0b0e14; }
        #ov_content::-webkit-scrollbar { width:3px; }
        #ov_content::-webkit-scrollbar-track { background:#0b0e14; }
        #ov_content::-webkit-scrollbar-thumb { background:#2d3748; border-radius:2px; }
        #ov_footer { padding:7px 8px; border-top:1px solid rgba(255,255,255,.06); flex-shrink:0;
            display:flex; flex-direction:column; gap:5px; }
        .ov_sec { margin-bottom:2px; }
        .ov_sec_hdr { display:flex; align-items:center; gap:5px;
            padding:5px 4px; cursor:pointer; border-radius:6px; transition:background 150ms; }
        .ov_sec_hdr:hover { background:rgba(255,255,255,.04); }
        .ov_sec_dot { width:5px; height:5px; border-radius:50%;
            background:#00f0ff; opacity:.45; flex-shrink:0; transition:opacity 150ms; }
        .ov_sec_hdr:hover .ov_sec_dot { opacity:1; }
        .ov_sec_lnk { font-size:9px; font-weight:900; color:#64748b; text-decoration:none;
            letter-spacing:.1em; text-transform:uppercase; flex-shrink:0;
            font-family:ui-monospace,SFMono-Regular,Menlo,monospace; transition:color 150ms; }
        .ov_sec_hdr:hover .ov_sec_lnk,
        .ov_sec_lnk:hover { color:#94a3b8; }
        .ov_sec_div { flex:1; height:1px; background:rgba(255,255,255,.05); }
        .ov_sec_toggle { font-size:9px; color:#64748b; flex-shrink:0; transition:transform 150ms; line-height:1; }
        .ov_badge { font-size:8px; font-weight:900; padding:2px 5px; border-radius:4px; white-space:nowrap;
            text-transform:uppercase; letter-spacing:.04em;
            font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
        .ov_ok  { background:rgba(0,255,157,.1); color:#00ff9d; border:1px solid rgba(0,255,157,.2); }
        .ov_ko  { background:rgba(255,42,109,.08); color:#ff2a6d; border:1px solid rgba(255,42,109,.15); }
        .ov_body { overflow:hidden; }
        .ov_body.collapsed { display:none; }
        .ov_row { display:flex; justify-content:space-between; align-items:center;
            padding:4px 4px; font-size:11px; border-bottom:1px solid rgba(255,255,255,.04); gap:4px; }
        .ov_row:last-child { border-bottom:none; }
        .ov_lbl { color:#64748b; flex-shrink:0; }
        .ov_val { color:#94a3b8; text-align:right; font-weight:600; }
        .ov_ok_txt { color:#00ff9d; font-weight:600; }
        .ov_warn { color:#ffb800; }
        .ov_perm { color:#38bdf8; }
        .ov_dim  { color:#334155; font-style:italic; }
        .ov_api_ok { color:#00ff9d; font-size:8px; font-weight:900;
            font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
            background:rgba(0,255,157,.08); border:1px solid rgba(0,255,157,.2);
            border-radius:4px; padding:1px 4px; text-transform:uppercase; letter-spacing:.04em; }
        .ov_api_dom { color:#ffb800; font-size:8px; font-weight:900;
            font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
            background:rgba(255,184,0,.08); border:1px solid rgba(255,184,0,.2);
            border-radius:4px; padding:1px 4px; text-transform:uppercase; letter-spacing:.04em; }
        .ov_hint { font-size:11px; color:#64748b; padding:4px 4px; line-height:1.45; }
        .ov_hint a { color:#38bdf8; text-decoration:underline; }
        .ov_sub { font-size:9px; font-weight:700; color:#64748b; margin:6px 4px 2px;
            text-transform:uppercase; letter-spacing:.1em;
            font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
        .ov_item_name { max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        #ov_refresh, #ov_export, #ov_reset { display:block; width:100%; padding:7px 0;
            border-radius:8px; font-size:11px; font-family:inherit; font-weight:600;
            text-align:center; cursor:pointer; transition:background 150ms,border-color 150ms; }
        #ov_refresh { background:rgba(56,189,248,.07); border:1px solid rgba(56,189,248,.15); color:#38bdf8; }
        #ov_refresh:hover { background:rgba(56,189,248,.13); border-color:rgba(56,189,248,.25); }
        #ov_refresh:disabled { opacity:.4; cursor:not-allowed; }
        #ov_export { background:rgba(0,240,255,.07); border:1px solid rgba(0,240,255,.15); color:#00f0ff; }
        #ov_export:hover { background:rgba(0,240,255,.13); border-color:rgba(0,240,255,.25); }
        #ov_reset { background:rgba(255,42,109,.07); border:1px solid rgba(255,42,109,.15); color:#ff2a6d; }
        #ov_reset:hover { background:rgba(255,42,109,.13); border-color:rgba(255,42,109,.25); }
    `);

    function injectUI() {
        const menuTable = document.getElementById('menuTable');
        if (menuTable) {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="menu_icon">
                    <a id="ov_icon_btn" href="#" target="_self" style="display:block;line-height:0;">
                        <svg id="ov_icon_svg" width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <filter id="ov_dot_glow" x="-100%" y="-100%" width="300%" height="300%">
                                    <feGaussianBlur stdDeviation="2" result="blur"/>
                                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                                </filter>
                            </defs>
                            <rect width="26" height="26" rx="4" fill="#0b0e14" stroke="rgba(255,255,255,.15)" stroke-width="1"/>
                            <circle id="ov_status_circle" cx="13" cy="13" r="4" fill="#334155"/>
                        </svg>
                    </a>
                </span>
                <a class="menubutton" href="#" id="ov_menu_btn"><span class="textlabel">OValue</span></a>
            `;
            menuTable.appendChild(li);
            const togglePanel = e => {
                e.preventDefault();
                const panel = document.getElementById('ov_panel');
                const open  = !panel.classList.contains('ov_open');
                panel.classList.toggle('ov_open', open);
                GM_setValue(PANEL_KEY, open);
            };
            document.getElementById('ov_menu_btn').addEventListener('click', togglePanel);
            document.getElementById('ov_icon_btn').addEventListener('click', togglePanel);
        }

        const panel = document.createElement('div');
        panel.id = 'ov_panel';
        if (GM_getValue(PANEL_KEY, false)) panel.classList.add('ov_open');
        // Stato collasso sezioni (persistito)
        const collapsed = GM_getValue(PANEL_COL_KEY, {});
        const mkSec = (id, lnkHref, lnkLabel, badgeId, bodyId, bodyHtml, lnkExtra = '') => {
            const isCollapsed = !!collapsed[id];
            // Separa l'emoji dal testo per evitare che letter-spacing/uppercase si applichi all'emoji
            const emojiMatch = lnkLabel.match(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}])\s*/u);
            const emoji = emojiMatch ? `<span style="font-size:10px;letter-spacing:0;text-transform:none;margin-right:2px;">${emojiMatch[1]}</span>` : '';
            const labelText = emojiMatch ? lnkLabel.slice(emojiMatch[0].length) : lnkLabel;
            return `
            <div class="ov_sec" data-sec="${id}">
                <div class="ov_sec_hdr">
                    <span class="ov_sec_dot"></span>
                    <a class="ov_sec_lnk${lnkExtra ? ' ' + lnkExtra : ''}" href="${lnkHref}"${lnkExtra ? ' target="_blank" rel="noopener noreferrer"' : ''}>${emoji}${labelText}</a>
                    <span class="ov_sec_div"></span>
                    <span id="${badgeId}" class="ov_badge ov_ko">${L.badgeMissing}</span>
                    <span class="ov_sec_toggle" style="transform:rotate(${isCollapsed ? '-90' : '0'}deg)">▾</span>
                </div>
                <div id="${bodyId}" class="ov_body${isCollapsed ? ' collapsed' : ''}">${bodyHtml}</div>
            </div>`;
        };

        panel.innerHTML = `
            <div id="ov_hdr">
                <span id="ov_hdr_title">⬡ OValue</span>
                <span id="ov_speed"></span>
                <button id="ov_close" title="${L.close}">${L.close}</button>
            </div>
            <div id="ov_content">
                ${mkSec('ov', '?page=ingame&component=overview', L.overview, 'ov_bdg_ov', 'ov_body_ov', `<div class="ov_hint">${L.hintOverview}</div>`)}
                ${mkSec('lf', '?page=ingame&component=lfbonuses', L.lifeform, 'ov_bdg_lf', 'ov_body_lf', `<div class="ov_hint">${L.hintLf}</div>`)}
                ${mkSec('lfr', '?page=ingame&component=lfresearch', L.lfResearch, 'ov_bdg_lfr', 'ov_body_lfr', `<div class="ov_hint">${L.hintLfResearch}</div>`)}
                ${mkSec('emp', empireUrl(), L.empire, 'ov_bdg_emp', 'ov_body_emp', `<div class="ov_hint">${L.hintEmpire(empireUrl())}</div>`, 'ov_empire_link')}
            </div>
            <div id="ov_footer">
                <button id="ov_refresh">${L.refresh}</button>
                <button id="ov_export">${L.export}</button>
                <button id="ov_reset">${L.reset}</button>
            </div>
        `;
        document.body.appendChild(panel);

        // Rileva l'altezza del footer OGame per non sovrapporre i pulsanti
        function ogameFooterHeight() {
            for (const sel of ['#footer', 'footer', '.footer', '#ogame_footer', '#legal']) {
                const el = document.querySelector(sel);
                if (el) {
                    const h = Math.ceil(el.getBoundingClientRect().height);
                    if (h > 0) return h;
                }
            }
            return 22; // fallback tipico OGame
        }

        function applyPanelHeight(top) {
            const fh  = ogameFooterHeight();
            const avail = window.innerHeight - (top || 0) - fh;
            panel.style.height = Math.max(200, avail) + 'px';
        }

        // Posizione: il pannello è docked a sinistra (left:0, top:0) per default.
        // Se l'utente lo ha trascinato, ripristina la posizione salvata.
        const savedPos = GM_getValue(PANEL_POS_KEY, null);
        if (savedPos && savedPos.left != null) {
            panel.style.left = savedPos.left + 'px';
            panel.style.top  = savedPos.top  + 'px';
        }
        applyPanelHeight(parseInt(panel.style.top) || 0);
        // Ricalcola se il footer OGame viene aggiunto dopo il caricamento
        setTimeout(() => applyPanelHeight(parseInt(panel.style.top) || 0), 1500);

        // ── Drag & drop sull'header ──────────────────────────────────────────
        let dragging = false, ox = 0, oy = 0;
        const hdr = document.getElementById('ov_hdr');
        hdr.addEventListener('mousedown', e => {
            if (e.target.id === 'ov_close') return;
            dragging = true;
            const r = panel.getBoundingClientRect();
            ox = e.clientX - r.left;
            oy = e.clientY - r.top;
            e.preventDefault();
        });
        document.addEventListener('mousemove', e => {
            if (!dragging) return;
            const nx = Math.max(0, Math.min(window.innerWidth  - panel.offsetWidth, e.clientX - ox));
            const ny = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - oy));
            panel.style.left = nx + 'px';
            panel.style.top  = ny + 'px';
            applyPanelHeight(ny);
        });
        document.addEventListener('mouseup', () => {
            if (!dragging) return;
            dragging = false;
            GM_setValue(PANEL_POS_KEY, {
                left: parseInt(panel.style.left) || 0,
                top:  parseInt(panel.style.top)  || 0
            });
        });

        // ── Sezioni collassabili ─────────────────────────────────────────────
        panel.querySelectorAll('.ov_sec').forEach(sec => {
            const secId  = sec.dataset.sec;
            const hdrEl  = sec.querySelector('.ov_sec_hdr');
            const body   = sec.querySelector('.ov_body');
            const toggle = sec.querySelector('.ov_sec_toggle');
            hdrEl.addEventListener('click', e => {
                if (e.target.tagName === 'A') return; // link cliccabile normalmente
                const isNowCollapsed = body.classList.toggle('collapsed');
                toggle.style.transform = isNowCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
                const state = GM_getValue(PANEL_COL_KEY, {});
                state[secId] = isNowCollapsed;
                GM_setValue(PANEL_COL_KEY, state);
            });
        });

        document.getElementById('ov_close').addEventListener('click', () => {
            panel.classList.remove('ov_open');
            GM_setValue(PANEL_KEY, false);
        });

        document.getElementById('ov_refresh').addEventListener('click', async () => {
            const btn = document.getElementById('ov_refresh');
            btn.disabled = true;
            btn.textContent = L.refreshing;
            await collectEmpireFromAPI(true); // force=true bypassa throttle
            btn.disabled = false;
            btn.textContent = L.refresh;
        });

        document.getElementById('ov_export').addEventListener('click', () => {
            d.planets.forEach(p => {
                if (p.id != null && d.planetLifeforms[p.id])
                    p.lifeform = d.planetLifeforms[p.id];
            });
            save();
            const json = JSON.stringify(d, null, 2);
            if (typeof GM_setClipboard !== 'undefined') GM_setClipboard(json, 'text');
            else navigator.clipboard.writeText(json);
            alert(L.exportOk);
        });

        document.getElementById('ov_reset').addEventListener('click', () => {
            if (!confirm(L.resetConfirm(SERVER_KEY))) return;
            GM_deleteValue(STORAGE_KEY);
            alert(L.resetDone);
            location.reload();
        });

        updatePanel();
    }

    setTimeout(injectUI, 500);

})();
