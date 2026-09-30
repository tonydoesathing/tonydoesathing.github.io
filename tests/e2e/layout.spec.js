import { expect, test } from '@playwright/test';
import {
  capture,
  centre,
  edgeContact,
  hideBars,
  inkBox,
  link,
  load,
  scanHitAreas,
  wordInk,
} from './helpers.js';

const desktop = { width: 1440, height: 900 };
const portrait = { width: 390, height: 844 };

// The CSS box of some heading text, found by its words rather than markup.
function textBox(page, text) {
  return page.getByRole('heading').evaluate((heading, text) => {
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const start = walker.currentNode.textContent.indexOf(text);
      if (start < 0) continue;
      const range = document.createRange();
      range.setStart(walker.currentNode, start);
      range.setEnd(walker.currentNode, start + text.length);
      const { x, y, width, height } = range.getBoundingClientRect();
      return { x, y, width, height };
    }
    return null;
  }, text);
}

for (const deviceScaleFactor of [1, 1.5, 2]) {
  test.describe(`edge contact at DPR ${deviceScaleFactor}`, () => {
    test.use({ deviceScaleFactor });

    for (const [layout, viewport] of Object.entries({ desktop, portrait })) {
      test(layout, async ({ page }) => {
        await page.setViewportSize(viewport);
        await load(page);
        await hideBars(page);
        const image = await capture(page);

        // The solid stroke of the g, not just a faint fringe, meets the left edge.
        const g = edgeContact(image, await link(page, 'github').boundingBox(), 'left');
        expect(g.gap).toBe(0);
        expect(g.ink).toBeGreaterThanOrEqual(250);

        // Right edges may end on a partly covered, antialiased device pixel.
        const rightEdges = { o: await page.getByRole('button').boundingBox() };
        if (layout === 'portrait') {
          const tony = await textBox(page, 'Tony');
          expect((await textBox(page, 'Mastromarin')).y).toBeGreaterThan(tony.y + tony.height / 2);
          // The y's arm, above the second line.
          rightEdges.y = { y: tony.y + tony.height * 0.2, height: tony.height * 0.5 };
        }
        for (const [letter, rows] of Object.entries(rightEdges)) {
          const contact = edgeContact(image, rows, 'right');
          expect(contact.gap, letter).toBeLessThanOrEqual(1);
          expect(contact.ink, letter).toBeGreaterThan(0);
        }
      });
    }
  });
}

test.describe('theme toggle glyph at DPR 1.5', () => {
  test.use({ deviceScaleFactor: 1.5 });

  test('has no seams across its filled half', async ({ page }) => {
    await load(page);
    await hideBars(page);
    const image = await capture(page);
    const button = await page.getByRole('button').boundingBox();
    const s = image.scale;
    const top = Math.ceil(button.y * s);
    const bottom = Math.floor((button.y + button.height) * s);
    let filledColumns = 0;
    for (let x = Math.ceil(button.x * s); x < (button.x + button.width) * s; x += 1) {
      const dark = [];
      for (let y = top; y < bottom; y += 1) if (image.ink(x, y) >= 200) dark.push(y);
      // A column through the filled half is dark from the outline's top to its bottom.
      if (dark.length < (bottom - top) / 2) continue;
      const first = dark[0],
        last = dark.at(-1);
      if (image.ink(x, Math.round((first + last) / 2)) < 250) continue;
      filledColumns += 1;
      for (let y = first + 2; y <= last - 2; y += 1) {
        expect(image.ink(x, y), `device pixel ${x},${y}`).toBeGreaterThanOrEqual(240);
      }
    }
    expect(filledColumns).toBeGreaterThan(10);
  });
});

test('heading does not jump between widths 969 and 970', async ({ page }) => {
  const headingInk = async width => {
    await page.setViewportSize({ width, height: 800 });
    await load(page);
    await hideBars(page);
    const menuTop = (await link(page, 'github').boundingBox()).y;
    const box = inkBox(await capture(page), { x: 0, y: 0, width, height: menuTop });
    // Measure from the right edge, which the heading is aligned to.
    return {
      right: width - box.right,
      top: box.top,
      width: box.right - box.left,
      height: box.bottom - box.top,
    };
  };
  const narrow = await headingInk(969);
  const wide = await headingInk(970);
  for (const key of Object.keys(narrow))
    expect(Math.abs(wide[key] - narrow[key]), key).toBeLessThanOrEqual(1);
});

for (const [layout, viewport] of Object.entries({ desktop, portrait })) {
  test(`link hit areas are solid, separate and cover their own word (${layout})`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await load(page);
    await hideBars(page);
    const areas = await scanHitAreas(page);
    expect(areas.map(area => area.name)).toEqual(['github', 'resume', 'email']);

    for (const [i, { name, box, holes }] of areas.entries()) {
      expect(holes, name).toBe(0);
      // Neighbours may share one boundary row, which the browser rounds.
      for (const other of areas.slice(i + 1)) {
        const width = Math.min(box.right, other.box.right) - Math.max(box.left, other.box.left);
        const height = Math.min(box.bottom, other.box.bottom) - Math.max(box.top, other.box.top);
        expect(Math.min(width, height), `${name} and ${other.name}`).toBeLessThanOrEqual(1);
      }

      // The target encloses the word's width and centre, and stays snug.
      const ink = await wordInk(page, name);
      expect(box.left, name).toBeLessThanOrEqual(ink.left);
      expect(box.right, name).toBeGreaterThanOrEqual(ink.right);
      expect(box.top, name).toBeLessThan((ink.top + ink.bottom) / 2);
      expect(box.bottom, name).toBeGreaterThan((ink.top + ink.bottom) / 2);
      for (const side of ['left', 'top', 'right', 'bottom']) {
        expect(Math.abs(box[side] - ink[side]), `${name} ${side}`).toBeLessThanOrEqual(4);
      }
    }

    // Targets stay put while a link is pressed.
    await page.mouse.move(...(await centre(link(page, 'resume'))));
    await page.mouse.down();
    await page.waitForTimeout(200);
    expect(await scanHitAreas(page)).toEqual(areas);
    // Release away from the link, so nothing navigates.
    await page.mouse.move(1, 1);
    await page.mouse.up();
  });
}

test('the menu takes pointer input only on its words', async ({ page }) => {
  await load(page);
  // Points inside the navigation's box that hit it, or a part of it, outside any link.
  const stray = await page.getByRole('navigation').evaluate(nav => {
    const { left, top, right, bottom } = nav.getBoundingClientRect();
    let count = 0;
    for (let y = Math.ceil(top); y < bottom; y += 1) {
      for (let x = Math.ceil(left); x < right; x += 1) {
        const hit = document.elementFromPoint(x, y);
        if (nav.contains(hit) && !hit.closest('a')) count += 1;
      }
    }
    return count;
  });
  expect(stray).toBe(0);
});
