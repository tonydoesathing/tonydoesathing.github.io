import { expect, test } from '@playwright/test';
import {
  capture,
  centre,
  changedAbove,
  hideBars,
  inkBox,
  isolate,
  link,
  load,
  recordMotion,
  tabTo,
  wordInk,
} from './helpers.js';

const resumeUrl = '**/TonyMastromarinoResume.pdf';

const near = (a, b, tolerance = 0.5) => Math.abs(a - b) <= tolerance;
const shown = samples => samples.filter(Boolean);
const width = box => box.right - box.left;
const height = box => (box ? box.bottom - box.top : 0);

// Collapses per-frame heights into the directions they move in, each with
// the index of the frame it starts from.
function heightTrend(samples) {
  const trend = [];
  for (let i = 1; i < samples.length; i += 1) {
    const change = height(samples[i]) - height(samples[i - 1]);
    if (Math.abs(change) < 0.5) continue;
    const direction = change > 0 ? 'grow' : 'shrink';
    if (trend.at(-1)?.direction !== direction) trend.push({ direction, from: i - 1 });
  }
  return trend;
}
const directions = samples => heightTrend(samples).map(({ direction }) => direction);

test.describe('navigation', () => {
  test('link clicks are never cancelled', async ({ page, context }) => {
    // 204 keeps the page open, so several activations can be counted.
    await page.route(resumeUrl, route => route.fulfill({ status: 204 }));
    await load(page);
    await page.evaluate(() => {
      window.clicks = [];
      addEventListener('click', event => window.clicks.push(event.defaultPrevented));
    });
    const resume = link(page, 'resume');
    await resume.click();
    await resume.dblclick();
    await resume.focus();
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => window.clicks)).toEqual([false, false, false, false]);

    // A modified click still opens a new tab.
    const newTab = context.waitForEvent('page');
    await resume.click({ modifiers: ['ControlOrMeta'] });
    await newTab;
  });

  for (const [name, url] of [
    ['github', 'https://github.com/tonydoesathing'],
    ['resume', /\/TonyMastromarinoResume\.pdf$/],
  ]) {
    test(`${name} navigates`, async ({ page }) => {
      await page.route(url, route => route.fulfill({ contentType: 'text/html', body: name }));
      await load(page);
      await link(page, name).click();
      await expect(page).toHaveURL(url);
    });
  }

  test('keyboard activation and a visible focus ring', async ({ page }) => {
    await page.route('https://github.com/**', route =>
      route.fulfill({ contentType: 'text/html', body: 'github' }),
    );
    await load(page);
    await hideBars(page);
    const github = link(page, 'github');
    const box = await github.boundingBox();
    const before = await capture(page);
    await tabTo(page, github);
    expect(changedAbove(before, await capture(page), box)).toBeGreaterThan(box.width / 2);

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('https://github.com/tonydoesathing');
  });
});

