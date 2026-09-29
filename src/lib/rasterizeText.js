const TEXT_RENDERING = {
  auto: 'auto',
  optimizespeed: 'optimizeSpeed',
  optimizelegibility: 'optimizeLegibility',
  geometricprecision: 'geometricPrecision',
};

// Render from the HTML text's baseline and physical-pixel origin. Both the
// theme glyph and link hit regions must match the actual loaded font.
export function rasterizeText(element, baselineElement, hitSlop = 0) {
  const range = document.createRange();
  range.selectNodeContents(element.firstChild);
  const rect = range.getBoundingClientRect();
  const style = getComputedStyle(element);
  const size = parseFloat(style.fontSize);
  const scale = window.devicePixelRatio || 1;
  const padding = Math.ceil(size);
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil((rect.width + 2 * padding) * scale);
  canvas.height = Math.ceil(size * 3 * scale);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.scale(scale, scale);
  // Computed CSS keywords can be lowercase; canvas enums are case-sensitive.
  context.textRendering = TEXT_RENDERING[style.textRendering.toLowerCase()] || 'auto';
  context.fontKerning = style.fontKerning;
  const family = style.fontFamily.split(',')[0].replace(/["']/g, '').trim();
  const regularLoaded = [...document.fonts].some(face =>
    face.family.replace(/["']/g, '') === family && face.status === 'loaded'
  );
  // This site loads regular Forum/Roboto with synthesis disabled. The fallback
  // can have a real bold face, so retain its weight until the web font loads.
  context.font = `${regularLoaded ? 400 : style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const baseline = baselineElement.getBoundingClientRect().top;
  const offsetX = Math.floor(rect.left * scale) / scale - padding;
  const offsetY = Math.floor(baseline * scale) / scale - padding;
  const text = element.firstChild.textContent;
  if (hitSlop) {
    context.lineWidth = hitSlop * 2;
    context.strokeText(text, rect.left - offsetX, baseline - offsetY);
  }
  context.fillText(text, rect.left - offsetX, baseline - offsetY);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  return { data: image.data, width: image.width, height: image.height, scale, offsetX, offsetY };
}
