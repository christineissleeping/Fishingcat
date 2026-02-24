// ── CONFIG ────────────────────────────────────────────────────────────
// Anchor coordinates are in Background-1 native pixels (2752 × 2064).
// At runtime they are multiplied by the computed background scale and
// offset so every object sits relative to the background, not the screen.

const CONFIG = {
  // Stage
  stageWidth:  1376,
  stageHeight: 1032,

  // Background-1 is the reference coordinate system.
  // bgScale: fraction of the stage the background should fill.
  bgScale: 0.5,

  // Anchors — native Background-1 coords (px).
  bedCatAnchor:   { x: 300,  y: 1150 },  // center-bottom of cat on bed
  hatAnchor:      { x: 1380, y: 480  },  // top-center of hat on wall hook
  standCatAnchor: { x: 1200, y: 1350 },  // center-bottom of standing cat near table

  // Object sizes as fraction of rendered background width.
  // e.g. 0.2 → sprite will be 20% as wide as the background on screen.
  bedCatScale:   0.22,
  hatScale:      0.10,
  standCatScale: 0.18,

  // Door trigger zone — native Background-1 coords & size (px).
  doorZone: { x: 2300, y: 200, width: 350, height: 1100 },

  // Timing
  blinkInterval: 3000,
  bubbleDelay:   1000,
  pulseSpeed:    0.02,

  // Debug
  debugMode: true,
};

// ── Helper: map a native-BG coordinate to screen position ────────────
function bgToScreen(bgSprite, nativeX, nativeY) {
  const s = bgSprite.scale.x; // uniform scale
  return {
    x: bgSprite.x + nativeX * s,
    y: bgSprite.y + nativeY * s,
  };
}

// ── Helper: place a sprite relative to Background-1 ─────────────────
// anchorX/Y  = position in native BG pixels
// sizeScale  = fraction of rendered bg width the sprite should occupy
// pivotMode  = how the sprite is anchored to its position
function placeOnBg(sprite, bgSprite, anchorX, anchorY, sizeScale, pivotMode) {
  // Scale sprite so its width = sizeScale * background's rendered width
  const desiredW   = sizeScale * bgSprite.width;
  const spriteScale = desiredW / sprite.texture.width;
  sprite.scale.set(spriteScale);

  // Pivot: 'bottom-center' for characters, 'top-center' for hanging items
  if (pivotMode === 'top-center') {
    sprite.anchor.set(0.5, 0.0);
  } else {
    sprite.anchor.set(0.5, 1.0); // bottom-center (default)
  }

  // Position in screen coords
  const pos = bgToScreen(bgSprite, anchorX, anchorY);
  sprite.x = pos.x;
  sprite.y = pos.y;
}

// ── Debug helpers ────────────────────────────────────────────────────
function debugLogBackground(bgSprite) {
  if (!CONFIG.debugMode) return;
  console.table({
    'bg x':              bgSprite.x,
    'bg y':              bgSprite.y,
    'bg width (scaled)': Math.round(bgSprite.width),
    'bg height (scaled)': Math.round(bgSprite.height),
    'bg scale':          bgSprite.scale.x,
    'stage width':       CONFIG.stageWidth,
    'stage height':      CONFIG.stageHeight,
    'devicePixelRatio':  window.devicePixelRatio || 1,
  });
}

function debugDrawMarkers(gfx, bgSprite) {
  if (!CONFIG.debugMode) return;

  const markers = [
    { label: 'bedCat',   ...CONFIG.bedCatAnchor,   color: 0xff0000 },
    { label: 'hat',      ...CONFIG.hatAnchor,       color: 0x00ff00 },
    { label: 'standCat', ...CONFIG.standCatAnchor,  color: 0x00ccff },
  ];

  markers.forEach(({ label, x, y, color }) => {
    const p = bgToScreen(bgSprite, x, y);
    // Cross-hair
    gfx.lineStyle(2, color);
    gfx.moveTo(p.x - 10, p.y);
    gfx.lineTo(p.x + 10, p.y);
    gfx.moveTo(p.x, p.y - 10);
    gfx.lineTo(p.x, p.y + 10);
    // Small circle
    gfx.drawCircle(p.x, p.y, 6);
  });

  // Label each marker
  markers.forEach(({ label, x, y, color }) => {
    const p = bgToScreen(bgSprite, x, y);
    const txt = new PIXI.Text(label, {
      fontSize: 11, fill: color, fontFamily: 'monospace',
    });
    txt.x = p.x + 10;
    txt.y = p.y - 8;
    gfx.parent.addChild(txt);
  });
}

// ── Bootstrap ────────────────────────────────────────────────────────
async function init() {
  const dpr = window.devicePixelRatio || 1;

  const app = new PIXI.Application({
    width:  CONFIG.stageWidth,
    height: CONFIG.stageHeight,
    backgroundColor: 0x1a1a2e,
    resolution: dpr,
    autoDensity: true,
  });
  document.body.appendChild(app.view);

  // ── Load all textures up front ─────────────────────────────────────
  const [bgTex, catOpenTex, hatTex, catStandTex] = await Promise.all([
    PIXI.Assets.load('assets/Background-1.png'),
    PIXI.Assets.load('assets/Cat-open-eye.png'),
    PIXI.Assets.load('assets/Hat-1.png'),
    PIXI.Assets.load('assets/Cat-stand.png'),
  ]);

  // High-quality downscale filtering
  [bgTex, catOpenTex, hatTex, catStandTex].forEach((tex) => {
    tex.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
    tex.baseTexture.mipmap    = PIXI.MIPMAP_MODES.ON;
  });

  // ── Background ────────────────────────────────────────────────────
  const bgSprite = new PIXI.Sprite(bgTex);
  const targetW     = CONFIG.stageWidth * CONFIG.bgScale;
  const renderScale = targetW / bgTex.width;
  bgSprite.scale.set(renderScale);
  bgSprite.x = (CONFIG.stageWidth  - bgTex.width  * renderScale) / 2;
  bgSprite.y = (CONFIG.stageHeight - bgTex.height * renderScale) / 2;
  app.stage.addChild(bgSprite);

  // ── Hat on wall hook ──────────────────────────────────────────────
  const hatSprite = new PIXI.Sprite(hatTex);
  placeOnBg(hatSprite, bgSprite,
    CONFIG.hatAnchor.x, CONFIG.hatAnchor.y,
    CONFIG.hatScale, 'top-center');
  app.stage.addChild(hatSprite);

  // ── Bed cat (open eye, reading) ───────────────────────────────────
  const bedCatSprite = new PIXI.Sprite(catOpenTex);
  placeOnBg(bedCatSprite, bgSprite,
    CONFIG.bedCatAnchor.x, CONFIG.bedCatAnchor.y,
    CONFIG.bedCatScale, 'bottom-center');
  app.stage.addChild(bedCatSprite);

  // ── Standing cat (hidden for now) ─────────────────────────────────
  const standCatSprite = new PIXI.Sprite(catStandTex);
  placeOnBg(standCatSprite, bgSprite,
    CONFIG.standCatAnchor.x, CONFIG.standCatAnchor.y,
    CONFIG.standCatScale, 'bottom-center');
  standCatSprite.visible = false;
  app.stage.addChild(standCatSprite);

  // ── Debug ─────────────────────────────────────────────────────────
  debugLogBackground(bgSprite);

  if (CONFIG.debugMode) {
    const gfx = new PIXI.Graphics();
    app.stage.addChild(gfx);
    debugDrawMarkers(gfx, bgSprite);
  }
}

init();
