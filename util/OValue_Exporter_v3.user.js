// ==UserScript==
// @name         OValue Exporter
// @namespace    https://greasyfork.org/it/users/1546037-nicolagalassi
// @version      3.3.5
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
            player: 'Giocatore', pclass: 'Classe', planets: 'Pianeti', plasma: 'Plasma',
            absent: 'assente', permanent: 'Permanente',
            missingPlanets: n => `⚠ Pianeti Mancanti (${n})`,
            missingLf:      n => `⚠ Razze Mancanti (${n})`,
            activeLf:       n => `Razze Attive (${n})`,
            globalItems:    n => `Item Globali (${n})`,
            bonusMetal: 'Bonus Metallo', bonusClass: 'Bonus Classe',
            hintOverview: 'Vai alla <a href="?page=ingame&component=overview">Panoramica</a> e attendi il caricamento.',
            hintLf: 'Vai ai <a href="?page=ingame&component=lfbonuses">Bonus LifeForm</a> e attendi il caricamento.',
            hintEmpire:          url => `Vai alla <a class="ov_empire_link" href="${url}" target="_blank">pagina Impero</a> e attendi.`,
            hintMissingPlanets:  url => `Visita la <a class="ov_empire_link" href="${url}" target="_blank">pagina Impero</a> per leggerli.`,
            hintMissingLf: 'Clicca su ciascun pianeta per registrare la specie.',
            export: '⬇ Esporta Dati OValue', reset: '🗑 Svuota Cache Universo', close: '✕',
            exportOk: '✅ Dati OValue copiati negli appunti!',
            resetConfirm: srv => `Svuotare la cache per "${srv}"?`,
            resetDone: 'Cache azzerata! Ricarica la pagina per ricominciare.'
        },
        en: {
            overview: '👤 Overview', lifeform: '🧬 LifeForm', empire: '🌍 Empire',
            badgeMissing: '✗ MISSING', badgeOk: '✓ READ',
            player: 'Player', pclass: 'Class', planets: 'Planets', plasma: 'Plasma',
            absent: 'absent', permanent: 'Permanent',
            missingPlanets: n => `⚠ Missing Planets (${n})`,
            missingLf:      n => `⚠ Missing Species (${n})`,
            activeLf:       n => `Active Species (${n})`,
            globalItems:    n => `Global Items (${n})`,
            bonusMetal: 'Metal Bonus', bonusClass: 'Class Bonus',
            hintOverview: 'Go to <a href="?page=ingame&component=overview">Overview</a> and wait for loading.',
            hintLf: 'Go to <a href="?page=ingame&component=lfbonuses">LifeForm Bonuses</a> and wait.',
            hintEmpire:         url => `Go to the <a class="ov_empire_link" href="${url}" target="_blank">Empire page</a> and wait.`,
            hintMissingPlanets: url => `Visit the <a class="ov_empire_link" href="${url}" target="_blank">Empire page</a> to collect them.`,
            hintMissingLf: 'Click each planet to register its species.',
            export: '⬇ Export OValue Data', reset: '🗑 Clear Universe Cache', close: '✕',
            exportOk: '✅ OValue data copied to clipboard!',
            resetConfirm: srv => `Clear cache for "${srv}"?`,
            resetDone: 'Cache cleared! Reload the page to start over.'
        },
        de: {
            overview: '👤 Übersicht', lifeform: '🧬 Lebensform', empire: '🌍 Imperium',
            badgeMissing: '✗ FEHLT', badgeOk: '✓ GELESEN',
            player: 'Spieler', pclass: 'Klasse', planets: 'Planeten', plasma: 'Plasma',
            absent: 'abwesend', permanent: 'Permanent',
            missingPlanets: n => `⚠ Fehlende Planeten (${n})`,
            missingLf:      n => `⚠ Fehlende Spezies (${n})`,
            activeLf:       n => `Aktive Spezies (${n})`,
            globalItems:    n => `Globale Items (${n})`,
            bonusMetal: 'Metall-Bonus', bonusClass: 'Klassen-Bonus',
            hintOverview: 'Gehe zur <a href="?page=ingame&component=overview">Übersicht</a> und warte auf das Laden.',
            hintLf: 'Gehe zu den <a href="?page=ingame&component=lfbonuses">Lebensform-Boni</a> und warte.',
            hintEmpire:         url => `Gehe zur <a class="ov_empire_link" href="${url}" target="_blank">Imperium-Seite</a> und warte.`,
            hintMissingPlanets: url => `Besuche die <a class="ov_empire_link" href="${url}" target="_blank">Imperium-Seite</a> um sie zu lesen.`,
            hintMissingLf: 'Klicke jeden Planeten an, um seine Spezies zu registrieren.',
            export: '⬇ OValue-Daten exportieren', reset: '🗑 Universum-Cache leeren', close: '✕',
            exportOk: '✅ OValue-Daten in die Zwischenablage kopiert!',
            resetConfirm: srv => `Cache leeren für "${srv}"?`,
            resetDone: 'Cache geleert! Seite neu laden.'
        },
        fr: {
            overview: '👤 Aperçu', lifeform: '🧬 Forme de vie', empire: '🌍 Empire',
            badgeMissing: '✗ MANQUANT', badgeOk: '✓ LU',
            player: 'Joueur', pclass: 'Classe', planets: 'Planètes', plasma: 'Plasma',
            absent: 'absent', permanent: 'Permanent',
            missingPlanets: n => `⚠ Planètes manquantes (${n})`,
            missingLf:      n => `⚠ Espèces manquantes (${n})`,
            activeLf:       n => `Espèces actives (${n})`,
            globalItems:    n => `Items globaux (${n})`,
            bonusMetal: 'Bonus métal', bonusClass: 'Bonus classe',
            hintOverview: "Allez à l'<a href=\"?page=ingame&component=overview\">Aperçu</a> et attendez le chargement.",
            hintLf: 'Allez aux <a href="?page=ingame&component=lfbonuses">Bonus Formes de vie</a> et attendez.',
            hintEmpire:         url => `Allez à la <a class="ov_empire_link" href="${url}" target="_blank">page Empire</a> et attendez.`,
            hintMissingPlanets: url => `Visitez la <a class="ov_empire_link" href="${url}" target="_blank">page Empire</a> pour les collecter.`,
            hintMissingLf: 'Cliquez sur chaque planète pour enregistrer son espèce.',
            export: '⬇ Exporter les données OValue', reset: '🗑 Vider le cache univers', close: '✕',
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

    // ── COSTANTI ─────────────────────────────────────────────────────────────
    const SERVER_KEY  = window.location.hostname;
    const STORAGE_KEY = 'ovalue_data_' + SERVER_KEY;
    const PANEL_KEY   = 'ovalue_panel_state';

    const LIFEFORM_CLASS = {
        lifeform1: 'Humans',
        lifeform2: 'Rocktal',
        lifeform3: 'Mechas',
        lifeform4: 'Kaelesh'
    };

    // CSS class names = chiavi di storage (language-neutral)
    const OFFICER_ROLES = ['commander', 'admiral', 'engineer', 'geologist', 'technocrat'];

    // ── STATO ────────────────────────────────────────────────────────────────
    let d = GM_getValue(STORAGE_KEY, {});
    const DEFAULTS = {
        overview_collected: false, lf_collected: false, empire_collected: false,
        playerName: '', playerClass: 'none', universeName: '', universeSpeed: 1,
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
            const link     = el.querySelector('.planetlink');
            const coordsEl = el.querySelector('.planet-koords');
            const nameEl   = el.querySelector('.planet-name');
            if (!link || !coordsEl) return [];
            let id = null;
            try { id = parseInt(new URL(link.href, location.origin).searchParams.get('cp')) || null; } catch (_) {}
            const raw = coordsEl.textContent.replace(/[^0-9:]/g, '');
            const m = raw.match(/^(\d+):(\d+):(\d+)$/);
            if (!m) return [];
            return [{ id, name: nameEl?.textContent.trim() || '', coords: raw, pos: parseInt(m[3]) }];
        });
    }

    function save() { GM_setValue(STORAGE_KEY, d); }

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
                // Cerca "more than X days" / "più di X giorni" / "mehr als X Tage" / "plus de X jours"
                const m = afterPipe.match(
                    /(?:more than|più di|mehr als|plus de)\s*(\d+)\s*(?:days?|giorni?|Tage?|jours?)/i
                );
                if (m) {
                    // +1 giorno di margine per sicurezza
                    timeRemaining = (parseInt(m[1]) + 1) + 'd';
                } else if (/active|attivo|aktiv|actif/i.test(afterPipe)) {
                    // Tooltip indica attivo ma senza numero: assume 7 giorni
                    timeRemaining = '7d';
                }
            }

            if (!timeRemaining) timeRemaining = L.permanent;
            officers[role] = { active, timeRemaining };
        }
        d.officers = officers;
        d.overview_collected = true;
        captureLifeform();
        save();
        updatePanel();
    }

    function collectLFBonuses() {
        const bonuses = { metal: '0%', classBonus: '0%' };
        document.querySelectorAll('inner-bonus-item-heading').forEach(el => {
            const titleEl = el.querySelector('.subCategoryTitle');
            const bonusEl = el.querySelector('.subCategoryBonus');
            if (!titleEl || !bonusEl) return;
            const title = (titleEl.getAttribute('aria-label') || titleEl.textContent).trim();
            const bonus = bonusEl.textContent.replace(/Totale:|Total:|Gesamt:|Total\s*:/gi, '').trim();
            if (!bonus) return;
            // IT: Metallo / EN: Metal / DE: Metall / FR: Métal
            if (/^(Metallo|Metal|Metall|M[eé]tal)$/i.test(title))
                bonuses.metal = bonus;
            // IT: Collezionista / EN: Collector / DE: Sammler / FR: Collecteur
            if (/^(Collezionista|Collector|Sammler|Collecteur)$/i.test(title))
                bonuses.classBonus = bonus;
        });
        d.lfBonuses = bonuses;
        d.lf_collected = true;
        captureLifeform();
        save();
        updatePanel();
    }

    function collectEmpire() {
        // Plasma
        let plasma = 0;
        document.querySelectorAll('.planet').forEach(p => {
            if (plasma) return;
            const node = p.querySelector('.values.research [class~="122"]');
            if (!node) return;
            const src = node.querySelector('a:not(.active)') || node.querySelector('span') || node;
            const m = src.textContent.replace(/\./g, '').match(/\d+/);
            if (m) plasma = parseInt(m[0]);
        });
        d.settings.plasma = plasma;

        const sidebar = getSidebarPlanets();
        const coordToId = {};
        sidebar.forEach(sp => { if (sp.id && sp.coords) coordToId[sp.coords] = sp.id; });

        const lvl = (p, container, cls) => {
            const node = p.querySelector('.' + container + ' [class~="' + cls + '"]');
            if (!node) return 0;
            const src = node.querySelector('a:not(.active)') || node.querySelector('span') || node;
            const m = src.textContent.replace(/\./g, '').match(/\d+/);
            return m ? parseInt(m[0]) : 0;
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

            planets.push({
                id: planetId, name: p.querySelector('.planetname')?.textContent.trim() || '',
                coords, pos,
                lifeform: planetId != null ? (d.planetLifeforms[planetId] || null) : null,
                metal:     lvl(p, 'supply', '1'),
                crystal:   lvl(p, 'supply', '2'),
                deuterium: lvl(p, 'supply', '3'),
                human:     lvl(p, 'lifeform1buildings', '11106'),
                magma:     lvl(p, 'lifeform2buildings', '12106'),
                crawlers:  lvl(p, 'ships', '217'),
                item, itemCustom, overload: false
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

    // ── ROUTING ──────────────────────────────────────────────────────────────
    const params    = new URLSearchParams(location.search);
    const page      = params.get('page')      || '';
    const component = params.get('component') || '';

    collectUniverseInfo();

    if (page === 'ingame' && component === 'overview') {
        setTimeout(collectOverview, 1000);
    } else if (page === 'ingame' && component === 'lfbonuses') {
        setTimeout(collectLFBonuses, 1000);
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
                lfBody.innerHTML =
                    row(L.bonusMetal, `<span class="ov_val">${d.lfBonuses.metal}</span>`) +
                    row(L.bonusClass, `<span class="ov_val">${d.lfBonuses.classBonus}</span>`);
            }
        }

        // ── Empire body ───────────────────────────────────────────────────────
        const empBody = document.getElementById('ov_body_emp');
        if (empBody) {
            if (!d.empire_collected) {
                empBody.innerHTML = `<div class="ov_hint">${L.hintEmpire(empireUrl())}</div>`;
            } else {
                let html = row(L.planets, `<span class="ov_val">${d.planets.length}</span>`) +
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
    }

    // ── INJECT UI ─────────────────────────────────────────────────────────────
    GM_addStyle(`
        #ov_panel { position:fixed; top:100px; left:190px; width:260px; background:#0e1520;
            border:1px solid #243040; border-radius:4px; z-index:9999; color:#8496a7;
            display:none; box-shadow:0 4px 24px rgba(0,0,0,.7);
            font-family:Verdana,Arial,sans-serif; font-size:11px; }
        #ov_hdr { background:linear-gradient(to bottom,#1e2d3e,#131d28); border-bottom:1px solid #0a1018;
            padding:7px 10px; display:flex; align-items:center; gap:6px; }
        #ov_hdr_title { font-weight:bold; color:#c8dff0; font-size:12px; flex-grow:1; letter-spacing:1px; }
        #ov_speed { font-size:9px; color:#4a6a8a; margin-right:4px; white-space:nowrap;
            overflow:hidden; text-overflow:ellipsis; max-width:130px; }
        #ov_close { background:none; border:none; color:#4a6a8a; cursor:pointer;
            font-size:14px; line-height:1; padding:0 2px; }
        #ov_close:hover { color:#8aa8c8; }
        #ov_content { padding:8px 10px; }
        .ov_sec { margin-bottom:6px; }
        .ov_sec_hdr { display:flex; align-items:center; justify-content:space-between;
            padding:4px 0; border-bottom:1px solid #1a2530; margin-bottom:4px; }
        .ov_sec_lnk { font-size:10px; font-weight:bold; color:#7aaace; text-decoration:none;
            letter-spacing:.5px; text-transform:uppercase; }
        .ov_sec_lnk:hover { color:#a0ccee; text-decoration:underline; }
        .ov_badge { font-size:8px; font-weight:bold; padding:2px 5px; border-radius:3px; white-space:nowrap; }
        .ov_ok  { background:#0f2a05; color:#6fc52a; border:1px solid #2a5010; }
        .ov_ko  { background:#2a0808; color:#d43636; border:1px solid #5a1010; }
        .ov_body { padding:0 0 2px; }
        .ov_row { display:flex; justify-content:space-between; align-items:center;
            padding:2px 0; font-size:10px; border-bottom:1px solid #141e28; gap:4px; }
        .ov_row:last-child { border-bottom:none; }
        .ov_lbl { color:#5a7a9a; flex-shrink:0; }
        .ov_val { color:#a0bcd4; text-align:right; }
        .ov_ok_txt { color:#6fc52a; font-weight:bold; }
        .ov_warn { color:#e8a83a; }
        .ov_perm { color:#4a8ac0; }
        .ov_dim  { color:#2e3e4e; font-style:italic; }
        .ov_hint { font-size:10px; color:#4a6a8a; padding:3px 0; line-height:1.4; }
        .ov_hint a { color:#5a9aca; text-decoration:underline; }
        .ov_sub  { font-size:9px; font-weight:bold; color:#4a6a8a; margin:5px 0 2px;
            text-transform:uppercase; letter-spacing:1px; }
        .ov_item_name { max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        #ov_export, #ov_reset { display:block; width:100%; margin-top:8px; padding:5px 0;
            background:linear-gradient(to bottom,#2d4055,#182030); border:1px solid #0a1018;
            color:#c8dff0; cursor:pointer; border-radius:3px; font-size:11px;
            font-family:inherit; letter-spacing:.5px; }
        #ov_export:hover { background:linear-gradient(to bottom,#3a5268,#202d3e); }
        #ov_reset { background:linear-gradient(to bottom,#3a1010,#1e0808); margin-top:4px; }
        #ov_reset:hover { background:linear-gradient(to bottom,#4e1515,#280a0a); }
    `);

    function injectUI() {
        const menuTable = document.getElementById('menuTable');
        if (menuTable) {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="menu_icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                         fill="none" stroke="#7aaace" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                         style="display:block;margin:auto">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                    </svg>
                </span>
                <a class="menubutton" href="#" id="ov_menu_btn"><span class="textlabel">OValue</span></a>
            `;
            menuTable.appendChild(li);
            document.getElementById('ov_menu_btn').addEventListener('click', e => {
                e.preventDefault();
                const panel = document.getElementById('ov_panel');
                const open  = panel.style.display === 'none';
                panel.style.display = open ? 'block' : 'none';
                GM_setValue(PANEL_KEY, open);
            });
        }

        const panel = document.createElement('div');
        panel.id = 'ov_panel';
        panel.style.display = GM_getValue(PANEL_KEY, false) ? 'block' : 'none';
        panel.innerHTML = `
            <div id="ov_hdr">
                <span id="ov_hdr_title">⬡ OVALUE</span>
                <span id="ov_speed"></span>
                <button id="ov_close" title="${L.close}">${L.close}</button>
            </div>
            <div id="ov_content">
                <div class="ov_sec">
                    <div class="ov_sec_hdr">
                        <a class="ov_sec_lnk" href="?page=ingame&component=overview">${L.overview}</a>
                        <span id="ov_bdg_ov" class="ov_badge ov_ko">${L.badgeMissing}</span>
                    </div>
                    <div id="ov_body_ov" class="ov_body">
                        <div class="ov_hint">${L.hintOverview}</div>
                    </div>
                </div>
                <div class="ov_sec">
                    <div class="ov_sec_hdr">
                        <a class="ov_sec_lnk" href="?page=ingame&component=lfbonuses">${L.lifeform}</a>
                        <span id="ov_bdg_lf" class="ov_badge ov_ko">${L.badgeMissing}</span>
                    </div>
                    <div id="ov_body_lf" class="ov_body">
                        <div class="ov_hint">${L.hintLf}</div>
                    </div>
                </div>
                <div class="ov_sec">
                    <div class="ov_sec_hdr">
                        <a class="ov_sec_lnk ov_empire_link" href="${empireUrl()}" target="_blank" rel="noopener noreferrer">${L.empire}</a>
                        <span id="ov_bdg_emp" class="ov_badge ov_ko">${L.badgeMissing}</span>
                    </div>
                    <div id="ov_body_emp" class="ov_body">
                        <div class="ov_hint">${L.hintEmpire(empireUrl())}</div>
                    </div>
                </div>
                <button id="ov_export">${L.export}</button>
                <button id="ov_reset">${L.reset}</button>
            </div>
        `;
        document.body.appendChild(panel);

        function positionPanel() {
            for (const sel of ['#sideBar', '#navi', '.navi_outer', '#left-col', '#menuTable']) {
                const el = document.querySelector(sel);
                if (el && el.getBoundingClientRect().width > 0) {
                    panel.style.left = Math.max(4, Math.round(el.getBoundingClientRect().left) - 264) + 'px';
                    break;
                }
            }
        }
        positionPanel();
        setTimeout(positionPanel, 1500);

        document.getElementById('ov_close').addEventListener('click', () => {
            panel.style.display = 'none';
            GM_setValue(PANEL_KEY, false);
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
