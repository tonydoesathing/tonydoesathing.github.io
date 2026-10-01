import { expect } from '@playwright/test';
import { PNG } from 'pngjs';

// Opens the site and waits until web fonts have loaded and the edge
// measurements have stopped moving the heading, links and theme toggle.
export async function load(page) {
  await page.goto('/');
  await settle(page);
}

export async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('button')).toBeVisible();
  let previous;
  await expect
    .poll(
      async () => {
        const current = await page.evaluate(() =>
          JSON.stringify(
            [...document.querySelectorAll('h1, a, button')].map(element =>
              element.getBoundingClientRect(),
            ),
          ),
        );
        const stable = current === previous;
        previous = current;
        return stable;
      },
      { intervals: [100] },
    )
    .toBe(true);
}

// The three background bars are the only animations running at rest. Freezing
// them stops new passes; hiding them makes screenshots deterministic. Anything
// else animating would be hidden too, so that fails instead.
export async function hideBars(page) {
  const hidden = await page.evaluate(() => {
    const animations = document.getAnimations();
    for (const animation of animations) {
      animation.pause();
      animation.effect.target.style.visibility = 'hidden';
    }
    return animations.length;
  });
  expect(hidden).toBe(3);
}

export const link = (page, name) => page.getByRole('link', { name, exact: true });

export async function centre(locator) {
  const { x, y, width, height } = await locator.boundingBox();
  return [x + width / 2, y + height / 2];
}

// Hides the other links, so pixels near this word belong to it alone.
// Returns a function that shows them again.
export async function isolate(page, name) {
  const others = await page.getByRole('link').filter({ hasNotText: name }).elementHandles();
  const setVisibility = value =>
    Promise.all(
      others.map(other =>
        other.evaluate((element, value) => {
          element.style.visibility = value;
        }, value),
      ),
    );
  await setVisibility('hidden');
  return () => setVisibility('');
}

// The CSS bounding box of a link's visible word.
export async function wordInk(page, name) {
  const restore = await isolate(page, name);
  const box = await link(page, name).boundingBox();
  const ink = inkBox(await capture(page), {
    x: box.x - 20,
    y: box.y - 40,
    width: box.width + 40,
    height: box.height + 80,
  });
  await restore();
  return ink;
}

// A screenshot decoded for sampling. `ink(x, y)` reads a device pixel, from 0
// for white to 255 for black; `scale` is device pixels per CSS pixel.
export async function capture(page) {
  const png = PNG.sync.read(await page.screenshot());
  const scale = png.width / page.viewportSize().width;
  const ink = (x, y) => {
    const i = (y * png.width + x) * 4;
    return 255 - (png.data[i] + png.data[i + 1] + png.data[i + 2]) / 3;
  };
  return { width: png.width, height: png.height, scale, ink };
}

// Device-pixel rows and columns covering a CSS rectangle, clipped to the image.
function deviceRange(image, { x, y, width, height }) {
  const clamp = (value, max) => Math.min(Math.max(value, 0), max);
  return {
    left: clamp(Math.floor(x * image.scale), image.width),
    right: clamp(Math.ceil((x + width) * image.scale), image.width),
    top: clamp(Math.floor(y * image.scale), image.height),
    bottom: clamp(Math.ceil((y + height) * image.scale), image.height),
  };
}

// Bounding box, in CSS pixels, of the dark pixels inside a CSS rectangle.
export function inkBox(image, rect, threshold = 128) {
  const range = deviceRange(image, rect);
  let left = Infinity,
    top = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  for (let y = range.top; y < range.bottom; y += 1) {
    for (let x = range.left; x < range.right; x += 1) {
      if (image.ink(x, y) < threshold) continue;
      left = Math.min(left, x);
      right = Math.max(right, x + 1);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y + 1);
    }
  }
  if (right < left) return null;
  const s = image.scale;
  return { left: left / s, top: top / s, right: right / s, bottom: bottom / s };
}

