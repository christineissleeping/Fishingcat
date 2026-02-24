// ── CONFIG ──────────────────────────────────────────────────────────
// Single source of truth for every tuneable value.
// Positions (x, y) are in canvas-pixel coordinates relative to the
// full-resolution background (2752 x 2064).
// ────────────────────────────────────────────────────────────────────

const CONFIG = {
  // Canvas matches the background exactly — no scaling.
  canvas: { width: 2752, height: 2064 },

  // ── Asset paths ────────────────────────────────────────────────────
  assets: {
    background1:      "assets/Background-1.png",
    background2:      "assets/Background-2.png",
    outside:          "assets/Outside.png",
    catStand:         "assets/Cat-stand.png",
    catStandWithHat:  "assets/Cat-stand-with-hat.png",
    catOpenEye:       "assets/Cat-open-eye.png",
    catCloseEye:      "assets/Cat-close-eye.png",
    catFishing:       "assets/Cat-fishing.png",
    hat1:             "assets/Hat-1.png",
    hat2:             "assets/Hat-2.png",
    fish:             "assets/Fish.png",
  },

  // ── Sprite anchors & draw sizes ────────────────────────────────────
  // x, y  = top-left corner on the canvas
  // w, h  = drawn width / height  (aspect ratio kept manually)

  // Step 2 — cat reading on the bed (Cat-open-eye, native 2048×2048 → 1:1)
  bedCat: {
    x: 80,
    y: 1150,
    w: 400,
    h: 400,
  },

  // Step 2 — straw hat on the wall hanger (Hat-1, native 2048×1536 → 4:3)
  wallHat: {
    x: 1220,
    y: 500,
    w: 220,
    h: 165,
  },

  // ── Timing (seconds) — placeholders for future steps ──────────────
  timing: {
    blinkInterval:    3.0,
    blinkDuration:    0.15,
    hatDropSpeed:     600,   // px/s
    fishBobAmplitude: 10,    // px
    fishBobPeriod:    2.0,   // seconds per full cycle
  },
};

// ── Image loader ────────────────────────────────────────────────────
// Returns a Promise that resolves to a Map<key, HTMLImageElement>.

function loadImages(assetMap) {
  const entries = Object.entries(assetMap);
  const images = {};

  return Promise.all(
    entries.map(
      ([key, src]) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            images[key] = img;
            resolve();
          };
          img.onerror = () => reject(new Error(`Failed to load: ${src}`));
          img.src = src;
        })
    )
  ).then(() => images);
}

// ── Bootstrap ───────────────────────────────────────────────────────

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;

// Disable image smoothing so pixel art / sharp lines stay crisp when
// the browser CSS-scales the canvas down to fit the viewport.
ctx.imageSmoothingEnabled = false;

// Step 2 — load background + bed cat + wall hat.
loadImages({
  background1: CONFIG.assets.background1,
  catOpenEye:  CONFIG.assets.catOpenEye,
  hat1:        CONFIG.assets.hat1,
}).then((images) => {
  const bg = images.background1;

  // Size the canvas to the background's native dimensions — no scaling.
  canvas.width  = bg.naturalWidth;
  canvas.height = bg.naturalHeight;
  ctx.imageSmoothingEnabled = false;       // re-apply after resize

  drawScene(images);
});

// ── Render one frame ────────────────────────────────────────────────

function drawScene(images) {
  // 1. Background — native resolution, no scaling.
  ctx.drawImage(images.background1, 0, 0);

  // 2. Wall hat — behind the cat layer.
  const wh = CONFIG.wallHat;
  ctx.drawImage(images.hat1, wh.x, wh.y, wh.w, wh.h);

  // 3. Bed cat — on top of the bedspread.
  const bc = CONFIG.bedCat;
  ctx.drawImage(images.catOpenEye, bc.x, bc.y, bc.w, bc.h);
}
