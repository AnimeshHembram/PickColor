// Plain script (not a module) so the app also works when index.html is opened
// straight from disk. Everything is shared through one global: window.PickColor.
(function () {
  "use strict";
  const PickColor = (globalThis.PickColor = globalThis.PickColor || {});

  /**
   * Wrapper for the browser EyeDropper API (screen-wide color sampling).
   *
   * Support is limited (Chromium-based desktop browsers at the time of writing),
   * so callers must check isEyeDropperSupported() before offering the action,
   * and must only call pickFromScreen() from a direct user gesture such as a click.
   * Nothing in this module runs on page load.
   */

  const { hexToRgb } = PickColor.colorUtils;

  function isEyeDropperSupported(win = globalThis) {
    return typeof win !== "undefined" && typeof win.EyeDropper === "function";
  }

  /**
   * Opens the browser eyedropper.
   * Resolves to one of:
   *   { status: "picked", rgb }
   *   { status: "cancelled" }      – the user pressed Esc or closed it
   *   { status: "unsupported" }
   *   { status: "error", message }
   * It never rejects, so the UI can't crash on an unexpected failure.
   */
  async function pickFromScreen(win = globalThis) {
    if (!isEyeDropperSupported(win)) return { status: "unsupported" };

    try {
      const dropper = new win.EyeDropper();
      const result = await dropper.open();
      const rgb = hexToRgb(result?.sRGBHex ?? "");
      if (!rgb) {
        return { status: "error", message: "The browser returned a color PickColor couldn't read." };
      }
      return { status: "picked", rgb };
    } catch (error) {
      if (error?.name === "AbortError") return { status: "cancelled" };
      if (error?.name === "NotAllowedError") {
        return {
          status: "error",
          message: "The browser blocked the eyedropper. Click the button again to retry.",
        };
      }
      return {
        status: "error",
        message: "The eyedropper stopped unexpectedly. Try again, or sample from an image instead.",
      };
    }
  }

  PickColor.eyedropper = {
    isEyeDropperSupported,
    pickFromScreen,
  };
})();
