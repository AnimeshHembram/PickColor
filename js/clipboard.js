// Plain script (not a module) so the app also works when index.html is opened
// straight from disk. Everything is shared through one global: window.PickColor.
(function () {
  "use strict";
  const PickColor = (globalThis.PickColor = globalThis.PickColor || {});

  /**
   * Copies text to the clipboard.
   * Uses the async Clipboard API where allowed (HTTPS or localhost), and falls
   * back to a temporary hidden textarea for older or restricted contexts.
   * Resolves true on success and false on failure; never rejects.
   */
  async function copyText(text) {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Permission denied or document not focused: try the fallback below.
      }
    }
    return legacyCopy(text);
  }

  function legacyCopy(text) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    area.style.pointerEvents = "none";
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }

  PickColor.clipboard = {
    copyText,
  };
})();
