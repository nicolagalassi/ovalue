export const BG_PRESETS = [
    { key: 'deep_space',  borderColor: 'rgba(0,240,255,0.55)',   stars: true,  scanlines: false },
    { key: 'neon_void',   borderColor: 'rgba(157,0,255,0.65)',   stars: false, scanlines: false },
    { key: 'steel_frame', borderColor: 'rgba(148,163,184,0.35)', stars: false, scanlines: true  },
    { key: 'cosmic',      borderColor: 'rgba(157,0,255,0.5)',    stars: true,  scanlines: false },
    { key: 'minimal',     borderColor: 'rgba(0,240,255,0.18)',   stars: false, scanlines: false },
];

export const NICK_COLORS = [
    '#e2e8f0', // bianco
    '#00f0ff', // ciano neon
    '#FFB800', // oro
    '#00ff9d', // verde neon
    '#9d00ff', // viola DM
    '#ff2a6d', // rosso neon
];

// ─── Stelle deterministiche (LCG seed fisso) ────────────────────────────────
const drawStars = (ctx, count, W, H) => {
    let s = 42;
    const rng = () => { s = (Math.imul(1664525, s) + 1013904223) | 0; return (s >>> 0) / 4294967296; };
    for (let i = 0; i < count; i++) {
        const x = rng() * W, y = rng() * H, r = rng() * 1.2 + 0.2, a = rng() * 0.45 + 0.2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
        ctx.fill();
    }
};

// ─── Sfondi ─────────────────────────────────────────────────────────────────
const drawBackground = (ctx, bgIndex, W, H) => {
    let g;
    switch (bgIndex) {
        case 0: // Deep Space
            g = ctx.createLinearGradient(0, 0, W, H);
            g.addColorStop(0, '#070c18'); g.addColorStop(1, '#0d1a33');
            ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
            drawStars(ctx, 55, W, H);
            break;
        case 1: // Neon Void
            g = ctx.createLinearGradient(0, 0, W, H);
            g.addColorStop(0, '#0a0014'); g.addColorStop(1, '#1a0030');
            ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
            { const rg = ctx.createRadialGradient(90, 75, 0, 90, 75, 110);
              rg.addColorStop(0, 'rgba(70,0,110,0.55)'); rg.addColorStop(1, 'rgba(26,0,48,0)');
              ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H); }
            break;
        case 2: // Steel Frame
            g = ctx.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, '#0a0f14'); g.addColorStop(1, '#111b26');
            ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = 'rgba(0,0,0,0.08)';
            for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
            break;
        case 3: // Cosmic
            g = ctx.createLinearGradient(0, 0, W, H);
            g.addColorStop(0, '#050810'); g.addColorStop(0.45, '#18003c'); g.addColorStop(1, '#050810');
            ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
            { const rg = ctx.createRadialGradient(250, 75, 0, 250, 75, 130);
              rg.addColorStop(0, 'rgba(80,0,160,0.35)'); rg.addColorStop(1, 'rgba(5,8,16,0)');
              ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H); }
            drawStars(ctx, 40, W, H);
            break;
        default: // Minimal
            ctx.fillStyle = '#050810'; ctx.fillRect(0, 0, W, H);
            break;
    }
};

// ─── Bordo neon arrotondato ──────────────────────────────────────────────────
const drawBorder = (ctx, bgIndex, W, H) => {
    const { borderColor } = BG_PRESETS[bgIndex] || BG_PRESETS[0];
    ctx.save();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = borderColor;
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.roundRect(0.75, 0.75, W - 1.5, H - 1.5, 7);
    ctx.stroke();
    ctx.restore();
};

// ─── Testo neon ─────────────────────────────────────────────────────────────
const neon = (ctx, text, x, y, color, blur = 10) => {
    ctx.save();
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = blur;
    ctx.fillText(text, x, y);
    ctx.restore();
};

