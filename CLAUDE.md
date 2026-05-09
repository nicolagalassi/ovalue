# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server
npm run build      # Production build (outputs to dist/)
npm run preview    # Preview the built app locally
```

No test runner is configured.

## Architecture Overview

OValue is a **Vue 3 SPA** built with Vite that provides OGame (browser game) tools: mine production calculator, pack exchange optimizer, shopping list builder, and officer/item expiration tracker.

**No Vuex / Pinia** — state is managed entirely via a single composable (`src/composables/useProfiles.js`) that wraps reactive `ref`s and persists to `localStorage`. Cross-tab sync is handled via `StorageEvent`. All views import from this composable to read and mutate profiles.

## Key Files

| File | Role |
|---|---|
| `src/composables/useProfiles.js` | Global state: profiles, active profile, known servers, localStorage persistence |
| `src/composables/useLanguage.js` | i18n with fallback chain: selected lang → EN → IT → raw key |
| `src/composables/useOgameFormulas.js` | Game math: mine production, crawlers, lifeform costs, duration parsing |
| `src/data/ogame_db.js` | Complete OGame item/building/research database (~25 KB) |
| `src/router.js` | 7 lazy-loaded routes with meta title/description and scroll-to-top |
| `src/App.vue` | Root component — contains `MAINTENANCE_MODE` flag (line ~11) |
| `src/services/rssFeedService.js` | OGame RSS fetcher with CORS proxy fallback chain |
| `util/OValue_Exporter_v3.user.js` | Userscript that exports player data from OGame into a format importable by the app |

## Profile Data Shape

Each profile holds sub-objects per tool:

```js
{
  name: string,
  lastSync: timestamp,
  production: { settings, planets[], daily },
  packExchange: { settings, stock, queue[] },
  shoppingList: { cart[], activeEvent },
  expirations: { officers{}, globalItems[] }
}
```

Default factories for each sub-object are exported from `useProfiles.js` (`createDefaultProductionData`, etc.).

## i18n

Four locale files live in `src/locales/`: `it.json` (primary), `en.json`, `de.json`, `fr.json`. DE and FR are partial — missing keys fall back to EN, then IT. When adding new UI strings, add keys to all four files; use the existing key naming pattern (e.g., `lbl_*` for labels, `btn_*` for buttons, `msg_*` for messages). `lbl_dm` is the shared key for Dark Matter / Officer / Dark Matter related labels.

## Routing

Routes are lazy-loaded in `src/router.js`. Each route has a `meta.title` and `meta.description` used for `document.title` and `<meta name="description">` updates. When adding a new view, register it here with the same lazy-import pattern.

## UI Theme

Tailwind custom theme defined in `tailwind.config.js` under `colors.ogame.*`:

| Token | Value | Use |
|---|---|---|
| `ogame-bg` | `#0b0e14` | Page background |
| `ogame-panel` | `#151923` | Cards/panels |
| `ogame-accent` | `#00f0ff` | Primary cyan neon |
| `ogame-success` | `#00ff9d` | Positive values |
| `ogame-danger` | `#ff2a6d` | Errors/destruction |
| `ogame-warning` | `#ffb800` | Gold/warnings |
| `ogame-dm` | `#9d00ff` | Dark Matter purple |
| `ogame-text` | `#e2e8f0` | Body text |

Custom shadows (`neon-*`) and gradient utilities are also defined. All new components should use these tokens rather than raw color values.

## Maintenance Mode

`MAINTENANCE_MODE` is a constant at the top of `src/App.vue`. When `true`, the app shows `MaintenanceView` instead of the router outlet. Toggle it to `false` during development to access the full app.

## Util Scripts

`util/` contains standalone userscripts and Node helpers that are not part of the Vue build:

- `OValue_Exporter_v3.user.js` — browser userscript injected into OGame pages to extract player data
- `OValue_Inspector.user.js` — debugging/inspection userscript
- `lfcosts.js` / `lfcosts.php` — lifeform cost tables used by both the exporter and the app
- `ogame_shop_data.json` — shop item price reference data

These are versioned alongside the app but built/deployed separately.