// How ink meets the viewport edge within some rows: `gap` is the number of
// blank device-pixel columns before the first inked one, and `ink` is the
// darkest pixel in the column at the very edge.
export function edgeContact(image, rows, side) {
  const { top, bottom } = deviceRange(image, { x: 0, width: 0, ...rows });
  const column = x => {
    let darkest = 0;
    for (let y = top; y < bottom; y += 1) darkest = Math.max(darkest, image.ink(x, y));
    return darkest;
  };
  const edge = side === 'left' ? 0 : image.width - 1;
  const step = side === 'left' ? 1 : -1;
  let gap = 0;
  while (gap < image.width && column(edge + gap * step) < 64) gap += 1;
  return { gap, ink: column(edge) };
}

// Each link's hit region, from elementFromPoint at every CSS pixel around the
// menu: its bounding box and how many points inside that box hit no link.
export async function scanHitAreas(page) {
  return page.getByRole('navigation').evaluate(nav => {
    const links = [...nav.querySelectorAll('a')];
    const rects = links.map(link => link.getBoundingClientRect());
    const top = Math.floor(Math.max(0, Math.min(...rects.map(rect => rect.top)) - 20));
    const bottom = Math.min(innerHeight, Math.max(...rects.map(rect => rect.bottom)) + 20);
    const right = Math.min(innerWidth, Math.max(...rects.map(rect => rect.right)) + 20);
    const hits = [];
    for (let y = top; y < bottom; y += 1) {
      for (let x = 0; x < right; x += 1) {
        const link = document.elementFromPoint(x, y)?.closest('a');
        if (link) hits.push({ x, y, link });
      }
    }
    return links.map(link => {
      const own = hits.filter(hit => hit.link === link);
      const box = {
        left: Math.min(...own.map(hit => hit.x)),
        top: Math.min(...own.map(hit => hit.y)),
        right: Math.max(...own.map(hit => hit.x)) + 1,
        bottom: Math.max(...own.map(hit => hit.y)) + 1,
      };
      const inside = hits.filter(
        ({ x, y }) => x >= box.left && x < box.right && y >= box.top && y < box.bottom,
      );
      const holes = (box.right - box.left) * (box.bottom - box.top) - inside.length;
      return { name: link.textContent, box, holes };
    });
  });
}

// Records, every frame, the box of whatever the link is animating (its
// underline/rectangle), or null while nothing is shown.
export async function recordMotion(locator) {
  await locator.evaluate(link => {
    const samples = [];
    const frame = () => {
      const shape = link
        .getAnimations({ subtree: true })
        .map(animation => animation.effect.target)[0];
      const box = shape?.getBoundingClientRect();
      samples.push(
        box && box.width > 0.5 && box.height > 0.5
          ? { left: box.left, top: box.top, right: box.right, bottom: box.bottom }
          : null,
      );
      link.motionFrame = requestAnimationFrame(frame);
    };
    link.motionSamples = samples;
    frame();
  });
  return () =>
    locator.evaluate(link => {
      cancelAnimationFrame(link.motionFrame);
      return link.motionSamples;
    });
}

// Collects console errors and warnings, and uncaught exceptions, for the
// page's lifetime.
export function watchConsole(page) {
  const errors = [];
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));
  return errors;
}

// Counts pixels that change in a band just above a CSS box, where a focus ring
// is drawn but no underline or glyph motion reaches.
export function changedAbove(before, after, box, band = 8) {
  const s = after.scale;
  let changed = 0;
  for (let y = Math.floor((box.y - band) * s); y < box.y * s; y += 1) {
    for (
      let x = Math.max(0, Math.floor(box.x * s));
      x < Math.min(after.width, (box.x + box.width) * s);
      x += 1
    ) {
      if (Math.abs(after.ink(x, y) - before.ink(x, y)) > 64) changed += 1;
    }
  }
  return changed / s ** 2;
}

// Presses Tab until the locator has focus, so tests don't depend on tab order.
export async function tabTo(page, locator) {
  for (
    let i = 0;
    i < 10 && !(await locator.evaluate(element => element === document.activeElement));
    i += 1
  ) {
    await page.keyboard.press('Tab');
  }
  await expect(locator).toBeFocused();
}
