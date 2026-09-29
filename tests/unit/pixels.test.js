import { afterEach, describe, expect, it, vi } from 'vitest';
import { dpr, snap, snapDown, snapUp, viewportRightEdge } from '../../src/lib/pixels.js';

afterEach(() => vi.unstubAllGlobals());

describe('pixels', () => {
  it('reads the device pixel ratio, defaulting to 1', () => {
    vi.stubGlobal('window', { devicePixelRatio: 1.5 });
    expect(dpr()).toBe(1.5);
    vi.stubGlobal('window', {});
    expect(dpr()).toBe(1);
  });

  it('snaps CSS lengths to the nearest, lower or higher device pixel', () => {
    expect(snap(10.2, 1.5)).toBeCloseTo(10);
    expect(snap(10.5, 1.5)).toBeCloseTo(10 + 2 / 3);
    expect(snapDown(10.9, 1.5)).toBeCloseTo(10 + 2 / 3);
    expect(snapUp(10.1, 1.5)).toBeCloseTo(10 + 2 / 3);
    expect(snapDown(-0.2, 2)).toBe(-0.5);
  });

  it('defaults to the current pixel ratio', () => {
    vi.stubGlobal('window', { devicePixelRatio: 2 });
    expect(snap(3.3)).toBe(3.5);
  });

  it('puts the viewport edge on the last device pixel', () => {
    vi.stubGlobal('window', { devicePixelRatio: 1.5 });
    vi.stubGlobal('document', { documentElement: { clientWidth: 389 } });
    expect(viewportRightEdge()).toBeCloseTo(389 + 1 / 3);
  });
});
