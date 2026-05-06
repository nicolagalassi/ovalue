// ==UserScript==
// @name         OValue DOM Inspector
// @namespace    https://greasyfork.org/it/users/1546037-nicolagalassi
// @version      1.0.0
// @description  Ispeziona il DOM di OGame e mostra i selettori rilevanti per OValue Exporter
// @author       OValue
// @license      MIT
// @match        https://*.ogame.gameforge.com/game/index.php*
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    setTimeout(inspect, 1500);

    function q(sel)  { return document.querySelector(sel); }
    function qa(sel) { return [...document.querySelectorAll(sel)]; }
    function text(sel) {
        const el = q(sel);
        return el ? el.textContent.trim().slice(0, 120) : null;
    }
    function meta(name) {
        const el = q(`meta[name="${name}"]`);
        return el ? el.getAttribute('content') : null;
    }

    function inspect() {
        const urlParams = new URLSearchParams(window.location.search);
        const page      = urlParams.get('page') || '';
        const component = urlParams.get('component') || '';
        const cp        = urlParams.get('cp') || '';

        const out = {
            url: window.location.href,
            page, component, cp,
            sections: {}
        };

        // ── META TAGS ──────────────────────────────────────────────────────────
        const metaKeys = [
            'ogame-planet-id', 'ogame-planet-type', 'ogame-planet-name',
            'ogame-player-id', 'ogame-player-name', 'ogame-universe',
            'ogame-universe-name', 'ogame-lang', 'ogame-server-time'
        ];
        const metaSection = {};
        metaKeys.forEach(k => { const v = meta(k); if (v) metaSection[k] = v; });
        // also dump ALL meta[name^="ogame"]
        qa('meta[name^="ogame"]').forEach(el => {
            metaSection[el.name] = el.getAttribute('content');
        });
        out.sections.meta = metaSection;

        // ── PLAYER / UNIVERSE ─────────────────────────────────────────────────
        const player = {};
        const nameCandidates = [
            '#playerName',
            '#myName',
            '.player-name',
            '#topBar .playerName',
            '#siteHeader .playerName',
            'a[href*="player"]'
        ];
        for (const sel of nameCandidates) {
            const v = text(sel);
            if (v) { player[sel] = v; break; }
        }
        // universe name / speed
        const univCandidates = ['#universe', '.universe-name', '#serverName', '#ogame-server'];
        for (const sel of univCandidates) {
            const v = text(sel);
            if (v) player[sel] = v;
        }
        out.sections.player = player;

        // ── PLAYER CLASS ──────────────────────────────────────────────────────
        const classSel = {};
        qa('#characterclass [class*="sprite"], #characterclass .characterclass-icon, #characterclass img, #characterclass [class*="miner"], #characterclass [class*="explorer"], #characterclass [class*="warrior"]')
            .forEach(el => {
                classSel[el.tagName + '.' + [...el.classList].join('.')] = el.textContent.trim().slice(0, 60) || el.getAttribute('src') || '(element found)';
            });
        out.sections.playerClass = classSel;

        // ── OFFICERS ─────────────────────────────────────────────────────────
        const officerSection = {};
        qa('#officers a, #officers [class*="officer"], .officer-button, [id*="officer"]').forEach(el => {
            const key = el.tagName + '#' + el.id + '.' + [...el.classList].join('.');
            officerSection[key] = {
                textContent: el.textContent.trim().slice(0, 80),
                classList: [...el.classList],
                innerHTML_short: el.innerHTML.slice(0, 200)
            };
        });
        // timer elements within officers
        qa('#officers [class*="timer"], #officers .custom-timer-officer, #officers [data-tooltip-title]').forEach(el => {
            const key = 'TIMER:' + el.tagName + '.' + [...el.classList].join('.');
            officerSection[key] = {
                text: el.textContent.trim(),
                tooltip: el.getAttribute('data-tooltip-title')?.slice(0, 200)
            };
        });
        out.sections.officers = officerSection;

        // ── LIFEFORM ─────────────────────────────────────────────────────────
        const lfSection = {};
        // Try every possible lifeform container
        const lfCandidates = [
            '#lifeform', '#lf', '.lifeform', '[id*="lifeform"]',
            '[class*="lifeform"]', 'lifeform-component',
            '#lifeformBuildings', '.lifeformActive',
            '[data-lifeform]', '#characterlifeform'
        ];
        for (const sel of lfCandidates) {
            const els = qa(sel);
            if (els.length > 0) {
                lfSection[sel] = els.map(el => ({
                    id: el.id,
                    classList: [...el.classList],
                    innerHTML_short: el.innerHTML.slice(0, 300)
                }));
            }
        }
        // Direct lifeform class icons (lifeform1..4)
        ['lifeform1','lifeform2','lifeform3','lifeform4'].forEach(lf => {
            const els = qa('.' + lf);
            if (els.length > 0) {
                lfSection['.' + lf] = els.map(el => ({
                    tagName: el.tagName,
                    id: el.id,
                    classList: [...el.classList],
                    parent: el.parentElement ? (el.parentElement.tagName + '#' + el.parentElement.id + '.' + [...el.parentElement.classList].join('.')) : null
                }));
            }
        });
        out.sections.lifeform = lfSection;

        // ── LF BONUSES ────────────────────────────────────────────────────────
        const lfBonus = {};
        qa('inner-bonus-item-heading, [class*="lfbonus"], [class*="lf-bonus"], [id*="lfbonus"]').forEach(el => {
            const key = el.tagName + '.' + [...el.classList].join('.');
            lfBonus[key] = el.innerHTML.slice(0, 400);
        });
        qa('.subCategoryTitle, .subCategoryBonus, .bonus-category').forEach(el => {
            const key = el.tagName + '.' + [...el.classList].join('.') + '|' + (el.getAttribute('aria-label') || '');
            lfBonus[key] = el.textContent.trim().slice(0, 100);
        });
        out.sections.lfBonuses = lfBonus;

        // ── EMPIRE / BUILDINGS ────────────────────────────────────────────────
        const empire = {};
        const planetEls = qa('.planet:not(.summary)');
        empire.planetCount = planetEls.length;
        if (planetEls.length > 0) {
            const p = planetEls[0]; // first planet as sample
            empire.firstPlanet = {
                id: p.id,
                classList: [...p.classList],
                coords: p.querySelector('.coords')?.textContent.trim(),
                name: p.querySelector('.planetname, .planet-name, [class*="name"]')?.textContent.trim(),
                innerHTML_first300: p.innerHTML.slice(0, 300),
                // Try building level selectors
                supply_sel_1: p.querySelector('.supply [class~="1"]')?.innerText?.slice(0, 50),
                research_122: p.querySelector('.values.research [class~="122"]')?.innerText?.slice(0, 50),
                lifeform1bld: p.querySelector('.lifeform1buildings [class~="11106"]')?.innerText?.slice(0, 50),
                lifeform2bld: p.querySelector('.lifeform2buildings [class~="12106"]')?.innerText?.slice(0, 50),
            };
        }
        out.sections.empire = empire;

        // ── GLOBAL ITEMS ──────────────────────────────────────────────────────
        const items = {};
        qa('.empireItems .item_img, [class*="globalItem"] img, [id*="item"] img, .item_img[data-tooltip-title]').forEach((el, i) => {
            items['item_' + i] = {
                tooltip: el.getAttribute('data-tooltip-title')?.slice(0, 200),
                classList: [...el.classList],
                parentHtml: el.parentElement?.outerHTML?.slice(0, 300)
            };
        });
        out.sections.globalItems = items;

        // ── PLANET SIDEBAR ────────────────────────────────────────────────────
        const sidebar = {};
        const planets = qa('#planetList .smallplanet');
        sidebar.count = planets.length;
        if (planets.length > 0) {
            const first = planets[0];
            sidebar.firstEntry = {
                innerHTML: first.innerHTML.slice(0, 400),
                link_href: first.querySelector('a')?.href,
                coords: first.querySelector('.planet-koords, .coords')?.textContent.trim(),
                name: first.querySelector('.planet-name, .planetname')?.textContent.trim()
            };
        }
        out.sections.planetSidebar = sidebar;

        // ── RENDER ────────────────────────────────────────────────────────────
        showPanel(out);
    }

    function showPanel(data) {
        GM_addStyle(`
            #ov_inspector { position:fixed; top:10px; right:10px; width:480px; max-height:90vh;
                overflow-y:auto; background:#0a0e14; border:1px solid #2a4060; border-radius:6px;
                z-index:99999; font:11px/1.4 monospace; color:#8ab0d0;
                box-shadow:0 4px 24px rgba(0,0,0,.8); }
            #ov_inspector h2 { background:#12202e; color:#c8e0f0; padding:8px 12px; margin:0;
                font-size:12px; letter-spacing:1px; border-bottom:1px solid #1a3040; }
            #ov_inspector pre { padding:10px 12px; margin:0; white-space:pre-wrap; word-break:break-all;
                max-height:70vh; overflow-y:auto; font-size:10px; }
            #ov_insp_copy { float:right; background:#1a3050; border:1px solid #2a5070;
                color:#8ab0d0; cursor:pointer; padding:3px 10px; border-radius:3px; font-size:10px; }
            #ov_insp_copy:hover { background:#2a4060; }
            #ov_insp_close { float:right; background:none; border:none; color:#6090b0;
                cursor:pointer; font-size:14px; padding:0 4px; margin-right:4px; }
        `);

        const json = JSON.stringify(data, null, 2);
        const panel = document.createElement('div');
        panel.id = 'ov_inspector';
        panel.innerHTML = `
            <h2>
                ⬡ OValue Inspector — ${data.page || 'home'}/${data.component || ''}
                <button id="ov_insp_close">✕</button>
                <button id="ov_insp_copy">📋 Copia</button>
            </h2>
            <pre>${escHtml(json)}</pre>
        `;
        document.body.appendChild(panel);

        panel.querySelector('#ov_insp_close').onclick = () => panel.remove();
        panel.querySelector('#ov_insp_copy').onclick = () => {
            if (typeof GM_setClipboard !== 'undefined') GM_setClipboard(json, 'text');
            else navigator.clipboard.writeText(json);
            panel.querySelector('#ov_insp_copy').textContent = '✓ Copiato!';
        };
    }

    function escHtml(s) {
        return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
})();
