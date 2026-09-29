import { rasterizeText, viewportBox } from './rasterizeText.js';
import { ALPHA, inkBounds } from './inkBounds.js';
import { paintEdgeText } from './edgeText.js';
import { onLayoutChange } from './onLayoutChange.js';
import { dpr, snap } from './pixels.js';

// Custom properties each link receives, for the underline and pressed box.
const LINK_PROPERTIES = [
  '--ink-top',
  '--ink-height',
  '--underline-top',
  '--underline-width',
  '--underline-height',
];

/**
 * Splits the vertical overlap between consecutive boxes (top to bottom)
 * halfway, so neighbouring hit targets meet without sharing any area.
 * Mutates the boxes; null entries are skipped.
 */
export function splitOverlaps(boxes) {
  for (let i = 1; i < boxes.length; i += 1) {
    const previous = boxes[i - 1];
    const current = boxes[i];
    if (previous && current && previous.bottom > current.top) {
      previous.bottom = current.top = (previous.bottom + current.top) / 2;
    }
  }
  return boxes;
}

// The visible HTML text keeps its layout. This invisible child keeps native
// link activation, hover, keyboard access and context menus, with a hit region
// tightly enclosing the whole word, including spaces between its letters.
export function wordHitArea(menu) {
  const entries = [...menu.querySelectorAll('a')].map(link => {
    const baseline = document.createElement('span');
    baseline.setAttribute('aria-hidden', 'true');
    baseline.style.cssText =
      'display:inline-block;width:0;height:0;vertical-align:baseline;pointer-events:none';
    const hitArea = document.createElement('span');
    hitArea.setAttribute('aria-hidden', 'true');
    hitArea.style.cssText = 'position:absolute;pointer-events:auto;cursor:pointer';
    const ink = document.createElement('span');
    ink.className = 'link-ink';
    ink.setAttribute('aria-hidden', 'true');
    const bar = document.createElement('span');
    bar.className = 'link-bar inverts';
    bar.setAttribute('aria-hidden', 'true');
    link.append(baseline, ink, bar, hitArea);
    return { link, baseline, hitArea, ink, bar };
  });

  function measure() {
    // Keep the first painted column at the viewport edge; leave the other
    // words at their existing horizontal positions.
    const first = entries[0];
    first.link.style.transform = '';
    const edgeRaster = rasterizeText(first.link, first.baseline);
    const edge = inkBounds(edgeRaster);
    if (edge) first.link.style.transform = `translateX(${-viewportBox(edgeRaster, edge).left}px)`;
    entries.forEach(({ link, baseline, ink }, i) => {
      paintEdgeText(link, baseline, ink, i === 0 ? 'left' : null);
      // The displayed raster already includes the edge correction/crop.
      // Use its exact geometry, not the padded and divided hit rectangle.
      link.style.setProperty('--ink-top', ink.style.top);
      link.style.setProperty('--ink-height', ink.style.height);
      const rect = link.getBoundingClientRect();
      const size = parseFloat(getComputedStyle(link).fontSize);
      link.style.setProperty('--underline-width', `${rect.width}px`);
      link.style.setProperty(
        '--underline-top',
        `${snap(baseline.getBoundingClientRect().top + size * 0.06) - rect.top}px`,
      );
      link.style.setProperty('--underline-height', `${Math.max(1 / dpr(), snap(size / 12))}px`);
    });
    const boxes = entries.map(({ link, baseline }) => {
      const raster = rasterizeText(link, baseline, { hitSlop: 1 });
      const bounds = inkBounds(raster, ALPHA.HIT);
      return bounds && viewportBox(raster, bounds);
    });
    // Letter counters and the spaces between letters remain clickable.
    splitOverlaps(boxes);
    entries.forEach(({ link, hitArea }, i) => {
      const box = boxes[i];
      if (!box) return;
      const rect = link.getBoundingClientRect();
      hitArea.style.left = `${box.left - rect.left}px`;
      hitArea.style.top = `${box.top - rect.top}px`;
      hitArea.style.width = `${box.right - box.left}px`;
      hitArea.style.height = `${box.bottom - box.top}px`;
      link.style.pointerEvents = 'none';
    });
  }

  const stopMeasuring = onLayoutChange(measure, { observe: entries.map(({ link }) => link) });

  return {
    destroy() {
      stopMeasuring();
      entries.forEach(({ link, baseline, hitArea, ink, bar }) => {
        ink.remove();
        bar.remove();
        LINK_PROPERTIES.forEach(property => link.style.removeProperty(property));
        link.style.removeProperty('color');
        baseline.remove();
        hitArea.remove();
        link.style.removeProperty('pointer-events');
        link.style.removeProperty('transform');
      });
    },
  };
}
