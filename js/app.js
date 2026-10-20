// Plain script (not a module) so the app also works when index.html is opened
// straight from disk. Everything is shared through one global: window.PickColor.
(function () {
  "use strict";
  const PickColor = (globalThis.PickColor = globalThis.PickColor || {});

  /**
   * PickColor entry point: wires the UI to the modules and keeps every view of
   * the selected color in sync. Feature logic lives in the other modules.
   */

  const { BLACK, WHITE, contrastRatio, formatAll, hexToRgb, parseColor, readableTextColor, rgbEquals, rgbToHex, wcagRating } = PickColor.colorUtils;
  const { copyText } = PickColor.clipboard;
  const { isEyeDropperSupported, pickFromScreen } = PickColor.eyedropper;
  const { createImageSampler } = PickColor.imagePicker;
  const { createPalette, createRecentColors, paletteToCss, paletteToJson } = PickColor.palette;

  const DEFAULT_COLOR = { r: 58, g: 111, b: 247 }; // #3A6FF7

  const $ = (selector) => document.querySelector(selector);

  const el = {
    colorPanel: $(".panel--color"),
    swatch: $("#swatch"),
    swatchHex: $("#swatch-hex"),
    swatchSub: $("#swatch-sub"),
    colorInput: $("#color-input"),
    entryForm: $("#color-entry"),
    entryInput: $("#color-text"),
    entryError: $("#color-text-error"),
    values: { hex: $("#value-hex"), rgb: $("#value-rgb"), hsl: $("#value-hsl") },
    contrastWhite: $("#contrast-white"),
    contrastBlack: $("#contrast-black"),
    eyedropperButton: $("#eyedropper-button"),
    eyedropperNote: $("#eyedropper-note"),
    dropzone: $("#dropzone"),
    dropzoneEmpty: $("#dropzone-empty"),
    fileInput: $("#file-input"),
    stage: $("#stage"),
    canvas: $("#sample-canvas"),
    reticle: $("#reticle"),
    loupe: $("#loupe"),
    samplerBar: $("#sampler-bar"),
    readout: $("#hover-readout"),
    clearImage: $("#clear-image"),
    recentList: $("#recent-list"),
    recentEmpty: $("#recent-empty"),
    paletteAdd: $("#palette-add"),
    paletteList: $("#palette-list"),
    paletteEmpty: $("#palette-empty"),
    paletteExport: $("#palette-export"),
    exportCssCopy: $("#export-css-copy"),
    exportCssDownload: $("#export-css-download"),
    exportJsonDownload: $("#export-json-download"),
    paletteClear: $("#palette-clear"),
    status: $("#status"),
  };

  const state = {
    rgb: DEFAULT_COLOR,
    formatted: formatAll(DEFAULT_COLOR),
  };

  const recent = createRecentColors();
  const palette = createPalette();

  /* ---------- Status messages ---------- */

  let statusTimer = 0;

  function announce(message, { error = false } = {}) {
    window.clearTimeout(statusTimer);
    el.status.classList.remove("is-hidden");
    el.status.classList.toggle("is-error", error);
    // Clearing first makes screen readers announce a repeated message again.
    el.status.textContent = "";
    window.requestAnimationFrame(() => {
      el.status.textContent = message;
    });
    statusTimer = window.setTimeout(() => el.status.classList.add("is-hidden"), error ? 5000 : 2600);
  }

  /* ---------- Selected color ---------- */

  /**
   * Makes rgb the selected color and updates every view of it.
   * options.remember – add to recent colors (false while dragging the native picker)
   */
  function setColor(rgb, { remember = true } = {}) {
    state.rgb = rgb;
    state.formatted = formatAll(rgb);
    const { hex, rgb: rgbText, hsl } = state.formatted;
    const ink = readableTextColor(rgb);

    el.colorPanel.style.setProperty("--swatch-color", hex);
    el.colorPanel.style.setProperty("--swatch-ink", rgbToHex(ink));
    el.swatchHex.textContent = hex;
    el.swatchSub.textContent = rgbText;
    el.swatch.setAttribute("aria-label", `Selected color ${hex}, ${rgbText}, ${hsl}`);

    el.values.hex.textContent = hex;
    el.values.rgb.textContent = rgbText;
    el.values.hsl.textContent = hsl;

    const nativeValue = hex.toLowerCase();
    if (el.colorInput.value !== nativeValue) el.colorInput.value = nativeValue;

    renderContrast(el.contrastWhite, contrastRatio(rgb, WHITE));
    renderContrast(el.contrastBlack, contrastRatio(rgb, BLACK));

    updateHash(hex);
    if (remember) renderRecent(recent.add(hex));
  }

  function renderContrast(item, ratio) {
    const rating = wcagRating(ratio);
    item.querySelector(".contrast__ratio").textContent = `${ratio.toFixed(2)}:1`;
    const badge = item.querySelector(".contrast__rating");
    badge.textContent = rating === "Fail" ? "Below AA" : rating;
    badge.dataset.rating = rating;
  }

  /* The address bar keeps the current color, so a link reopens it: …/#3A6FF7 */
  function updateHash(hex) {
    const next = `#${hex.slice(1)}`;
    if (window.location.hash !== next) {
      try {
        window.history.replaceState(null, "", next);
      } catch {
        // Some sandboxed previews block history changes; the app still works.
      }
    }
  }

  function colorFromHash() {
    return hexToRgb(decodeURIComponent(window.location.hash.slice(1)));
  }

  /* ---------- Choosing a color ---------- */

  el.colorInput.addEventListener("input", () => {
    const rgb = hexToRgb(el.colorInput.value);
    if (rgb) setColor(rgb, { remember: false });
  });

  el.colorInput.addEventListener("change", () => {
    const rgb = hexToRgb(el.colorInput.value);
    if (rgb) setColor(rgb);
  });

  el.entryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = el.entryInput.value.trim();
    if (!text) {
      showEntryError("Type a color first, for example #3A6FF7.");
      return;
    }
    const rgb = parseColor(text);
    if (!rgb) {
      showEntryError(`“${text}” isn't a color PickColor can read. Try #3A6FF7, rgb(58, 111, 247) or hsl(223, 92%, 60%).`);
      return;
    }
    clearEntryError();
    setColor(rgb);
    announce(`Applied ${state.formatted.hex}`);
  });

  el.entryInput.addEventListener("input", clearEntryError);

  function showEntryError(message) {
    el.entryError.textContent = message;
    el.entryError.hidden = false;
    el.entryInput.setAttribute("aria-invalid", "true");
    el.entryInput.focus();
  }

  function clearEntryError() {
    el.entryError.hidden = true;
    el.entryError.textContent = "";
    el.entryInput.removeAttribute("aria-invalid");
  }

  /* ---------- Copy ---------- */

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = state.formatted[button.dataset.copy];
      const ok = await copyText(value);
      if (ok) {
        flashButton(button, "Copied");
        announce(`Copied ${value}`);
      } else {
        announce("Couldn't copy. Select the value and copy it with Ctrl+C or ⌘C.", { error: true });
      }
    });
  });

  function flashButton(button, text) {
    const original = button.dataset.label ?? button.textContent;
    button.dataset.label = original;
    button.textContent = text;
    button.classList.add("is-done");
    window.clearTimeout(Number(button.dataset.timer));
    button.dataset.timer = String(
      window.setTimeout(() => {
        button.textContent = original;
        button.classList.remove("is-done");
      }, 1400),
    );
  }

  /* ---------- Screen eyedropper (progressive enhancement) ---------- */

  if (isEyeDropperSupported()) {
    el.eyedropperButton.hidden = false;
    el.eyedropperButton.addEventListener("click", async () => {
      el.eyedropperButton.disabled = true;
      const result = await pickFromScreen();
      el.eyedropperButton.disabled = false;
      el.eyedropperButton.focus();

      if (result.status === "picked") {
        setColor(result.rgb);
        announce(`Picked ${state.formatted.hex} from your screen`);
      } else if (result.status === "cancelled") {
        announce("Screen picking cancelled");
      } else if (result.status === "error") {
        announce(result.message, { error: true });
      }
    });
  } else {
    el.eyedropperNote.hidden = false;
  }

  /* ---------- Image sampling ---------- */

  const sampler = createImageSampler({
    canvas: el.canvas,
    reticle: el.reticle,
    loupe: el.loupe,
    onHover(sample) {
      if (!sample) {
        el.readout.textContent = "Point at the image to preview a color.";
        return;
      }
      renderReadout(sample);
    },
    onPick(sample) {
      if (rgbEquals(sample.rgb, state.rgb)) {
        announce(`Picked ${state.formatted.hex} at x ${sample.x}, y ${sample.y}`);
      } else {
        setColor(sample.rgb);
        let message = `Picked ${state.formatted.hex} at x ${sample.x}, y ${sample.y}`;
        if (sample.alpha === 0) message += ". This pixel is fully transparent.";
        else if (sample.alpha < 255) {
          message += `. This pixel is ${Math.round((1 - sample.alpha / 255) * 100)}% transparent; transparency isn't included.`;
        }
        announce(message);
      }
      renderReadout(sample);
    },
  });

  function renderReadout(sample) {
    const hex = rgbToHex(sample.rgb);
    const chip = document.createElement("span");
    chip.className = "readout__chip";
    chip.style.background = hex;
    const text = document.createElement("span");
    text.textContent = `${hex}  x ${sample.x}, y ${sample.y}`;
    el.readout.replaceChildren(chip, text);
  }

  async function openImage(file) {
    if (!file) return;
    const result = await sampler.loadFile(file);
    if (!result.ok) {
      announce(result.message, { error: true });
      return;
    }
    el.dropzoneEmpty.hidden = true;
    el.stage.hidden = false;
    el.samplerBar.hidden = false;
    el.dropzone.classList.add("has-image");
    announce(`Opened ${file.name || "image"} (${result.width} × ${result.height}). Click a point to pick its color.`);
  }

  function closeImage() {
    sampler.clear();
    el.stage.hidden = true;
    el.samplerBar.hidden = true;
    el.dropzoneEmpty.hidden = false;
    el.dropzone.classList.remove("has-image");
    el.fileInput.focus();
    announce("Image removed");
  }

  el.fileInput.addEventListener("change", () => {
    const [file] = el.fileInput.files;
    openImage(file);
    el.fileInput.value = ""; // lets the same file be chosen again
  });

  el.clearImage.addEventListener("click", closeImage);

  // Drag and drop
  let dragDepth = 0;
  el.dropzone.addEventListener("dragenter", (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth += 1;
    el.dropzone.classList.add("is-dragging");
  });
  el.dropzone.addEventListener("dragover", (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  });
  el.dropzone.addEventListener("dragleave", () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) el.dropzone.classList.remove("is-dragging");
  });
  el.dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dragDepth = 0;
    el.dropzone.classList.remove("is-dragging");
    const [file] = event.dataTransfer.files;
    openImage(file);
  });

  // A file dropped outside the drop area shouldn't make the browser leave the app
  window.addEventListener("dragover", (event) => {
    if (hasFiles(event)) event.preventDefault();
  });
  window.addEventListener("drop", (event) => {
    if (hasFiles(event)) event.preventDefault();
  });

  function hasFiles(event) {
    return Array.from(event.dataTransfer?.types ?? []).includes("Files");
  }

  // Paste an image from the clipboard
  document.addEventListener("paste", (event) => {
    const item = Array.from(event.clipboardData?.items ?? []).find(
      (entry) => entry.kind === "file" && entry.type.startsWith("image/"),
    );
    if (!item) return; // plain text paste: leave it to the focused field
    event.preventDefault();
    openImage(item.getAsFile());
  });

  /* ---------- Recent colors ---------- */

  function renderRecent(list) {
    el.recentEmpty.hidden = list.length > 0;
    el.recentList.hidden = list.length === 0;
    el.recentList.replaceChildren(
      ...list.map((hex) => {
        const li = document.createElement("li");
        li.append(colorChip(hex, `Use ${hex}`));
        return li;
      }),
    );
  }

  function colorChip(hex, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.style.background = hex;
    button.title = hex;
    button.setAttribute("aria-label", label);
    button.addEventListener("click", () => {
      const rgb = hexToRgb(hex);
      if (rgb) setColor(rgb);
    });
    return button;
  }

  /* ---------- Palette ---------- */

  el.paletteAdd.addEventListener("click", () => {
    const hex = state.formatted.hex;
    const result = palette.add(hex);
    if (result === "duplicate") {
      announce(`${hex} is already in your palette`);
    } else if (result === "full") {
      announce("Your palette is full. Remove a color to add another.", { error: true });
    } else if (!palette.isSaved()) {
      announce(`Added ${hex}. This browser isn't allowing storage, so the palette lasts for this visit only.`);
    } else {
      announce(`Added ${hex} to your palette`);
    }
  });

  const paletteRows = new Map();

  function renderPalette(items) {
    el.paletteEmpty.hidden = items.length > 0;
    el.paletteList.hidden = items.length === 0;
    el.paletteExport.hidden = items.length === 0;

    const ids = new Set(items.map((item) => item.id));
    for (const [id, row] of paletteRows) {
      if (!ids.has(id)) {
        row.li.remove();
        paletteRows.delete(id);
      }
    }

    items.forEach((item, index) => {
      let row = paletteRows.get(item.id);
      if (!row) {
        row = createPaletteRow(item);
        paletteRows.set(item.id, row);
      }
      // Update in place so a field being edited keeps focus
      if (document.activeElement !== row.name) row.name.value = item.name;
      row.name.setAttribute("aria-label", `Name for ${item.hex}`);
      row.chip.setAttribute("aria-label", `Use ${item.name}, ${item.hex}`);
      row.remove.setAttribute("aria-label", `Remove ${item.name}`);
      if (el.paletteList.children[index] !== row.li) {
        el.paletteList.insertBefore(row.li, el.paletteList.children[index] ?? null);
      }
    });
  }

  function createPaletteRow(item) {
    const li = document.createElement("li");
    li.className = "palette-item";

    const chip = colorChip(item.hex, `Use ${item.name}, ${item.hex}`);

    const name = document.createElement("input");
    name.type = "text";
    name.className = "palette-item__name";
    name.maxLength = 40;
    name.value = item.name;
    name.addEventListener("change", () => palette.rename(item.id, name.value));
    name.addEventListener("keydown", (event) => {
      if (event.key === "Enter") name.blur();
      if (event.key === "Escape") {
        name.value = palette.items().find((entry) => entry.id === item.id)?.name ?? name.value;
        name.blur();
      }
    });

    const hex = document.createElement("span");
    hex.className = "palette-item__hex";
    hex.textContent = item.hex;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "button button--quiet palette-item__remove";
    remove.innerHTML =
      '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6Z" fill="currentColor"/></svg>';
    remove.addEventListener("click", () => {
      const items = palette.items();
      const index = items.findIndex((entry) => entry.id === item.id);
      const removedName = items[index]?.name ?? item.hex;
      palette.remove(item.id);
      // Keep keyboard focus nearby: next row, previous row, or the add button
      const remaining = palette.items();
      const neighbour = remaining[index] ?? remaining[index - 1];
      (neighbour ? paletteRows.get(neighbour.id).remove : el.paletteAdd).focus();
      announce(`Removed ${removedName}`);
    });

    li.append(chip, name, hex, remove);
    return { li, chip, name, remove };
  }

  palette.subscribe(renderPalette);

  el.exportCssCopy.addEventListener("click", async () => {
    const ok = await copyText(paletteToCss(palette.items()));
    if (ok) {
      flashButton(el.exportCssCopy, "Copied");
      announce("Copied the palette as CSS variables");
    } else {
      announce("Couldn't copy. Use Download CSS instead.", { error: true });
    }
  });

  el.exportCssDownload.addEventListener("click", () => {
    download("pickcolor-palette.css", paletteToCss(palette.items()), "text/css");
    announce("Downloaded pickcolor-palette.css");
  });

  el.exportJsonDownload.addEventListener("click", () => {
    download("pickcolor-palette.json", paletteToJson(palette.items()), "application/json");
    announce("Downloaded pickcolor-palette.json");
  });

  function download(filename, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Clearing needs a second click, so one slip doesn't wipe the palette
  let clearTimer = 0;
  el.paletteClear.addEventListener("click", () => {
    if (el.paletteClear.dataset.armed === "true") {
      window.clearTimeout(clearTimer);
      resetClearButton();
      palette.clear();
      el.paletteAdd.focus();
      announce("Palette cleared");
      return;
    }
    el.paletteClear.dataset.armed = "true";
    el.paletteClear.textContent = "Click again to clear";
    clearTimer = window.setTimeout(resetClearButton, 4000);
  });

  function resetClearButton() {
    el.paletteClear.dataset.armed = "false";
    el.paletteClear.textContent = "Clear palette";
  }

  /* ---------- Start ---------- */

  setColor(colorFromHash() ?? DEFAULT_COLOR, { remember: false });
  renderRecent(recent.list());
  renderPalette(palette.items());

  window.addEventListener("hashchange", () => {
    const rgb = colorFromHash();
    if (rgb && !rgbEquals(rgb, state.rgb)) setColor(rgb);
  });
})();
