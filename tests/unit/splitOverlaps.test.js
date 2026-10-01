import { describe, expect, it } from 'vitest';
import { splitOverlaps } from '../../src/lib/fitWords.js';

const box = (top, bottom) => ({ left: 0, right: 10, top, bottom });

describe('splitOverlaps', () => {
  it('meets overlapping neighbours halfway', () => {
    expect(splitOverlaps([box(0, 12), box(8, 20), box(18, 30)])).toEqual([
      box(0, 10),
      box(10, 19),
      box(19, 30),
    ]);
  });

  it('leaves separate boxes alone', () => {
    expect(splitOverlaps([box(0, 10), box(10, 20), box(25, 30)])).toEqual([
      box(0, 10),
      box(10, 20),
      box(25, 30),
    ]);
  });

  it('skips words without ink', () => {
    expect(splitOverlaps([box(0, 12), null, box(8, 20)])).toEqual([box(0, 12), null, box(8, 20)]);
  });
});
