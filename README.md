# Personal Site
This is a landing page for my Github.

## Setup
Make sure you have NodeJS and NPM installed, then run `npm install`.

## Dev container

With a container engine running and the VS Code **Dev Containers** extension
installed, open this folder and run **Dev Containers: Reopen in Container**.
The first build downloads the browser tools and can take a few minutes.

The container includes Node.js 22, npm, Git, Python 3, ripgrep, jq, the Svelte
editor extension, Codex CLI, Claude Code CLI, their VS Code extensions, and
Playwright with Chromium, Firefox, and WebKit. Setup runs
`npm ci` automatically. Linux `node_modules` live in a separate named volume.
After changing `package-lock.json`, run `npm ci` again inside the container.

Run `codex` or `claude` in the container terminal and follow the sign-in prompts,
or use their VS Code panels. Sign in inside the container; host credentials are
not copied into the image. You may need to sign in again after rebuilding.
Both CLI executables are checked with `--version` during the image build.
Their Dockerfile build arguments default to `latest` and can be set to specific
versions. Docker may reuse the installation layer on rebuild; use **Dev
Containers: Rebuild Container Without Cache** to fetch fresh releases.
Installation references: [Codex](https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex)
and [Claude Code](https://code.claude.com/docs/en/setup#install-with-npm).

Start development:

```sh
npm run dev -- --host 0.0.0.0
```

Open the forwarded port **5173** in your host browser. Vite handles live updates.
To inspect a production build:

```sh
npm run build
npm run preview -- --host 0.0.0.0
```

Open forwarded port **4173**. Builds replace the tracked `docs/` output used by
GitHub Pages; use `npm run build -- --outDir /tmp/portfolio-build` for a build
check that leaves that output untouched.

### Browser exploration

With the dev server running, capture desktop or mobile screenshots:

```sh
playwright screenshot --browser chromium --viewport-size '1440,900' --wait-for-timeout 3000 http://localhost:5173 /tmp/portfolio-desktop.png
playwright screenshot --device 'iPhone 13' --wait-for-timeout 3000 http://localhost:5173 /tmp/portfolio-mobile.png
```

Browser automation is also available for measuring link hitboxes, inspecting
styles, and testing interactions. For example:

```sh
node <<'JS'
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:5173');
    console.log(await page.locator('a').evaluateAll(links => links.map(link => ({
      text: link.textContent.trim(),
      bounds: link.getBoundingClientRect().toJSON()
    }))));
  } finally {
    await browser.close();
  }
})();
JS
```

Playwright lives in `/opt/browser-tools` rather than the site's dependencies.
CommonJS scripts can use `require('playwright')` through `NODE_PATH`; ES modules
can import `/opt/browser-tools/node_modules/playwright/index.mjs`.
Browsers run headlessly. To view an existing trace in your host browser, run
`playwright show-trace --host 0.0.0.0 --port 9323 /path/to/trace.zip` and open
forwarded port **9323**.

Use **Dev Containers: Rebuild Container** after editing the Dockerfile or
container configuration. The pinned Playwright version in the Dockerfile
controls both the automation library and its browser binaries.


## Running and Building
Use `npm run dev` to run the dev server and `npm run build` to build the site to the `/docs` folder, which Github will host.


## Site behavior

`src/main.js` mounts `App.svelte`, which renders the name, primary navigation,
and three decorative bars. White text uses `mix-blend-mode: difference` to
appear black against the page and white wherever a black bar passes beneath it.

Each `Rectangle.svelte` chooses a random width, height, vertical position, and
speed of 24–36 CSS pixels per second. Duration is the full travel distance
(viewport width plus bar width) divided by speed, so desktop and mobile bars
move at the same slow pace. Tune `min_speed` and `max_speed` in that component.
CSS animates only `transform`; JavaScript chooses fresh values on `animationend`
and recalculates duration when the viewport width changes, preserving progress.
The initial bars start at independent random points along their sweeps using
negative CSS animation delays. Later passes enter from the right edge. A keyed
element restarts each randomized pass at time zero. There are no
animation-frame callbacks or recurring timers. Viewport units adapt the bars'
geometry to window resizing.
Reduced-motion preferences show stationary bars and stop the animation cycle.

The navigation retains the original typography, line heights, and staggered
positions. Each anchor owns its visual offset and content-sized box, eliminating
the extra clickable area left behind by offset headings. Keyboard focus gets
an explicit outline and underline. Decorative elements do not intercept clicks.
The original compact spacing and edge cropping are intentional.

Metadata, a favicon, and a no-JavaScript navigation fallback live in `index.html`
and `public/`. The résumé link is relative to the site root.

Deployment still uses the built `docs/` directory. After source changes, run
`npm run build` and include the updated output when publishing. No GitHub Pages
settings need changing for this implementation.


The final “o” in Mastromarino is the light/dark button. It swaps
`--primary` and `--background` and saves
the selection in local storage. The saved theme is restored before first paint;
light mode is the default. Blended text stays white in both modes so difference
blending continues to invert against both the page and the moving bars. Storage
restrictions do not prevent switching themes for the current page. The button
uses the horizontal-slice treatment: hover moves the middle left; pressing
shoots it right and reverses the fill without fading; release sends it back to
center immediately. It has a screen-reader label and keyboard focus. Reduced
motion disables its animations. The original letter remains in the text layout
to preserve spacing; the button overlays its measured ink bounds. Measurements
update after fonts load and on resize, with slice boundaries aligned to device
pixels to avoid hairline seams.
