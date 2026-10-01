import { describe, expect, it } from 'vitest';
import { resolveTheme, validTheme } from '../../src/lib/theme.svelte.js';

describe('theme', () => {
  it('accepts only the two theme names as a saved choice', () => {
    expect(validTheme('light')).toBe('light');
    expect(validTheme('dark')).toBe('dark');
    for (const value of [null, '', 'Dark', 'system', 'auto']) expect(validTheme(value)).toBeNull();
  });

  it('prefers a saved choice over the system preference', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('follows the system without a saved choice', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme(null, false)).toBe('light');
  });
});
