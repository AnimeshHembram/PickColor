# PickColor — Architecture

## 1. Deployment model
PickColor is a static client-side website hosted on GitHub Pages. GitHub serves the files; application features execute in the user's browser. There is no backend in the MVP.

## 2. Technology choices
- HTML5 for semantic structure.
- CSS for layout, responsive behavior, themes, and component states.
- Vanilla JavaScript for application behavior, as plain deferred scripts sharing one `window.PickColor` namespace (see section 4a).
- Browser Clipboard API for copying, with clear handling for unavailable/denied access.
- File input + browser image decoding for local image sampling.
- EyeDropper API as optional progressive enhancement after feature detection.
- GitHub Pages for hosting.
- Browser-native test strategy initially; use a small test runner only if needed and compatible with a no-build static project.

Do not add React, Vue, TypeScript, npm, a bundler, or external runtime dependencies without explaining the concrete benefit and getting approval.

## 3. Proposed file layout
```text
PickColor/
├── index.html
├── README.md
├── .gitignore
├── assets/
│   ├── icons/
│   └── images/
├── css/
│   ├── styles.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── color-utils.js
│   ├── eyedropper.js
│   ├── image-picker.js
│   ├── palette.js
│   └── clipboard.js
├── tests/
│   ├── index.html        (browser test runner)
│   ├── run.mjs           (optional Node runner)
│   ├── scripts.mjs       (script load order for the Node runner)
│   ├── harness.js, *.test.js
│   └── fixtures/         (sample images for sampling checks)
└── docs/
    ├── PROJECT_BRIEF.md
    ├── ARCHITECTURE.md
    ├── ROADMAP.md
    └── TESTING.md
```

`.nojekyll` (empty) tells GitHub Pages to serve files without Jekyll processing. `.gitattributes` keeps line endings consistent across Windows and other systems.

## 4. Module responsibilities
### `index.html`
Semantic app shell, landmarks, controls, and the ordered `<script defer>` tags (app.js last). Avoid inline application logic.

### `css/styles.css`
Design tokens, typography, core layout, color workspace, buttons, fields, focus states, and light/dark theme variables.

### `css/responsive.css`
Responsive layout and narrow viewport adjustments. Keep mobile rules separate and avoid duplicating base styles.

### `js/app.js`
Initialize the app, connect UI events, coordinate modules, update the selected color, and display status messages. Keep it as orchestration rather than a place for every feature.

### `js/color-utils.js`
Pure functions for validating/parsing supported color inputs and converting between RGB, HEX, and HSL. Prefer deterministic functions that can be tested independently. Document rounding and alpha-channel decisions.

### `js/eyedropper.js`
Feature detection and wrapper for the browser EyeDropper API. Handle cancellation, unsupported browsers, and permission/runtime errors. Never call it on page load.

### `js/image-picker.js`
Read a user-selected local image, display it, and sample pixels from the source image. Account for scaling, letterboxing, device pixel ratio, and pointer coordinates. Keep image data local to the browser and do not upload it.

### `js/clipboard.js`
Copies text with the async Clipboard API, falling back to a temporary textarea where that API is unavailable or denied. Never throws.

### `js/palette.js`
MVP-safe palette state and UI helpers if needed. For the first release, avoid overengineering; session-only recent colors are sufficient. Export functionality belongs to P1 unless the MVP task specifically includes it.

As built: recent colors are kept in memory for the visit; the palette (name + HEX per color, up to 48) is saved in `localStorage` and exports to CSS custom properties or JSON.

## 4a. Decisions made during the build
- **Plain scripts instead of ES modules:** browsers refuse to load JavaScript modules from `file://` pages, so with modules the app did nothing when `index.html` was double-clicked. Each file is now an IIFE that reads from and adds to `window.PickColor` (e.g. `PickColor.colorUtils`), loaded with `<script defer>` in dependency order. It works identically from disk and on GitHub Pages, still needs no build step, and the pure helpers remain testable in the browser and in Node (via `vm`).
- **Alpha:** not supported. Inputs with alpha are rejected. Sampled pixels report RGB only; partly or fully transparent pixels are flagged in the status message.
- **Rounding:** HEX is uppercase six-digit. HSL is rounded to whole degrees/percents, so RGB stays the source of truth.
- **Pixel sampling:** the image is drawn at natural size on a canvas shown with `object-fit: contain`; pointer positions are mapped back using the canvas's CSS box, which handles scaling, letterboxing and device pixel ratio. Mouse positions arrive as whole CSS pixels, so on upscaled images the arrow keys give single-pixel precision.
- **Images over 50 megapixels** are refused with a message, because very large canvases fail in some browsers.
- **URL hash:** the current HEX is mirrored in the address bar (`#3A6FF7`) so a link reopens the same color.
- **Visual design:** the interface is strictly black and white, so the selected color is the only chroma on screen and the surroundings don't skew how it looks.

## 5. Data flow
1. A user selects a color, samples an image, or uses EyeDropper where supported.
2. The selected color is normalized to one internal representation, preferably RGB integer channels plus optional alpha if alpha is intentionally supported.
3. Color utilities derive HEX, RGB, and HSL strings.
4. The UI updates the preview, value fields, and status message.
5. Copy actions send the chosen formatted value to the clipboard.
6. Optional recent-color/palette features store only the data required for that feature, locally.

## 6. Theme behavior
- Black and white only: pure white background with black text, switching to pure black with white text when `prefers-color-scheme: dark`. Greys appear only for hairlines and secondary text.
- There is no manual theme switch (removed at the owner's request, replacing P0 item 7 of the brief), so nothing about the theme is stored.
- All colors are CSS variables on `:root`, redefined in one `prefers-color-scheme: dark` block.
- Without a red, errors are marked by a ⚠ prefix, heavier text and a dashed field border rather than by color.

## 7. Browser and security constraints
- GitHub Pages is static hosting; do not rely on server-side code.
- Browser APIs may require HTTPS and direct user activation.
- EyeDropper support varies; always feature-detect.
- Clipboard operations may be restricted by browser context or permissions.
- Local image handling should use object URLs or in-memory decoding and clean up object URLs when replaced.
- Do not inject user-controlled strings with `innerHTML`; use safe DOM APIs/text content.
- Do not add analytics, remote fonts, trackers, or external API calls without approval.
- Never commit credentials, tokens, `.env` files, or generated local artifacts.

## 8. Local development
Use any simple static server to serve the repository root. Do not run Python application modules; this is a static web app. Relative asset paths must work both at the repository root and when deployed under a GitHub Pages project path such as `/PickColor/`.

## 9. Testing strategy
- Unit-check pure color conversion functions with known values (black, white, primaries, and edge cases).
- Manually verify image sampling at corners and center for an image displayed at different sizes.
- Test clipboard success and failure states.
- Test that the theme follows the system light/dark setting in black and white.
- Test EyeDropper supported and unsupported paths, including cancellation.
- Check browser console and network panel for unexpected errors or outbound requests.
- Test responsive layout and keyboard navigation.

## 10. GitHub Pages paths
Use relative links for local assets (`./css/styles.css`, `./js/app.js`) and avoid root-absolute paths (`/css/styles.css`) because project Pages sites are commonly served under a repository subpath. The README live URL should only be added after deployment has been verified.
