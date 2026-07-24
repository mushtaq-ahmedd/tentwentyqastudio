/**
 * Deterministic image annotation — draws a highlight box around a Finding's `Location.
 * boundingBox` on top of its page screenshot. Not an AI-generated image (docs/03's Evidence
 * Schema rule): the same bounding box input always produces the exact same highlighted output,
 * pixel for pixel. This is what makes a "Highlighted Screenshot" evidence item mandatory and
 * trustworthy — the box is drawn from the same coordinates the detecting Engine already
 * captured, never estimated or redrawn from a description.
 */
import { PNG } from "pngjs";
import type { BoundingBox } from "./types";

const HIGHLIGHT_COLOR: readonly [number, number, number] = [255, 42, 42];
const LINE_THICKNESS = 4;
/** Drawn slightly outside the element's real edges so the box doesn't sit flush against it —
 * easier to see against a busy background. */
const PADDING = 6;

/** Draws a rectangular outline (not filled) around `box` on `screenshotPng`, clamped to the
 * image's own bounds. Returns a new PNG buffer — the input buffer is never mutated. */
export function drawHighlightBox(screenshotPng: Buffer, box: BoundingBox): Buffer {
  const png = PNG.sync.read(screenshotPng);

  const x0 = Math.max(0, Math.round(box.x) - PADDING);
  const y0 = Math.max(0, Math.round(box.y) - PADDING);
  const x1 = Math.min(png.width - 1, Math.round(box.x + box.width) + PADDING);
  const y1 = Math.min(png.height - 1, Math.round(box.y + box.height) + PADDING);

  function setPixel(x: number, y: number): void {
    if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
    const idx = (png.width * y + x) << 2;
    png.data[idx] = HIGHLIGHT_COLOR[0];
    png.data[idx + 1] = HIGHLIGHT_COLOR[1];
    png.data[idx + 2] = HIGHLIGHT_COLOR[2];
    png.data[idx + 3] = 255;
  }

  for (let t = 0; t < LINE_THICKNESS; t++) {
    for (let x = x0; x <= x1; x++) {
      setPixel(x, y0 + t);
      setPixel(x, y1 - t);
    }
    for (let y = y0; y <= y1; y++) {
      setPixel(x0 + t, y);
      setPixel(x1 - t, y);
    }
  }

  return PNG.sync.write(png);
}
