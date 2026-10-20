# PickColor — Roadmap

## Phase 0 — Foundation and repository hygiene
- [ ] Confirm this is a static web app; retire the unused Python desktop prototype from the deployment path.
- [ ] Create the agreed folder structure.
- [ ] Review `.gitignore`; ensure `.venv/`, caches, secrets, and generated artifacts are excluded.
- [ ] Keep README focused on what PickColor does, how to run it, and where to open the live app.
- [ ] Add this brief, architecture, and roadmap.
- [ ] Confirm GitHub repository visibility and Pages settings.

**Exit criteria:** clean repository structure, documented scope, no accidental environment files staged.

## Phase 1 — UI shell and adaptive themes
- [ ] Create semantic `index.html`.
- [ ] Implement responsive workspace and accessible controls.
- [ ] Define CSS design tokens for light and dark themes.
- [ ] Respect system preference by default.
- [ ] Add manual theme toggle and safe persistence.
- [ ] Verify keyboard focus and reduced-motion behavior.

**Exit criteria:** the static site opens locally, renders at mobile/desktop widths, and theme switching works.

## Phase 2 — Core color workspace
- [ ] Implement a color preview and visual color input.
- [ ] Implement pure HEX/RGB/HSL conversion functions.
- [ ] Add copy buttons with status feedback and error handling.
- [ ] Add unit tests for conversions and edge cases.

**Exit criteria:** values remain synchronized and tests pass.

## Phase 3 — Local image sampling
- [ ] Add image file selection with file type and decode error handling.
- [ ] Render the image responsively without uploading it.
- [ ] Sample the correct source pixel after scaling and letterboxing.
- [ ] Update preview and all color formats from the sampled pixel.
- [ ] Test center/corner samples and different aspect ratios.

**Exit criteria:** pixel selection matches source colors for tested images and sizes.

## Phase 4 — Browser eyedropper
- [ ] Feature-detect `window.EyeDropper`.
- [ ] Add a user-triggered eyedropper action only when supported.
- [ ] Handle cancel, rejection, and unsupported cases gracefully.
- [ ] Keep image sampling as the fallback.
- [ ] Document the browser support limitation.

**Exit criteria:** no crash on unsupported browsers; successful selection works in supported browsers.

## Phase 5 — Palette workflow
- [ ] Add session recent-color history.
- [ ] Allow adding/removing palette swatches.
- [ ] Export palette as JSON and CSS custom properties.
- [ ] Add copy/export feedback and empty states.

**Exit criteria:** users can build and export a useful palette without an account.

## Phase 6 — QA and accessibility
- [ ] Check semantic landmarks and accessible names.
- [ ] Verify keyboard-only use and visible focus.
- [ ] Review color contrast in both themes.
- [ ] Check narrow viewport behavior.
- [ ] Test errors, empty states, clipboard restrictions, and unsupported APIs.
- [ ] Remove console warnings and unused files.

**Exit criteria:** documented test checklist passes.

## Phase 7 — GitHub Pages deployment
- [ ] Configure GitHub Pages for the intended branch/folder.
- [ ] Verify all asset paths under the project subpath.
- [ ] Open the deployed site in a new browser tab.
- [ ] Test the deployed app, not just the local copy.
- [ ] Add the verified live URL and Open PickColor link to README.
- [ ] Confirm the repository link works in a signed-out/private browsing session if public access is intended.

**Exit criteria:** public repository visitors can click the README link and use the deployed app.

## Working rhythm
For each phase, ask Claude Desktop to implement one bounded task at a time. After each task:
1. Inspect the diff.
2. Run the relevant checks.
3. Manually test the behavior.
4. Fix regressions before adding the next feature.
5. Commit with a specific message and push.

Avoid one giant prompt that attempts the whole product in a single pass.
