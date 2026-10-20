// Plain script (not a module) so the app also works when index.html is opened
// straight from disk. Everything is shared through one global: window.PickColor.
(function () {
  "use strict";
  const PickColor = (globalThis.PickColor = globalThis.PickColor || {});

  /**
   * Local image sampling.
   *
   * The chosen file is decoded in the browser and drawn at its natural size onto
   * a <canvas>, and pixels are read straight from that canvas. The file is never
   * uploaded: object URLs are created only to decode it and revoked right after.
   *
   * The canvas is shown scaled to fit (CSS object-fit: contain), so pointer
   * positions are mapped back to source pixels with mapPointToPixel(), which
   * accounts for scaling and letterboxing. Using CSS pixels from
   * getBoundingClientRect() keeps the mapping correct at any device pixel ratio.
   */

  /** Largest image area we try to decode (pixels). Bigger canvases fail in some browsers. */
  const MAX_IMAGE_PIXELS = 50_000_000;

  const LOUPE_RADIUS = 7; // shows a 15 × 15 pixel neighbourhood

  /**
   * Maps a point inside the displayed element (CSS pixels, relative to its
   * top-left corner) to a source pixel, for an image drawn with object-fit: contain.
   * Returns { x, y } integer pixel coordinates, or null when the point falls
   * outside the drawn image (in the letterbox bars or outside the element).
   */
  function mapPointToPixel({ x, y, width, height, naturalWidth, naturalHeight }) {
    if (!(width > 0 && height > 0 && naturalWidth > 0 && naturalHeight > 0)) return null;
    const scale = Math.min(width / naturalWidth, height / naturalHeight);
    const drawnWidth = naturalWidth * scale;
    const drawnHeight = naturalHeight * scale;
    const offsetX = (width - drawnWidth) / 2;
    const offsetY = (height - drawnHeight) / 2;

    const localX = x - offsetX;
    const localY = y - offsetY;
    if (localX < 0 || localY < 0 || localX > drawnWidth || localY > drawnHeight) return null;

    // A point exactly on the right/bottom edge belongs to the last pixel.
    return {
      x: Math.min(naturalWidth - 1, Math.floor(localX / scale)),
      y: Math.min(naturalHeight - 1, Math.floor(localY / scale)),
    };
  }

  /**
   * Inverse of mapPointToPixel: the centre of a source pixel in element CSS
   * pixels, plus the on-screen size of one source pixel.
   */
  function pixelToPoint({ px, py, width, height, naturalWidth, naturalHeight }) {
    const scale = Math.min(width / naturalWidth, height / naturalHeight);
    const offsetX = (width - naturalWidth * scale) / 2;
    const offsetY = (height - naturalHeight * scale) / 2;
    return {
      x: offsetX + (px + 0.5) * scale,
      y: offsetY + (py + 0.5) * scale,
      size: scale,
    };
  }

  function isImageFile(file) {
    return Boolean(file) && typeof file.type === "string" && file.type.startsWith("image/");
  }

  /**
   * Creates the sampler for a canvas.
   * options:
   *   canvas   – the display canvas (no border or padding)
   *   reticle  – optional element positioned over the current pixel
   *   loupe    – optional small canvas that shows a zoomed neighbourhood
   *   onHover(sample | null) – sample = { rgb, alpha, x, y }
   *   onPick(sample)
   */
  function createImageSampler({ canvas, reticle, loupe, onHover, onPick }) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const loupeCtx = loupe?.getContext("2d") ?? null;
    let loaded = false;
    let cursor = { x: 0, y: 0 };

    const box = () => {
      const rect = canvas.getBoundingClientRect();
      return {
        rect,
        width: rect.width,
        height: rect.height,
        naturalWidth: canvas.width,
        naturalHeight: canvas.height,
      };
    };

    function readPixel(x, y) {
      const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data;
      return { rgb: { r, g, b }, alpha: a, x, y };
    }

    function pixelFromEvent(event) {
      if (!loaded) return null;
      const { rect, ...size } = box();
      return mapPointToPixel({ x: event.clientX - rect.left, y: event.clientY - rect.top, ...size });
    }

    function showReticle(px, py) {
      if (!reticle) return;
      const size = box();
      const point = pixelToPoint({ px, py, ...size });
      const side = Math.max(12, point.size);
      reticle.style.width = `${side}px`;
      reticle.style.height = `${side}px`;
      reticle.style.left = `${canvas.offsetLeft + point.x - side / 2}px`;
      reticle.style.top = `${canvas.offsetTop + point.y - side / 2}px`;
      reticle.hidden = false;
    }

    function drawLoupe(px, py) {
      if (!loupeCtx) return;
      const span = LOUPE_RADIUS * 2 + 1;
      const cell = loupe.width / span;
      loupeCtx.imageSmoothingEnabled = false;
      loupeCtx.clearRect(0, 0, loupe.width, loupe.height);
      loupeCtx.drawImage(
        canvas,
        px - LOUPE_RADIUS,
        py - LOUPE_RADIUS,
        span,
        span,
        0,
        0,
        loupe.width,
        loupe.height,
      );
      const centre = LOUPE_RADIUS * cell;
      loupeCtx.lineWidth = 2;
      loupeCtx.strokeStyle = "#000";
      loupeCtx.strokeRect(centre, centre, cell, cell);
      loupeCtx.lineWidth = 1;
      loupeCtx.strokeStyle = "#fff";
      loupeCtx.strokeRect(centre + 1.5, centre + 1.5, cell - 3, cell - 3);
    }

    function hoverAt(pixel) {
      if (!pixel) {
        if (reticle) reticle.hidden = true;
        onHover?.(null);
        return;
      }
      cursor = pixel;
      showReticle(pixel.x, pixel.y);
      drawLoupe(pixel.x, pixel.y);
      onHover?.(readPixel(pixel.x, pixel.y));
    }

    function pickAt(pixel) {
      if (!pixel) return;
      cursor = pixel;
      showReticle(pixel.x, pixel.y);
      drawLoupe(pixel.x, pixel.y);
      onPick?.(readPixel(pixel.x, pixel.y));
    }

    canvas.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return; // touch has no hover; tap picks
      hoverAt(pixelFromEvent(event));
    });

    canvas.addEventListener("pointerleave", () => {
      if (document.activeElement !== canvas) hoverAt(null);
    });

    canvas.addEventListener("click", (event) => pickAt(pixelFromEvent(event)));

    canvas.addEventListener("focus", () => {
      if (loaded) hoverAt(cursor);
    });

    canvas.addEventListener("blur", () => hoverAt(null));

    canvas.addEventListener("keydown", (event) => {
      if (!loaded) return;
      const step = event.shiftKey ? 10 : 1;
      const moves = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      if (event.key in moves) {
        event.preventDefault();
        const [dx, dy] = moves[event.key];
        hoverAt({
          x: Math.min(canvas.width - 1, Math.max(0, cursor.x + dx)),
          y: Math.min(canvas.height - 1, Math.max(0, cursor.y + dy)),
        });
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        pickAt(cursor);
      }
    });

    // Upscaled small images look crisp (and honest) with pixelated rendering.
    const updateRendering = () => {
      if (!loaded) return;
      const { width, naturalWidth } = box();
      canvas.classList.toggle("is-pixelated", width / naturalWidth > 1.5);
      if (reticle && !reticle.hidden) showReticle(cursor.x, cursor.y);
    };
    if ("ResizeObserver" in window) new ResizeObserver(updateRendering).observe(canvas);

    /**
     * Decodes and shows a file. Resolves { ok: true, width, height } or
     * { ok: false, message } with a message suitable for the status area.
     */
    async function loadFile(file) {
      if (!isImageFile(file)) {
        return { ok: false, message: "That file isn't an image. Choose a PNG, JPEG, WebP, GIF or SVG file." };
      }

      const url = URL.createObjectURL(file);
      const image = new Image();
      image.decoding = "async";
      try {
        image.src = url;
        await image.decode();
      } catch {
        URL.revokeObjectURL(url);
        return { ok: false, message: `PickColor couldn't open “${file.name}”. The file may be damaged or in a format this browser can't show.` };
      }
      URL.revokeObjectURL(url);

      const width = image.naturalWidth;
      const height = image.naturalHeight;
      if (!width || !height) {
        return { ok: false, message: "This image has no fixed size (common for some SVG files). Try a PNG or JPEG instead." };
      }
      if (width * height > MAX_IMAGE_PIXELS) {
        return { ok: false, message: `This image is ${width} × ${height} pixels, which is too large to sample here. Try a smaller copy.` };
      }

      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0);

      try {
        ctx.getImageData(0, 0, 1, 1);
      } catch {
        clear();
        return { ok: false, message: "The browser won't let PickColor read this image's pixels." };
      }

      loaded = true;
      cursor = { x: Math.floor(width / 2), y: Math.floor(height / 2) };
      if (reticle) reticle.hidden = true;
      updateRendering();
      return { ok: true, width, height };
    }

    function clear() {
      loaded = false;
      canvas.width = 0;
      canvas.height = 0;
      canvas.classList.remove("is-pixelated");
      if (reticle) reticle.hidden = true;
      loupeCtx?.clearRect(0, 0, loupe.width, loupe.height);
      onHover?.(null);
    }

    return { loadFile, clear, hasImage: () => loaded };
  }

  PickColor.imagePicker = {
    MAX_IMAGE_PIXELS,
    mapPointToPixel,
    pixelToPoint,
    isImageFile,
    createImageSampler,
  };
})();
