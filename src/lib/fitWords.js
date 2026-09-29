import { rasterizeText, viewportBox } from './rasterizeText.js';
import { ALPHA, inkBounds } from './inkBounds.js';
import { edgeInk, showInk } from './edgeText.js';
import { onLayoutChange } from './onLayoutChange.js';
import { dpr, snap } from './pixels.js';

/** @typedef {import('./rasterizeText.js').Raster} Raster */
/** @typedef {{ left: number, top: number, right: number, bottom: number }} Box */

/**
 * A menu link and the elements MenuLink renders inside it.
 *
 * @typedef {object} Word
 * @property {HTMLElement} link
 * @property {Text} text The label.
 * @property {Element} baseline A zero-size marker on the label's baseline.
 * @property {HTMLElement} overlay Shows the label's raster in place of its text.
 * @property {HTMLElement} hitArea The word's rectangular pointer target.
 * @property {'left'} [alignEdge] Pins the word's ink to that viewport edge.
 */

// Hit targets reach this many CSS pixels beyond the ink.
const HIT_SLOP = 1;

/**
 * Splits the vertical overlap between consecutive boxes (top to bottom)
 * halfway, so neighbouring hit targets meet without sharing any area.
 * Mutates the boxes; null entries are skipped.
 *
 * @param {(Box | null)[]} boxes
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

/**
 * The underline's box relative to its link, in CSS pixels: the link's full
 * width, 0.06em below the baseline and 1/12em thick (at least a device
 * pixel), snapped to device pixels.
 *
 * @param {{ baselineY: number, fontSize: number, linkTop: number, linkWidth: number, scale: number }} metrics
 */
export function underlineGeometry({ baselineY, fontSize, linkTop, linkWidth, scale }) {
  return {
    top: snap(baselineY + fontSize * 0.06, scale) - linkTop,
    width: linkWidth,
    height: Math.max(1 / scale, snap(fontSize / 12, scale)),
  };
}

/** The horizontal shift that puts a raster's first inked column at x = 0. */
function leftEdgeShift(/** @type {Raster} */ raster) {
  const ink = inkBounds(raster);
  return ink && -viewportBox(raster, ink).left;
}

/**
 * Reads everything the layout needs from one word. Called with the link
 * untranslated; shifted words move by whole device pixels, so their rasters
 * are unchanged apart from position.
 *
 * @param {Word} word
 */
function measure({ link, text, baseline, alignEdge }) {
  const baselineY = baseline.getBoundingClientRect().top;
  const rect = link.getBoundingClientRect();
  const raster = rasterizeText({ text, baselineY });
  const hitRaster = rasterizeText({ text, baselineY, hitSlop: HIT_SLOP });
  const hitInk = inkBounds(hitRaster, ALPHA.HIT);
  return {
    rect,
    shift: alignEdge === 'left' ? leftEdgeShift(raster) : null,
    ink: edgeInk(raster, alignEdge),
    underline: underlineGeometry({
      baselineY,
      fontSize: parseFloat(getComputedStyle(link).fontSize),
      linkTop: rect.top,
      linkWidth: rect.width,
      scale: dpr(),
    }),
    hitBox: hitInk && viewportBox(hitRaster, hitInk),
  };
}

/**
 * Writes one word's measurements.
 *
 * @param {Word} word
 * @param {ReturnType<typeof measure>} measured
 */
function apply({ link, overlay, hitArea }, { rect, shift, ink, underline, hitBox }) {
  if (shift !== null) link.style.transform = `translateX(${shift}px)`;
  if (ink) {
    // A pinned overlay is placed against the link as shifted.
    const origin = { left: rect.left + (shift ?? 0), top: rect.top };
    showInk(overlay, ink, origin);
    link.style.color = 'transparent';
    // The pressed box is sized from the visible ink, not the hit area.
    link.style.setProperty('--ink-top', `${ink.top - origin.top}px`);
    link.style.setProperty('--ink-height', `${ink.height}px`);
  }
  link.style.setProperty('--underline-top', `${underline.top}px`);
  link.style.setProperty('--underline-width', `${underline.width}px`);
  link.style.setProperty('--underline-height', `${underline.height}px`);
  if (hitBox) {
    // The hit area takes over pointer input, so letter counters and the
    // spaces between letters stay clickable.
    Object.assign(hitArea.style, {
      left: `${hitBox.left - rect.left}px`,
      top: `${hitBox.top - rect.top}px`,
      width: `${hitBox.right - hitBox.left}px`,
      height: `${hitBox.bottom - hitBox.top}px`,
    });
    link.style.pointerEvents = 'none';
  }
}

/**
 * Keeps the menu's words fitted to their rendered text: each word's raster
 * overlay and edge alignment, its underline geometry, and a solid hit area
 * snugly enclosing it, with neighbours' overlaps split. The visible HTML text
 * keeps its layout and the link keeps native behaviour. Refits whenever
 * layout changes, reading every word before writing any.
 *
 * @param {Word[]} words Top to bottom.
 * @returns {() => void} Stops refitting.
 */
export function fitWords(words) {
  return onLayoutChange(
    () => {
      words.forEach(({ link }) => link.style.removeProperty('transform'));
      const measured = words.map(measure);
      splitOverlaps(measured.map(({ hitBox }) => hitBox));
      words.forEach((word, i) => apply(word, measured[i]));
    },
    { observe: words.map(({ link }) => link) },
  );
}