test.describe('link motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(resumeUrl, route => route.fulfill({ status: 204 }));
    await load(page);
    await hideBars(page);
  });

  test('hover draws an underline rightward and retracts it rightward', async ({ page }) => {
    const resume = link(page, 'resume');
    const ink = await wordInk(page, 'resume');
    const stop = await recordMotion(resume);
    await page.mouse.move(...(await centre(resume)));
    await page.waitForTimeout(400);
    await page.mouse.move(1, 1);
    await page.waitForTimeout(500);
    const samples = shown(await stop());

    const full = Math.max(...samples.map(width));
    const drawn = samples.findIndex(sample => near(width(sample), full));
    const [draw, retract] = [samples.slice(0, drawn + 1), samples.slice(drawn)];
    // At least one partial frame each way, so both are animated; more would
    // depend on how many frames a busy machine drops.
    expect(draw.length).toBeGreaterThan(2);
    expect(retract.length).toBeGreaterThan(2);
    for (const [i, sample] of draw.entries()) {
      expect(near(sample.left, draw[0].left)).toBe(true);
      if (i) expect(sample.right).toBeGreaterThanOrEqual(draw[i - 1].right);
    }
    for (const [i, sample] of retract.entries()) {
      expect(near(sample.right, retract[0].right)).toBe(true);
      if (i) expect(sample.left).toBeGreaterThanOrEqual(retract[i - 1].left);
    }
    // A substantial underline beneath the word, not a hairline or a box.
    const underline = samples[drawn];
    expect(underline.top).toBeGreaterThanOrEqual(ink.bottom - 1);
    expect(height(underline)).toBeGreaterThanOrEqual(3);
    expect(height(underline)).toBeLessThan((ink.bottom - ink.top) / 3);
  });

  test('press grows the underline upward and release collapses it upward', async ({ page }) => {
    const resume = link(page, 'resume');
    const ink = await wordInk(page, 'resume');
    await page.mouse.move(...(await centre(resume)));
    await page.waitForTimeout(400);
    const stop = await recordMotion(resume);
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.up();
    await page.waitForTimeout(500);
    const samples = await stop();

    const underline = samples[0];
    const boxAt = samples.findIndex(sample => height(sample) === Math.max(...samples.map(height)));
    const box = samples[boxAt];
    const grow = samples.slice(0, boxAt + 1);
    const collapse = shown(samples.slice(boxAt));
    expect(grow.length).toBeGreaterThan(2);
    expect(collapse.length).toBeGreaterThan(2);
    expect(directions(samples)).toEqual(['grow', 'shrink']);
    for (const sample of grow) {
      expect(near(sample.left, underline.left) && near(sample.right, underline.right)).toBe(true);
      expect(near(sample.bottom, underline.bottom)).toBe(true);
    }
    for (const sample of collapse) {
      expect(near(sample.left, underline.left) && near(sample.right, underline.right)).toBe(true);
      expect(near(sample.top, box.top)).toBe(true);
    }
    expect(samples.at(-1)).toBeNull();
    // Balanced: as much space above the word as the underline leaves below it.
    expect(Math.abs(ink.top - box.top - (box.bottom - ink.bottom))).toBeLessThanOrEqual(1.5);
  });

  test('double-click grows and shrinks twice, starting again from the underline', async ({
    page,
  }) => {
    const resume = link(page, 'resume');
    await page.mouse.move(...(await centre(resume)));
    await page.waitForTimeout(400);
    const stop = await recordMotion(resume);
    await page.mouse.dblclick(...(await centre(resume)));
    await page.waitForTimeout(1300);
    const samples = await stop();

    expect(directions(samples)).toEqual(['grow', 'shrink', 'grow', 'shrink']);
    // The second press does not jump straight to a full rectangle.
    const full = Math.max(...samples.map(height));
    const secondGrow = heightTrend(samples)[2].from;
    expect(height(samples[secondGrow + 1])).toBeLessThan(full - 1);
  });
});

test.describe('reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('background bars stay still', async ({ page }) => {
    await load(page);
    const first = await page.screenshot();
    await page.waitForTimeout(1000);
    expect((await page.screenshot()).equals(first)).toBe(true);
  });

  test('link states change without animating', async ({ page }) => {
    await page.route(resumeUrl, route => route.fulfill({ status: 204 }));
    await load(page);
    const resume = link(page, 'resume');
    const ink = await wordInk(page, 'resume');
    await isolate(page, 'resume');
    const wordWidth = ink.right - ink.left;
    const below = { x: ink.left, y: ink.bottom, width: wordWidth, height: 20 };
    const animating = () =>
      resume.evaluate(element => element.getAnimations({ subtree: true }).length);

    expect(inkBox(await capture(page), below)).toBeNull();
    await page.mouse.move(...(await centre(resume)));
    // Fully drawn in the first frame.
    const underline = inkBox(await capture(page), below);
    expect(underline.right - underline.left).toBeGreaterThan(wordWidth * 0.9);
    expect(await animating()).toBe(0);

    // The box inverts the word, so its top row is dark from end to end.
    await page.mouse.down();
    const box = inkBox(await capture(page), {
      x: ink.left,
      y: ink.top - 20,
      width: wordWidth,
      height: 20,
    });
    expect(box.right - box.left).toBeGreaterThan(wordWidth * 0.9);
    expect(await animating()).toBe(0);

    await page.mouse.up();
    await page.mouse.move(1, 1);
    expect(inkBox(await capture(page), below)).toBeNull();
  });
});
