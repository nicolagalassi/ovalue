// ==UserScript==
// @name         OValue Exporter
// @namespace    https://greasyfork.org/it/users/1546037-nicolagalassi
// @version      3.1.2
// @description  Raccoglie i dati dell'impero navigando per le pagine, li memorizza per universo e li sincronizza automaticamente con OValue
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
// @downloadURL https://update.greasyfork.org/scripts/574448/OValue%20Exporter.user.js
// @updateURL https://update.greasyfork.org/scripts/574448/OValue%20Exporter.meta.js
// ==/UserScript==

(async function () {
    'use strict';

    // Bridge mode: quando lo script gira su ovalue.net, trasferisce i dati
    // da GM_setValue (storage estensione) a localStorage (leggibile dall'app Vue).
    // Prima di scrivere riallinea planet.lifeform dalla mappa planetLifeforms.
    function syncToOValue() {
        const servers = GM_getValue('ovalue_servers', []);
        const allData = {};
        for (const srv of servers) {
            const d = GM_getValue('ovalue_data_' + srv, null);
            if (d) {
                // Riallinea lifeform per ogni pianeta dalla mappa planetLifeforms
                if (d.planets && d.planetLifeforms) {
                    d.planets.forEach(p => {
                        if (p.id != null && d.planetLifeforms[p.id]) {
                            p.lifeform = d.planetLifeforms[p.id];
                        }
                    });
                }
                allData[srv] = d;
            }
        }
        if (Object.keys(allData).length === 0) return;
        localStorage.setItem('ovalue_exporter_pending', JSON.stringify(allData));
        window.dispatchEvent(new CustomEvent('ovalue-exporter-sync', { detail: allData }));
    }

    if (window.location.hostname.includes('ovalue.net')) {
        syncToOValue();
        return;
    }

    // 1. CHIAVI DI STORAGE
    const serverKey = window.location.hostname;
    const storageKey = 'ovalue_data_' + serverKey;
    const panelStateKey = 'ovalue_panel_state';

    // Aggiorna la lista dei server visitati (usata dal bridge su ovalue.net)
    const knownServers = GM_getValue('ovalue_servers', []);
    if (!knownServers.includes(serverKey)) {
        knownServers.push(serverKey);
        GM_setValue('ovalue_servers', knownServers);
    }

    // Recupera lo stato attuale dei dati per QUESTO universo
    let ovalueData = GM_getValue(storageKey, {
        overview_collected: false,
        lf_collected: false,
        empire_collected: false,
        playerClass: "none",
        officers: {},
        lfBonuses: { metal: "0%", classBonus: "0%" },
        settings: { plasma: 0 },
        planets: [],
        planetLifeforms: {},
        globalItems: [],
        universeSpeed: 1,
        universeName: ''
    });

    // Migrazione: versioni precedenti potrebbero non avere questi campi
    if (!ovalueData.planetLifeforms) ovalueData.planetLifeforms = {};
    if (!ovalueData.universeName) ovalueData.universeName = '';

    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    const component = urlParams.get('component');

    // Mappa CSS class lifeform -> nome leggibile (coerente con OValue app: lowercase)
    const LIFEFORM_NAMES = {
        lifeform1: 'Humans',
        lifeform2: 'Rocktal',
        lifeform3: 'Mechas',
        lifeform4: 'Kaelesh'
    };

    // --- HELPER: meta-tag OGame ---

    function getMetaContent(name) {
        const el = document.querySelector(`meta[name="${name}"]`);
        return el ? el.getAttribute('content') : null;
    }
    function getCurrentPlanetId() {
        const v = getMetaContent('ogame-planet-id');
        return v ? parseInt(v) : null;
    }
    function getCurrentPlanetType() {
        return getMetaContent('ogame-planet-type'); // 'planet' | 'moon'
    }

    // Legge l'elenco pianeti dal menu laterale (#planetList)
    function getPlanetListFromSidebar() {
        const result = [];
        document.querySelectorAll('#planetList .smallplanet').forEach(el => {
            const link = el.querySelector('.planetlink');
            const coordsEl = el.querySelector('.planet-koords');
            const nameEl = el.querySelector('.planet-name');
            if (!link || !coordsEl) return;

            let id = null;
            try {
                const url = new URL(link.href, window.location.origin);
                id = parseInt(url.searchParams.get('cp')) || null;
            } catch (_) {}

            const coordsRaw = coordsEl.textContent.replace(/[^0-9:]/g, '');
            const m = coordsRaw.match(/^(\d+):(\d+):(\d+)$/);
            if (!m) return;

            result.push({
                id,
                name: (nameEl ? nameEl.textContent : '').trim(),
                coords: coordsRaw,
                pos: parseInt(m[3])
            });
        });
        return result;
    }

    function getMissingPlanets() {
        if (!ovalueData.empire_collected) return [];
        const sidebar = getPlanetListFromSidebar();
        if (sidebar.length === 0) return [];
        const collectedPositions = new Set(ovalueData.planets.map(p => p.pos));
        return sidebar.filter(p => !collectedPositions.has(p.pos));
    }

    function getPlanetsMissingLifeform() {
        const sidebar = getPlanetListFromSidebar();
        if (sidebar.length === 0) return [];
        return sidebar.filter(p => p.id && !ovalueData.planetLifeforms[p.id]);
    }

    // --- 2. FUNZIONI DI AGGIORNAMENTO UI ---

    function empireHref() {
        return '?page=standalone&component=empire';
    }

    function lifeformColor(name) {
        return {
            'Humans':  '#6aafdf',
            'Rocktal': '#df8a6a',
            'Mechas':  '#a08ad0',
            'Kaelesh': '#8adf6a'
        }[name] || '#a0bcd4';
    }

    function getPanelLeft() {
        const panelWidth = 250;
        const gap = 4;
        const navSelectors = ['#sideBar', '#navi', '.navi_outer', '#left-col', '#menuTable'];
        for (let sel of navSelectors) {
            let el = document.querySelector(sel);
            if (el && el.getBoundingClientRect().width > 0) {
                const navLeft = Math.round(el.getBoundingClientRect().left);
                return Math.max(4, navLeft - panelWidth - gap);
            }
        }
        return 4;
    }

    function updatePanelStatus() {
        const badge = (id, ok) => {
            let el = document.getElementById(id);
            if (!el) return;
            el.className = ok ? 'ov_badge ov_ok_badge' : 'ov_badge ov_ko_badge';
            el.textContent = ok ? '✓ LETTO' : '✗ MANCANTE';
        };

        badge('ov_badge_overview', ovalueData.overview_collected);
        badge('ov_badge_lf', ovalueData.lf_collected);
        badge('ov_badge_empire', ovalueData.empire_collected);

        let speedEl = document.getElementById('ov_speed');
        if (speedEl) speedEl.textContent = `${serverKey.split('.')[0].toUpperCase()} · eco ${ovalueData.universeSpeed}x`;

        // Aggiorna href dei link Impero
        document.querySelectorAll('.ov_empire_link').forEach(a => a.setAttribute('href', empireHref()));

        // ── Corpo OVERVIEW ───────────────────────────────────────────────────
        let overviewBody = document.getElementById('ov_body_overview');
        if (overviewBody) {
            if (!ovalueData.overview_collected) {
                overviewBody.innerHTML = `<div class="ov_hint">Vai a <a href="?page=ingame&component=overview">Panoramica</a> e attendi il caricamento.</div>`;
            } else {
                const pClass = ovalueData.playerClass !== 'none' ? ovalueData.playerClass : '—';
                const classColor = { 'Collezionista': '#6aafdf', 'Generale': '#df8a6a', 'Esploratore': '#8adf6a' }[pClass] || '#7a9ab2';
                let html = `<div class="ov_row"><span class="ov_lbl">Classe giocatore</span><span style="color:${classColor};font-weight:bold">${pClass}</span></div>`;

                const ORDER = ['Comandante', 'Ammiraglio', 'Ingegnere', 'Geologo', 'Tecnico'];
                ORDER.forEach(name => {
                    const info = ovalueData.officers[name];
                    if (!info) {
                        html += `<div class="ov_row ov_dim"><span class="ov_lbl">✗ ${name}</span><span>—</span></div>`;
                        return;
                    }
                    if (!info.active) {
                        html += `<div class="ov_row ov_dim"><span class="ov_lbl">✗ ${name}</span><span>assente</span></div>`;
                        return;
                    }
                    const isPerm = info.timeRemaining === 'Permanente';
                    const valCls = isPerm ? 'ov_perm' : 'ov_warn';
                    html += `<div class="ov_row"><span class="ov_lbl ov_active">✓ ${name}</span><span class="${valCls}">${info.timeRemaining}</span></div>`;
                });
                overviewBody.innerHTML = html;
            }
        }

        // ── Corpo LIFEFORM ───────────────────────────────────────────────────
        let lfBody = document.getElementById('ov_body_lf');
        if (lfBody) {
            if (!ovalueData.lf_collected) {
                lfBody.innerHTML = `<div class="ov_hint">Vai a <a href="?page=ingame&component=lfbonuses">Bonus LifeForm</a> e attendi il caricamento.</div>`;
            } else {
                lfBody.innerHTML = `
                    <div class="ov_row"><span class="ov_lbl">Bonus Metallo</span><span class="ov_val">${ovalueData.lfBonuses.metal}</span></div>
                    <div class="ov_row"><span class="ov_lbl">Bonus Classe</span><span class="ov_val">${ovalueData.lfBonuses.classBonus}</span></div>
                `;
            }
        }

        // ── Corpo IMPERO ─────────────────────────────────────────────────────
        let empBody = document.getElementById('ov_body_empire');
        if (empBody) {
            if (!ovalueData.empire_collected) {
                empBody.innerHTML = `<div class="ov_hint">Vai alla pagina <a class="ov_empire_link" href="${empireHref()}">Impero</a> e attendi il caricamento.</div>`;
            } else {
                let html = `
                    <div class="ov_row"><span class="ov_lbl">Pianeti letti</span><span class="ov_val">${ovalueData.planets.length}</span></div>
                    <div class="ov_row"><span class="ov_lbl">Tecnologia Plasma</span><span class="ov_val">Liv. ${ovalueData.settings.plasma}</span></div>
                `;

                // Pianeti mancanti
                const missing = getMissingPlanets();
                if (missing.length > 0) {
                    html += `<div class="ov_sub_title">⚠ Pianeti Mancanti (${missing.length})</div>`;
                    html += `<div class="ov_hint" style="margin-bottom:4px">Visita la <a class="ov_empire_link" href="${empireHref()}">pagina Impero</a> per leggerli.</div>`;
                    missing.forEach(p => {
                        const label = p.name ? `${p.name} [${p.coords}]` : `[${p.coords}]`;
                        html += `<div class="ov_row ov_dim"><span class="ov_lbl">✗ ${label}</span><span>—</span></div>`;
                    });
                }

                // Pianeti senza lifeform
                const lfMissing = getPlanetsMissingLifeform();
                if (lfMissing.length > 0) {
                    html += `<div class="ov_sub_title">⚠ Razze Mancanti (${lfMissing.length})</div>`;
                    html += `<div class="ov_hint" style="margin-bottom:4px">Apri ciascun pianeta per registrare la specie attiva.</div>`;
                    lfMissing.forEach(p => {
                        const label = p.name ? `${p.name} [${p.coords}]` : `[${p.coords}]`;
                        const href = `?page=ingame&component=overview&cp=${p.id}`;
                        html += `<div class="ov_row ov_dim">
                            <span class="ov_lbl">✗ <a href="${href}" style="color:#5a9aca">${label}</a></span>
                            <span>—</span>
                        </div>`;
                    });
                }

                // Razze attive note
                const knownLfPlanets = ovalueData.planets
                    .map(p => ({ ...p, lifeform: ovalueData.planetLifeforms[p.id] }))
                    .filter(p => p.lifeform && p.lifeform !== 'none');
                if (knownLfPlanets.length > 0) {
                    html += `<div class="ov_sub_title">Razze Attive (${knownLfPlanets.length})</div>`;
                    knownLfPlanets.forEach(p => {
                        const color = lifeformColor(p.lifeform);
                        html += `<div class="ov_row">
                            <span class="ov_lbl">P${String(p.pos).padStart(2,'0')} · ${p.name || '—'}</span>
                            <span style="color:${color};font-weight:bold">${p.lifeform}</span>
                        </div>`;
                    });
                }

                // Item globali
                const items = ovalueData.globalItems;
                html += `<div class="ov_sub_title">Item Globali (${items.length})</div>`;
                if (items.length === 0) {
                    html += `<div class="ov_dim" style="font-size:10px;padding:2px 0">Nessun item rilevato.</div>`;
                } else {
                    items.forEach(item => {
                        const isPerm = item.timeRemaining === 'Permanente';
                        const timeCls = isPerm ? 'ov_perm' : 'ov_warn';
                        html += `<div class="ov_row">
                            <span class="ov_lbl ov_item_name">${item.name}</span>
                            <span class="${timeCls}">${item.timeRemaining}</span>
                        </div>`;
                    });
                }
                empBody.innerHTML = html;
            }
        }
    }

    // --- 3. FUNZIONI DI RACCOLTA DATI ---

    async function fetchUniverseSpeed() {
        try {
            let response = await fetch('/api/serverData.xml');
            let text = await response.text();
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(text, "text/xml");
            ovalueData.universeSpeed = xmlDoc.getElementsByTagName("speed")[0]?.textContent || 1;
            ovalueData.universeName = xmlDoc.getElementsByTagName("name")[0]?.textContent || '';
            GM_setValue(storageKey, ovalueData);
            updatePanelStatus();
        } catch (e) {
            console.error("OValue Exporter: Impossibile recuperare il nome dell'universo", e);
        }
    }

    // Legge la lifeform attiva dal blocco #lifeform del pianeta corrente
    function captureCurrentPlanetLifeform() {
        if (getCurrentPlanetType() === 'moon') return;
        const planetId = getCurrentPlanetId();
        if (!planetId) return;
        const lifeformBlock = document.querySelector('#lifeform');
        if (!lifeformBlock) return;

        const icon = lifeformBlock.querySelector('.lifeform-item-icon');
        if (!icon) {
            ovalueData.planetLifeforms[planetId] = 'none';
            return;
        }

        let detected = 'none';
        for (const key of ['lifeform1', 'lifeform2', 'lifeform3', 'lifeform4']) {
            if (icon.classList.contains(key)) {
                detected = LIFEFORM_NAMES[key];
                break;
            }
        }
        ovalueData.planetLifeforms[planetId] = detected;
    }

    function parseOverview() {
        let classDiv = document.querySelector('#characterclass .sprite');
        if (classDiv) {
            if (classDiv.classList.contains('explorer')) ovalueData.playerClass = "Esploratore";
            else if (classDiv.classList.contains('miner')) ovalueData.playerClass = "Collezionista";
            else if (classDiv.classList.contains('warrior')) ovalueData.playerClass = "Generale";
        }

        let officersList = {};
        document.querySelectorAll('#officers a').forEach(a => {
            let isHired = a.classList.contains('on');
            let type = "Sconosciuto";
            if (a.classList.contains('commander')) type = "Comandante";
            if (a.classList.contains('admiral')) type = "Ammiraglio";
            if (a.classList.contains('engineer')) type = "Ingegnere";
            if (a.classList.contains('geologist')) type = "Geologo";
            if (a.classList.contains('technocrat')) type = "Tecnico";

            let timeStr = "Permanente";
            if (isHired) {
                let timerDiv = a.querySelector('.custom-timer-officer, .timer, [class*="timer"]');
                if (timerDiv) {
                    let raw = timerDiv.innerText.trim();
                    if (raw && !/^(∞|Permanente|Permanent|-|)$/i.test(raw)) {
                        timeStr = raw;
                    }
                }
                if (timeStr === "Permanente") {
                    let tooltip = a.getAttribute('data-tooltip-title') || a.getAttribute('title') || '';
                    let durMatch = tooltip.match(/(?:Durata rimanente|Remaining duration|Verbleibende|Durée)[\s:]*([^<\n|]+)/i);
                    if (durMatch) timeStr = durMatch[1].trim();
                }
            }
            officersList[type] = { active: isHired, timeRemaining: timeStr };
        });

        ovalueData.officers = officersList;
        ovalueData.overview_collected = true;

        // Cattura lifeform del pianeta corrente
        captureCurrentPlanetLifeform();

        GM_setValue(storageKey, ovalueData);
        updatePanelStatus();
    }

    function parseLFBonuses() {
        let lfBonuses = { metal: "0%", classBonus: "0%" };

        document.querySelectorAll('inner-bonus-item-heading').forEach(el => {
            let titleDiv = el.querySelector('.subCategoryTitle');
            let bonusDiv = el.querySelector('.subCategoryBonus');
            if (titleDiv && bonusDiv) {
                let title = titleDiv.getAttribute('aria-label') || titleDiv.innerText.trim();
                let bonus = bonusDiv.innerText.trim().replace(/(Totale:|Total:)/i, '').trim();

                if (title === "Metallo" || title === "Metal") {
                    lfBonuses.metal = bonus;
                }
                if (title === "Collezionista" || title === "Collector") {
                    lfBonuses.classBonus = bonus;
                }
            }
        });

        ovalueData.lfBonuses = lfBonuses;
        ovalueData.lf_collected = true;
        GM_setValue(storageKey, ovalueData);
        updatePanelStatus();
    }

    function extractDuration(tooltipTitle, imgEl) {
        let m = tooltipTitle.match(/(?:Durata rimanente|Remaining duration|Verbleibende Laufzeit|Durée restante)\s*:?\s*([^\n|<]+)/i);
        if (m) {
            let val = m[1].trim();
            if (val && !/^(∞|-|Permanent|Permanente)$/i.test(val)) return val;
            if (/^(∞|Permanent|Permanente)$/i.test(val)) return "Permanente";
        }

        if (imgEl) {
            let timerEl = imgEl.querySelector('[class*="timer"], .duration, .countdown');
            if (timerEl) {
                let raw = timerEl.innerText.trim();
                if (raw && !/^(∞|-|Permanent|Permanente)$/i.test(raw)) return raw;
            }
            let hiddenSpan = imgEl.querySelector('.hidden');
            if (hiddenSpan) {
                let raw = hiddenSpan.innerText.trim();
                if (raw) return raw;
            }
        }

        return "Permanente";
    }

    function parseEmpire() {
        // 1. Plasma
        let plasma = 0;
        document.querySelectorAll('.planet').forEach(p => {
            if (plasma > 0) return;
            let plasmaDiv = p.querySelector('.values.research [class~="122"]');
            if (plasmaDiv) {
                let src = plasmaDiv.querySelector('a:not(.active)') || plasmaDiv.querySelector('span');
                let val = 0;
                if (src) {
                    val = parseInt(src.innerText.replace(/\./g, '')) || 0;
                } else {
                    val = parseInt(plasmaDiv.innerText.replace(/\./g, '').match(/\d+/)?.[0]) || 0;
                }
                if (val > 0) plasma = val;
            }
        });
        ovalueData.settings.plasma = plasma;

        // 2. Pianeti — usa :not(.summary) per escludere il riquadro totale
        // Costruisci mappa coordinate → ID dal menu laterale come fallback:
        // la pagina Impero standalone potrebbe non avere id="planet-XXXXX"
        // sugli elementi .planet, ma il menu laterale ha sempre ?cp=<id>.
        const sidebarPlanets = getPlanetListFromSidebar();
        const coordToId = {};
        sidebarPlanets.forEach(sp => { if (sp.id && sp.coords) coordToId[sp.coords] = sp.id; });

        let planetsData = [];
        document.querySelectorAll('.planet:not(.summary)').forEach((p) => {
            let coordsText = p.querySelector('.coords')?.innerText || '';
            let coordsMatch = coordsText.trim().match(/\[?(\d+):(\d+):(\d+)\]?/);
            if (!coordsMatch) return;

            const coords = `${coordsMatch[1]}:${coordsMatch[2]}:${coordsMatch[3]}`;

            // Planet ID: 1) attributo id="planet-XXXXX" sul DOM (pagine in-game normali)
            //            2) menu laterale abbinato per coordinate (empire standalone)
            const planetIdMatch = (p.id || '').match(/\d+/);
            const planetId = (planetIdMatch ? parseInt(planetIdMatch[0]) : null)
                          || coordToId[coords]
                          || null;

            let pos = parseInt(coordsMatch[3]);
            let name = p.querySelector('.planetname')?.innerText.trim() || '';

            let getLevel = (container, cls) => {
                let node = p.querySelector('.' + container + ' [class~="' + cls + '"]');
                if (!node) return 0;
                let firstA = node.querySelector('a:not(.active)');
                if (firstA) {
                    let m = firstA.innerText.replace(/\./g, '').match(/\d+/);
                    if (m) return parseInt(m[0]);
                }
                let span = node.querySelector('span');
                if (span) {
                    let m = span.innerText.replace(/\./g, '').match(/\d+/);
                    if (m) return parseInt(m[0]);
                }
                let m = node.innerText.replace(/\./g, '').match(/\d+/);
                return m ? parseInt(m[0]) : 0;
            };

            let itemValue = 0;
            let itemCustomValue = 0;
            p.querySelectorAll('.item_img').forEach(img => {
                let titleAttr = img.getAttribute('data-tooltip-title') || '';
                if (/metallo Bronzo|Bronze Metal/i.test(titleAttr)) itemValue = Math.max(itemValue, 10);
                if (/metallo Argento|Silver Metal/i.test(titleAttr)) itemValue = Math.max(itemValue, 20);
                if (/metallo Oro|Gold Metal/i.test(titleAttr)) itemValue = Math.max(itemValue, 30);
                if (/metallo Platino|Platinum Metal/i.test(titleAttr)) itemValue = Math.max(itemValue, 40);
                let ampMatch = titleAttr.match(/(?:Amplificatore di risorse|Resource Amplifier)[^\d]*(\d+)/i);
                if (ampMatch) itemCustomValue = parseInt(ampMatch[1]);
            });

            // Lifeform dalla cache (popolata visitando i singoli pianeti).
            // La pagina Impero standalone potrebbe non avere id="planet-XXXXX"
            // sul .planet, quindi usiamo le coordinate come chiave alternativa
            // per collegare il pianeta all'ID letto dal menu laterale.
            const lifeform = (planetId != null) ? (ovalueData.planetLifeforms[planetId] || null) : null;

            planetsData.push({
                id: planetId,
                name,
                coords,
                pos,
                lifeform,
                metal: getLevel('supply', '1'),
                crystal: getLevel('supply', '2'),
                deuterium: getLevel('supply', '3'),
                magma: getLevel('lifeform2buildings', '12106'),
                human: getLevel('lifeform1buildings', '11106'),
                crawlers: getLevel('ships', '217'),
                item: itemValue,
                itemCustom: itemCustomValue,
                overload: false
            });
        });

        // 3. Item Globali
        let globalItemsData = [];
        const empireItemsEl = document.querySelector('.planet .empireItems') || document.querySelector('.empireItems');
        if (empireItemsEl) {
            empireItemsEl.querySelectorAll('.item_img').forEach(img => {
                let titleAttr = img.getAttribute('data-tooltip-title') || '';
                let name = titleAttr.split('|')[0].trim();
                if (!name || /metallo|Metal|Amplificatore|Amplifier/i.test(name)) return;
                let timeRemaining = extractDuration(titleAttr, img);
                const hiddenSpan = img.querySelector('span.hidden[data-total-duration]');
                const totalDuration = hiddenSpan ? parseInt(hiddenSpan.getAttribute('data-total-duration')) * 1000 : null;
                globalItemsData.push({ name, timeRemaining, totalDuration });
            });
        }

        ovalueData.planets = planetsData;
        ovalueData.globalItems = globalItemsData;
        ovalueData.empire_collected = true;
        GM_setValue(storageKey, ovalueData);
        updatePanelStatus();
    }

    function tryParseEmpire() {
        let coordsNodes = document.querySelectorAll('.planet .coords');
        if (coordsNodes.length > 0) {
            parseEmpire();
        } else {
            setTimeout(tryParseEmpire, 500);
        }
    }

    // Cattura passiva della lifeform su qualsiasi pagina in-game del pianeta
    function tryCaptureLifeformPassive() {
        if (getCurrentPlanetType() === 'moon') return;
        const planetId = getCurrentPlanetId();
        if (!planetId) return;
        const lifeformBlock = document.querySelector('#lifeform');
        if (!lifeformBlock) return;

        const before = ovalueData.planetLifeforms[planetId];
        captureCurrentPlanetLifeform();
        const after = ovalueData.planetLifeforms[planetId];

        if (before !== after) {
            GM_setValue(storageKey, ovalueData);
            updatePanelStatus();
        }
    }

    // --- 4. ESECUZIONE ROUTING ---

    if (page === 'ingame' && component === 'overview') {
        setTimeout(parseOverview, 1000);
    } else if (page === 'ingame' && component === 'lfbonuses') {
        setTimeout(parseLFBonuses, 1000);
    } else if (component === 'empire') {
        tryParseEmpire();
    } else {
        // Cattura passiva su tutte le altre pagine in-game
        setTimeout(tryCaptureLifeformPassive, 800);
    }

    if (!ovalueData.universeSpeed || ovalueData.universeSpeed === 1 || !ovalueData.universeName) {
        fetchUniverseSpeed();
    }

    // --- 5. INTERFACCIA UTENTE ---

    GM_addStyle(`
        #ov_panel {
            position: fixed;
            top: 100px;
            left: 190px;
            width: 250px;
            background: #0e1520;
            border: 1px solid #243040;
            border-radius: 4px;
            z-index: 9999;
            color: #8496a7;
            display: none;
            box-shadow: 0 4px 24px rgba(0,0,0,0.7);
            font-family: Verdana, Arial, sans-serif;
            font-size: 11px;
        }
        #ov_header {
            background: linear-gradient(to bottom, #1e2d3e 0%, #131d28 100%);
            border-bottom: 1px solid #0a1018;
            padding: 7px 10px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        #ov_header_title { font-weight: bold; color: #c8dff0; font-size: 12px; flex-grow: 1; letter-spacing: 1px; }
        #ov_speed { font-size: 9px; color: #4a6a8a; margin-right: 4px; }
        #ov_close_btn { background: none; border: none; color: #4a6a8a; cursor: pointer; font-size: 14px; line-height: 1; padding: 0 2px; }
        #ov_close_btn:hover { color: #8aa8c8; }
        #ov_content { padding: 8px 10px; }
        .ov_section { margin-bottom: 6px; }
        .ov_sec_header { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #1a2530; margin-bottom: 4px; }
        .ov_sec_link { font-size: 10px; font-weight: bold; color: #7aaace; text-decoration: none; letter-spacing: 0.5px; text-transform: uppercase; }
        .ov_sec_link:hover { color: #a0ccee; text-decoration: underline; }
        .ov_badge { font-size: 8px; font-weight: bold; padding: 2px 5px; border-radius: 3px; white-space: nowrap; }
        .ov_ok_badge  { background: #0f2a05; color: #6fc52a; border: 1px solid #2a5010; }
        .ov_ko_badge  { background: #2a0808; color: #d43636; border: 1px solid #5a1010; }
        .ov_body { padding: 0 0 2px 0; }
        .ov_row { display: flex; justify-content: space-between; align-items: center; padding: 2px 0; font-size: 10px; border-bottom: 1px solid #141e28; gap: 4px; }
        .ov_row:last-child { border-bottom: none; }
        .ov_lbl     { color: #5a7a9a; flex-shrink: 0; }
        .ov_val     { color: #a0bcd4; text-align: right; }
        .ov_active  { color: #6fc52a; font-weight: bold; }
        .ov_warn    { color: #e8a83a; }
        .ov_perm    { color: #4a8ac0; }
        .ov_dim     { color: #2e3e4e; font-style: italic; }
        .ov_hint    { font-size: 10px; color: #4a6a8a; padding: 3px 0; line-height: 1.4; }
        .ov_hint a  { color: #5a9aca; text-decoration: underline; }
        .ov_sub_title { font-size: 9px; font-weight: bold; color: #4a6a8a; margin: 5px 0 2px; text-transform: uppercase; letter-spacing: 1px; }
        .ov_item_name { max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        #ov_export_btn, #ov_reset_btn {
            display: block; width: 100%; margin-top: 8px; padding: 5px 0;
            background: linear-gradient(to bottom, #2d4055 0%, #182030 100%);
            border: 1px solid #0a1018; color: #c8dff0; cursor: pointer;
            border-radius: 3px; font-size: 11px; font-family: inherit; letter-spacing: 0.5px;
        }
        #ov_export_btn:hover { background: linear-gradient(to bottom, #3a5268 0%, #202d3e 100%); }
        #ov_reset_btn { background: linear-gradient(to bottom, #3a1010 0%, #1e0808 100%); margin-top: 4px; }
        #ov_reset_btn:hover { background: linear-gradient(to bottom, #4e1515 0%, #280a0a 100%); }
        #ov_menu_btn { cursor: pointer; }
    `);

    function injectUI() {
        let menuTable = document.getElementById('menuTable');
        if (menuTable) {
            let li = document.createElement('li');
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

            document.getElementById('ov_menu_btn').addEventListener('click', (e) => {
                e.preventDefault();
                const panel = document.getElementById('ov_panel');
                const isHidden = panel.style.display === 'none';
                panel.style.display = isHidden ? 'block' : 'none';
                GM_setValue(panelStateKey, isHidden);
            });
        }

        const panel = document.createElement('div');
        panel.id = 'ov_panel';
        const leftPx = getPanelLeft();
        panel.style.left = leftPx + 'px';
        const isPanelOpen = GM_getValue(panelStateKey, false);
        panel.style.display = isPanelOpen ? 'block' : 'none';

        panel.innerHTML = `
            <div id="ov_header">
                <span id="ov_header_title">⬡ OVALUE</span>
                <span id="ov_speed"></span>
                <button id="ov_close_btn" title="Chiudi">✕</button>
            </div>
            <div id="ov_content">
                <div class="ov_section">
                    <div class="ov_sec_header">
                        <a class="ov_sec_link" href="?page=ingame&component=overview">👤 Panoramica</a>
                        <span id="ov_badge_overview" class="ov_badge ov_ko_badge">✗ MANCANTE</span>
                    </div>
                    <div id="ov_body_overview" class="ov_body">
                        <div class="ov_hint">Vai alla <a href="?page=ingame&component=overview">Panoramica</a> e attendi il caricamento.</div>
                    </div>
                </div>
                <div class="ov_section">
                    <div class="ov_sec_header">
                        <a class="ov_sec_link" href="?page=ingame&component=lfbonuses">🧬 LifeForm</a>
                        <span id="ov_badge_lf" class="ov_badge ov_ko_badge">✗ MANCANTE</span>
                    </div>
                    <div id="ov_body_lf" class="ov_body">
                        <div class="ov_hint">Vai ai <a href="?page=ingame&component=lfbonuses">Bonus LifeForm</a> e attendi il caricamento.</div>
                    </div>
                </div>
                <div class="ov_section">
                    <div class="ov_sec_header">
                        <a class="ov_sec_link ov_empire_link" href="${empireHref()}">🌍 Impero</a>
                        <span id="ov_badge_empire" class="ov_badge ov_ko_badge">✗ MANCANTE</span>
                    </div>
                    <div id="ov_body_empire" class="ov_body">
                        <div class="ov_hint">Vai alla pagina <a class="ov_empire_link" href="${empireHref()}">Impero</a> e attendi il caricamento.</div>
                    </div>
                </div>
                <button id="ov_export_btn">⬇ Esporta Dati OValue</button>
                <button id="ov_reset_btn">🗑 Svuota Cache Universo</button>
            </div>
        `;
        document.body.appendChild(panel);

        updatePanelStatus();

        setTimeout(() => {
            panel.style.left = getPanelLeft() + 'px';
        }, 1500);

        document.getElementById('ov_close_btn').addEventListener('click', () => {
            panel.style.display = 'none';
            GM_setValue(panelStateKey, false);
        });

        document.getElementById('ov_export_btn').addEventListener('click', () => {
            // Riallinea planet.lifeform dalla mappa planetLifeforms prima dell'export
            ovalueData.planets.forEach(p => {
                if (p.id != null && ovalueData.planetLifeforms[p.id]) {
                    p.lifeform = ovalueData.planetLifeforms[p.id];
                }
            });
            GM_setValue(storageKey, ovalueData);

            const jsonString = JSON.stringify(ovalueData, null, 2);
            if (typeof GM_setClipboard !== 'undefined') {
                GM_setClipboard(jsonString, 'text');
                alert('✅ Dati OValue copiati negli appunti!');
            } else {
                navigator.clipboard.writeText(jsonString).then(() => alert('✅ Dati OValue copiati!'));
            }
        });

        document.getElementById('ov_reset_btn').addEventListener('click', () => {
            if (!confirm(`Svuotare la cache per "${serverKey}"?`)) return;
            GM_deleteValue(storageKey);
            alert(`Cache azzerata! Ricarica la pagina per ricominciare.`);
            location.reload();
        });
    }

    setTimeout(injectUI, 500);

})();
