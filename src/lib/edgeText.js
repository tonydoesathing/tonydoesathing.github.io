// Cropped ink images that stand in for HTML text, optionally pinned to an edge.
// DESIGN.md: "Responsive wrapping and exact edge alignment".

import { viewportBox } from './rasterizeText.js';
import { ALPHA, inkBounds } from './inkBounds.js';
import { alphaMask } from './alphaMask.js';
import { viewportRightEdge } from './pixels.js';

/** @typedef {import('./rasterizeText.js').Raster} Raster */

/**
 * A text raster's visible ink, cropped, as an image to show in place of the
 * HTML text, with its viewport box in CSS pixels. Measuring canvas ink but
 * displaying HTML text can differ by a few pixels between browser engines, so
 * the same raster serves both. `side` pins the ink to that viewport edge.
 *
 * @param {Raster} raster
 * @param {'left' | 'right'} [side]
 * @returns {{ left: number, top: number, width: number, height: number, image: string } | null}
 */
export function edgeInk(raster, side) {
  const ink = inkBounds(raster);
  if (!ink) return null;
  if (side === 'left') {
    // A faint antialiased fringe can look like a gap even at x=0. Align the
    // solid stroke to the edge, cropping only that outer fringe.
    const solidInk = inkBounds(raster, ALPHA.SOLID);
    if (solidInk) ink.left = solidInk.left;
  }
  // An image rather than a canvas element: WebKit places canvases on whole
  // CSS pixels inside fractional or transformed boxes, which breaks edge
  // contact at DPR 1.5 and 2.
  const canvas = alphaMask(raster, ink);
  const { left, top } = viewportBox(raster, ink);
  const width = canvas.width / raster.scale;
  const height = canvas.height / raster.scale;
  const x = side === 'left' ? 0 : side === 'right' ? viewportRightEdge() - width : left;
  return { left: x, top, width, height, image: canvas.toDataURL() };
}

/**
 * Shows an `edgeInk` image in an absolutely positioned overlay whose
 * containing block has its top left corner at `origin` in the viewport.
 *
 * @param {HTMLElement} overlay
 * @param {NonNullable<ReturnType<typeof edgeInk>>} ink
 * @param {{ left: number, top: number }} origin
 */
export function showInk(overlay, { left, top, width, height, image }, origin) {
  Object.assign(overlay.style, {
    left: `${left - origin.left}px`,
    top: `${top - origin.top}px`,
    width: `${width}px`,
    height: `${height}px`,
    backgroundImage: `url("${image}")`,
  });
}
