import { CONFIG } from './config.js';

// ─── Canvas setup ────────────────────────────────────────
const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');

canvas.width  = CONFIG.stageWidth;
canvas.height = CONFIG.stageHeight;

// ─── Boot ────────────────────────────────────────────────
function init() {
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (CONFIG.debugMode) {
    console.log('CONFIG loaded:', CONFIG);
  }
}

init();
