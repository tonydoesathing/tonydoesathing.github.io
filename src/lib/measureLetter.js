// Measure the visible ink, not the much taller inline text box. Raster bounds
// also work in WebKit, where canvas text bounds can include side bearings.
export function measureLetter(element) {
  const range = document.createRange();
  range.selectNodeContents(element.firstChild);
  const rect = range.getBoundingClientRect();
  const style = getComputedStyle(element);
  const size = parseFloat(style.fontSize);
  const scale = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(size * 3 * scale);
  canvas.height = Math.ceil(size * 3 * scale);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.scale(scale, scale);
  // Computed CSS keywords may be lowercase; canvas enum values are case-sensitive.
  const textRendering = {
    auto: 'auto',
    optimizespeed: 'optimizeSpeed',
    optimizelegibility: 'optimizeLegibility',
    geometricprecision: 'geometricPrecision',
  };
  context.textRendering = textRendering[style.textRendering.toLowerCase()] || 'auto';
  context.fontKerning = style.fontKerning;
  // Forum has only its regular face and synthesis is disabled. Before it loads,
  // the serif fallback can have a real bold face, so retain that weight.
  const forumLoaded = [...document.fonts].some(face =>
    face.family.replace(/["']/g, '') === 'Forum' && face.status === 'loaded'
  );
  context.font = `${forumLoaded ? 400 : style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const padding = Math.ceil(size);
  const baseline = element.querySelector('[data-baseline]').getBoundingClientRect().top;
  const offsetX = Math.floor(rect.left * scale) / scale - padding;
  const offsetY = Math.floor(baseline * scale) / scale - padding;
  // Match the text's subpixel origin before scanning its physical pixels.
  context.fillText(element.textContent, rect.left - offsetX, baseline - offsetY);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  let left = canvas.width;
  let right = 0;
  let top = canvas.height;
  let bottom = 0;
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      if (data[(y * canvas.width + x) * 4 + 3] > 0) {
        left = Math.min(left, x);
        right = Math.max(right, x + 1);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y + 1);
      }
    }
  }
  const width = (right - left) / scale;
  const height = (bottom - top) / scale;
  const x = offsetX + left / scale;
  const y = offsetY + top / scale;
  // Align internal cuts to physical pixels, including a fractional glyph origin.
  const cut = (fraction) => Math.round((y + height * fraction) * scale) / scale - y;
  return { x, y, width, height, cutTop: cut(0.35), cutBottom: cut(0.65), stroke: Math.max(1, size / 22) };
}