// ─── Render principale ───────────────────────────────────────────────────────
export const drawSignature = (ctx, data, bgIndex, fontReady) => {
    const W = 500, H = 150;
    const {
        name          = 'Player',
        daily         = 0,
        maxMine       = 0,
        lfBonus       = 0,
        collBonus     = 0,
        isCollector   = false,
        ecoSpeed      = 8,
        nicknameColor = '#e2e8f0',
        showClass     = true,
        showEco       = true,
        showMine      = true,
        showLfBonus   = true,
        showCollBonus = true,
    } = data;

    ctx.clearRect(0, 0, W, H);
    drawBackground(ctx, bgIndex, W, H);

    const font  = fontReady ? 'Orbitron' : 'monospace';
    const SPLIT = 238; // x separatore verticale

    // ── Separatore verticale tratteggiato ────────────────────────────────
    ctx.save();
    ctx.strokeStyle = 'rgba(0,240,255,0.18)';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 4;
    ctx.setLineDash([3, 5]);
    ctx.beginPath(); ctx.moveTo(SPLIT, 12); ctx.lineTo(SPLIT, H - 18); ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

    // ── SINISTRA TOP: nickname + classe + eco ─────────────────────────────
    const displayName = name.length > 18 ? name.slice(0, 17) + '…' : name;
    ctx.font = `bold 13px '${font}', monospace`;
    neon(ctx, displayName.toUpperCase(), 12, 28, nicknameColor, 8);

    let infoY = 42;
    if (showClass) {
        const classLabel = isCollector ? 'COLLEZIONISTA' : 'GENERALE';
        const classColor = isCollector ? '#00f0ff' : '#94a3b8';
        ctx.font = '9px monospace';
        neon(ctx, classLabel, 12, infoY, classColor, isCollector ? 6 : 2);
        infoY += 13;
    }
    if (showEco) {
        ctx.font = '8px monospace';
        ctx.fillStyle = '#3d5070';
        ctx.fillText(`ECO ×${ecoSpeed}`, 12, infoY);
    }

    // ── SINISTRA separatore orizzontale ──────────────────────────────────
    ctx.save();
    ctx.strokeStyle = 'rgba(45,55,72,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(12, 90); ctx.lineTo(SPLIT - 12, 90); ctx.stroke();
    ctx.restore();

    // ── SINISTRA BOTTOM: produzione pacchetto 24h ─────────────────────────
    ctx.font = '7px monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText('PACCHETTO  ·  24H', 12, 104);

    const packStr = new Intl.NumberFormat('it-IT').format(Math.floor(daily));
    const packFontSize = packStr.length <= 10 ? 20 : packStr.length <= 13 ? 17 : 14;
    ctx.font = `bold ${packFontSize}px '${font}', monospace`;
    neon(ctx, packStr, 12, 128, '#FFB800', 14);

    // ── DESTRA: stats account ─────────────────────────────────────────────
    const rightX = SPLIT + 14;
    const rightStats = [
        showMine    ? { label: 'MIN. METALLO', value: `Lv.${maxMine}`,                         color: '#00f0ff' } : null,
        showLfBonus ? { label: 'BONUS LF',     value: `+${Number(lfBonus).toFixed(2)}%`,       color: '#00ff9d' } : null,
        (showCollBonus && isCollector && Number(collBonus) > 0)
                    ? { label: 'COLLECTOR',    value: `+${Number(collBonus).toFixed(2)}%`,     color: '#9d00ff' } : null,
    ].filter(Boolean);

    if (rightStats.length > 0) {
        const usableH = H - 18 - 12;
        const rowH    = Math.min(38, Math.floor(usableH / rightStats.length));
        const totalH  = rightStats.length * rowH;
        const startY  = Math.round((usableH - totalH) / 2) + 12 + 8;

        rightStats.forEach(({ label, value, color }, i) => {
            const baseY = startY + i * rowH;
            ctx.font = '7px monospace';
            ctx.fillStyle = '#3d5070';
            ctx.fillText(label, rightX, baseY);
            ctx.font = `bold 13px '${font}', monospace`;
            neon(ctx, value, rightX, baseY + 17, color, 9);
        });
    }

    // ── Bottom bar ────────────────────────────────────────────────────────
    ctx.save();
    ctx.strokeStyle = 'rgba(45,55,72,0.30)'; ctx.lineWidth = 1; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(10, H - 16); ctx.lineTo(W - 10, H - 16); ctx.stroke();
    ctx.restore();

    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#243045';
    ctx.fillText('PRODUCTION CORE  •  OVALUE', W / 2, H - 6);

    drawBorder(ctx, bgIndex, W, H);
};
