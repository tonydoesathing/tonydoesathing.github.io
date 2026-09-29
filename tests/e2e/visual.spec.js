import { expect, test } from '@playwright/test';
import { hideBars, load } from './helpers.js';

const layouts = {
  desktop: { width: 1440, height: 900 },
  portrait: { width: 390, height: 844 },
  landscape: { width: 844, height: 390 },
};

// Font rendering differs between engines and platforms, so one engine keeps
// the baselines; the other suites cover all three.
test.skip(({ browserName }) => browserName !== 'chromium', 'Baselines are Chromium only');

for (const [layout, viewport] of Object.entries(layouts)) {
  for (const colorScheme of ['light', 'dark']) {
    test(`${layout} ${colorScheme}`, { tag: '@visual' }, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme });
      await load(page);
      await hideBars(page);
      await expect(page).toHaveScreenshot(`${layout}-${colorScheme}.png`);
    });
  }
}
