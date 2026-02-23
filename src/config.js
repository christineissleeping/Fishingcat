// ─── CONFIG ─────────────────────────────────────────────
// Reference coordinate system: assets/Background-1.png (2752 × 2064)
// Background is scaled to 50% and centered on stage.
// All room-object anchors are expressed as fractions (0–1) of the
// *scaled* background bounds, so they stay correct regardless of
// the actual pixel size on screen.
// ─────────────────────────────────────────────────────────

export const CONFIG = {
  // ── Stage ──────────────────────────────────────────────
  stageWidth:  1376,          // canvas width  (px)
  stageHeight: 1032,          // canvas height (px)

  // ── Background ─────────────────────────────────────────
  bgScale: 0.5,              // Background-1.png drawn at 50%

  // ── Room-object anchors (fraction of scaled bg) ────────
  // { x, y } where 0,0 = top-left of bg, 1,1 = bottom-right
  bedCatAnchor:   { x: 0.72, y: 0.52 },   // cat sleeping on bed
  hatAnchor:      { x: 0.22, y: 0.42 },   // hat on the shelf / hook
  standCatAnchor: { x: 0.50, y: 0.70 },   // cat standing in room

  // ── Door trigger zone (fraction of scaled bg) ──────────
  // Player clicks inside this rect to "go outside"
  doorZone: { x: 0.02, y: 0.25, width: 0.12, height: 0.50 },

  // ── Timing (ms unless noted) ───────────────────────────
  timing: {
    blinkInterval:  3000,     // ms between eye-blink cycles
    blinkDuration:   150,     // ms eyes stay closed per blink
    bubbleDelay:    1500,     // ms before speech/thought bubble appears
    pulseSpeed:      800,     // ms per pulse cycle (for interactive hints)
  },

  // ── Debug ──────────────────────────────────────────────
  debugMode: false,           // draw hit-boxes, log state changes
};
