import { rasterizeText, viewportBox } from './rasterizeText.js';
import { ALPHA, inkBounds } from './inkBounds.js';
import { alphaMask } from './alphaMask.js';
import { viewportRightEdge } from './pixels.js';

// Use the same font raster for measurement and display. Measuring canvas ink
// but displaying HTML text can differ by a few pixels between browser engines.
export function paintEdgeText(element, baseline, overlay, side) {
  const raster = rasterizeText(element, baseline);
  const ink = inkBounds(raster);
  if (!ink) return false;
  if (side === 'left') {
    // A faint antialiased fringe can look like a gap even at x=0. Align the
    // solid stroke to the edge, cropping only that outer fringe.
    const solidInk = inkBounds(raster, ALPHA.SOLID);
    if (solidInk) ink.left = solidInk.left;
  }
  const canvas = alphaMask(raster, ink);
  const rect = element.getBoundingClientRect();
  const { left, top } = viewportBox(raster, ink);
  const width = canvas.width / raster.scale;
  const height = canvas.height / raster.scale;
  const x = side === 'left' ? 0 : side === 'right' ? viewportRightEdge() - width : left;
  overlay.style.cssText = `position:absolute;pointer-events:none;left:${x - rect.left}px;top:${top - rect.top}px;width:${width}px;height:${height}px;background:url("${canvas.toDataURL()}") 0 0 / 100% 100% no-repeat`;
  element.style.color = 'transparent';
  return true;
}
