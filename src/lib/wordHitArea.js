import { rasterizeText } from './rasterizeText.js';

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

  let pendingFrame = 0;
  let disposed = false;
  function scheduleMeasure() {
    if (disposed || pendingFrame) return;
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = 0;
      const boxes = entries.map(({ link, baseline }) => {
        const raster = rasterizeText(link, baseline, 1);
        const bounds = inkBounds(raster);
        if (!bounds) return null;
        return {
          left: raster.offsetX + bounds.left / raster.scale,
          top: raster.offsetY + bounds.top / raster.scale,
          right: raster.offsetX + (bounds.right + 1) / raster.scale,
          bottom: raster.offsetY + (bounds.bottom + 1) / raster.scale,
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
      document.fonts.removeEventListener('loadingdone', scheduleMeasure);
      window.removeEventListener('resize', scheduleMeasure);
      entries.forEach(({ link, baseline, hitArea }) => {
        baseline.remove();
        hitArea.remove();
        link.style.removeProperty('pointer-events');
      });
    },
  };
}

function inkBounds({ data, width, height }) {
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] < 32) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  return right < left ? null : { left, top, right, bottom };
}
