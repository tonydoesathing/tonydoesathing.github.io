import { rasterizeText } from './rasterizeText.js';
import { inkBounds } from './inkBounds.js';
import { paintEdgeText } from './edgeText.js';
import { observePixelRatio } from './observePixelRatio.js';

// The visible HTML text keeps its layout. This invisible child keeps native
// link activation, hover, keyboard access and context menus, with a hit region
// tightly enclosing the whole word, including spaces between its letters.
export function wordHitArea(menu) {
  const entries = [...menu.querySelectorAll('a')].map(link => {
    const baseline = document.createElement('span');
    baseline.setAttribute('aria-hidden', 'true');
    baseline.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline;pointer-events:none';
    const hitArea = document.createElement('span');
    hitArea.setAttribute('aria-hidden', 'true');
    hitArea.style.cssText = 'position:absolute;pointer-events:auto;cursor:pointer';
    link.append(baseline, hitArea);
    return { link, baseline, hitArea };
  });

  const edgeInk = document.createElement('span');
  edgeInk.setAttribute('aria-hidden', 'true');
  entries[0].link.insertBefore(edgeInk, entries[0].hitArea);
  // Keep native hover/focus underlines visible while the ink overlay is shown.
  entries[0].link.style.textDecorationColor = 'white';

  let pendingFrame = 0;
  let disposed = false;
  function scheduleMeasure() {
    if (disposed || pendingFrame) return;
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = 0;
      // Keep the first painted column at the viewport edge; leave the other
      // words at their existing horizontal positions.
      const first = entries[0];
      first.link.style.transform = '';
      const edgeRaster = rasterizeText(first.link, first.baseline);
      const edge = inkBounds(edgeRaster);
      if (edge) {
        const left = edgeRaster.offsetX + edge.left / edgeRaster.scale;
        first.link.style.transform = `translateX(${-left}px)`;
      }
      paintEdgeText(first.link, first.baseline, edgeInk, 'left');
      const boxes = entries.map(({ link, baseline }) => {
        const raster = rasterizeText(link, baseline, 1);
        const bounds = inkBounds(raster, 32);
        if (!bounds) return null;
        return {
          left: raster.offsetX + bounds.left / raster.scale,
          top: raster.offsetY + bounds.top / raster.scale,
          right: raster.offsetX + bounds.right / raster.scale,
          bottom: raster.offsetY + bounds.bottom / raster.scale,
        };
      });
      // Split the small vertical overlap between neighboring word rectangles.
      // Letter counters and the spaces between letters remain clickable.
      for (let i = 1; i < boxes.length; i += 1) {
        const previous = boxes[i - 1], current = boxes[i];
        if (previous && current && previous.bottom > current.top) {
          const boundary = (previous.bottom + current.top) / 2;
          previous.bottom = current.top = boundary;
        }
      }
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
    });
  }

  const stopObservingPixels = observePixelRatio(scheduleMeasure);
  const observer = new ResizeObserver(scheduleMeasure);
  entries.forEach(({ link }) => observer.observe(link));
  document.fonts.ready.then(scheduleMeasure);
  document.fonts.addEventListener('loadingdone', scheduleMeasure);
  // Re-align to the physical pixel grid even when only the viewport height changes.
  window.addEventListener('resize', scheduleMeasure);

  return {
    destroy() {
      disposed = true;
      cancelAnimationFrame(pendingFrame);
      observer.disconnect();
      stopObservingPixels();
      document.fonts.removeEventListener('loadingdone', scheduleMeasure);
      window.removeEventListener('resize', scheduleMeasure);
      edgeInk.remove();
      entries[0].link.style.removeProperty('color');
      entries[0].link.style.removeProperty('text-decoration-color');
      entries.forEach(({ link, baseline, hitArea }) => {
        baseline.remove();
        hitArea.remove();
        link.style.removeProperty('pointer-events');
        link.style.removeProperty('transform');
      });
    },
  };
}
