// Load order for the Node runner (paths relative to tests/).
// Keep in step with the <script> tags in tests/index.html.
export const SCRIPTS = [
  "../js/color-utils.js",
  "../js/image-picker.js",
  "../js/palette.js",
  "../js/eyedropper.js",
  "./harness.js",
  "./color-utils.test.js",
  "./image-picker.test.js",
  "./palette.test.js",
  "./eyedropper.test.js",
];
