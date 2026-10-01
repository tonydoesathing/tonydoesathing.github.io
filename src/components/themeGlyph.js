// Draws the theme toggle's half-filled "o" from the letter it replaces.

import { viewportBox } from '../lib/rasterizeText.js';
import { ALPHA, inkBounds } from '../lib/inkBounds.js';
import { alphaMask, alphaAt } from '../lib/alphaMask.js';
import { snap } from '../lib/pixels.js';

/** @typedef {import('../lib/rasterizeText.js').Raster} Raster */

/**
 * The theme toggle's artwork, drawn from the letter it replaces: the letter's
 * visible ink where it's shown, with half its interior filled, as a canvas at
 * device resolution, and the device rows where its middle slice is cut. Null
 * if the letter has no ink. Measures ink rather than the taller inline text
 * box; raster bounds also avoid WebKit's canvas text metrics including the
 * glyph's side bearings.
 *
 * @param {Raster} raster The letter, as aligned.
 */
export function themeGlyph(raster) {
  const ink = inkBounds(raster);
  if (!ink) return null;
  const { scale } = raster;
  const source = halfFilledGlyph(raster, ink);
  // The raster origin is on the device grid, so the box is too; snapping
  // only drops floating-point error.
  const { left, top } = viewportBox(raster, ink);
  // Cut on device rows so the three slices meet without seams.
  const cut = fraction => Math.round(source.height * fraction);
  return {
    x: snap(left, scale),
    y: snap(top, scale),
    width: source.width / scale,
    height: source.height / scale,
    scale,
    source,
    cuts: [cut(0.35), cut(0.65)],
  };
}

/**
 * The toggle's place when the letter can't be measured: the letter's DOM box,
 * with no artwork, so the button covers the visible text.
 *
 * @param {Element} letter
 */
export function letterBox(letter) {
  const { left, top, width, height } = letter.getBoundingClientRect();
  return { x: left, y: top, width, height };
}

// Reuse the rasterized font outline, filling only the space between the two
// strokes of the o. Its asymmetric contour and varying stroke weight survive.
function halfFilledGlyph(raster, ink) {
  const width = ink.right - ink.left;
  // Per row, the first and last columns inside a stroke.
  const strokes = [];
  for (let y = ink.top; y < ink.bottom; y += 1) {
    let first = width;
    let last = -1;
    for (let x = 0; x < width; x += 1) {
      if (alphaAt(raster, x + ink.left, y) < ALPHA.STROKE) continue;
      first = Math.min(first, x);
      last = x;
    }
    strokes.push({ first, last });
  }
  return alphaMask(raster, ink, (alpha, x, y) => {
    const { first, last } = strokes[y];
    if (x <= first || x >= last) return alpha;
    const leftCoverage = Math.min(1, Math.max(0, width / 2 - x));
    return alpha + (255 - alpha) * leftCoverage;
  });
}
