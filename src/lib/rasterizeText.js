import { dpr, snapDown } from './pixels.js';

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
 * Renders an element's text from the HTML text's baseline and physical-pixel
 * origin, so the theme glyph and link hit regions match the loaded font.
 * `hitSlop` strokes the outline, growing the ink by that many CSS pixels.
 *
 * @returns {Raster}
 */
export function rasterizeText(element, baselineElement, { hitSlop = 0 } = {}) {
  const range = document.createRange();
  range.selectNodeContents(element.firstChild);
  const rect = range.getBoundingClientRect();
  const style = getComputedStyle(element);
  const size = parseFloat(style.fontSize);
  const scale = dpr();
  const padding = Math.ceil(size);
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil((rect.width + 2 * padding) * scale);
  canvas.height = Math.ceil(size * 3 * scale);
  const context = canvas.getContext('2d', { willReadFrequently: true });
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
  const baseline = baselineElement.getBoundingClientRect().top;
  // Snap after subtracting the padding: a whole CSS pixel isn't a whole device
  // pixel at fractional ratios, and the origin must stay on the device grid.
  const offsetX = snapDown(rect.left - padding, scale);
  const offsetY = snapDown(baseline - padding, scale);
  const text = element.firstChild.textContent;
  if (hitSlop) {
    context.lineWidth = hitSlop * 2;
    context.strokeText(text, rect.left - offsetX, baseline - offsetY);
  }
  context.fillText(text, rect.left - offsetX, baseline - offsetY);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  return { data: image.data, width: image.width, height: image.height, scale, offsetX, offsetY };
}
