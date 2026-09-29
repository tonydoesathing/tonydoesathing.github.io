import { rasterizeText } from './rasterizeText.js';
import { inkBounds } from './inkBounds.js';

// Measure visible ink rather than the taller inline text box. Raster bounds
// also avoid WebKit's canvas text metrics including the glyph's side bearings.
export function measureLetter(element) {
  const { data, width: sourceWidth, height: sourceHeight, scale, offsetX, offsetY } =
    rasterizeText(element, element.querySelector('[data-baseline]'));
  const ink = inkBounds({ data, width: sourceWidth, height: sourceHeight });
  if (!ink) return null;
  const { left, right, top, bottom } = ink;

  const width = (right - left) / scale;
  const height = (bottom - top) / scale;
  const x = offsetX + left / scale;
  // The raster origin can sit between physical pixels (e.g. at 1.5×). Snap it
  // so the bitmap and the slice cuts below land on whole device rows.
  const y = Math.round((offsetY + top / scale) * scale) / scale;
  const cut = (fraction) => Math.round(height * fraction * scale) / scale;
  const glyph = halfFilledGlyph(data, sourceWidth, left, top, right, bottom);
  return { x, y, width, height, cutTop: cut(0.35), cutBottom: cut(0.65), glyph };
}

// Reuse the rasterized font outline, filling only the space between the two
// strokes of the o. Its asymmetric contour and varying stroke weight survive.
function halfFilledGlyph(source, sourceWidth, left, top, right, bottom) {
  const width = right - left;
  const height = bottom - top;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const image = context.createImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    const alphaAt = x => source[((y + top) * sourceWidth + x + left) * 4 + 3];
    let firstStroke = width;
    let lastStroke = -1;
    for (let x = 0; x < width; x += 1) {
      if (alphaAt(x) >= 128) {
        firstStroke = Math.min(firstStroke, x);
        lastStroke = x;
      }
    }
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const alpha = alphaAt(x);
      const inside = x > firstStroke && x < lastStroke;
      const leftCoverage = Math.min(1, Math.max(0, width / 2 - x));
      image.data[index] = 255;
      image.data[index + 1] = 255;
      image.data[index + 2] = 255;
      image.data[index + 3] = inside ? alpha + (255 - alpha) * leftCoverage : alpha;
    }
  }
  context.putImageData(image, 0, 0);
  return canvas.toDataURL();
}
