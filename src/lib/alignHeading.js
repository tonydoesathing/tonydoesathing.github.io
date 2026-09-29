import { rasterizeText, viewportBox } from './rasterizeText.js';
import { inkBounds } from './inkBounds.js';
import { edgeInk, showInk } from './edgeText.js';
import { onLayoutChange } from './onLayoutChange.js';
import { viewportRightEdge } from './pixels.js';

/**
 * Text to measure: its text node and a zero-size marker on its baseline.
 *
 * @typedef {{ text: Text, baseline: Element }} TextTarget
 */

const baselineY = (/** @type {TextTarget} */ { baseline }) => baseline.getBoundingClientRect().top;

function rightEdge(/** @type {TextTarget} */ target) {
  const raster = rasterizeText({ text: target.text, baselineY: baselineY(target) });
  const ink = inkBounds(raster);
  return ink ? viewportBox(raster, ink).right : null;
}

/**
 * Keeps the heading's ink flush with the right viewport edge: the last
 * letter's always, and the first name's when it wraps onto its own line, where
 * a raster overlay replaces its text. Translates only, preserving wrapping and
 * vertical layout. Realigns whenever layout changes, then calls `onAlign`.
 *
 * @param {HTMLElement} heading
 * @param {object} parts
 * @param {TextTarget & { element: HTMLElement, overlay: HTMLElement }} parts.firstName
 * @param {TextTarget} parts.lastLetter
 * @param {() => void} onAlign
 * @returns {() => void} Stops aligning and undoes it.
 */
export function alignHeading(heading, { firstName, lastLetter }, onAlign) {
  function reset() {
    heading.style.removeProperty('transform');
    firstName.element.style.removeProperty('left');
    firstName.element.style.removeProperty('color');
    firstName.overlay.hidden = true;
  }

  function align() {
    reset();
    const viewportRight = viewportRightEdge();
    const right = rightEdge(lastLetter);
    if (right === null) return;
    heading.style.transform = `translateX(${viewportRight - right}px)`;
    if (Math.abs(baselineY(firstName) - baselineY(lastLetter)) <= 1) return;

    // The first name has wrapped onto its own line.
    const firstRight = rightEdge(firstName);
    if (firstRight !== null) firstName.element.style.left = `${viewportRight - firstRight}px`;
    const raster = rasterizeText({ text: firstName.text, baselineY: baselineY(firstName) });
    const ink = edgeInk(raster, 'right');
    if (!ink) return;
    showInk(firstName.overlay, ink, firstName.element.getBoundingClientRect());
    firstName.overlay.hidden = false;
    firstName.element.style.color = 'transparent';
  }

  const stop = onLayoutChange(
    () => {
      align();
      onAlign();
    },
    { observe: [heading] },
  );
  return () => {
    stop();
    reset();
  };
}
