import { expect, test } from '@playwright/test';
import { capture, changedAbove, hideBars, load, settle, tabTo, watchErrors } from './helpers.js';

const toggle = page => page.getByRole('button');
const saved = page => page.evaluate(() => localStorage.getItem('theme'));

async function expectTheme(page, theme) {
  const root = page.locator('html');
  await expect(root).toHaveCSS('background-color', theme === 'dark' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)');
  await expect(root).toHaveCSS('color-scheme', theme);
  await expect(toggle(page)).toHaveAccessibleName(theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

for (const system of ['light', 'dark']) {
  test(`follows a ${system} system preference by default`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: system });
    await load(page);
    await expectTheme(page, system);
    // The detected theme is not saved as if it had been chosen.
    expect(await saved(page)).toBeNull();
  });
}

test('follows live system changes until a choice is made', async ({ page }) => {
  await load(page);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expectTheme(page, 'dark');
  await toggle(page).click();
  await expectTheme(page, 'light');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.emulateMedia({ colorScheme: 'dark' });
  await expectTheme(page, 'light');
});

test('a choice survives reloading', async ({ page }) => {
  await load(page);
  await toggle(page).click();
  await expectTheme(page, 'dark');
  await page.reload();
  await settle(page);
  await expectTheme(page, 'dark');
});

test('a choice syncs across tabs, and clearing it restores the system theme', async ({ context }) => {
  const [first, second] = [await context.newPage(), await context.newPage()];
  await load(first);
  await load(second);
  await toggle(first).click();
  await expectTheme(second, 'dark');
  await second.evaluate(() => localStorage.clear());
  await expectTheme(first, 'light');
  await second.reload();
  await settle(second);
  await expectTheme(second, 'light');
});

test('ignores an invalid saved value', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'purple'));
  await page.emulateMedia({ colorScheme: 'dark' });
  await load(page);
  await expectTheme(page, 'dark');
});

test('still toggles when storage is blocked', async ({ page }) => {
  const errors = watchErrors(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() { throw new DOMException('Storage is blocked', 'SecurityError'); },
    });
  });
  await load(page);
  await expect(saved(page)).rejects.toThrow('Storage is blocked');
  await expectTheme(page, 'light');
  await toggle(page).click();
  await expectTheme(page, 'dark');
  await toggle(page).click();
  await expectTheme(page, 'light');
  expect(errors).toEqual([]);
});

test('the toggle shows a focus ring, and Enter and Space activate it', async ({ page }) => {
  await load(page);
  await hideBars(page);
  const box = await toggle(page).boundingBox();
  const before = await capture(page);
  await tabTo(page, toggle(page));
  expect(changedAbove(before, await capture(page), box)).toBeGreaterThan(box.width / 2);
  await page.keyboard.press('Enter');
  await expectTheme(page, 'dark');
  await page.keyboard.press('Space');
  await expectTheme(page, 'light');
});
