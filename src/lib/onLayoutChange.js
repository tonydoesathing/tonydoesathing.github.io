import { dpr } from './pixels.js';

/**
 * Calls `callback` once in the next frame after anything that can move text
 * on the pixel grid: fonts loading, the window resizing, the pixel ratio
 * changing, or an observed element resizing. Several triggers in one frame
 * coalesce into one call. Also runs once after fonts are ready.
 *
 * @param {() => void} callback
 * @param {{ observe?: Element[] }} [options]
 * @returns {() => void} Stops listening and cancels a pending call.
 */
export function onLayoutChange(callback, { observe = [] } = {}) {
  let frame = 0;
  let disposed = false;
  // True from a call until the next frame starts.
  let justRan = false;
  const schedule = () => {
    if (disposed || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      callback();
      justRan = true;
      requestAnimationFrame(() => (justRan = false));
    });
  };

  // Resize observations are delivered after animation frame callbacks, so any
  // in the frame of a call describe the layout it has just measured.
  const observer = new ResizeObserver(() => justRan || schedule());
  observe.forEach(element => observer.observe(element));
  const stopObservingPixels = observePixelRatio(schedule);
  document.fonts.ready.then(schedule);
  document.fonts.addEventListener('loadingdone', schedule);
  // Re-align to the pixel grid even when only the viewport height changes.
  window.addEventListener('resize', schedule);

  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    stopObservingPixels();
    document.fonts.removeEventListener('loadingdone', schedule);
    window.removeEventListener('resize', schedule);
  };
}

// Moving a window between displays can change DPR without changing its CSS size.
function observePixelRatio(onChange) {
  let query;
  function listen() {
    query?.removeEventListener('change', changed);
    query = matchMedia(`(resolution: ${dpr()}dppx)`);
    query.addEventListener('change', changed);
  }
  function changed() {
    listen();
    onChange();
  }
  listen();
  return () => query.removeEventListener('change', changed);
}
