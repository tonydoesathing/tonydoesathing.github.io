import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLinkMotion, DURATIONS } from '../../src/lib/linkMotion.js';

// Phases entered, each with the time since the test started.
function setup({ reducedMotion = false } = {}) {
  const start = Date.now();
  const phases = [];
  const motion = createLinkMotion(phase => phases.push([phase, Date.now() - start]), {
    reducedMotion: () => reducedMotion,
  });
  return { motion, phases };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('linkMotion', () => {
  it('draws the underline on hover and retracts it on leaving', () => {
    const { motion, phases } = setup();
    motion.enter();
    vi.advanceTimersByTime(1000);
    motion.leave();
    vi.advanceTimersByTime(1000);
    expect(phases).toEqual([
      ['hover', 0],
      ['exit', 1000],
      ['idle', 1000 + DURATIONS.exit],
    ]);
  });

  it('holds the pressed box until release, then collapses it', () => {
    const { motion, phases } = setup();
    motion.press();
    vi.advanceTimersByTime(500);
    motion.release();
    vi.advanceTimersByTime(1000);
    expect(phases).toEqual([
      ['press', 0],
      ['release', 500],
      ['idle', 500 + DURATIONS.release],
    ]);
  });

  it('plays a double-click as two full presses, one after the other', () => {
    const { motion, phases } = setup();
    for (let i = 0; i < 2; i += 1) {
      motion.press();
      vi.advanceTimersByTime(40);
      motion.release();
      vi.advanceTimersByTime(40);
    }
    vi.advanceTimersByTime(2000);
    const { press, release } = DURATIONS;
    expect(phases).toEqual([
      ['press', 0],
      ['release', press],
      ['idle', press + release],
      ['press', press + release],
      ['release', 2 * press + release],
      ['idle', 2 * (press + release)],
    ]);
  });

  it('queues at most one press while one is running', () => {
    const { motion, phases } = setup();
    for (let i = 0; i < 5; i += 1) {
      motion.press();
      motion.release();
      vi.advanceTimersByTime(10);
    }
    vi.advanceTimersByTime(2000);
    expect(phases.filter(([phase]) => phase === 'press')).toHaveLength(2);
  });

  it('finishes an exit before hovering again', () => {
    const { motion, phases } = setup();
    motion.enter();
    vi.advanceTimersByTime(DURATIONS.hover);
    motion.leave();
    vi.advanceTimersByTime(100);
    motion.enter();
    vi.advanceTimersByTime(2000);
    const exitEnd = DURATIONS.hover + DURATIONS.exit;
    expect(phases).toEqual([
      ['hover', 0],
      ['exit', DURATIONS.hover],
      ['idle', exitEnd],
      ['hover', exitEnd],
    ]);
  });

  it('finishes drawing before retracting after a brief hover', () => {
    const { motion, phases } = setup();
    motion.enter();
    vi.advanceTimersByTime(50);
    motion.leave();
    vi.advanceTimersByTime(2000);
    expect(phases).toEqual([
      ['hover', 0],
      ['exit', DURATIONS.hover],
      ['idle', DURATIONS.hover + DURATIONS.exit],
    ]);
  });

  it('runs every phase without delay under reduced motion', () => {
    const { motion, phases } = setup({ reducedMotion: true });
    motion.enter();
    vi.runAllTimers();
    for (let i = 0; i < 2; i += 1) {
      motion.press();
      motion.release();
      vi.runAllTimers();
    }
    expect(phases.map(([phase]) => phase)).toEqual([
      'hover',
      'press',
      'release',
      'idle',
      'press',
      'release',
      'idle',
    ]);
    // Fake timers count a zero delay as 1ms.
    expect(phases.at(-1)[1]).toBeLessThan(10);
  });

  it('stops a running phase', () => {
    const { motion, phases } = setup();
    motion.enter();
    motion.leave();
    motion.stop();
    vi.advanceTimersByTime(2000);
    expect(phases).toEqual([['hover', 0]]);
  });
});
