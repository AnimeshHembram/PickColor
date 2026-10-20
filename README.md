# PickColor

A small, private color picker that runs in your browser. Pick a color, get its HEX, RGB and HSL values, sample colors from your own images, and build a palette, all without installing anything or creating an account.

**Open PickColor:** _the live link will be added here once GitHub Pages deployment is verified._

## What it does

- **Pick a color** with your system color picker, or type one as HEX, `rgb()` or `hsl()`.
- **Copy** the HEX, RGB or HSL value with one click.
- **Sample from an image.** Choose, drop or paste an image, then click any point. A zoomed loupe and crosshair show exactly which pixel you'll get, and you can move pixel by pixel with the arrow keys. Your image never leaves your device.
- **Pick from anywhere on screen** in browsers that support the EyeDropper feature (currently Chrome and Edge on desktop). Other browsers show a note and keep image sampling as the alternative.
- **Check text contrast**: see the WCAG contrast ratio for white and black text on the selected color.
- **Recent colors** for the current visit, and a **palette** you can name and export as CSS variables or JSON. The palette is saved in your browser only.
- **Light and dark themes** that follow your system setting, with a manual override.
- **Shareable links**: the address bar keeps the current color (for example `…/#3A6FF7`).

## Run it locally

PickColor is plain HTML, CSS and JavaScript with nothing to install or build.

- **Quickest:** double-click `index.html` to open it in your browser. Everything works this way.
- **Closest to the live site:** serve the folder with any static server, then open <http://localhost:8000/>:

  ```bash
  python -m http.server 8000
  ```

## Run the tests

- **In a browser:** open `tests/index.html` (double-click it, or visit <http://localhost:8000/tests/> with the server running).
- **From the command line (optional, Node.js 18 or newer):** `node tests/run.mjs`

Manual checks for image sampling, themes, clipboard and the eyedropper are listed in [docs/TESTING.md](docs/TESTING.md). Sample images for those checks are in `tests/fixtures/`.

## Project layout

```text
index.html          App shell
css/styles.css      Design tokens, light/dark themes, components
css/responsive.css  Narrow-screen adjustments
js/app.js           Wires the UI together
js/color-utils.js   Color parsing, conversion and contrast (pure functions)
js/image-picker.js  Local image loading and pixel sampling
js/eyedropper.js    Optional screen eyedropper
js/palette.js       Recent colors, palette storage and export
js/theme.js         Theme preference (theme-init.js applies it before first paint)
js/clipboard.js     Copy with fallback
tests/              Browser-native tests and fixtures
docs/               Brief, architecture, roadmap, testing checklist
```

More detail is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Privacy

PickColor has no backend, analytics, trackers, remote fonts or external requests. Images are decoded in your browser and never uploaded. Your theme choice and palette are stored only in this browser's local storage.

## Deploying to GitHub Pages

1. Push the repository to GitHub.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, and save.
4. After a minute or two the site is available at `https://<your-username>.github.io/PickColor/`.

All asset paths are relative, so the app works under that `/PickColor/` subpath. The empty `.nojekyll` file tells Pages to serve the files as they are.
