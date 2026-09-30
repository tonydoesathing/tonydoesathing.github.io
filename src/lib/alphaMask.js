// Copies raster ink to white-on-transparent canvases, so overlays invert like text.
// DESIGN.md: "Background bars and inversion".

/** @typedef {import('./rasterizeText.js').Raster} Raster */

/**
 * The alpha of a raster pixel.
 *
 * @param {Raster} raster
 * @param {number} x Raster pixels.
 * @param {number} y Raster pixels.
 * @returns {number} 0–255.
 */
export const alphaAt = (raster, x, y) => raster.data[(y * raster.width + x) * 4 + 3];

/**
 * Copies the ink inside `bounds` to a new canvas as white on transparent.
 * `shade(alpha, x, y)` may adjust each pixel; x and y are canvas coordinates.
 * White lets the overlay invert what is beneath it, like the text it replaces.
 *
 * @param {Raster} raster
 * @param {{ left: number, top: number, right: number, bottom: number }} bounds Raster pixels.
 * @param {(alpha: number, x: number, y: number) => number} [shade]
 */
export function alphaMask(raster, { left, top, right, bottom }, shade = alpha => alpha) {
  const canvas = document.createElement('canvas');
  canvas.width = right - left;
  canvas.height = bottom - top;
  const context = canvas.getContext('2d');
  const image = context.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const index = (y * canvas.width + x) * 4;
      image.data.fill(255, index, index + 3);
      image.data[index + 3] = shade(alphaAt(raster, x + left, y + top), x, y);
    }
  }
  context.putImageData(image, 0, 0);
  return canvas;
}
