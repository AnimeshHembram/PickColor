// Plain script (not a module) so the app also works when index.html is opened
// straight from disk. Everything is shared through one global: window.PickColor.
(function () {
  "use strict";
  const PickColor = (globalThis.PickColor = globalThis.PickColor || {});

  /**
   * Theme preference: "system" (default), "light" or "dark".
   * - "system" removes data-theme so CSS follows prefers-color-scheme.
   * - An explicit choice sets data-theme on <html> and is saved when storage works.
   */

  const THEME_KEY = "pickcolor-theme";
  const CHOICES = ["system", "light", "dark"];

  function readThemeChoice(storage = safeStorage()) {
    try {
      const saved = storage?.getItem(THEME_KEY);
      return saved === "light" || saved === "dark" ? saved : "system";
    } catch {
      return "system";
    }
  }

  function applyThemeChoice(choice, root = document.documentElement) {
    if (choice === "light" || choice === "dark") root.setAttribute("data-theme", choice);
    else root.removeAttribute("data-theme");
  }

  /** Applies and saves a choice. Returns false if it could not be saved. */
  function saveThemeChoice(choice, storage = safeStorage()) {
    const value = CHOICES.includes(choice) ? choice : "system";
    applyThemeChoice(value);
    try {
      if (!storage) return false;
      if (value === "system") storage.removeItem(THEME_KEY);
      else storage.setItem(THEME_KEY, value);
      return true;
    } catch {
      return false;
    }
  }

  /** Wires a group of radio inputs (name="theme") to the theme preference. */
  function initThemeControl(form) {
    const current = readThemeChoice();
    applyThemeChoice(current);
    const radio = form.querySelector(`input[name="theme"][value="${current}"]`);
    if (radio) radio.checked = true;

    form.addEventListener("change", (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.name === "theme") {
        saveThemeChoice(target.value);
      }
    });
  }

  function safeStorage() {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  PickColor.theme = {
    THEME_KEY,
    readThemeChoice,
    applyThemeChoice,
    saveThemeChoice,
    initThemeControl,
  };
})();
