// Finds a raster's visible ink: the measurement behind alignment, hit areas and
// the toggle glyph.

/** Alpha levels (0–255) at which a raster pixel counts as ink. */
export const ALPHA = {
  /** Any coverage: the glyph's full antialiased extent. */
  ANY: 1,
  /** At least half covered: inside the outline, to find the strokes of the o. */
  STROKE: 128,
  /** Fully covered (254 absorbs rounding): the solid stroke, not its fringe. */
  SOLID: 254,
};

/**
 * The bounding box of pixels at or above `threshold` alpha, or null if none.
 * Bounds are in raster pixels, exclusive on the right and bottom.
 *
 * @param {import('./rasterizeText.js').Raster} raster
 * @param {number} [threshold] One of ALPHA.
 * @returns {{ left: number, top: number, right: number, bottom: number } | null}
 */
export function inkBounds({ data, width, height }, threshold = ALPHA.ANY) {
  let left = width,
    top = height,
    right = 0,
    bottom = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] < threshold) continue;
      left = Math.min(left, x);
      right = Math.max(right, x + 1);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y + 1);
    }
  }
  return right <= left || bottom <= top ? null : { left, top, right, bottom };
}
