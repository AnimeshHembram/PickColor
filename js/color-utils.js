// Plain script (not a module) so the app also works when index.html is opened
// straight from disk. Everything is shared through one global: window.PickColor.
(function () {
  "use strict";
  const PickColor = (globalThis.PickColor = globalThis.PickColor || {});

  /**
   * Pure color helpers. No DOM access, so every function here can be tested
   * in a browser or in Node.
   *
   * Internal representation: { r, g, b } with integer channels 0–255.
   *
   * Decisions:
   * - Alpha is not supported. Inputs with an alpha component (#RGBA, #RRGGBBAA,
   *   rgba(), hsla()) are rejected rather than silently dropped.
   * - HEX output is uppercase, six digits: "#3A6FF7".
   * - HSL output rounds hue to a whole degree and saturation/lightness to whole
   *   percents. Because of that rounding, converting HSL back to RGB can differ
   *   from the original by a channel step or two, so RGB stays the source of truth.
   */

  /** @typedef {{ r: number, g: number, b: number }} Rgb */
  /** @typedef {{ h: number, s: number, l: number }} Hsl */

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  /** True when value is an object with integer r, g, b in 0–255. */
  function isRgb(value) {
    return (
      value !== null &&
      typeof value === "object" &&
      ["r", "g", "b"].every(
        (key) => Number.isInteger(value[key]) && value[key] >= 0 && value[key] <= 255,
      )
    );
  }

  /** Rounds and clamps each channel into a valid Rgb. */
  function normalizeRgb({ r, g, b }) {
    return {
      r: clamp(Math.round(r), 0, 255),
      g: clamp(Math.round(g), 0, 255),
      b: clamp(Math.round(b), 0, 255),
    };
  }

  function rgbEquals(a, b) {
    return Boolean(a && b) && a.r === b.r && a.g === b.g && a.b === b.b;
  }

  /* ---------- HEX ---------- */

  /** Rgb → "#RRGGBB" (uppercase). */
  function rgbToHex(rgb) {
    const { r, g, b } = normalizeRgb(rgb);
    return (
      "#" +
      [r, g, b]
        .map((channel) => channel.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase()
    );
  }

  /**
   * "#RGB", "#RRGGBB", "RGB" or "RRGGBB" → Rgb, or null when invalid.
   */
  function hexToRgb(input) {
    if (typeof input !== "string") return null;
    let hex = input.trim().replace(/^#/, "");
    if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(hex)) return null;
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((digit) => digit + digit)
        .join("");
    }
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  /* ---------- HSL ---------- */

  /** Rgb → Hsl with h in [0, 360), s and l in [0, 100], all rounded integers. */
  function rgbToHsl(rgb) {
    const { r, g, b } = normalizeRgb(rgb);
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;
    const l = (max + min) / 2;

    let h = 0;
    let s = 0;
    if (delta !== 0) {
      s = delta / (1 - Math.abs(2 * l - 1));
      if (max === rn) h = ((gn - bn) / delta) % 6;
      else if (max === gn) h = (bn - rn) / delta + 2;
      else h = (rn - gn) / delta + 4;
      h *= 60;
      if (h < 0) h += 360;
    }

    let hue = Math.round(h);
    if (hue === 360) hue = 0;
    return { h: hue, s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  /** Hsl (h any number of degrees, s and l in 0–100) → Rgb. */
  function hslToRgb({ h, s, l }) {
    const hue = ((h % 360) + 360) % 360;
    const sat = clamp(s, 0, 100) / 100;
    const light = clamp(l, 0, 100) / 100;

    const chroma = (1 - Math.abs(2 * light - 1)) * sat;
    const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = light - chroma / 2;

    let rgb;
    if (hue < 60) rgb = [chroma, x, 0];
    else if (hue < 120) rgb = [x, chroma, 0];
    else if (hue < 180) rgb = [0, chroma, x];
    else if (hue < 240) rgb = [0, x, chroma];
    else if (hue < 300) rgb = [x, 0, chroma];
    else rgb = [chroma, 0, x];

    return normalizeRgb({
      r: (rgb[0] + m) * 255,
      g: (rgb[1] + m) * 255,
      b: (rgb[2] + m) * 255,
    });
  }

  /* ---------- Formatting ---------- */

  const formatHex = (rgb) => rgbToHex(rgb);

  function formatRgb(rgb) {
    const { r, g, b } = normalizeRgb(rgb);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function formatHsl(rgb) {
    const { h, s, l } = rgbToHsl(rgb);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  /** All three display strings at once. */
  function formatAll(rgb) {
    return { hex: formatHex(rgb), rgb: formatRgb(rgb), hsl: formatHsl(rgb) };
  }

  /* ---------- Parsing ---------- */

  const NUMBER = "[+-]?(?:\\d+\\.?\\d*|\\.\\d+)";

  // rgb(255, 0, 0) · rgb(255 0 0)
  const RGB_PATTERN = new RegExp(
    `^rgb\\(\\s*(${NUMBER})\\s*(?:,\\s*|\\s+)(${NUMBER})\\s*(?:,\\s*|\\s+)(${NUMBER})\\s*\\)$`,
    "i",
  );

  // hsl(210, 50%, 40%) · hsl(210deg 50% 40%)
  const HSL_PATTERN = new RegExp(
    `^hsl\\(\\s*(${NUMBER})(?:deg)?\\s*(?:,\\s*|\\s+)(${NUMBER})%\\s*(?:,\\s*|\\s+)(${NUMBER})%\\s*\\)$`,
    "i",
  );

  /**
   * Parses a HEX, rgb() or hsl() string into Rgb. Returns null if the text
   * is not a supported color or a channel is out of range.
   */
  function parseColor(input) {
    if (typeof input !== "string") return null;
    const text = input.trim();
    if (!text) return null;

    const hex = hexToRgb(text);
    if (hex) return hex;

    const rgbMatch = text.match(RGB_PATTERN);
    if (rgbMatch) {
      const channels = rgbMatch.slice(1, 4).map(Number);
      if (channels.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
        return null;
      }
      const [r, g, b] = channels;
      return { r, g, b };
    }

    const hslMatch = text.match(HSL_PATTERN);
    if (hslMatch) {
      const [h, s, l] = hslMatch.slice(1, 4).map(Number);
      if (s < 0 || s > 100 || l < 0 || l > 100) return null;
      return hslToRgb({ h, s, l });
    }

    return null;
  }

  /* ---------- Contrast (WCAG 2.x) ---------- */

  /** Relative luminance from 0 (black) to 1 (white). */
  function relativeLuminance(rgb) {
    const { r, g, b } = normalizeRgb(rgb);
    const linear = (channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  }

  /** Contrast ratio between two colors, from 1 to 21. */
  function contrastRatio(a, b) {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    const lighter = Math.max(la, lb);
    const darker = Math.min(la, lb);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /** WCAG rating for normal-size text: "AAA", "AA", or "Fail". */
  function wcagRating(ratio) {
    if (ratio >= 7) return "AAA";
    if (ratio >= 4.5) return "AA";
    return "Fail";
  }

  const WHITE = Object.freeze({ r: 255, g: 255, b: 255 });
  const BLACK = Object.freeze({ r: 0, g: 0, b: 0 });

  /** Whichever of black or white reads better on top of the color. */
  function readableTextColor(background) {
    return contrastRatio(background, BLACK) >= contrastRatio(background, WHITE) ? BLACK : WHITE;
  }

  PickColor.colorUtils = {
    isRgb,
    normalizeRgb,
    rgbEquals,
    rgbToHex,
    hexToRgb,
    rgbToHsl,
    hslToRgb,
    formatHex,
    formatRgb,
    formatHsl,
    formatAll,
    parseColor,
    relativeLuminance,
    contrastRatio,
    wcagRating,
    WHITE,
    BLACK,
    readableTextColor,
  };
})();
