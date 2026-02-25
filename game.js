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
    pulseSpeed:  2.0,    // cycles per second (reused from thought pulse)
    pulseAmount: 0.08,   // ±8 % scale
  },

  // Step 5 — standing cat on the floor near the table (native 2048×2048 → 1:1)
  standCat: {
    x: 800,
    y: 1300,
    w: 500,
    h: 500,
  },

  // Step 6 — Hat-2 overlay on standing cat's head (native 2048×2048 → 1:1)
  // 50% of wallHat display width → 110; 1:1 aspect → 110×110
  // dx/dy are offsets from the standing cat's top-left corner
  catHat: {
    dx: 145,
    dy: -80,
    w: 270,
    h: 270,
  },

  // Step 7 — door trigger zone (cat centre must enter this rect)
  doorZone: {
    x: 2350,
    y: 200,
    w: 400,
    h: 1200,
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

  // ── Step 8 — Scene 2: outside fishing ───────────────────────────
  scene2: {
    // Fishing cat on the bank near the wooden stump (native 2048×2048 → 1:1)
    fishCat: { x: 1150, y: 1080, w: 500, h: 500 },
    // Water band where ripples are drawn
    water: { x: 450, y: 980, w: 2100, h: 300 },
    rippleCount: 6,
    rippleSpeed: 0.4,          // cycles per second
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

let scene = "idle";        // "idle" | "thinking" | "dreaming" | "standing" | "hatted" | "outside"
let visibleBubbles = 0;    // 0–3 small thought dots shown so far
let pulseT0 = 0;           // timestamp when pulse started
let animFrameId = null;    // rAF handle for the pulse loop
let cachedImages = null;   // set once at boot, used by callbacks

// ── Drag state (Step 6) ────────────────────────────────────────────

let catPos = null;         // { x, y } — mutable position of standing cat
let dragging = false;
let dragOffset = { x: 0, y: 0 };
let doorTriggered = false;

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

function onFishClick() {
  stopPulse();
  scene = "standing";
  pulseT0 = performance.now();
  startPulse();            // reuse rAF loop — now drives the hat pulse
}

function onHatClick() {
  stopPulse();
  scene = "hatted";
  catPos = { x: CONFIG.standCat.x, y: CONFIG.standCat.y };
  drawScene(cachedImages);
}

function onDoorTriggered() {
  dragging = false;
  scene = "outside";
  startPulse();              // reuse rAF loop for water ripple animation
}

// ── Water ripples (Step 8) ──────────────────────────────────────────

// Stable per-ripple seeds (computed once, reused every frame)
const rippleSeeds = Array.from({ length: 12 }, (_, i) => ({
  px: (i * 0.618033988) % 1,          // golden-ratio distribution across width
  py: (i * 0.414213562) % 1,          // sqrt(2)-1 distribution across height
}));

function drawRipples(t) {
  const s2 = CONFIG.scene2;
  const w = s2.water;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.5;

  for (let i = 0; i < s2.rippleCount; i++) {
    const seed = rippleSeeds[i];
    const bx = w.x + seed.px * w.w;
    const by = w.y + seed.py * w.h;
    const phase = t * s2.rippleSpeed + i * 1.3;
    const rx = 18 + 8 * Math.sin(phase * Math.PI * 2);

    ctx.beginPath();
    ctx.ellipse(bx, by, rx, 3, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ── Pulse animation loop ────────────────────────────────────────────

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

// Step 8 — load all sprites for both scenes.
loadImages({
  background1:  CONFIG.assets.background1,
  outside:      CONFIG.assets.outside,
  catOpenEye:   CONFIG.assets.catOpenEye,
  catCloseEye:  CONFIG.assets.catCloseEye,
  catStand:     CONFIG.assets.catStand,
  catFishing:   CONFIG.assets.catFishing,
  hat1:         CONFIG.assets.hat1,
  hat2:         CONFIG.assets.hat2,
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

  // ── Click events ──────────────────────────────────────────────────

  canvas.addEventListener("click", (e) => {
    if (dragging) return;
    const rect = canvas.getBoundingClientRect();
    const pt = hitTest(e, rect);

    // Step 4: click bed cat → thought bubbles
    if (scene === "idle" && inRect(pt.x, pt.y, CONFIG.bedCat)) {
      onCatClick();
      return;
    }

    // Step 5: click fish → standing cat + hat pulse
    if (scene === "dreaming") {
      const f = CONFIG.thought.fish;
      const fishRect = { x: f.cx - f.w / 2, y: f.cy - f.h / 2, w: f.w, h: f.h };
      if (inRect(pt.x, pt.y, fishRect)) {
        onFishClick();
        return;
      }
    }

    // Step 6: click pulsing wall hat → hat on cat
    if (scene === "standing" && inRect(pt.x, pt.y, CONFIG.wallHat)) {
      onHatClick();
    }
  });

  // ── Drag events (Step 6) ──────────────────────────────────────────

  canvas.addEventListener("mousedown", (e) => {
    if (scene !== "hatted" || !catPos) return;
    const rect = canvas.getBoundingClientRect();
    const pt = hitTest(e, rect);
    const sc = CONFIG.standCat;
    const catRect = { x: catPos.x, y: catPos.y, w: sc.w, h: sc.h };

    if (inRect(pt.x, pt.y, catRect)) {
      dragging = true;
      dragOffset.x = pt.x - catPos.x;
      dragOffset.y = pt.y - catPos.y;
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const pt = hitTest(e, rect);
    catPos.x = pt.x - dragOffset.x;
    catPos.y = pt.y - dragOffset.y;
    drawScene(cachedImages);

    // Step 7: check if cat centre entered the door zone
    if (!doorTriggered) {
      const sc = CONFIG.standCat;
      const cx = catPos.x + sc.w / 2;
      const cy = catPos.y + sc.h / 2;
      if (inRect(cx, cy, CONFIG.doorZone)) {
        doorTriggered = true;
        onDoorTriggered();
      }
    }
  });

  canvas.addEventListener("mouseup", () => {
    dragging = false;
  });
});

// ── Render one frame ────────────────────────────────────────────────

function drawScene(images) {
  // ── Scene 2: outside fishing ──────────────────────────────────────
  if (scene === "outside") {
    ctx.drawImage(images.outside, 0, 0);

    // Fishing cat on the bank
    const fc = CONFIG.scene2.fishCat;
    ctx.drawImage(images.catFishing, fc.x, fc.y, fc.w, fc.h);

    // Animated water ripples
    drawRipples(performance.now() / 1000);
    return;
  }

  // ── Scene 1: bedroom ──────────────────────────────────────────────
  // 1. Background — native resolution, no scaling.
  ctx.drawImage(images.background1, 0, 0);

  // 2. Wall hat (hidden in "hatted" — it's now on the cat)
  const wh = CONFIG.wallHat;
  if (scene === "standing") {
    // Pulsing hat
    const elapsed = (performance.now() - pulseT0) / 1000;
    const scale = 1 + wh.pulseAmount *
      Math.sin(elapsed * wh.pulseSpeed * Math.PI * 2);
    const hw = wh.w * scale;
    const hh = wh.h * scale;
    const hcx = wh.x + wh.w / 2;
    const hcy = wh.y + wh.h / 2;
    ctx.drawImage(images.hat1, hcx - hw / 2, hcy - hh / 2, hw, hh);
  } else if (scene !== "hatted") {
    ctx.drawImage(images.hat1, wh.x, wh.y, wh.w, wh.h);
  }

  // 3. Bed cat (idle / thinking / dreaming only)
  if (scene !== "standing" && scene !== "hatted") {
    const bc = CONFIG.bedCat;
    const catImg = eyesOpen ? images.catOpenEye : images.catCloseEye;
    ctx.drawImage(catImg, bc.x, bc.y, bc.w, bc.h);
  }

  // 4. Standing cat + optional hat overlay
  if (scene === "standing") {
    const sc = CONFIG.standCat;
    ctx.drawImage(images.catStand, sc.x, sc.y, sc.w, sc.h);
  }
  if (scene === "hatted" && catPos) {
    const sc = CONFIG.standCat;
    ctx.drawImage(images.catStand, catPos.x, catPos.y, sc.w, sc.h);

    // Hat-2 overlay on cat's head
    const ch = CONFIG.catHat;
    ctx.drawImage(images.hat2,
      catPos.x + ch.dx, catPos.y + ch.dy, ch.w, ch.h);
  }

  // 5. Thought bubbles (thinking + dreaming states).
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
