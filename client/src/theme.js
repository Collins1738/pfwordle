/**
 * Design tokens for pfwordle.
 * To switch themes: update this file only.
 * All components import from here — no hardcoded colors elsewhere.
 */

export const t = {
  // Backgrounds
  bg:       "#E6F4FF",   // page background
  surface:  "#ffffff",   // cards, modals, header
  overlay:  "rgba(0, 100, 200, 0.08)", // subtle tint

  // Brand / Accent
  accent:     "#00A2FF",  // primary CTA, correct tiles, active states
  accentDark: "#0077CC",  // button shadow
  accentAlt:  "#f5a623",  // present tiles, loss state (orange)

  // Text
  text:   "#1A1A2E",  // primary text
  muted:  "#6B6FA2",  // secondary text, placeholders
  white:  "#ffffff",

  // Borders
  border: "#b8d4f0",  // default border

  // Tile / keyboard states
  correct:    "#00A2FF",
  present:    "#f5a623",
  absent:     "#6B6FA2",
  tbd:        "#ffffff",
  empty:      "#ffffff",
  keyDefault: "#c8dff5",

  // Typography
  font:   "'Fredoka', sans-serif",

  // Border radii
  radius:   "10px",
  radiusMd: "18px",
  radiusLg: "24px",
  radiusFull: "9999px",
};
