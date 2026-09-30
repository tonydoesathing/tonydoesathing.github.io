// Draws DOM text on a canvas as the page renders it, so its ink can be measured.
// DESIGN.md: "Responsive wrapping and exact edge alignment".

import { dpr, snapDown } from './pixels.js';
import { alphaAt } from './alphaMask.js';

const TEXT_RENDERING = {
  auto: 'auto',
  optimizespeed: 'optimizeSpeed',
  optimizelegibility: 'optimizeLegibility',
  geometricprecision: 'geometricPrecision',
};

const FONT_KERNING = { auto: 'auto', normal: 'normal', none: 'none' };

/**
 * Text drawn at device resolution. Raster pixels are device pixels: `scale`
 * converts between them and CSS pixels.
 *
 * @typedef {object} Raster
 * @property {Uint8ClampedArray} data RGBA bytes, row by row.
 * @property {number} width In raster pixels.
 * @property {number} height In raster pixels.
 * @property {number} scale Raster pixels per CSS pixel (the device pixel ratio).
 * @property {number} offsetX Viewport x of raster column 0, in CSS pixels, on the device-pixel grid.
 * @property {number} offsetY Viewport y of raster row 0, in CSS pixels, on the device-pixel grid.
 */

/**
 * Raster bounds (see inkBounds) converted to a viewport box in CSS pixels.
 *
 * @param {Raster} raster
 * @param {{ left: number, top: number, right: number, bottom: number }} bounds
 */
export function viewportBox({ scale, offsetX, offsetY }, { left, top, right, bottom }) {
  return {
    left: offsetX + left / scale,
    top: offsetY + top / scale,
    right: offsetX + right / scale,
    bottom: offsetY + bottom / scale,
  };
}

/**
 * Renders a text node at its on-screen position and baseline, at device
 * resolution, so the theme glyph and link hit regions match the loaded font.
 * `baselineY` is the text's baseline in viewport CSS pixels. Null if the
 * canvas can't be read back faithfully, as when anti-fingerprinting blocks it.
 *
 * @param {{ text: Text, baselineY: number }} target
 * @returns {Raster | null}
 */
export function rasterizeText({ text, baselineY }) {
  const range = document.createRange();
  range.selectNodeContents(text);
  const rect = range.getBoundingClientRect();
  const style = getComputedStyle(text.parentElement);
  const size = parseFloat(style.fontSize);
  const scale = dpr();
  const padding = Math.ceil(size);
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil((rect.width + 2 * padding) * scale);
  canvas.height = Math.ceil(size * 3 * scale);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.scale(scale, scale);
  // Computed CSS keywords can be lowercase; canvas enums are case-sensitive.
  context.textRendering = TEXT_RENDERING[style.textRendering.toLowerCase()] || 'auto';
  context.fontKerning = FONT_KERNING[style.fontKerning] || 'auto';
  const family = style.fontFamily.split(',')[0].replace(/["']/g, '').trim();
  const regularLoaded = [...document.fonts].some(
    face => face.family.replace(/["']/g, '') === family && face.status === 'loaded',
  );
  // This site loads regular Forum/Roboto with synthesis disabled. The fallback
  // can have a real bold face, so retain its weight until the web font loads.
  context.font = `${regularLoaded ? 400 : style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  // Snap after subtracting the padding: a whole CSS pixel isn't a whole device
  // pixel at fractional ratios, and the origin must stay on the device grid.
  const offsetX = snapDown(rect.left - padding, scale);
  const offsetY = snapDown(baselineY - padding, scale);
  context.fillText(text.data, rect.left - offsetX, baselineY - offsetY);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const raster = {
    data: image.data,
    width: image.width,
    height: image.height,
    scale,
    offsetX,
    offsetY,
  };
  return hasBlankBorder(raster) ? raster : null;
}

// The text is drawn inside a blank margin, so ink on the raster's border means
// the read was altered (noised or filled) and its ink can't be trusted.
function hasBlankBorder(raster) {
  const { width, height } = raster;
  for (let x = 0; x < width; x += 1) {
    if (alphaAt(raster, x, 0) || alphaAt(raster, x, height - 1)) return false;
  }
  for (let y = 0; y < height; y += 1) {
    if (alphaAt(raster, 0, y) || alphaAt(raster, width - 1, y)) return false;
  }
  return true;
}
