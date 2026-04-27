// ==UserScript==
// @name         OValue Exporter
// @namespace    https://greasyfork.org/it/users/1546037-nicolagalassi
// @version      2.2.0
// @description  Raccoglie i dati dell'impero navigando per le pagine, li memorizza per universo e li esporta
// @author       OValue
// @license      MIT
// @match        https://*.ogame.gameforge.com/game/index.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ogame.gameforge.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(async function () {
    'use strict';

    // 1. CHIAVI DI STORAGE
    const serverKey = window.location.hostname;
    const storageKey = 'ovalue_data_' + serverKey;
    const panelStateKey = 'ovalue_panel_state';

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
        globalItems: [],
        universeSpeed: 1
    });

    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    const component = urlParams.get('component');

    // --- 2. FUNZIONI DI AGGIORNAMENTO UI ---

    // Posiziona il pannello a sinistra del menu di navigazione di OGame (nello spazio di sfondo)
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
        // ── OVERVIEW ──────────────────────────────────────────────────────────
        const badge = (id, ok) => {
            let el = document.getElementById(id);
            if (!el) return;
            el.className = ok ? 'ov_badge ov_ok_badge' : 'ov_badge ov_ko_badge';
            el.textContent = ok ? '✓ LETTO' : '✗ MANCANTE';
        };

        badge('ov_badge_overview', ovalueData.overview_collected);
        badge('ov_badge_lf', ovalueData.lf_collected);
        badge('ov_badge_empire', ovalueData.empire_collected);

        // Velocità universo
        let speedEl = document.getElementById('ov_speed');
        if (speedEl) speedEl.textContent = `${serverKey.split('.')[0].toUpperCase()} · eco ${ovalueData.universeSpeed}x`;

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
                empBody.innerHTML = `<div class="ov_hint">Vai alla pagina <a href="?page=empire">Impero</a> e attendi il caricamento.</div>`;
            } else {
                let html = `
                    <div class="ov_row"><span class="ov_lbl">Pianeti letti</span><span class="ov_val">${ovalueData.planets.length}</span></div>
                    <div class="ov_row"><span class="ov_lbl">Tecnologia Plasma</span><span class="ov_val">Liv. ${ovalueData.settings.plasma}</span></div>
                `;

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
            GM_setValue(storageKey, ovalueData);
            updatePanelStatus();
        } catch (e) {
            console.error("OValue Exporter: Impossibile recuperare la velocità dell'universo", e);
        }
    }

    function parseOverview() {
        let classDiv = document.querySelector('#characterclass .sprite');
        if (classDiv) {
            // Le classi CSS sono uguali in tutte le lingue
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
                // 1. Prova il timer countdown (formato D:HH:MM:SS)
                let timerDiv = a.querySelector('.custom-timer-officer, .timer, [class*="timer"]');
                if (timerDiv) {
                    let raw = timerDiv.innerText.trim();
                    // Scarta "∞", "Permanente" e stringhe vuote
                    if (raw && !/^(∞|Permanente|Permanent|-|)$/i.test(raw)) {
                        timeStr = raw;
                    }
                }
                // 2. Fallback: leggi dalla tooltip (alcuni versioni OGame mostrano la durata lì)
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
                // Rimuove la parola "Totale:" o "Total:" per le lingue IT/EN
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

    // Estrae la durata rimanente da tooltip e/o elemento DOM.
    // Gestisce formati IT/EN e il countdown OGame (D:HH:MM:SS).
    function extractDuration(tooltipTitle, imgEl) {
        // 1. Cerca nel tooltip: "Durata rimanente: X" / "Remaining duration: X"
        let m = tooltipTitle.match(/(?:Durata rimanente|Remaining duration|Verbleibende Laufzeit|Durée restante)\s*:?\s*([^\n|<]+)/i);
        if (m) {
            let val = m[1].trim();
            if (val && !/^(∞|-|Permanent|Permanente)$/i.test(val)) return val;
            if (/^(∞|Permanent|Permanente)$/i.test(val)) return "Permanente";
        }

        // 2. Cerca un timer countdown nel DOM (D:HH:MM:SS)
        if (imgEl) {
            let timerEl = imgEl.querySelector('[class*="timer"], .duration, .countdown');
            if (timerEl) {
                let raw = timerEl.innerText.trim();
                if (raw && !/^(∞|-|Permanent|Permanente)$/i.test(raw)) return raw;
            }
            // 3. Span nascosto con testo alternativo
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

        // 2. Pianeti, Livelli, LF, Crawlers
        let planetsData = [];
        document.querySelectorAll('.planet').forEach((p) => {
            let coordsText = p.querySelector('.coords')?.innerText || '';
            let match = coordsText.trim().match(/\[\d+:\d+:(\d+)\]/);
            if (!match) return;

            let pos = parseInt(match[1]);
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
                // Booster produzione metallo (usati nei calcoli)
                if (/metallo Bronzo|Bronze Metal/i.test(titleAttr)) itemValue = Math.max(itemValue, 10);
                if (/metallo Argento|Silver Metal/i.test(titleAttr)) itemValue = Math.max(itemValue, 20);
                if (/metallo Oro|Gold Metal/i.test(titleAttr)) itemValue = Math.max(itemValue, 30);
                if (/metallo Platino|Platinum Metal/i.test(titleAttr)) itemValue = Math.max(itemValue, 40);

                let ampMatch = titleAttr.match(/(?:Amplificatore di risorse|Resource Amplifier)[^\d]*(\d+)/i);
                if (ampMatch) itemCustomValue = parseInt(ampMatch[1]);
            });

            planetsData.push({
                name,
                pos,
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

        // 3. Item Globali — dalla prima sezione .empireItems trovata (uguale per tutti i pianeti)
        let globalItemsData = [];
        const empireItemsEl = document.querySelector('.planet .empireItems') || document.querySelector('.empireItems');
        if (empireItemsEl) {
            empireItemsEl.querySelectorAll('.item_img').forEach(img => {
                let titleAttr = img.getAttribute('data-tooltip-title') || '';
                let name = titleAttr.split('|')[0].trim();
                // Escludi booster produzione già gestiti come itemValue
                if (!name || /metallo|Metal|Amplificatore|Amplifier/i.test(name)) return;
                let timeRemaining = extractDuration(titleAttr, img);
                // Durata totale dell'item (per la barra di avanzamento nello scadenziario)
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


    // --- 4. ESECUZIONE ROUTING ---

    if (page === 'ingame' && component === 'overview') {
        setTimeout(parseOverview, 1000);
    } else if (page === 'ingame' && component === 'lfbonuses') {
        setTimeout(parseLFBonuses, 1000);
    } else if (component === 'empire') {
        tryParseEmpire();
    }

    if (!ovalueData.universeSpeed || ovalueData.universeSpeed === 1) {
        fetchUniverseSpeed();
    }

    // --- 5. INTERFACCIA UTENTE ---

    GM_addStyle(`
        /* Panel container */
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
        #ov_header_title {
            font-weight: bold;
            color: #c8dff0;
            font-size: 12px;
            flex-grow: 1;
            letter-spacing: 1px;
        }
        #ov_speed {
            font-size: 9px;
            color: #4a6a8a;
            margin-right: 4px;
        }
        #ov_close_btn {
            background: none;
            border: none;
            color: #4a6a8a;
            cursor: pointer;
            font-size: 14px;
            line-height: 1;
            padding: 0 2px;
        }
        #ov_close_btn:hover { color: #8aa8c8; }
        #ov_content { padding: 8px 10px; }

        /* Sections */
        .ov_section { margin-bottom: 6px; }
        .ov_sec_header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px solid #1a2530;
            margin-bottom: 4px;
        }
        .ov_sec_link {
            font-size: 10px;
            font-weight: bold;
            color: #7aaace;
            text-decoration: none;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .ov_sec_link:hover { color: #a0ccee; text-decoration: underline; }

        /* Status badges */
        .ov_badge { font-size: 8px; font-weight: bold; padding: 2px 5px; border-radius: 3px; white-space: nowrap; }
        .ov_ok_badge  { background: #0f2a05; color: #6fc52a; border: 1px solid #2a5010; }
        .ov_ko_badge  { background: #2a0808; color: #d43636; border: 1px solid #5a1010; }

        /* Body rows */
        .ov_body { padding: 0 0 2px 0; }
        .ov_row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 2px 0;
            font-size: 10px;
            border-bottom: 1px solid #141e28;
            gap: 4px;
        }
        .ov_row:last-child { border-bottom: none; }
        .ov_lbl     { color: #5a7a9a; flex-shrink: 0; }
        .ov_val     { color: #a0bcd4; text-align: right; }
        .ov_active  { color: #6fc52a; font-weight: bold; }
        .ov_warn    { color: #e8a83a; }
        .ov_perm    { color: #4a8ac0; }
        .ov_dim     { color: #2e3e4e; font-style: italic; }
        .ov_hint    { font-size: 10px; color: #4a6a8a; padding: 3px 0; line-height: 1.4; }
        .ov_hint a  { color: #5a9aca; text-decoration: underline; }
        .ov_sub_title {
            font-size: 9px; font-weight: bold; color: #4a6a8a;
            margin: 5px 0 2px;
            text-transform: uppercase; letter-spacing: 1px;
        }
        .ov_item_name {
            max-width: 130px; overflow: hidden;
            text-overflow: ellipsis; white-space: nowrap;
        }

        /* Buttons */
        #ov_export_btn, #ov_reset_btn {
            display: block;
            width: 100%;
            margin-top: 8px;
            padding: 5px 0;
            background: linear-gradient(to bottom, #2d4055 0%, #182030 100%);
            border: 1px solid #0a1018;
            color: #c8dff0;
            cursor: pointer;
            border-radius: 3px;
            font-size: 11px;
            font-family: inherit;
            letter-spacing: 0.5px;
        }
        #ov_export_btn:hover { background: linear-gradient(to bottom, #3a5268 0%, #202d3e 100%); }
        #ov_reset_btn { background: linear-gradient(to bottom, #3a1010 0%, #1e0808 100%); margin-top: 4px; }
        #ov_reset_btn:hover { background: linear-gradient(to bottom, #4e1515 0%, #280a0a 100%); }

        /* Menu button in OGame sidebar */
        #ov_menu_btn { cursor: pointer; }
    `);

    function injectUI() {
        // ── Bottone nel menu laterale OGame ────────────────────────────────────
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

        // ── Pannello principale ────────────────────────────────────────────────
        const panel = document.createElement('div');
        panel.id = 'ov_panel';

        // Posizionamento: a sinistra del menu nav di OGame, nello spazio di sfondo
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

                <!-- Sezione: Panoramica -->
                <div class="ov_section">
                    <div class="ov_sec_header">
                        <a class="ov_sec_link" href="?page=ingame&component=overview">👤 Panoramica</a>
                        <span id="ov_badge_overview" class="ov_badge ov_ko_badge">✗ MANCANTE</span>
                    </div>
                    <div id="ov_body_overview" class="ov_body">
                        <div class="ov_hint">Vai alla <a href="?page=ingame&component=overview">Panoramica</a> e attendi il caricamento.</div>
                    </div>
                </div>

                <!-- Sezione: Lifeform -->
                <div class="ov_section">
                    <div class="ov_sec_header">
                        <a class="ov_sec_link" href="?page=ingame&component=lfbonuses">🧬 LifeForm</a>
                        <span id="ov_badge_lf" class="ov_badge ov_ko_badge">✗ MANCANTE</span>
                    </div>
                    <div id="ov_body_lf" class="ov_body">
                        <div class="ov_hint">Vai ai <a href="?page=ingame&component=lfbonuses">Bonus LifeForm</a> e attendi il caricamento.</div>
                    </div>
                </div>

                <!-- Sezione: Impero -->
                <div class="ov_section">
                    <div class="ov_sec_header">
                        <a class="ov_sec_link" href="?page=empire">🌍 Impero</a>
                        <span id="ov_badge_empire" class="ov_badge ov_ko_badge">✗ MANCANTE</span>
                    </div>
                    <div id="ov_body_empire" class="ov_body">
                        <div class="ov_hint">Vai alla pagina <a href="?page=empire">Impero</a> e attendi il caricamento.</div>
                    </div>
                </div>

                <button id="ov_export_btn">⬇ Esporta Dati OValue</button>
                <button id="ov_reset_btn">🗑 Svuota Cache Universo</button>
            </div>
        `;
        document.body.appendChild(panel);

        updatePanelStatus();

        // Riposiziona il pannello se il sidebar si carica dopo
        setTimeout(() => {
            const updatedLeft = getPanelLeft();
            panel.style.left = updatedLeft + 'px';
        }, 1500);

        document.getElementById('ov_close_btn').addEventListener('click', () => {
            panel.style.display = 'none';
            GM_setValue(panelStateKey, false);
        });

        document.getElementById('ov_export_btn').addEventListener('click', () => {
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
