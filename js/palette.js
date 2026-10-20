// Plain script (not a module) so the app also works when index.html is opened
// straight from disk. Everything is shared through one global: window.PickColor.
(function () {
  "use strict";
  const PickColor = (globalThis.PickColor = globalThis.PickColor || {});

  /**
   * Recent colors (this session only) and a saved palette with export helpers.
   * The palette is stored in this browser's localStorage when available; it is
   * never sent anywhere. Pure helpers are exported separately for testing.
   */

  const { hexToRgb, rgbToHex } = PickColor.colorUtils;

  const PALETTE_KEY = "pickcolor-palette";
  const RECENT_LIMIT = 12;
  const PALETTE_LIMIT = 48;

  /* ---------- Pure helpers ---------- */

  /** Most-recent-first list without duplicates, capped at limit. */
  function pushRecent(list, hex, limit = RECENT_LIMIT) {
    const value = hex.toUpperCase();
    return [value, ...list.filter((item) => item !== value)].slice(0, limit);
  }

  /** "Brand Blue #2" → "brand-blue-2". Falls back to "color". */
  function slugify(name) {
    const slug = String(name)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return slug || "color";
  }

  /** Unique CSS custom property names for each palette item, in order. */
  function cssVariableNames(items, prefix = "color") {
    const used = new Map();
    return items.map((item) => {
      const base = `${prefix}-${slugify(item.name)}`;
      const count = used.get(base) ?? 0;
      used.set(base, count + 1);
      return count === 0 ? `--${base}` : `--${base}-${count + 1}`;
    });
  }

  function paletteToCss(items) {
    const names = cssVariableNames(items);
    const lines = items.map((item, index) => `  ${names[index]}: ${item.hex};`);
    return `:root {\n${lines.join("\n")}\n}\n`;
  }

  function paletteToJson(items) {
    const colors = items.map(({ name, hex }) => {
      const { r, g, b } = hexToRgb(hex);
      return { name, hex, rgb: [r, g, b] };
    });
    return JSON.stringify({ name: "PickColor palette", colors }, null, 2) + "\n";
  }

  /** Keeps only well-formed items; used when reading saved data. */
  function sanitizeItems(value) {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item) => item && typeof item.name === "string" && hexToRgb(item.hex ?? ""))
      .slice(0, PALETTE_LIMIT)
      .map((item) => ({
        id: typeof item.id === "string" && item.id ? item.id : makeId(),
        name: item.name.slice(0, 40),
        hex: rgbToHex(hexToRgb(item.hex)),
      }));
  }

  let idCounter = 0;
  function makeId() {
    idCounter += 1;
    return `c${Date.now().toString(36)}${idCounter}`;
  }

  /* ---------- Stateful stores ---------- */

  function createRecentColors(limit = RECENT_LIMIT) {
    let list = [];
    return {
      add(hex) {
        list = pushRecent(list, hex, limit);
        return list;
      },
      list: () => list,
    };
  }

  function createPalette(storage = safeStorage()) {
    let items = load();
    const listeners = new Set();

    function load() {
      try {
        const raw = storage?.getItem(PALETTE_KEY);
        return raw ? sanitizeItems(JSON.parse(raw)) : [];
      } catch {
        return [];
      }
    }

    let saved = true;
    function commit(next) {
      items = next;
      try {
        storage?.setItem(PALETTE_KEY, JSON.stringify(items));
        saved = Boolean(storage);
      } catch {
        saved = false;
      }
      listeners.forEach((listener) => listener(items));
    }

    return {
      items: () => items,
      isSaved: () => saved,
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      /** Returns "added", "duplicate" or "full". */
      add(hex, name) {
        const value = hex.toUpperCase();
        if (items.some((item) => item.hex === value)) return "duplicate";
        if (items.length >= PALETTE_LIMIT) return "full";
        commit([...items, { id: makeId(), name: name || `Color ${items.length + 1}`, hex: value }]);
        return "added";
      },
      rename(id, name) {
        const trimmed = name.trim().slice(0, 40);
        commit(items.map((item) => (item.id === id ? { ...item, name: trimmed || item.name } : item)));
      },
      remove(id) {
        commit(items.filter((item) => item.id !== id));
      },
      clear() {
        commit([]);
      },
    };
  }

  function safeStorage() {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  PickColor.palette = {
    PALETTE_KEY,
    RECENT_LIMIT,
    PALETTE_LIMIT,
    pushRecent,
    slugify,
    cssVariableNames,
    paletteToCss,
    paletteToJson,
    sanitizeItems,
    createRecentColors,
    createPalette,
  };
})();
