import { CONFIG } from './config.js';

// ── Canvas setup ───────────────────────────────────────────
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.stageWidth;
canvas.height = CONFIG.stageHeight;

// ── Helper: convert normalised BG coords → canvas pixels ──
function bgToCanvas(nx, ny) {
  const bgW = CONFIG.bgNativeWidth * CONFIG.bgScale;
  const bgH = CONFIG.bgNativeHeight * CONFIG.bgScale;
  const offsetX = (CONFIG.stageWidth - bgW) / 2;
  const offsetY = (CONFIG.stageHeight - bgH) / 2;
  return {
    x: offsetX + nx * bgW,
    y: offsetY + ny * bgH,
  };
}

// ── Boot ───────────────────────────────────────────────────
function init() {
  console.log('Fishingcat – CONFIG loaded', CONFIG);

  if (CONFIG.debugMode) {
    drawDebugOverlay();
  }
}

// ── Debug: visualise anchors & zones ───────────────────────
function drawDebugOverlay() {
  const bgW = CONFIG.bgNativeWidth * CONFIG.bgScale;
  const bgH = CONFIG.bgNativeHeight * CONFIG.bgScale;
  const offsetX = (CONFIG.stageWidth - bgW) / 2;
  const offsetY = (CONFIG.stageHeight - bgH) / 2;

  // background bounds
  ctx.strokeStyle = 'lime';
  ctx.lineWidth = 2;
  ctx.strokeRect(offsetX, offsetY, bgW, bgH);

  // anchors
  const anchors = [
    { label: 'bedCat', ...CONFIG.bedCatAnchor },
    { label: 'hat', ...CONFIG.hatAnchor },
    { label: 'standCat', ...CONFIG.standCatAnchor },
  ];

  ctx.font = '14px monospace';
  for (const a of anchors) {
    const p = bgToCanvas(a.x, a.y);
    ctx.strokeStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(p.x - 8, p.y);
    ctx.lineTo(p.x + 8, p.y);
    ctx.moveTo(p.x, p.y - 8);
    ctx.lineTo(p.x, p.y + 8);
    ctx.stroke();
    ctx.fillStyle = 'cyan';
    ctx.fillText(a.label, p.x + 10, p.y - 4);
  }

  // door zone
  const dz = CONFIG.doorZone;
  const dzTopLeft = bgToCanvas(dz.x, dz.y);
  const dzSize = { w: dz.width * bgW, h: dz.height * bgH };
  ctx.strokeStyle = 'yellow';
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(dzTopLeft.x, dzTopLeft.y, dzSize.w, dzSize.h);
  ctx.setLineDash([]);
  ctx.fillStyle = 'yellow';
  ctx.fillText('doorZone', dzTopLeft.x + 4, dzTopLeft.y - 4);
}

init();
