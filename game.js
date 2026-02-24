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
    x: 40,
    y: 1150,
    w: 450,
    h: 450,
  },

  // Step 2 — straw hat on the wall hanger (Hat-1, native 2048×1536 → 4:3)
  wallHat: {
    x: 1300,
    y: 580,
    w: 220,
    h: 165,
  },

  // ── Timing (seconds) ──────────────────────────────────────────────
  timing: {
    blinkInterval:    3.0,
    blinkDuration:    0.15,
    hatDropSpeed:     600,   // px/s
    fishBobAmplitude: 10,    // px
    fishBobPeriod:    2.0,   // seconds per full cycle
  },

  // ── Step 4 — thought bubbles + fish dream ────────────────────────
  thought: {
    // Small trailing dots (from cat head upward-right)
    bubbles: [
      { x: 310, y: 1110, r: 15 },
      { x: 350, y: 1040, r: 22 },
      { x: 385, y: 960,  r: 30 },
    ],
    bubbleDelay: 300,          // ms between each small bubble
    // Large cloud (cx, cy = centre)
    cloud: { cx: 460, cy: 740, w: 320, h: 240 },
    // Fish inside the cloud (cx, cy = centre; 1:1 native)
    fish:  { cx: 460, cy: 740, w: 130, h: 130 },
    pulseSpeed:  2.0,          // cycles per second
    pulseAmount: 0.08,         // ±8 % scale
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

// ── Scene state ─────────────────────────────────────────────────────

let scene = "idle";        // "idle" | "thinking" | "dreaming"
let visibleBubbles = 0;    // 0–3 small thought dots shown so far
let pulseT0 = 0;           // timestamp when fish pulse started
let animFrameId = null;    // rAF handle for the pulse loop
let cachedImages = null;   // set once at boot, used by callbacks

// ── Blink state ─────────────────────────────────────────────────────

let blinkTimerId = null;
let eyesOpen = true;

function startBlink(images) {
  stopBlink();
  const { blinkInterval, blinkDuration } = CONFIG.timing;

  blinkTimerId = setInterval(() => {
    // Close eyes
    eyesOpen = false;
    drawScene(images);

    // Re-open after blinkDuration
    setTimeout(() => {
      eyesOpen = true;
      drawScene(images);
    }, blinkDuration * 1000);
  }, blinkInterval * 1000);
}

function stopBlink() {
  if (blinkTimerId !== null) {
    clearInterval(blinkTimerId);
    blinkTimerId = null;
  }
  eyesOpen = true;
}

// ── Cloud drawing (outer outline only, no inner rings) ──────────────

function drawCloud(cx, cy, w, h) {
  const pad = 10;
  const offW = w + pad * 2;
  const offH = h + pad * 2;
  const off = document.createElement("canvas");
  off.width = offW;
  off.height = offH;
  const oc = off.getContext("2d");

  const ox = offW / 2;
  const oy = offH / 2;

  // Bumps that form the cloud silhouette
  const bumps = [
    { dx:  0,        dy: -h * 0.12, r: h * 0.40 },
    { dx: -w * 0.28, dy:  0,        r: h * 0.34 },
    { dx:  w * 0.28, dy:  0,        r: h * 0.34 },
    { dx: -w * 0.15, dy:  h * 0.15, r: h * 0.32 },
    { dx:  w * 0.15, dy:  h * 0.15, r: h * 0.32 },
    { dx:  0,        dy:  h * 0.08, r: h * 0.36 },
  ];

  // 1. Fill white cloud body
  oc.fillStyle = "#fff";
  for (const b of bumps) {
    oc.beginPath();
    oc.arc(ox + b.dx, oy + b.dy, b.r, 0, Math.PI * 2);
    oc.fill();
  }

  // 2. Stroke behind the white fills → only the outer edge is visible
  oc.globalCompositeOperation = "destination-over";
  oc.strokeStyle = "#000";
  oc.lineWidth = 3;
  for (const b of bumps) {
    oc.beginPath();
    oc.arc(ox + b.dx, oy + b.dy, b.r, 0, Math.PI * 2);
    oc.stroke();
  }

  ctx.drawImage(off, cx - offW / 2, cy - offH / 2);
}

// ── Click handler ───────────────────────────────────────────────────

function hitTest(e, rect) {
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function inRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function onCatClick() {
  stopBlink();
  scene = "thinking";
  visibleBubbles = 0;

  const { bubbles, bubbleDelay } = CONFIG.thought;

  // Reveal small dots one by one
  bubbles.forEach((_, i) => {
    setTimeout(() => {
      visibleBubbles = i + 1;
      drawScene(cachedImages);
    }, bubbleDelay * (i + 1));
  });

  // After all dots → show cloud + pulsing fish
  setTimeout(() => {
    scene = "dreaming";
    pulseT0 = performance.now();
    startPulse();
  }, bubbleDelay * (bubbles.length + 1));
}

// ── Fish pulse loop ─────────────────────────────────────────────────

function startPulse() {
  stopPulse();
  (function tick() {
    drawScene(cachedImages);
    animFrameId = requestAnimationFrame(tick);
  })();
}

function stopPulse() {
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}

// ── Bootstrap ───────────────────────────────────────────────────────

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;

// Disable image smoothing so pixel art / sharp lines stay crisp when
// the browser CSS-scales the canvas down to fit the viewport.
ctx.imageSmoothingEnabled = false;

// Step 4 — load all sprites needed so far.
loadImages({
  background1:  CONFIG.assets.background1,
  catOpenEye:   CONFIG.assets.catOpenEye,
  catCloseEye:  CONFIG.assets.catCloseEye,
  hat1:         CONFIG.assets.hat1,
  fish:         CONFIG.assets.fish,
}).then((images) => {
  cachedImages = images;
  const bg = images.background1;

  // Size the canvas to the background's native dimensions — no scaling.
  canvas.width  = bg.naturalWidth;
  canvas.height = bg.naturalHeight;
  ctx.imageSmoothingEnabled = false;       // re-apply after resize

  drawScene(images);
  startBlink(images);

  // Click: bed cat → thought bubbles → fish
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const pt = hitTest(e, rect);

    if (scene === "idle" && inRect(pt.x, pt.y, CONFIG.bedCat)) {
      onCatClick();
    }
  });
});

