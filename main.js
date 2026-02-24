// ── CONFIG ────────────────────────────────────────────────────────────
// All values are placeholders — tune once art is placed.
// Anchor coordinates are in Background-1 native pixels (2752 × 2064).
// At runtime they are multiplied by the computed background scale and
// offset so every object sits relative to the background, not the screen.

const CONFIG = {
  // Stage
  stageWidth:  1376,
  stageHeight: 1032,

  // Background-1 is the reference coordinate system.
  // bgScale: fraction of the stage width the background should occupy.
  // 0.5 → background rendered at 50 % of stage width, centred.
  bgScale: 0.5,

  // Anchors — positions on the *native* Background-1 image (px).
  // They will be mapped to screen coords via: screenPos = bgOrigin + anchor * renderScale
  bedCatAnchor:   { x: 1800, y: 1200 },   // sleeping cat on bed
  hatAnchor:      { x: 1400, y:  800 },   // hat object
  standCatAnchor: { x:  600, y: 1400 },   // standing cat

  // Door trigger zone — native Background-1 coords & size (px).
  doorZone: { x: 200, y: 400, width: 400, height: 700 },

  // Timing
  blinkInterval: 3000,   // ms between eye blinks
  bubbleDelay:   1000,   // ms before speech bubble appears
  pulseSpeed:    0.02,   // per-frame delta for pulsing effects

  // Debug
  debugMode: true,       // draw trigger zones & anchor crosses
};

// ── Interaction state machine states (enum-like) ─────────────────────
const STATE = {
  IDLE:        'IDLE',
  HAT_PICKED:  'HAT_PICKED',
  CAT_PETTED:  'CAT_PETTED',
  DOOR_OPEN:   'DOOR_OPEN',
};

// Current interaction state
let currentState = STATE.IDLE;

// ── Helper: map a native-BG coordinate to screen position ────────────
// bgSprite must be the rendered Background-1 sprite.
function bgToScreen(bgSprite, nativeX, nativeY) {
  const renderScale = bgSprite.scale.x;          // uniform scale
  return {
    x: bgSprite.x + nativeX * renderScale,
    y: bgSprite.y + nativeY * renderScale,
  };
}

// ── Bootstrap (PixiJS app) ───────────────────────────────────────────
async function init() {
  const app = new PIXI.Application({
    width:  CONFIG.stageWidth,
    height: CONFIG.stageHeight,
    backgroundColor: 0x1a1a2e,
  });
  document.body.appendChild(app.view);

  // ── Place background ───────────────────────────────────────────────
  const bgTex  = await PIXI.Assets.load('assets/Background-1.png');
  const bgSprite = new PIXI.Sprite(bgTex);

  // Scale so the background width == bgScale * stageWidth
  const targetW   = CONFIG.stageWidth * CONFIG.bgScale;
  const renderScale = targetW / bgTex.width;
  bgSprite.scale.set(renderScale);

  // Centre on stage
  bgSprite.x = (CONFIG.stageWidth  - bgTex.width  * renderScale) / 2;
  bgSprite.y = (CONFIG.stageHeight - bgTex.height * renderScale) / 2;

  app.stage.addChild(bgSprite);

  // ── Debug overlay ──────────────────────────────────────────────────
  if (CONFIG.debugMode) {
    const gfx = new PIXI.Graphics();

    // Draw anchor crosses
    const anchors = [
      { label: 'bedCat',   ...CONFIG.bedCatAnchor },
      { label: 'hat',      ...CONFIG.hatAnchor },
      { label: 'standCat', ...CONFIG.standCatAnchor },
    ];
    anchors.forEach(({ label, x, y }) => {
      const p = bgToScreen(bgSprite, x, y);
      gfx.lineStyle(2, 0xff0000);
      gfx.moveTo(p.x - 8, p.y);
      gfx.lineTo(p.x + 8, p.y);
      gfx.moveTo(p.x, p.y - 8);
      gfx.lineTo(p.x, p.y + 8);
    });

    // Draw door zone rectangle
    const dz = CONFIG.doorZone;
    const dzTL = bgToScreen(bgSprite, dz.x, dz.y);
    const dzBR = bgToScreen(bgSprite, dz.x + dz.width, dz.y + dz.height);
    gfx.lineStyle(2, 0x00ff00);
    gfx.drawRect(dzTL.x, dzTL.y, dzBR.x - dzTL.x, dzBR.y - dzTL.y);

    app.stage.addChild(gfx);

    console.log('[DEBUG] CONFIG:', CONFIG);
    console.log('[DEBUG] bgSprite position:', bgSprite.x, bgSprite.y,
                'renderScale:', renderScale);
  }
}

init();
