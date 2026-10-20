# PickColor — Roadmap

## Phase 0 — Foundation and repository hygiene
- [x] Confirm this is a static web app; retire the unused Python desktop prototype from the deployment path. (Never committed; delete `src/`, `tests/test_app.py` and `.venv/` locally.)
- [x] Create the agreed folder structure.
- [x] Review `.gitignore`; ensure `.venv/`, caches, secrets, and generated artifacts are excluded.
- [x] Keep README focused on what PickColor does, how to run it, and where to open the live app.
- [x] Add this brief, architecture, and roadmap.
- [ ] Confirm GitHub repository visibility and Pages settings.

**Exit criteria:** clean repository structure, documented scope, no accidental environment files staged.

## Phase 1 — UI shell and adaptive themes
- [x] Create semantic `index.html`.
- [x] Implement responsive workspace and accessible controls.
- [x] Define CSS design tokens for light and dark themes.
- [x] Respect system preference by default.
- [x] Add manual theme toggle and safe persistence.
- [x] Verify keyboard focus and reduced-motion behavior.

**Exit criteria:** the static site opens locally, renders at mobile/desktop widths, and theme switching works.

## Phase 2 — Core color workspace
- [x] Implement a color preview and visual color input.
- [x] Implement pure HEX/RGB/HSL conversion functions.
- [x] Add copy buttons with status feedback and error handling.
- [x] Add unit tests for conversions and edge cases.

**Exit criteria:** values remain synchronized and tests pass.

## Phase 3 — Local image sampling
- [x] Add image file selection with file type and decode error handling.
- [x] Render the image responsively without uploading it.
- [x] Sample the correct source pixel after scaling and letterboxing.
- [x] Update preview and all color formats from the sampled pixel.
- [x] Test center/corner samples and different aspect ratios.

**Exit criteria:** pixel selection matches source colors for tested images and sizes.

## Phase 4 — Browser eyedropper
- [x] Feature-detect `window.EyeDropper`.
- [x] Add a user-triggered eyedropper action only when supported.
- [x] Handle cancel, rejection, and unsupported cases gracefully.
- [x] Keep image sampling as the fallback.
- [x] Document the browser support limitation.

**Exit criteria:** no crash on unsupported browsers; successful selection works in supported browsers.

## Phase 5 — Palette workflow
- [x] Add session recent-color history.
- [x] Allow adding/removing palette swatches.
- [x] Export palette as JSON and CSS custom properties.
- [x] Add copy/export feedback and empty states.

**Exit criteria:** users can build and export a useful palette without an account.

## Phase 6 — QA and accessibility
- [x] Check semantic landmarks and accessible names.
- [x] Verify keyboard-only use and visible focus.
- [x] Review color contrast in both themes.
- [x] Check narrow viewport behavior.
- [x] Test errors, empty states, clipboard restrictions, and unsupported APIs.
- [ ] Remove console warnings and unused files. (Console is clean; the old Python files still need deleting locally.)

**Exit criteria:** documented test checklist passes.

## Phase 7 — GitHub Pages deployment
- [ ] Configure GitHub Pages for the intended branch/folder.
- [ ] Verify all asset paths under the project subpath.
- [ ] Open the deployed site in a new browser tab.
- [ ] Test the deployed app, not just the local copy.
- [ ] Add the verified live URL and Open PickColor link to README.
- [ ] Confirm the repository link works in a signed-out/private browsing session if public access is intended.

**Exit criteria:** public repository visitors can click the README link and use the deployed app.

Status: Phases 0–6 are implemented and pass the automated tests and the browser checks in `docs/TESTING.md` (run in headless Chromium). Before deploying, run the manual checklist in Firefox or Safari and in a real Chrome/Edge for the screen eyedropper. Phase 7 needs the GitHub repository and Pages settings.

## Working rhythm
For each phase, ask Claude Desktop to implement one bounded task at a time. After each task:
1. Inspect the diff.
2. Run the relevant checks.
3. Manually test the behavior.
4. Fix regressions before adding the next feature.
5. Commit with a specific message and push.

Avoid one giant prompt that attempts the whole product in a single pass.
