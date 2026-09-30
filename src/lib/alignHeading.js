// Keeps the heading's ink flush with the right screen edge.

import { rasterizeText, viewportBox } from './rasterizeText.js';
import { inkBounds } from './inkBounds.js';
import { edgeInk, showInk } from './edgeText.js';
import { onLayoutChange } from './onLayoutChange.js';
import { viewportRightEdge } from './pixels.js';

/** @typedef {import('./rasterizeText.js').Raster} Raster */

/**
 * Text to measure: its text node and a zero-size marker on its baseline.
 *
 * @typedef {{ text: Text, baseline: Element }} TextTarget
 */

const baselineY = (/** @type {TextTarget} */ { baseline }) => baseline.getBoundingClientRect().top;

/** A text's raster and the viewport x of its ink's right edge, or null if unmeasurable. */
function measure(/** @type {TextTarget} */ target) {
  const raster = rasterizeText({ text: target.text, baselineY: baselineY(target) });
  const ink = raster && inkBounds(raster);
  return ink && { raster, right: viewportBox(raster, ink).right };
}

/**
 * Keeps the heading's ink flush with the right viewport edge: the last
 * letter's always, and the first name's when it wraps onto its own line, where
 * a raster overlay replaces its text. Translates only, preserving wrapping and
 * vertical layout. Realigns whenever layout changes, then calls `onAlign`
 * with the last letter's raster as aligned, or null if it couldn't be measured.
 *
 * @param {HTMLElement} heading
 * @param {object} parts
 * @param {TextTarget & { element: HTMLElement, overlay: HTMLElement }} parts.firstName
 * @param {TextTarget} parts.lastLetter
 * @param {(lastLetter: Raster | null) => void} onAlign
 * @returns {() => void} Stops aligning and undoes it.
 */
export function alignHeading(heading, { firstName, lastLetter }, onAlign) {
  function reset() {
    heading.style.removeProperty('transform');
    firstName.element.style.removeProperty('left');
    firstName.element.style.removeProperty('color');
    firstName.overlay.hidden = true;
  }

  // After resetting, reads everything, then writes. Alignment shifts by whole
  // device pixels, so rasters taken before it are still exact afterwards,
  // apart from position.
  function align() {
    reset();
    const viewportRight = viewportRightEdge();
    const last = measure(lastLetter);
    // Unmeasured, the heading stays plain, unaligned text.
    if (!last) return null;
    const shift = viewportRight - last.right;
    // The first name needs its own alignment once it wraps onto its own line.
    const wrapped = Math.abs(baselineY(firstName) - baselineY(lastLetter)) > 1;
    const first = wrapped ? measure(firstName) : null;
    const firstInk = first && edgeInk(first.raster, 'right');
    const firstBox = firstInk && firstName.element.getBoundingClientRect();

    heading.style.transform = `translateX(${shift}px)`;
    if (firstInk) {
      const left = viewportRight - first.right - shift;
      firstName.element.style.left = `${left}px`;
      // The overlay's containing block moves with the heading and the name.
      const origin = { left: firstBox.left + shift + left, top: firstBox.top };
      showInk(firstName.overlay, firstInk, origin);
      firstName.overlay.hidden = false;
      firstName.element.style.color = 'transparent';
    }
    return { ...last.raster, offsetX: last.raster.offsetX + shift };
  }

  const stop = onLayoutChange(() => onAlign(align()), { observe: [heading] });
  return () => {
    stop();
    reset();
  };
}
