/**
 * Central configuration for the Fishing Cat room scene.
 *
 * Coordinate convention:
 *   All anchor and zone values are expressed in **original background-image
 *   pixels** (Background-1.png is 2752 × 2064).  At runtime the background
 *   is scaled by `bgScale` and centred on the stage; the engine converts
 *   these values to screen coordinates automatically.
 */

export const CONFIG = {
  // ── Stage / canvas ────────────────────────────────────────────────
  stageWidth: 1376,
  stageHeight: 1032,

  // ── Background ────────────────────────────────────────────────────
  bgScale: 0.5, // Background-1.png rendered at 50 %

  // ── Room-object anchors (px in original BG space) ─────────────────
  // Each anchor is the point where the sprite's origin is placed.
  bedCatAnchor: { x: 1800, y: 1200 },   // sleeping cat on the bed
  hatAnchor: { x: 1900, y: 1050 },       // hat resting near the bed
  standCatAnchor: { x: 900, y: 1500 },   // standing cat on the floor

  // ── Interactive zones (px in original BG space) ───────────────────
  doorZone: { x: 200, y: 400, width: 500, height: 1100 },

  // ── Timing ────────────────────────────────────────────────────────
  timing: {
    blinkInterval: 3000,   // ms between blinks
    bubbleDelay: 1500,     // ms before speech bubble appears
    pulseSpeed: 0.06,      // alpha oscillation speed (per frame)
  },

  // ── Debug ─────────────────────────────────────────────────────────
  debugMode: false, // true → draw bounding boxes & zone outlines
};
