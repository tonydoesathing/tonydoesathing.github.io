import { expect, test } from '@playwright/test';
import { link, load, watchErrors } from './helpers.js';

test('exposes the heading, primary navigation and theme toggle', async ({ page }) => {
  await load(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Tony Mastromarino');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toMatchAriaSnapshot(`
    - navigation "Primary":
      - link "github":
        - /url: https://github.com/tonydoesathing
      - link "resume":
        - /url: /TonyMastromarinoResume.pdf
      - link "email":
        - /url: mailto:mastromarino.tony@gmail.com
  `);
  // Decoration stays out of the tree; the order of these may change.
  const children = (await page.getByRole('main').ariaSnapshot())
    .split('\n')
    .filter(line => line.startsWith('  - '));
  expect(children.sort()).toEqual([
    '  - button "Switch to dark mode"',
    '  - heading "Tony Mastromarino" [level=1]',
    '  - navigation "Primary":',
  ]);
  await page.getByRole('button').click();
  await expect(page.getByRole('button')).toHaveAccessibleName('Switch to light mode');
});

test('logs no console errors', async ({ page }) => {
  const errors = watchErrors(page);
  await load(page);
  for (const name of ['github', 'resume', 'email']) await link(page, name).hover();
  await page.getByRole('button').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  expect(errors).toEqual([]);
});

test('background bars keep their progress across a resize', async ({ page }) => {
  // Every bar starts halfway along a fixed path, far from its end.
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
  await load(page);
  // The bars are the only animations running at rest.
  const progress = () =>
    page.evaluate(() =>
      document.getAnimations().map(animation => animation.effect.getComputedTiming().progress),
    );
  const before = await progress();
  expect(before).toHaveLength(3);
  await page.setViewportSize({ width: 1000, height: 900 });
  await page.waitForTimeout(300);
  const after = await progress();
  // Changing the duration alone would jump from 0.5 to about 0.72; a few
  // seconds of travel add only about 0.01 each.
  after.forEach((value, i) => expect(Math.abs(value - before[i])).toBeLessThan(0.05));
});
