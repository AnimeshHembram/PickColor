// Plain script (not a module) so the app also works when index.html is opened
// straight from disk. Everything is shared through one global: window.PickColor.
(function () {
  "use strict";
  const PickColor = (globalThis.PickColor = globalThis.PickColor || {});

  const { test, deepEqual, equal, assert } = PickColor.testHarness;
  const { isEyeDropperSupported, pickFromScreen } = PickColor.eyedropper;

  const fakeWindow = (open) => ({
    EyeDropper: class {
      open() {
        return open();
      }
    },
  });

  const domError = (name) => Object.assign(new Error(name), { name });

  test("isEyeDropperSupported", () => {
    assert(isEyeDropperSupported(fakeWindow(() => Promise.resolve())));
    assert(!isEyeDropperSupported({}));
  });

  test("pickFromScreen: unsupported", async () => {
    deepEqual(await pickFromScreen({}), { status: "unsupported" });
  });

  test("pickFromScreen: picked", async () => {
    const result = await pickFromScreen(fakeWindow(() => Promise.resolve({ sRGBHex: "#3a6ff7" })));
    deepEqual(result, { status: "picked", rgb: { r: 58, g: 111, b: 247 } });
  });

  test("pickFromScreen: user cancels (AbortError)", async () => {
    const result = await pickFromScreen(fakeWindow(() => Promise.reject(domError("AbortError"))));
    deepEqual(result, { status: "cancelled" });
  });

  test("pickFromScreen: blocked or unexpected errors never throw", async () => {
    const blocked = await pickFromScreen(fakeWindow(() => Promise.reject(domError("NotAllowedError"))));
    equal(blocked.status, "error");
    const odd = await pickFromScreen(fakeWindow(() => Promise.reject(new Error("boom"))));
    equal(odd.status, "error");
    const unreadable = await pickFromScreen(fakeWindow(() => Promise.resolve({ sRGBHex: "rgb(1,2,3)" })));
    equal(unreadable.status, "error");
  });
})();
