export const BG_PRESETS = [
    { key: 'stellar' },
    { key: 'forge'   },
    { key: 'cartoon' },
    { key: 'anime'   },
    { key: 'cyber'   },
];

// Palette colori condivisa per nick / bordo / produzione
export const COLOR_SWATCHES = [
    '#00f0ff', // ciano neon (default bordo)
    '#9d00ff', // viola DM
    '#FFB800', // oro (default produzione)
    '#00ff9d', // verde neon
    '#ff2a6d', // rosso neon
    '#e2e8f0', // bianco (default nick)
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

// ─── Braci Fucina (seed diverso dalle stelle) ────────────────────────────────
const drawEmbers = (ctx, count, W, H) => {
    let s = 137;
    const rng = () => { s = (Math.imul(1664525, s) + 1013904223) | 0; return (s >>> 0) / 4294967296; };
    for (let i = 0; i < count; i++) {
        const x = rng() * W, y = H * 0.2 + rng() * H * 0.8;
        const r = rng() * 1.8 + 0.3;
        const a = rng() * 0.65 + 0.2;
        const g = Math.floor(60 + rng() * 100);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,${g},10,${a.toFixed(2)})`;
        ctx.fill();
    }
};

// ─── Griglia olografica Cyber ────────────────────────────────────────────────
const drawCyberGrid = (ctx, W, H) => {
    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 0.5;
    const step = 16;
    for (let x = 0; x <= W; x += step) {
        ctx.globalAlpha = x % (step * 3) === 0 ? 0.10 : 0.04;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += step) {
        ctx.globalAlpha = y % (step * 3) === 0 ? 0.10 : 0.04;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
};

// ─── Sfondi ─────────────────────────────────────────────────────────────────
const drawBackground = (ctx, bgIndex, W, H) => {
    let g;
    switch (bgIndex) {
        case 0: { // Stellare — spazio profondo blu
            g = ctx.createLinearGradient(0, 0, W, H);
            g.addColorStop(0, '#060a16'); g.addColorStop(1, '#0c1830');
            ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
            const rg0 = ctx.createRadialGradient(380, 38, 0, 380, 38, 130);
            rg0.addColorStop(0, 'rgba(0,100,180,0.15)'); rg0.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = rg0; ctx.fillRect(0, 0, W, H);
            drawStars(ctx, 65, W, H);
            break;
        }
        case 1: { // Fucina — miniera in fusione
            g = ctx.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, '#0e0400'); g.addColorStop(0.55, '#1e0900'); g.addColorStop(1, '#2c1100');
            ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
            const rg1 = ctx.createRadialGradient(250, H + 20, 0, 250, H + 20, 220);
            rg1.addColorStop(0, 'rgba(230,75,0,0.50)');
            rg1.addColorStop(0.45, 'rgba(150,35,0,0.22)');
            rg1.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = rg1; ctx.fillRect(0, 0, W, H);
            drawEmbers(ctx, 48, W, H);
            break;
        }
        case 2: { // Cartoon — stile piatto e vivace
            g = ctx.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, '#120600'); g.addColorStop(0.55, '#261000'); g.addColorStop(1, '#351a00');
            ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
            const rg2 = ctx.createRadialGradient(110, H + 10, 0, 110, H + 10, 170);
            rg2.addColorStop(0, 'rgba(255,130,0,0.40)'); rg2.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = rg2; ctx.fillRect(0, 0, W, H);
            // Banda terreno stile cartoon
            const groundY = Math.round(H * 0.72);
            ctx.fillStyle = 'rgba(50,18,0,0.55)';
            ctx.fillRect(0, groundY, W, H - groundY);
            ctx.save();
            ctx.strokeStyle = 'rgba(200,80,0,0.30)'; ctx.lineWidth = 1; ctx.setLineDash([]);
            ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();
            ctx.restore();
            break;
        }
        case 3: { // Anime — cielo notturno, fuoco a sx, luna a dx
            g = ctx.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, '#03050e'); g.addColorStop(0.42, '#0e0600'); g.addColorStop(1, '#1c0a00');
            ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
            const rg3a = ctx.createRadialGradient(55, H + 10, 0, 55, H + 10, 170);
            rg3a.addColorStop(0, 'rgba(215,55,0,0.40)'); rg3a.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = rg3a; ctx.fillRect(0, 0, W, H);
            const rg3b = ctx.createRadialGradient(430, 18, 0, 430, 18, 110);
            rg3b.addColorStop(0, 'rgba(30,80,170,0.20)'); rg3b.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = rg3b; ctx.fillRect(0, 0, W, H);
            drawStars(ctx, 28, W, H * 0.55);
            break;
        }
        default: { // Cyber — griglia olografica
            ctx.fillStyle = '#020508'; ctx.fillRect(0, 0, W, H);
            const rgC = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 220);
            rgC.addColorStop(0, 'rgba(0,200,255,0.07)'); rgC.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = rgC; ctx.fillRect(0, 0, W, H);
            drawCyberGrid(ctx, W, H);
            break;
        }
    }
};

// ─── Bordo neon arrotondato ───────────────────────────────────────────────────
const drawBorder = (ctx, color, W, H) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = color;
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
        nickname      = 'Player',
        universe      = '',
        daily         = 0,
        maxMine       = 0,
        lfBonus       = 0,
        collBonus     = 0,
        isCollector   = false,
        playerClass   = 'other',
        ecoSpeed      = 8,
        nicknameColor = '#e2e8f0',
        borderColor   = '#00f0ff',
        prodColor     = '#FFB800',
        showClass     = true,
        showEco       = true,
        showUniverse  = true,
        showMine      = true,
        showLfBonus   = true,
        showCollBonus = true,
        labels        = {},
    } = data;

    const lbl = {
        pack:            labels.pack            || 'PACK · 24H',
        mine:            labels.mine            || 'METAL MINE',
        lfBonus:         labels.lfBonus         || 'LF BONUS',
        collector:       labels.collector       || 'COLLECTOR',
        eco:             labels.eco             || 'ECO',
        classCollector:  labels.classCollector  || 'COLLECTOR',
        classGeneral:    labels.classGeneral    || 'GENERAL',
        classExplorer:   labels.classExplorer   || 'EXPLORER',
    };

    ctx.clearRect(0, 0, W, H);
    drawBackground(ctx, bgIndex, W, H);

    const font  = fontReady ? 'Orbitron' : 'monospace';
    const SPLIT = 238;

    // ── Separatore verticale tratteggiato ────────────────────────────────
    ctx.save();
    ctx.strokeStyle = `${borderColor}55`;
    ctx.lineWidth = 1;
    ctx.shadowColor = borderColor; ctx.shadowBlur = 4;
    ctx.setLineDash([3, 5]);
    ctx.beginPath(); ctx.moveTo(SPLIT, 12); ctx.lineTo(SPLIT, H - 18); ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

    // ── SINISTRA TOP: nickname + universo + classe + eco ─────────────────
    const displayNick = nickname.length > 18 ? nickname.slice(0, 17) + '…' : nickname;
    ctx.font = `bold 13px '${font}', monospace`;
    neon(ctx, displayNick.toUpperCase(), 12, 28, nicknameColor, 8);

    let infoY = 41;
    if (showUniverse && universe) {
        ctx.font = '10px monospace';
        ctx.fillStyle = '#4a5568';
        ctx.fillText(universe.toUpperCase(), 12, infoY);
        infoY += 13;
    }
    if (showClass) {
        const classLabel = playerClass === 'collector' ? lbl.classCollector
                         : playerClass === 'explorer'  ? lbl.classExplorer
                         : lbl.classGeneral;
        const classColor = playerClass === 'collector' ? '#00f0ff' : '#64748b';
        ctx.font = `bold 10px '${font}', monospace`;
        neon(ctx, classLabel.toUpperCase(), 12, infoY, classColor, playerClass === 'collector' ? 6 : 0);
        infoY += 13;
    }
    if (showEco) {
        ctx.font = '9px monospace';
        ctx.fillStyle = '#3d5070';
        ctx.fillText(`${lbl.eco} ×${ecoSpeed}`, 12, infoY);
    }

    // ── SINISTRA separatore orizzontale ──────────────────────────────────
    ctx.save();
    ctx.strokeStyle = 'rgba(45,55,72,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(12, 90); ctx.lineTo(SPLIT - 12, 90); ctx.stroke();
    ctx.restore();

    // ── SINISTRA BOTTOM: produzione pacchetto 24h ─────────────────────────
    ctx.font = '10px monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText(lbl.pack, 12, 104);

    const packStr      = new Intl.NumberFormat('it-IT').format(Math.floor(daily));
    const packFontSize = packStr.length <= 10 ? 20 : packStr.length <= 13 ? 17 : 14;
    ctx.font = `bold ${packFontSize}px '${font}', monospace`;
    neon(ctx, packStr, 12, 127, prodColor, 14);

    // ── DESTRA: stats account ─────────────────────────────────────────────
    const rightX = SPLIT + 14;
    const rightStats = [
        showMine    ? { label: lbl.mine,      value: `Lv.${maxMine}`,                     color: '#00f0ff' } : null,
        showLfBonus ? { label: lbl.lfBonus,   value: `+${Number(lfBonus).toFixed(2)}%`,   color: '#00ff9d' } : null,
        (showCollBonus && isCollector && Number(collBonus) > 0)
                    ? { label: lbl.collector, value: `+${Number(collBonus).toFixed(2)}%`, color: '#9d00ff' } : null,
    ].filter(Boolean);

    if (rightStats.length > 0) {
        const usableH = H - 18 - 12;
        const rowH    = Math.min(38, Math.floor(usableH / rightStats.length));
        const totalH  = rightStats.length * rowH;
        const startY  = Math.round((usableH - totalH) / 2) + 12 + 8;

        rightStats.forEach(({ label, value, color }, i) => {
            const baseY = startY + i * rowH;
            ctx.font = '10px monospace';
            ctx.fillStyle = '#4a5568';
            ctx.fillText(label, rightX, baseY);
            ctx.font = `bold 14px '${font}', monospace`;
            neon(ctx, value, rightX, baseY + 18, color, 9);
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

    drawBorder(ctx, borderColor || '#00f0ff', W, H);
};
