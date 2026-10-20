// Plain script (not a module) so the app also works when index.html is opened
// straight from disk. Everything is shared through one global: window.PickColor.
(function () {
  "use strict";
  const PickColor = (globalThis.PickColor = globalThis.PickColor || {});

  const { test, deepEqual, equal, assert } = PickColor.testHarness;
  const { PALETTE_KEY, createPalette, cssVariableNames, paletteToCss, paletteToJson, pushRecent, sanitizeItems, slugify, } = PickColor.palette;

  function memoryStorage(initial = {}) {
    const data = { ...initial };
    return {
      getItem: (key) => (key in data ? data[key] : null),
      setItem: (key, value) => {
        data[key] = String(value);
      },
      removeItem: (key) => {
        delete data[key];
      },
      data,
    };
  }

  test("pushRecent: newest first, no duplicates, capped", () => {
    let list = [];
    list = pushRecent(list, "#aa0000", 3);
    list = pushRecent(list, "#00AA00", 3);
    list = pushRecent(list, "#AA0000", 3);
    deepEqual(list, ["#AA0000", "#00AA00"]);
    list = pushRecent(list, "#0000AA", 3);
    list = pushRecent(list, "#FFFFFF", 3);
    deepEqual(list, ["#FFFFFF", "#0000AA", "#AA0000"]);
  });

  test("slugify", () => {
    equal(slugify("Brand Blue #2"), "brand-blue-2");
    equal(slugify("  Café crème "), "cafe-creme");
    equal(slugify("***"), "color");
  });

  test("cssVariableNames: unique names for duplicates", () => {
    deepEqual(cssVariableNames([{ name: "Sky" }, { name: "sky" }, { name: "Sea" }, { name: "SKY" }]), [
      "--color-sky",
      "--color-sky-2",
      "--color-sea",
      "--color-sky-3",
    ]);
  });

  test("paletteToCss", () => {
    const css = paletteToCss([
      { name: "Sky", hex: "#3A6FF7" },
      { name: "Ink", hex: "#1C1C1C" },
    ]);
    equal(css, ":root {\n  --color-sky: #3A6FF7;\n  --color-ink: #1C1C1C;\n}\n");
  });

  test("paletteToJson includes hex and rgb", () => {
    const parsed = JSON.parse(paletteToJson([{ name: "Sky", hex: "#3A6FF7" }]));
    deepEqual(parsed.colors, [{ name: "Sky", hex: "#3A6FF7", rgb: [58, 111, 247] }]);
  });

  test("sanitizeItems drops malformed entries", () => {
    const items = sanitizeItems([
      { id: "a", name: "Good", hex: "#abc" },
      { id: "b", name: "Bad hex", hex: "nope" },
      { name: 3, hex: "#000000" },
      null,
    ]);
    equal(items.length, 1);
    equal(items[0].hex, "#AABBCC");
    equal(sanitizeItems("not an array").length, 0);
  });

  test("createPalette: add, rename, remove, clear, persisted", () => {
    const storage = memoryStorage();
    const palette = createPalette(storage);
    equal(palette.add("#3a6ff7"), "added");
    equal(palette.add("#3A6FF7"), "duplicate");
    equal(palette.add("#000000", "Ink"), "added");
    equal(palette.items().length, 2);

    const [first] = palette.items();
    palette.rename(first.id, "  Sky  ");
    equal(palette.items()[0].name, "Sky");
    palette.rename(first.id, "   ");
    equal(palette.items()[0].name, "Sky", "blank rename keeps old name");

    const reloaded = createPalette(storage);
    deepEqual(
      reloaded.items().map(({ name, hex }) => [name, hex]),
      [
        ["Sky", "#3A6FF7"],
        ["Ink", "#000000"],
      ],
    );

    palette.remove(first.id);
    equal(palette.items().length, 1);
    palette.clear();
    equal(palette.items().length, 0);
    equal(storage.data[PALETTE_KEY], "[]");
  });

  test("createPalette: corrupt storage starts empty", () => {
    const palette = createPalette(memoryStorage({ [PALETTE_KEY]: "{not json" }));
    equal(palette.items().length, 0);
  });

  test("createPalette: storage that throws still works for the visit", () => {
    const throwing = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
    const palette = createPalette(throwing);
    equal(palette.add("#123456"), "added");
    equal(palette.items().length, 1);
    assert(!palette.isSaved());
  });

  test("createPalette: notifies subscribers", () => {
    const palette = createPalette(memoryStorage());
    let calls = 0;
    palette.subscribe(() => {
      calls += 1;
    });
    palette.add("#111111");
    palette.clear();
    equal(calls, 2);
  });
})();
