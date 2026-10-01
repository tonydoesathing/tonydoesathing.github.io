import { expect, test } from '@playwright/test';
import { hideBars, link, load, settle, watchConsole, wordInk } from './helpers.js';

// Ways anti-fingerprinting can spoil canvas reads. Each applies while
// window.canvasBlocked is true, which it is unless a test clears it first.
const blockers = {
  'blank canvas reads': () => {
    const { getImageData } = CanvasRenderingContext2D.prototype;
    CanvasRenderingContext2D.prototype.getImageData = function (x, y, width, height) {
      return window.canvasBlocked === false
        ? getImageData.call(this, x, y, width, height)
        : new ImageData(width, height);
    };
  },
  'opaque canvas reads': () => {
    const { getImageData } = CanvasRenderingContext2D.prototype;
    CanvasRenderingContext2D.prototype.getImageData = function (...args) {
      const image = getImageData.apply(this, args);
      if (window.canvasBlocked !== false) image.data.fill(255);
      return image;
    };
  },
  'no 2d canvas': () => {
    const { getContext } = HTMLCanvasElement.prototype;
    HTMLCanvasElement.prototype.getContext = function (type, ...options) {
      return type === '2d' && window.canvasBlocked !== false
        ? null
        : getContext.call(this, type, ...options);
    };
  },
};

// Raster stand-ins showing, and heading or link text made transparent.
const rasterParts = page =>
  page.evaluate(() =>
    [...document.querySelectorAll('h1, h1 *, nav *, button *')]
      .filter(element => {
        const style = getComputedStyle(element);
        const { width, height } = element.getBoundingClientRect();
        const image = element.tagName === 'CANVAS' || style.backgroundImage !== 'none';
        return (image && width > 0 && height > 0) || style.color === 'rgba(0, 0, 0, 0)';
      })
      .map(element => element.outerHTML.slice(0, 80)),
  );

// The CSS box of the heading's last letter, which the toggle covers.
const lastLetterBox = page =>
  page.getByRole('heading').evaluate(heading => {
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    let last;
    while (walker.nextNode()) if (walker.currentNode.textContent.trim()) last = walker.currentNode;
    const range = document.createRange();
    range.setStart(last, last.length - 1);
    range.setEnd(last, last.length);
    const { x, y, width, height } = range.getBoundingClientRect();
    return { x, y, width, height };
  });

async function expectPlainText(page) {
  expect(await rasterParts(page)).toEqual([]);
  await hideBars(page);
  for (const name of ['github', 'resume', 'email'])
    expect(await wordInk(page, name)).not.toBeNull();
}

for (const [name, block] of Object.entries(blockers)) {
  test.describe(`with ${name}`, () => {
    test.beforeEach(({ page }) => page.addInitScript(block));

    test('shows plain text, and the links and theme toggle work', async ({ page }) => {
      await page.route('https://github.com/**', route =>
        route.fulfill({ contentType: 'text/html', body: 'github' }),
      );
      const errors = watchConsole(page);
      await load(page);
      await expectPlainText(page);

      // The toggle covers the letter's text.
      const toggle = page.getByRole('button');
      const box = await toggle.boundingBox();
      const letter = await lastLetterBox(page);
      for (const side of ['x', 'y', 'width', 'height']) {
        expect(Math.abs(box[side] - letter[side]), side).toBeLessThanOrEqual(1);
      }
      await toggle.click();
      await expect(toggle).toHaveAccessibleName('Switch to light mode');
      await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(0, 0, 0)');

      expect(errors).toEqual([]);

      await link(page, 'github').click();
      await expect(page).toHaveURL('https://github.com/tonydoesathing');
    });
  });
}

test('falls back to plain text when canvas reads start failing', async ({ page }) => {
  const errors = watchConsole(page);
  await page.addInitScript(() => (window.canvasBlocked = false));
  await page.addInitScript(blockers['blank canvas reads']);
  await load(page);
  expect(await rasterParts(page)).not.toEqual([]);

  await page.evaluate(() => (window.canvasBlocked = true));
  await page.setViewportSize({ width: 1000, height: 900 });
  await settle(page);
  await expectPlainText(page);
  expect(errors).toEqual([]);
});

// Only Chromium emulates the forced colours themselves; elsewhere this checks
// that the stylesheet alone brings the plain text back.
test('shows plain text in forced colours', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await load(page);
  await expectPlainText(page);

  // Each line's backplate covers its box, so a word inked outside its own box
  // would be hidden by its neighbour's.
  for (const name of ['github', 'resume', 'email']) {
    const box = await link(page, name).boundingBox();
    const ink = await wordInk(page, name);
    expect(ink.top, name).toBeGreaterThanOrEqual(box.y);
    expect(ink.bottom, name).toBeLessThanOrEqual(box.y + box.height);
  }

  // Measurement still works, so the toggle covers the letter's ink.
  const toggle = page.getByRole('button');
  const box = await toggle.boundingBox();
  const letter = await lastLetterBox(page);
  expect(box.width * box.height).toBeGreaterThan(0);
  expect(box.x).toBeGreaterThanOrEqual(letter.x - 1);
  expect(box.y).toBeGreaterThanOrEqual(letter.y - 1);
  expect(box.x + box.width).toBeLessThanOrEqual(letter.x + letter.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(letter.y + letter.height + 1);
  await toggle.click();
  await expect(toggle).toHaveAccessibleName('Switch to light mode');
});
