// Loaded as a classic (blocking) script in <head> so a saved light/dark choice
// is applied before the first paint, avoiding a flash of the wrong theme.
// With no saved choice, CSS follows the system preference on its own.
(function () {
  try {
    var saved = window.localStorage.getItem("pickcolor-theme");
    if (saved === "light" || saved === "dark") {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch (e) {
    // Storage unavailable (private mode, blocked cookies): follow the system.
  }
})();
