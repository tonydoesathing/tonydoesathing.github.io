import { rasterizeText } from './rasterizeText.js';
import { inkBounds } from './inkBounds.js';
import { paintEdgeText, viewportInkRight } from './edgeText.js';

function rightEdge(element) {
  const raster = rasterizeText(element, element.querySelector('[data-baseline]'));
  const ink = inkBounds(raster);
  return ink ? raster.offsetX + ink.right / raster.scale : null;
}

// Translate only; preserve the heading's original wrapping and vertical layout.
export function alignHeading(lastLetter) {
  const heading = lastLetter.closest('h1');
  const firstName = heading.querySelector('[data-first-name]');
  heading.style.transform = '';
  firstName.style.left = '';
  firstName.style.removeProperty('color');
  const overlay = firstName.querySelector('[data-edge-ink]');
  overlay.style.display = 'none';
  const viewportRight = viewportInkRight();
  const right = rightEdge(lastLetter);
  if (right === null) return;
  heading.style.transform = `translateX(${viewportRight - right}px)`;

  const baseline = element => element.querySelector('[data-baseline]').getBoundingClientRect().top;
  if (Math.abs(baseline(firstName) - baseline(lastLetter)) > 1) {
    const firstRight = rightEdge(firstName);
    if (firstRight !== null) firstName.style.left = `${viewportRight - firstRight}px`;
    paintEdgeText(firstName, firstName.querySelector('[data-baseline]'), overlay, 'right');
  }
}
