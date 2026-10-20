# PickColor — Architecture

## 1. Deployment model
PickColor is a static client-side website hosted on GitHub Pages. GitHub serves the files; application features execute in the user's browser. There is no backend in the MVP.

## 2. Technology choices
- HTML5 for semantic structure.
- CSS for layout, responsive behavior, themes, and component states.
- Vanilla JavaScript using ES modules for application behavior.
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
│   └── palette.js
└── docs/
    ├── PROJECT_BRIEF.md
    ├── ARCHITECTURE.md
    └── ROADMAP.md
```

## 4. Module responsibilities
### `index.html`
Semantic app shell, landmarks, controls, and module entry point. Avoid inline application logic.

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

### `js/palette.js`
MVP-safe palette state and UI helpers if needed. For the first release, avoid overengineering; session-only recent colors are sufficient. Export functionality belongs to P1 unless the MVP task specifically includes it.

## 5. Data flow
1. A user selects a color, samples an image, or uses EyeDropper where supported.
2. The selected color is normalized to one internal representation, preferably RGB integer channels plus optional alpha if alpha is intentionally supported.
3. Color utilities derive HEX, RGB, and HSL strings.
4. The UI updates the preview, value fields, and status message.
5. Copy actions send the chosen formatted value to the clipboard.
6. Optional recent-color/palette features store only the data required for that feature, locally.

## 6. Theme behavior
- Default to the operating system preference using `prefers-color-scheme`.
- Provide an accessible manual toggle.
- Store an explicit user choice in local storage only if storage is available.
- If no explicit choice exists, continue following the system preference.
- Use CSS variables rather than duplicating whole stylesheets.

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
- Test theme default, manual toggle, and persisted override.
- Test EyeDropper supported and unsupported paths, including cancellation.
- Check browser console and network panel for unexpected errors or outbound requests.
- Test responsive layout and keyboard navigation.

## 10. GitHub Pages paths
Use relative links for local assets (`./css/styles.css`, `./js/app.js`) and avoid root-absolute paths (`/css/styles.css`) because project Pages sites are commonly served under a repository subpath. The README live URL should only be added after deployment has been verified.
