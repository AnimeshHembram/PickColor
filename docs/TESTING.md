# PickColor — Testing checklist

## Automated

| What | How |
| --- | --- |
| Color conversion, parsing, contrast | `tests/color-utils.test.js` |
| Pointer-to-pixel mapping (scaling, letterboxing, edges) | `tests/image-picker.test.js` |
| Recent colors, palette storage, CSS/JSON export | `tests/palette.test.js` |
| EyeDropper success, cancel, error, unsupported | `tests/eyedropper.test.js` (mocked API) |

Run them by opening `/tests/` on a local static server, or with `node tests/run.mjs` (Node 22+).

## Manual

Serve the folder locally (see README) and check each item in at least one Chromium browser and one of Firefox or Safari.

### Page
- [ ] The page loads with no errors in the browser console.
- [ ] The network panel shows no requests outside the site itself.
- [ ] The layout works at 320 px, 390 px, 768 px and 1280 px wide, with no sideways scrolling.

### Selecting and copying
- [ ] The system color picker updates the swatch and all three values while dragging.
- [ ] Typing `#0a0`, `rgb(255 200 0)` and `hsl(210, 50%, 40%)` then pressing Enter applies each one.
- [ ] Typing `banana` shows an error under the field, and the error clears when you edit the text.
- [ ] Each Copy button copies the right value and shows "Copied".
- [ ] Over plain `http://` on a non-localhost address, copy either works through the fallback or shows the error message.

### Image sampling (use `tests/fixtures/`)
Each fixture has four colored quadrants, a different dark grey in each corner pixel (#101010 top left, #202020 top right, #303030 bottom left, #404040 bottom right) and one white pixel at the exact centre.
- [ ] `quadrants-wide.png`: corners and centre pick the expected colors (use the arrow keys for single-pixel precision).
- [ ] `quadrants-tall.png`: the image is letterboxed; clicking the grey bars beside it does nothing.
- [ ] `quadrants-tiny.png` (8 × 8): the image shows as crisp blocks and every block picks its own color.
- [ ] Resize the window and check that picks are still accurate.
- [ ] Choosing a text file shows "That file isn't an image".
- [ ] Dragging an image onto the drop area and pasting one with Ctrl+V / ⌘V both work.
- [ ] Remove image returns to the empty state.

### Screen eyedropper
- [ ] In Chrome or Edge on desktop: Pick from screen opens the eyedropper; picking updates the color, and Esc reports "cancelled".
- [ ] In Firefox or Safari: the button is hidden and the explanation is shown.

### Palette
- [ ] Add current color adds it once; adding it again says it's already there.
- [ ] Renaming a color and reloading keeps the name.
- [ ] Copy as CSS variables, Download CSS and Download JSON contain the palette.
- [ ] Clear palette asks for a second click.

### Theme and accessibility
- [ ] With no choice saved, the theme follows the operating system setting.
- [ ] Choosing Light or Dark persists after a reload; System goes back to following the OS.
- [ ] Everything can be reached and used with the keyboard, and the focus outline is always visible.
- [ ] With "reduce motion" turned on in the OS, transitions are effectively instant.
- [ ] A screen reader announces copy, pick and error messages.

### After deployment
- [ ] The GitHub Pages URL loads with all styles, scripts and the icon (no 404s under `/PickColor/`).
- [ ] The README link opens the live app in a private window.
