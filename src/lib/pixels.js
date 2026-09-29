// Device-pixel helpers. Snapping CSS lengths to the physical pixel grid keeps
// raster overlays crisp and edges flush at fractional pixel ratios.

/** Device pixels per CSS pixel. */
export const dpr = () => window.devicePixelRatio || 1;

/** Rounds a CSS length to the nearest device pixel. */
export const snap = (value, scale = dpr()) => Math.round(value * scale) / scale;

/** Rounds a CSS length down to a device pixel. */
export const snapDown = (value, scale = dpr()) => Math.floor(value * scale) / scale;

/** Rounds a CSS length up to a device pixel. */
export const snapUp = (value, scale = dpr()) => Math.ceil(value * scale) / scale;

/** The viewport's right edge in CSS pixels, rounded up to cover its last device pixel. */
export const viewportRightEdge = () => snapUp(document.documentElement.clientWidth);
