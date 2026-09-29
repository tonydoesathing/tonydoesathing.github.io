import { rasterizeText, viewportBox } from './rasterizeText.js';
import { inkBounds } from './inkBounds.js';
import { paintEdgeText } from './edgeText.js';
import { viewportRightEdge } from './pixels.js';

function rightEdge(element) {
  const raster = rasterizeText(element, element.querySelector('[data-baseline]'));
  const ink = inkBounds(raster);
  return ink ? viewportBox(raster, ink).right : null;
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
  const viewportRight = viewportRightEdge();
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