// ── Render one frame ────────────────────────────────────────────────

function drawScene(images) {
  // 1. Background — native resolution, no scaling.
  ctx.drawImage(images.background1, 0, 0);

  // 2. Wall hat — behind the cat layer.
  const wh = CONFIG.wallHat;
  ctx.drawImage(images.hat1, wh.x, wh.y, wh.w, wh.h);

  // 3. Bed cat — swap sprite based on blink state.
  const bc = CONFIG.bedCat;
  const catImg = eyesOpen ? images.catOpenEye : images.catCloseEye;
  ctx.drawImage(catImg, bc.x, bc.y, bc.w, bc.h);

  // 4. Thought bubbles (thinking + dreaming states).
  if (scene === "thinking" || scene === "dreaming") {
    const t = CONFIG.thought;

    // Small trailing dots
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    for (let i = 0; i < visibleBubbles; i++) {
      const b = t.bubbles[i];
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Large cloud + pulsing fish
    if (scene === "dreaming") {
      const c = t.cloud;
      drawCloud(c.cx, c.cy, c.w, c.h);

      const f = t.fish;
      const elapsed = (performance.now() - pulseT0) / 1000;
      const scale = 1 + t.pulseAmount *
        Math.sin(elapsed * t.pulseSpeed * Math.PI * 2);
      const fw = f.w * scale;
      const fh = f.h * scale;
      ctx.drawImage(images.fish, f.cx - fw / 2, f.cy - fh / 2, fw, fh);
    }
  }
}
