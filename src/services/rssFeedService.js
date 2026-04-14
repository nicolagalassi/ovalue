/**
 * rssFeedService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches and parses the OGame EN international forum RSS feed.
 *
 * Board feed URL pattern (WBB4 / Woltlab Suite):
 *   https://board.en.ogame.gameforge.com/index.php/BoardFeed/{BOARD_ID}/
 *
 * Board 1022 = Events / News / Info (most active board for announcements).
 *
 * CORS strategy — proxies tried in order, first success wins:
 *   1. Direct fetch        — works if Gameforge sends CORS headers (sometimes does)
 *   2. allorigins.win      — returns JSON { contents: '<xml>...' }
 *   3. corsproxy.io        — transparent proxy
 *   4. thingproxy          — last resort fallback
 *
 * For production, replace public proxies with a private edge function.
 * See INTEGRATION_GUIDE.md for a Netlify/Vercel edge function template.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const FEED_URL  = 'https://board.en.ogame.gameforge.com/index.php?board-feed/1022/';
const MAX_ITEMS = 20;

const PROXY_CHAIN = [
  // 1. Direct (no proxy)
  (url) => url,

  // 2. allOrigins — wraps response in { contents: '...' }
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,

  // 3. corsproxy.io — transparent
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,

  // 4. Codetabs — another transparent proxy
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetches the OGame forum RSS feed, trying each proxy in turn.
 * @returns {Promise<FeedItem[]>}
 *
 * @typedef {{ title: string, link: string, pubDate: string, category: string }} FeedItem
 */
export async function fetchOGameFeed() {
  const controller = new AbortController();
  const promises = PROXY_CHAIN.map(makeUrl => 
    _fetchViaProxy(makeUrl, FEED_URL, controller.signal).then(xml => {
      if (xml) {
        const items = _parseRSS(xml);
        if (items.length > 0) return items;
      }
      throw new Error('Empty or invalid RSS');
    })
  );

  try {
    const fastestResult = await Promise.any(promises);
    controller.abort(); // Cancel slower requests
    return fastestResult;
  } catch (err) {
    throw new Error('All RSS proxy attempts failed: ' + err.message);
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function _fetchViaProxy(makeUrl, targetUrl, externalSignal) {
  const proxyUrl = makeUrl(targetUrl);
  
  const timeoutId = setTimeout(() => externalSignal.abort(), 8000);

  const res = await fetch(proxyUrl, {
    method: 'GET',
    headers: { Accept: 'application/rss+xml, application/xml, text/xml, */*' },
    signal: externalSignal,
  }).finally(() => clearTimeout(timeoutId));

  if (!res.ok) throw new Error(`HTTP ${res.status} — ${proxyUrl}`);

  const text = await res.text();

  // allOrigins wraps XML in a JSON envelope: { contents: '...' }
  if (proxyUrl.includes('allorigins.win')) {
    try {
      const json = JSON.parse(text);
      return json.contents ?? text;
    } catch {
      return text;
    }
  }

  return text;
}

function _parseRSS(xmlString) {
  let doc;
  try {
    doc = new DOMParser().parseFromString(xmlString, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('XML parse error');
  } catch (err) {
    console.warn('[rssFeedService] XML parse failed:', err.message);
    return [];
  }

  return Array.from(doc.querySelectorAll('item'))
    .slice(0, MAX_ITEMS)
    .map((item) => {
      const title = _clean(_text(item, 'title') || _text(item, 'description') || '(no title)');
      const pubDate = _text(item, 'pubDate') || '';
      return {
        title,
        link:     _text(item, 'link') || _text(item, 'guid') || '#',
        pubDate,
        category: _clean(_text(item, 'category') || _inferCategory(title, pubDate)),
      };
    })
    .filter((it) => it.title && it.link !== '#');
}

// ── XML / text utilities ──────────────────────────────────────────────────────

function _text(parent, tag) {
  return (parent.querySelector(tag)?.textContent ?? '').trim();
}

function _clean(str) {
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function _inferCategory(text, pubDateStr = '') {
  const t = text.toLowerCase();
  
  // Highlight Offers/Sales only if active
  if (/sale|discount|offer|cashback|relocation|items|%/.test(t)) {
    const isOfferActive = () => {
      const now = new Date();
      now.setHours(0,0,0,0);
      
      const matches = [...text.matchAll(/(\d{1,2})\.(\d{1,2})\.?/g)];
      if (matches.length > 0) {
        let latestTimestamp = 0;
        for (const match of matches) {
          const day = parseInt(match[1]);
          const month = parseInt(match[2]);
          if (day > 0 && day <= 31 && month > 0 && month <= 12) {
            const d = new Date(now.getFullYear(), month - 1, day, 23, 59, 59);
            if (d.getTime() > latestTimestamp) {
              latestTimestamp = d.getTime();
            }
          }
        }
        return latestTimestamp >= now.getTime();
      }

      if (pubDateStr) {
        const pubDate = new Date(pubDateStr);
        if ((Date.now() - pubDate.getTime()) < 2 * 24 * 3600 * 1000) return true;
      }
      return false;
    };
    
    return isOfferActive() ? 'Offer' : 'Past Offer';
  }
  
  if (/happy hour|hh\b/.test(t))              return 'Event';
  if (/\bevent\b|task reward/.test(t))        return 'Event';
  if (/v\d+\.\d+|version|changelog/.test(t)) return 'Changelog';
  if (/maintenance|maint/.test(t))            return 'Maintenance';
  if (/new universe|uni \d+/.test(t))         return 'New Universe';
  return 'News';
}
