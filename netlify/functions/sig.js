import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

let fontData;
try {
    fontData = readFileSync(join(__dirname, 'Orbitron-Bold.woff2'));
} catch (_) {
    fontData = readFileSync(join(process.cwd(), 'public/fonts/Orbitron-Bold.woff2'));
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

const BG_CSS = [
    'linear-gradient(135deg, #060a16 0%, #0c1830 100%)',               // Stellare
    'linear-gradient(180deg, #0e0400 0%, #1e0900 55%, #2c1100 100%)', // Fucina
    'linear-gradient(180deg, #120600 0%, #261000 55%, #351a00 100%)', // Cartoon
    'linear-gradient(180deg, #03050e 0%, #0e0600 42%, #1c0a00 100%)', // Anime
    'linear-gradient(135deg, #020508 0%, #040c10 100%)',               // Cyber
];

const fmtNum = n => new Intl.NumberFormat('it-IT').format(Math.floor(n || 0));
const fmtPct = v => `+${Number(v || 0).toFixed(2)}%`;

const buildLayout = (data, bgIndex) => {
    const bg          = BG_CSS[bgIndex] || BG_CSS[0];
    const borderColor = data.borderColor || '#00f0ff';
    const prodColor   = data.prodColor   || '#FFB800';

    const packStr      = fmtNum(data.daily);
    const packFontSize = packStr.length <= 10 ? 20 : packStr.length <= 13 ? 17 : 14;

    const nicknameColor = data.nicknameColor || '#e2e8f0';
    const showClass     = data.showClass     !== false;
    const showEco       = data.showEco       !== false;
    const showUniverse  = data.showUniverse  !== false;
    const showMine      = data.showMine      !== false;
    const showLfBonus   = data.showLfBonus   !== false;
    const showCollBonus = data.showCollBonus !== false;

    const nickname = data.nickname || data.universe || 'Player';
    const universe = data.universe || '';

    // Labels localizzate con fallback EN
    const lbl = {
        pack:           (data.labels && data.labels.pack)           || 'PACK · 24H',
        mine:           (data.labels && data.labels.mine)           || 'METAL MINE',
        lfBonus:        (data.labels && data.labels.lfBonus)        || 'LF BONUS',
        collector:      (data.labels && data.labels.collector)      || 'COLLECTOR',
        eco:            (data.labels && data.labels.eco)            || 'ECO',
        classCollector: (data.labels && data.labels.classCollector) || 'COLLECTOR',
        classGeneral:   (data.labels && data.labels.classGeneral)   || 'GENERAL',
        classExplorer:  (data.labels && data.labels.classExplorer)  || 'EXPLORER',
    };

    const classLabel = data.playerClass === 'collector' ? lbl.classCollector
                     : data.playerClass === 'explorer'  ? lbl.classExplorer
                     : lbl.classGeneral;

    // ── Info giocatore TOP (sinistra) ────────────────────────────────────────
    const topInfoChildren = [
        {
            type: 'span',
            props: {
                style: { fontSize: 13, fontWeight: 700, color: nicknameColor, letterSpacing: '0.5px' },
                children: nickname.toUpperCase().slice(0, 18),
            },
        },
        ...(showUniverse && universe ? [{
            type: 'span',
            props: {
                style: { fontSize: 10, color: '#4a5568', letterSpacing: '1px' },
                children: universe.toUpperCase(),
            },
        }] : []),
        ...(showClass ? [{
            type: 'span',
            props: {
                style: {
                    fontSize: 10,
                    fontWeight: 700,
                    color: data.playerClass === 'collector' ? '#00f0ff' : '#64748b',
                    letterSpacing: '1px',
                },
                children: classLabel.toUpperCase(),
            },
        }] : []),
        ...(showEco ? [{
            type: 'span',
            props: {
                style: { fontSize: 9, color: '#3d5070', letterSpacing: '1px' },
                children: `${lbl.eco} ×${data.ecoSpeed || 8}`,
            },
        }] : []),
    ];

    // ── Stats destra ─────────────────────────────────────────────────────────
    const rightStats = [
        showMine    ? { label: lbl.mine,      value: `Lv.${data.maxMine || 0}`, color: '#00f0ff' } : null,
        showLfBonus ? { label: lbl.lfBonus,   value: fmtPct(data.lfBonus),      color: '#00ff9d' } : null,
        (showCollBonus && data.isCollector && Number(data.collBonus) > 0)
                    ? { label: lbl.collector, value: fmtPct(data.collBonus),    color: '#9d00ff' } : null,
    ].filter(Boolean);

    const statsGap = rightStats.length >= 3 ? 10 : rightStats.length === 2 ? 18 : 0;

    return {
        type: 'div',
        props: {
            style: {
                width: '500px', height: '150px',
                display: 'flex', flexDirection: 'column',
                background: bg,
                border: `1.5px solid ${borderColor}aa`,
                borderRadius: '6px',
                fontFamily: 'Orbitron',
                overflow: 'hidden',
            },
            children: [
                // Riga principale
                {
                    type: 'div',
                    props: {
                        style: { display: 'flex', flex: 1, padding: '10px 12px 4px', alignItems: 'stretch' },
                        children: [
                            // Colonna sinistra: info TOP + pack BOTTOM
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        width: '224px',
                                        display: 'flex', flexDirection: 'column',
                                        justifyContent: 'space-between',
                                    },
                                    children: [
                                        // TOP: nickname + classe + eco
                                        {
                                            type: 'div',
                                            props: {
                                                style: { display: 'flex', flexDirection: 'column', gap: '4px' },
                                                children: topInfoChildren,
                                            },
                                        },
                                        // BOTTOM: pacchetto 24h
                                        {
                                            type: 'div',
                                            props: {
                                                style: { display: 'flex', flexDirection: 'column', gap: '3px' },
                                                children: [
                                                    {
                                                        type: 'span',
                                                        props: { style: { fontSize: 10, color: '#475569', letterSpacing: '2px' }, children: lbl.pack },
                                                    },
                                                    {
                                                        type: 'span',
                                                        props: { style: { fontSize: packFontSize, fontWeight: 700, color: prodColor, letterSpacing: '-0.5px' }, children: packStr },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                            // Separatore verticale
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        width: '1px', background: `${borderColor}55`,
                                        margin: '0 6px', alignSelf: 'stretch',
                                    },
                                },
                            },
                            // Colonna destra: stats account
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        flex: 1, display: 'flex', flexDirection: 'column',
                                        justifyContent: 'center', gap: `${statsGap}px`,
                                    },
                                    children: rightStats.length > 0
                                        ? rightStats.map(({ label, value, color }) => ({
                                            type: 'div',
                                            props: {
                                                style: { display: 'flex', flexDirection: 'column', gap: '3px' },
                                                children: [
                                                    { type: 'span', props: { style: { fontSize: 10, color: '#4a5568', letterSpacing: '0.8px' }, children: label } },
                                                    { type: 'span', props: { style: { fontSize: 14, fontWeight: 700, color }, children: value } },
                                                ],
                                            },
                                        }))
                                        : [{ type: 'span', props: { style: { fontSize: 8, color: '#3d5070' }, children: '—' } }],
                                },
                            },
                        ],
                    },
                },
                // Bottom bar
                {
                    type: 'div',
                    props: {
                        style: {
                            borderTop: '1px solid rgba(45,55,72,0.35)',
                            padding: '3px 12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        },
                        children: [{
                            type: 'span',
                            props: { style: { fontSize: 7, color: '#243045', letterSpacing: '2px' }, children: 'PRODUCTION CORE  •  OVALUE' },
                        }],
                    },
                },
            ],
        },
    };
};

// ─── Handler ─────────────────────────────────────────────────────────────────
export const handler = async (event) => {
    const match = event.path.match(UUID_RE);
    if (!match) return { statusCode: 400, body: 'Invalid signature ID' };
    const sigId = match[0];

    let sigData, bgIndex;
    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/signatures?id=eq.${sigId}&select=data,bg_index&limit=1`,
            { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
        );
        const [row] = await res.json();
        if (!row) return { statusCode: 404, body: 'Signature not found' };
        sigData  = row.data      || {};
        bgIndex  = row.bg_index  ?? 0;
    } catch (err) {
        return { statusCode: 502, body: `Supabase error: ${err.message}` };
    }

    const svg = await satori(buildLayout(sigData, bgIndex), {
        width:  500,
        height: 150,
        fonts: [{ name: 'Orbitron', data: fontData, weight: 700, style: 'normal' }],
    });

    const resvg  = new Resvg(svg, { fitTo: { mode: 'width', value: 500 } });
    const pngBuf = resvg.render().asPng();

    return {
        statusCode: 200,
        headers: {
            'Content-Type':  'image/png',
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
        body:            Buffer.from(pngBuf).toString('base64'),
        isBase64Encoded: true,
    };
};
