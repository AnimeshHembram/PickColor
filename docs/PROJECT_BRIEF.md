# PickColor — Project Brief

## 1. Product summary
PickColor is a lightweight, browser-based color utility. A user should be able to open the GitHub repository, click the **Open PickColor** link, and use the app in a separate browser tab without installing software or creating an account.

**Live hosting target:** GitHub Pages  
**Initial UI direction:** Adaptive light and dark themes  
**Initial implementation:** Static HTML, CSS, and vanilla JavaScript  
**Backend:** None for the MVP  
**Primary audience:** Designers, developers, students, and anyone who needs to inspect or reuse colors.

## 2. Product principles
- Fast to open and easy to understand.
- Responsive on desktop and mobile-sized screens.
- Accessible keyboard interactions, visible focus states, and readable contrast.
- Local-first: no account, analytics, external API, or server-side storage required for the MVP.
- Be transparent about browser permissions and unsupported capabilities.
- Keep the code small, modular, and easy for contributors to understand.
- Do not claim screen-wide sampling works in every browser.

## 3. MVP features
### P0 — Required first release
1. Color workspace with a clear preview swatch.
2. Display the selected color in HEX, RGB, and HSL.
3. Visual color selection using a native browser color input or a custom picker if justified.
4. Copy HEX, RGB, and HSL values to the clipboard, with success/error feedback.
5. Load a local image using a file input and sample a pixel by clicking/tapping the displayed image.
6. Responsive layout and adaptive light/dark theme, following the system preference by default.
7. Manual theme toggle; persist the user's choice locally when practical.
8. Accessible labels, keyboard focus, and useful empty/error states.
9. README with a clear **Open PickColor** link once GitHub Pages is enabled.
10. Basic tests for color conversion and image sampling logic where practical.

### P1 — After the MVP is stable
1. Recent colors in the current session.
2. Palette creation, rename/remove colors, and export to JSON or CSS variables.
3. Browser EyeDropper API integration when available, triggered only by a user action.
4. Helpful unsupported-browser messaging and graceful fallback.
5. Keyboard shortcuts only where discoverable and non-conflicting.

### Explicitly out of scope for the MVP
- Python/PySide desktop app or browser extension.
- Backend, account system, cloud sync, or server database.
- Uploading user images to a server.
- Promising unrestricted access to pixels in other desktop applications.
- Frameworks, bundlers, or dependencies unless a concrete need is documented.

## 4. Screen-wide sampling expectations
The browser EyeDropper API is an optional progressive enhancement. Feature-detect it before showing/enabling the action. Invoke it only after a direct user gesture. Handle cancellation and errors without crashing. If unsupported, explain the limitation and direct users to image sampling or manual color selection. Never describe this as universally supported.

## 5. UX direction
- Calm, modern, compact utility interface.
- Clear visual hierarchy; the selected color is the focal point.
- Adaptive light/dark themes using CSS custom properties.
- Respect `prefers-color-scheme` initially; allow a manual override.
- Keep motion subtle and honor `prefers-reduced-motion`.
- Avoid decorative complexity that slows down the main task.

## 6. Quality and acceptance criteria
The MVP is acceptable when:
- Opening `index.html` through a local static server renders without console errors.
- The layout works at common mobile and desktop widths.
- HEX/RGB/HSL output agrees with known test cases.
- Copy actions report success or failure.
- A user can load a local image and sample pixels accurately from the rendered image, including when it is scaled to fit.
- Theme switching works and is keyboard accessible.
- Unsupported EyeDropper API cases are handled gracefully.
- No user image is sent over the network.
- The GitHub Pages deployment works from the repository's configured source.
- README instructions and live link are accurate.

## 7. Definition of done for each change
- Change is limited to a clearly described task.
- Code is readable and separated by responsibility.
- Relevant manual checks and automated tests pass.
- No secrets, generated files, or local environment folders are committed.
- Commit message explains the change.
- README/docs are updated when behavior or setup changes.
