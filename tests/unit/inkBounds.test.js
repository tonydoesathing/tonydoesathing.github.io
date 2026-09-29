import { describe, expect, it } from 'vitest';
import { inkBounds } from '../../src/lib/inkBounds.js';

// A width × height RGBA raster with the given [x, y, alpha] pixels.
function raster(width, height, pixels = []) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (const [x, y, alpha] of pixels) data[(y * width + x) * 4 + 3] = alpha;
  return { data, width, height };
}

describe('inkBounds', () => {
  it('returns null for a blank raster', () => {
    expect(inkBounds(raster(4, 3))).toBeNull();
  });

  it('is exclusive on the right and bottom', () => {
    expect(inkBounds(raster(4, 3, [[2, 1, 255]]))).toEqual({ left: 2, top: 1, right: 3, bottom: 2 });
  });

  it('encloses every inked pixel', () => {
    const pixels = [[1, 4, 255], [5, 0, 10], [3, 2, 1]];
    expect(inkBounds(raster(8, 6, pixels))).toEqual({ left: 1, top: 0, right: 6, bottom: 5 });
  });

  it('ignores pixels fainter than the threshold', () => {
    const pixels = [[0, 0, 253], [2, 1, 254], [3, 2, 255]];
    expect(inkBounds(raster(4, 3, pixels), 254)).toEqual({ left: 2, top: 1, right: 4, bottom: 3 });
    expect(inkBounds(raster(4, 3, [[0, 0, 100]]), 254)).toBeNull();
  });

  it('reads only the alpha channel', () => {
    const { data, width, height } = raster(2, 2);
    data.fill(255);
    for (let i = 3; i < data.length; i += 4) data[i] = 0;
    expect(inkBounds({ data, width, height })).toBeNull();
  });
});
