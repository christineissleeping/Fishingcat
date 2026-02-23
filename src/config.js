/**
 * Central configuration for the Fishingcat room interaction scene.
 * All positions use normalized coordinates (0–1) relative to the
 * background image bounds so they stay correct at any scale.
 */
export const CONFIG = {
  // ── Stage ────────────────────────────────────────────────
  stageWidth: 1376,
  stageHeight: 1032,

  // ── Background ───────────────────────────────────────────
  bgScale: 0.5, // background drawn at 50% of its native size
  bgNativeWidth: 2752,
  bgNativeHeight: 2064,

  // ── Object anchors (normalised 0–1 relative to BG bounds) ─
  bedCatAnchor: { x: 0.5, y: 0.55 },   // cat-on-bed position
  hatAnchor: { x: 0.52, y: 0.42 },      // hat resting position
  standCatAnchor: { x: 0.25, y: 0.65 }, // standing cat position

  // ── Door trigger zone (normalised 0–1 relative to BG bounds)
  doorZone: { x: 0.85, y: 0.25, width: 0.12, height: 0.45 },

  // ── Timing (milliseconds unless noted) ───────────────────
  blinkInterval: 3000,  // ms between blinks
  bubbleDelay: 1500,    // ms before speech bubble appears
  pulseSpeed: 0.6,      // seconds per pulse cycle

  // ── Debug ────────────────────────────────────────────────
  debugMode: false, // draw anchor crosses & zone outlines
};
