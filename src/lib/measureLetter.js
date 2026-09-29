import { rasterizeText, viewportBox } from './rasterizeText.js';
import { ALPHA, inkBounds } from './inkBounds.js';
import { alphaMask, alphaAt } from './alphaMask.js';
import { snap } from './pixels.js';

// Measure visible ink rather than the taller inline text box. Raster bounds
// also avoid WebKit's canvas text metrics including the glyph's side bearings.
export function measureLetter(element) {
  const raster = rasterizeText(element, element.querySelector('[data-baseline]'));
  const ink = inkBounds(raster);
  if (!ink) return null;
  const { scale } = raster;
  // The raster origin is on the device grid, so these are whole device pixels.
  const { left: x, top: y } = viewportBox(raster, ink);
  const width = (ink.right - ink.left) / scale;
  const height = (ink.bottom - ink.top) / scale;
  // Cut on device rows so the three slices meet without seams.
  const cut = fraction => snap(height * fraction, scale);
  const glyph = halfFilledGlyph(raster, ink).toDataURL();
  return { x, y, width, height, cutTop: cut(0.35), cutBottom: cut(0.65), glyph };
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
