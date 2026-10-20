// Plain script (not a module) so the app also works when index.html is opened
// straight from disk. Everything is shared through one global: window.PickColor.
(function () {
  "use strict";
  const PickColor = (globalThis.PickColor = globalThis.PickColor || {});

  const { test, deepEqual, equal, assert } = PickColor.testHarness;
  const { isImageFile, mapPointToPixel, pixelToPoint } = PickColor.imagePicker;

  test("mapPointToPixel: 1:1 scale maps directly", () => {
    const box = { width: 100, height: 50, naturalWidth: 100, naturalHeight: 50 };
    deepEqual(mapPointToPixel({ ...box, x: 0, y: 0 }), { x: 0, y: 0 });
    deepEqual(mapPointToPixel({ ...box, x: 10.5, y: 20.9 }), { x: 10, y: 20 });
    deepEqual(mapPointToPixel({ ...box, x: 100, y: 50 }), { x: 99, y: 49 });
  });

  test("mapPointToPixel: scaled down by half", () => {
    const box = { width: 200, height: 100, naturalWidth: 400, naturalHeight: 200 };
    deepEqual(mapPointToPixel({ ...box, x: 100, y: 50 }), { x: 200, y: 100 });
    deepEqual(mapPointToPixel({ ...box, x: 199.99, y: 99.99 }), { x: 399, y: 199 });
  });

  test("mapPointToPixel: scaled up 10× (small image)", () => {
    const box = { width: 40, height: 40, naturalWidth: 4, naturalHeight: 4 };
    deepEqual(mapPointToPixel({ ...box, x: 9.9, y: 0 }), { x: 0, y: 0 });
    deepEqual(mapPointToPixel({ ...box, x: 10, y: 39 }), { x: 1, y: 3 });
  });

  test("mapPointToPixel: letterboxed left and right (tall image in wide box)", () => {
    // 100×200 image in a 300×200 box: drawn 100 wide, 100 px bars on each side
    const box = { width: 300, height: 200, naturalWidth: 100, naturalHeight: 200 };
    equal(mapPointToPixel({ ...box, x: 50, y: 100 }), null, "left bar");
    equal(mapPointToPixel({ ...box, x: 250, y: 100 }), null, "right bar");
    deepEqual(mapPointToPixel({ ...box, x: 100, y: 0 }), { x: 0, y: 0 });
    deepEqual(mapPointToPixel({ ...box, x: 150, y: 100 }), { x: 50, y: 100 });
    deepEqual(mapPointToPixel({ ...box, x: 200, y: 200 }), { x: 99, y: 199 });
  });

  test("mapPointToPixel: letterboxed top and bottom (wide image in tall box)", () => {
    // 400×100 image in a 200×200 box: scale 0.5, drawn 200×50, bars of 75 px
    const box = { width: 200, height: 200, naturalWidth: 400, naturalHeight: 100 };
    equal(mapPointToPixel({ ...box, x: 100, y: 74 }), null);
    equal(mapPointToPixel({ ...box, x: 100, y: 126 }), null);
    deepEqual(mapPointToPixel({ ...box, x: 0, y: 75 }), { x: 0, y: 0 });
    deepEqual(mapPointToPixel({ ...box, x: 100, y: 100 }), { x: 200, y: 50 });
  });

  test("mapPointToPixel: outside the element and empty sizes", () => {
    const box = { width: 100, height: 100, naturalWidth: 10, naturalHeight: 10 };
    equal(mapPointToPixel({ ...box, x: -1, y: 5 }), null);
    equal(mapPointToPixel({ ...box, x: 5, y: 101 }), null);
    equal(mapPointToPixel({ x: 0, y: 0, width: 0, height: 0, naturalWidth: 10, naturalHeight: 10 }), null);
    equal(mapPointToPixel({ x: 0, y: 0, width: 10, height: 10, naturalWidth: 0, naturalHeight: 0 }), null);
  });

  test("pixelToPoint is the inverse of mapPointToPixel at pixel centres", () => {
    const box = { width: 333, height: 211, naturalWidth: 97, naturalHeight: 61 };
    for (const [px, py] of [[0, 0], [96, 60], [48, 30], [13, 57]]) {
      const point = pixelToPoint({ ...box, px, py });
      deepEqual(mapPointToPixel({ ...box, x: point.x, y: point.y }), { x: px, y: py });
    }
  });

  test("isImageFile checks the MIME type", () => {
    assert(isImageFile({ type: "image/png" }));
    assert(isImageFile({ type: "image/svg+xml" }));
    assert(!isImageFile({ type: "text/plain" }));
    assert(!isImageFile({ type: "" }));
    assert(!isImageFile(null));
  });
})();
