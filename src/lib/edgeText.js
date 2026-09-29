import { rasterizeText } from './rasterizeText.js';
import { inkBounds } from './inkBounds.js';

export function viewportInkRight() {
  const scale = window.devicePixelRatio || 1;
  return Math.ceil(document.documentElement.clientWidth * scale) / scale;
}

// Use the same font raster for measurement and display. Measuring canvas ink
// but displaying HTML text can differ by a few pixels between browser engines.
export function paintEdgeText(element, baseline, overlay, side) {
  const raster = rasterizeText(element, baseline);
  const ink = inkBounds(raster);
  if (!ink) return false;
  if (side === 'left') {
    // A faint antialiased fringe can look like a gap even at x=0. Align the
    // solid stroke to the edge, cropping only that outer fringe.
    const solidInk = inkBounds(raster, 254);
    if (solidInk) ink.left = solidInk.left;
  }
  const canvas = document.createElement('canvas');
  canvas.width = ink.right - ink.left;
  canvas.height = ink.bottom - ink.top;
  const context = canvas.getContext('2d');
  const image = context.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const index = (y * canvas.width + x) * 4;
      image.data[index] = image.data[index + 1] = image.data[index + 2] = 255;
      image.data[index + 3] = raster.data[((y + ink.top) * raster.width + x + ink.left) * 4 + 3];
    }
  }
  context.putImageData(image, 0, 0);
  const rect = element.getBoundingClientRect();
  const width = canvas.width / raster.scale;
  const x = side === 'left' ? 0 : viewportInkRight() - width;
  const y = raster.offsetY + ink.top / raster.scale;
  overlay.style.cssText = `position:absolute;pointer-events:none;left:${x - rect.left}px;top:${y - rect.top}px;width:${width}px;height:${canvas.height / raster.scale}px;background:url("${canvas.toDataURL()}") 0 0 / 100% 100% no-repeat`;
  element.style.color = 'transparent';
  return true;
}
