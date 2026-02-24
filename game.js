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

// Step 1 — load only the background; other assets added in later steps.
loadImages({ background1: CONFIG.assets.background1 }).then((images) => {
  const bg = images.background1;

  // Size the canvas to the image's native dimensions — no scaling.
  canvas.width  = bg.naturalWidth;
  canvas.height = bg.naturalHeight;
  ctx.imageSmoothingEnabled = false;       // re-apply after resize

  drawScene(bg);
});

// ── Render one frame ────────────────────────────────────────────────

function drawScene(bg) {
  // Draw at (0,0) with no width/height args → native resolution, no scaling.
  ctx.drawImage(bg, 0, 0);

  // Scene objects (cat, hats, fish, etc.) will be added in later steps.
}
