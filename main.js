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
  // 0.5 → background rendered at 50 % of stage size, centred.
  bgScale: 0.5,

  // Anchors — native Background-1 coords (px). Placeholders for later steps.
  bedCatAnchor:   { x: 1800, y: 1200 },
  hatAnchor:      { x: 1400, y:  800 },
  standCatAnchor: { x:  600, y: 1400 },

  // Door trigger zone — native Background-1 coords & size (px).
  doorZone: { x: 200, y: 400, width: 400, height: 700 },

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

// ── Debug: log background placement info ─────────────────────────────
function debugLogBackground(bgSprite) {
  if (!CONFIG.debugMode) return;
  const w = bgSprite.width;
  const h = bgSprite.height;
  console.table({
    'bg x':              bgSprite.x,
    'bg y':              bgSprite.y,
    'bg width (scaled)': Math.round(w),
    'bg height (scaled)': Math.round(h),
    'bg scale':          bgSprite.scale.x,
    'stage width':       CONFIG.stageWidth,
    'stage height':      CONFIG.stageHeight,
    'devicePixelRatio':  window.devicePixelRatio || 1,
  });
}

// ── Bootstrap ────────────────────────────────────────────────────────
async function init() {
  const dpr = window.devicePixelRatio || 1;

  const app = new PIXI.Application({
    width:  CONFIG.stageWidth,
    height: CONFIG.stageHeight,
    backgroundColor: 0x1a1a2e,
    resolution: dpr,    // render at native device pixels
    autoDensity: true,  // CSS size stays stageWidth × stageHeight
  });
  document.body.appendChild(app.view);

  // ── Load & place Background-1 ──────────────────────────────────────
  const bgTex    = await PIXI.Assets.load('assets/Background-1.png');
  const bgSprite = new PIXI.Sprite(bgTex);

  // High-quality downscale filtering (avoids blurry bilinear default)
  bgTex.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
  bgTex.baseTexture.mipmap    = PIXI.MIPMAP_MODES.ON;

  // Scale so the background fills bgScale of the stage (fit by width)
  const targetW     = CONFIG.stageWidth * CONFIG.bgScale;
  const renderScale = targetW / bgTex.width;
  bgSprite.scale.set(renderScale);

  // Centre on stage
  bgSprite.x = (CONFIG.stageWidth  - bgTex.width  * renderScale) / 2;
  bgSprite.y = (CONFIG.stageHeight - bgTex.height * renderScale) / 2;

  app.stage.addChild(bgSprite);

  // ── Debug output ───────────────────────────────────────────────────
  debugLogBackground(bgSprite);
}

init();
