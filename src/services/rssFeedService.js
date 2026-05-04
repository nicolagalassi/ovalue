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
      const rssCat = _clean(_text(item, 'category') || '');
      const rssLower = rssCat.toLowerCase();
      let category;
      if (rssLower.includes('offer')) {
        category = _inferCategory(title, pubDate, 'Offer');
      } else if (rssLower.includes('event')) {
        category = _inferCategory(title, pubDate, 'Event');
      } else if (rssCat) {
        category = rssCat;
      } else {
        category = _inferCategory(title, pubDate);
      }
      return {
        title,
        link:     _text(item, 'link') || _text(item, 'guid') || '#',
        pubDate,
        category,
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

const monthMap = {
  'jan': 0, 'january': 0, 'feb': 1, 'february': 1,
  'mar': 2, 'march': 2, 'apr': 3, 'april': 3,
  'may': 4, 'jun': 5, 'june': 5,
  'jul': 6, 'july': 6, 'aug': 7, 'august': 7,
  'sep': 8, 'september': 8, 'oct': 9, 'october': 9,
  'nov': 10, 'november': 10, 'dec': 11, 'december': 11
};

function _inferCategory(text, pubDateStr = '', forceBaseType = null) {
  const t = text.toLowerCase();
  let baseCat = forceBaseType || 'News';

  if (!forceBaseType) {
    if (/sale|discount|offer|cashback|relocation|items|%/.test(t)) baseCat = 'Offer';
    else if (/happy hour|hh\b|\bevent\b|task reward/.test(t)) baseCat = 'Event';
    else if (/v\d+\.\d+|version|changelog/.test(t)) return 'Changelog';
    else if (/maintenance|maint/.test(t)) return 'Maintenance';
    else if (/new universe|uni \d+/.test(t)) return 'New Universe';
  }

  if (baseCat === 'Offer' || baseCat === 'Event') {
    const now = new Date();
    now.setHours(0,0,0,0);
    const todayNum = now.getTime();
    
    let earliest = Infinity;
    let latest = 0;
    let foundDate = false;

    // 1. DD.MM
    const matchesNumeric = [...text.matchAll(/(\d{1,2})\.(\d{1,2})\.?/g)];
    if (matchesNumeric.length > 0) {
      foundDate = true;
      for (const match of matchesNumeric) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        if (day > 0 && day <= 31 && month >= 0 && month <= 11) {
          const dStart = new Date(now.getFullYear(), month, day, 0, 0, 0).getTime();
          const dEnd = new Date(now.getFullYear(), month, day, 23, 59, 59).getTime();
          if (dStart < earliest) earliest = dStart;
          if (dEnd > latest) latest = dEnd;
        }
      }
    }

    // 2. Month DD or Month DD-DD (separator must be dash/en-dash/em-dash)
    const matchesWord = [...text.matchAll(/([a-zA-Z]+)\s+(\d{1,2})(?:\s*[-–—]\s*(\d{1,2}))?/g)];
    for (const match of matchesWord) {
      const monthStr = match[1].toLowerCase();
      if (monthMap[monthStr] !== undefined) {
        foundDate = true;
        const month = monthMap[monthStr];
        const startDay = parseInt(match[2]);
        const endDayRaw = match[3] ? parseInt(match[3]) : null;
        const endDay = (endDayRaw && endDayRaw >= 1 && endDayRaw <= 31) ? endDayRaw : startDay;
        const dStart = new Date(now.getFullYear(), month, startDay, 0, 0, 0).getTime();
        const dEnd = new Date(now.getFullYear(), month, endDay, 23, 59, 59).getTime();
        if (dStart < earliest) earliest = dStart;
        if (dEnd > latest) latest = dEnd;
      }
    }

    if (foundDate) {
      if (todayNum >= earliest && todayNum <= latest) return `Active ${baseCat}`;
      if (todayNum < earliest) return `Future ${baseCat}`;
      return `Past ${baseCat}`;
    }

    if (pubDateStr) {
      const pubDate = new Date(pubDateStr);
      if ((Date.now() - pubDate.getTime()) < 2 * 24 * 3600 * 1000) return `Active ${baseCat}`;
    }
    
    return `Past ${baseCat}`;
  }
  
  return baseCat;
}
