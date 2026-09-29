// Bounds are exclusive on the right/bottom and measured in raster pixels.
export function inkBounds({ data, width, height }, threshold = 1) {
  let left = width,
    top = height,
    right = 0,
    bottom = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] < threshold) continue;
      left = Math.min(left, x);
      right = Math.max(right, x + 1);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y + 1);
    }
  }
  return right <= left || bottom <= top ? null : { left, top, right, bottom };
}
