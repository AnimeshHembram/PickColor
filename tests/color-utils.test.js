// Plain script (not a module) so the app also works when index.html is opened
// straight from disk. Everything is shared through one global: window.PickColor.
(function () {
  "use strict";
  const PickColor = (globalThis.PickColor = globalThis.PickColor || {});

  const { test, equal, deepEqual, assert } = PickColor.testHarness;
  const { contrastRatio, formatAll, hexToRgb, hslToRgb, isRgb, parseColor, readableTextColor, relativeLuminance, rgbToHex, rgbToHsl, wcagRating, BLACK, WHITE, } = PickColor.colorUtils;

  const KNOWN = [
    // name, rgb, hex, hsl
    ["black", { r: 0, g: 0, b: 0 }, "#000000", { h: 0, s: 0, l: 0 }],
    ["white", { r: 255, g: 255, b: 255 }, "#FFFFFF", { h: 0, s: 0, l: 100 }],
    ["red", { r: 255, g: 0, b: 0 }, "#FF0000", { h: 0, s: 100, l: 50 }],
    ["lime", { r: 0, g: 255, b: 0 }, "#00FF00", { h: 120, s: 100, l: 50 }],
    ["blue", { r: 0, g: 0, b: 255 }, "#0000FF", { h: 240, s: 100, l: 50 }],
    ["yellow", { r: 255, g: 255, b: 0 }, "#FFFF00", { h: 60, s: 100, l: 50 }],
    ["cyan", { r: 0, g: 255, b: 255 }, "#00FFFF", { h: 180, s: 100, l: 50 }],
    ["magenta", { r: 255, g: 0, b: 255 }, "#FF00FF", { h: 300, s: 100, l: 50 }],
    ["mid grey", { r: 128, g: 128, b: 128 }, "#808080", { h: 0, s: 0, l: 50 }],
    ["navy", { r: 0, g: 0, b: 128 }, "#000080", { h: 240, s: 100, l: 25 }],
    ["olive", { r: 128, g: 128, b: 0 }, "#808000", { h: 60, s: 100, l: 25 }],
    ["default blue", { r: 58, g: 111, b: 247 }, "#3A6FF7", { h: 223, s: 92, l: 60 }],
  ];

  for (const [name, rgb, hex, hsl] of KNOWN) {
    test(`rgbToHex: ${name}`, () => equal(rgbToHex(rgb), hex));
    test(`hexToRgb: ${name}`, () => deepEqual(hexToRgb(hex), rgb));
    test(`rgbToHsl: ${name}`, () => deepEqual(rgbToHsl(rgb), hsl));
  }

  test("hslToRgb: primaries and greys are exact", () => {
    for (const [, rgb, , hsl] of KNOWN.slice(0, 9)) deepEqual(hslToRgb(hsl), rgb);
  });

  test("hslToRgb: round trip of rounded HSL stays within 3 per channel", () => {
    for (let r = 0; r <= 255; r += 17) {
      for (let g = 0; g <= 255; g += 51) {
        for (let b = 0; b <= 255; b += 85) {
          const back = hslToRgb(rgbToHsl({ r, g, b }));
          assert(
            Math.abs(back.r - r) <= 3 && Math.abs(back.g - g) <= 3 && Math.abs(back.b - b) <= 3,
            `round trip drifted for ${r},${g},${b}: ${JSON.stringify(back)}`,
          );
        }
      }
    }
  });

  test("hslToRgb: hue wraps around", () => {
    deepEqual(hslToRgb({ h: 360, s: 100, l: 50 }), { r: 255, g: 0, b: 0 });
    deepEqual(hslToRgb({ h: -120, s: 100, l: 50 }), { r: 0, g: 0, b: 255 });
  });

  test("rgbToHsl: hue never reports 360", () => {
    // Hue just below 360 rounds up; it must wrap to 0
    equal(rgbToHsl({ r: 255, g: 0, b: 1 }).h, 0);
  });

  test("hexToRgb: short form, lowercase, no hash, whitespace", () => {
    deepEqual(hexToRgb("#f0a"), { r: 255, g: 0, b: 170 });
    deepEqual(hexToRgb("3a6ff7"), { r: 58, g: 111, b: 247 });
    deepEqual(hexToRgb("  #3A6FF7 "), { r: 58, g: 111, b: 247 });
  });

  test("hexToRgb: rejects invalid and alpha forms", () => {
    for (const bad of ["", "#", "#12", "#12345", "#1234", "#12345678", "#GGGGGG", "red", null, 42]) {
      equal(hexToRgb(bad), null, `input ${JSON.stringify(bad)}`);
    }
  });

  test("rgbToHex: clamps and rounds out-of-range channels", () => {
    equal(rgbToHex({ r: 300, g: -4, b: 127.6 }), "#FF0080");
  });

  test("formatAll: strings", () => {
    deepEqual(formatAll({ r: 58, g: 111, b: 247 }), {
      hex: "#3A6FF7",
      rgb: "rgb(58, 111, 247)",
      hsl: "hsl(223, 92%, 60%)",
    });
  });

  test("parseColor: HEX, rgb() and hsl() in comma and space syntax", () => {
    deepEqual(parseColor("#3A6FF7"), { r: 58, g: 111, b: 247 });
    deepEqual(parseColor("rgb(58, 111, 247)"), { r: 58, g: 111, b: 247 });
    deepEqual(parseColor("RGB(58 111 247)"), { r: 58, g: 111, b: 247 });
    deepEqual(parseColor("hsl(0, 100%, 50%)"), { r: 255, g: 0, b: 0 });
    deepEqual(parseColor("hsl(120deg 100% 25%)"), { r: 0, g: 128, b: 0 });
  });

  test("parseColor: rejects out-of-range, alpha and unknown input", () => {
    for (const bad of [
      "rgb(256, 0, 0)",
      "rgb(-1, 0, 0)",
      "rgb(1.5, 0, 0)",
      "rgba(0, 0, 0, 0.5)",
      "rgb(0, 0)",
      "hsl(0, 120%, 50%)",
      "hsl(0, 50, 50)",
      "hsla(0, 50%, 50%, 1)",
      "blue",
      "",
      "   ",
    ]) {
      equal(parseColor(bad), null, `input ${JSON.stringify(bad)}`);
    }
  });

  test("isRgb", () => {
    assert(isRgb({ r: 0, g: 255, b: 10 }));
    assert(!isRgb({ r: 0, g: 256, b: 10 }));
    assert(!isRgb({ r: 0.5, g: 0, b: 0 }));
    assert(!isRgb(null));
  });

  test("relativeLuminance: black 0, white 1", () => {
    equal(relativeLuminance(BLACK), 0);
    equal(relativeLuminance(WHITE), 1);
  });

  test("contrastRatio: black on white is 21, same color is 1", () => {
    equal(Number(contrastRatio(BLACK, WHITE).toFixed(2)), 21);
    equal(contrastRatio({ r: 10, g: 20, b: 30 }, { r: 10, g: 20, b: 30 }), 1);
  });

  test("contrastRatio: #767676 on white is about 4.54 (AA threshold)", () => {
    const ratio = contrastRatio({ r: 118, g: 118, b: 118 }, WHITE);
    equal(Number(ratio.toFixed(2)), 4.54);
    equal(wcagRating(ratio), "AA");
  });

  test("wcagRating thresholds", () => {
    equal(wcagRating(7), "AAA");
    equal(wcagRating(4.5), "AA");
    equal(wcagRating(4.49), "Fail");
  });

  test("readableTextColor picks the higher-contrast option", () => {
    deepEqual(readableTextColor({ r: 255, g: 255, b: 0 }), BLACK);
    deepEqual(readableTextColor({ r: 0, g: 0, b: 128 }), WHITE);
  });
})();
