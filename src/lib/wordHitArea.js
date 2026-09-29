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
    const ink = document.createElement('span');
    ink.className = 'link-ink';
    ink.setAttribute('aria-hidden', 'true');
    const bar = document.createElement('span');
    bar.className = 'link-bar';
    bar.setAttribute('aria-hidden', 'true');
    link.append(baseline, ink, bar, hitArea);
    return { link, baseline, hitArea, ink, bar };

  });

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
      entries.forEach(({ link, baseline, ink }, i) => {
        paintEdgeText(link, baseline, ink, i === 0 ? 'left' : null);
        // The displayed raster already includes the edge correction/crop.
        // Use its exact geometry, not the padded and divided hit rectangle.
        for (const dimension of ['top', 'height']) {
          link.style.setProperty(`--ink-${dimension}`, ink.style[dimension]);
        }
        const rect = link.getBoundingClientRect();
        const size = parseFloat(getComputedStyle(link).fontSize);
        const scale = window.devicePixelRatio || 1;
        const snap = value => Math.round(value * scale) / scale;
        link.style.setProperty('--underline-width', `${rect.width}px`);
        link.style.setProperty('--underline-top', `${snap(baseline.getBoundingClientRect().top + size * 0.06) - rect.top}px`);
        link.style.setProperty('--underline-height', `${Math.max(1 / scale, snap(size / 12))}px`);
      });
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
      entries.forEach(({ link, baseline, hitArea, ink, bar }) => {
        ink.remove();
        bar.remove();
        for (const prefix of ['ink', 'underline']) {
          for (const dimension of ['left', 'top', 'width', 'height']) link.style.removeProperty(`--${prefix}-${dimension}`);
        }
        link.style.removeProperty('color');
        baseline.remove();
        hitArea.remove();
        link.style.removeProperty('pointer-events');
        link.style.removeProperty('transform');
      });
    },
  };
}
