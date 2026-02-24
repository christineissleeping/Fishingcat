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
  cat: {
    x: 1350,
    y: 1200,
    w: 550,
    h: 550,
  },

  hat1: {
    x: 1060,
    y: 440,
    w: 240,
    h: 180,   // native ratio 2048:1536 ≈ 4:3
  },

  hat2: {
    x: 680,
    y: 520,
    w: 200,
    h: 200,
  },

  fish: {
    x: 400,
    y: 1500,
    w: 200,
    h: 200,
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

loadImages(CONFIG.assets).then((images) => {
  drawScene(images);
});

// ── Render one frame ────────────────────────────────────────────────

function drawScene(images) {
  const { width, height } = CONFIG.canvas;

  // 1. Background — drawn at native size (no scaling).
  ctx.drawImage(images.background1, 0, 0, width, height);

  // 2. Hats (behind the cat so the cat can overlap them later).
  const h1 = CONFIG.hat1;
  ctx.drawImage(images.hat1, h1.x, h1.y, h1.w, h1.h);

  const h2 = CONFIG.hat2;
  ctx.drawImage(images.hat2, h2.x, h2.y, h2.w, h2.h);

  // 3. Cat — standing pose, no hat.
  const c = CONFIG.cat;
  ctx.drawImage(images.catStand, c.x, c.y, c.w, c.h);

  // 4. Fish
  const f = CONFIG.fish;
  ctx.drawImage(images.fish, f.x, f.y, f.w, f.h);
}
