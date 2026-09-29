# Code & design critique

A review of the requirements in [README.md](README.md), the running site, and the
implementation in `src/` at commit `068b1aa` (branch `refinements`). The goal is to keep
what the site looks like and does exactly as it is, while making the code a clean,
well-organized example: easy to read, extend, test and maintain.

Nothing here has been implemented. Each finding gives the problem, why it matters and
a suggested alternative. The code sketches show the intended shape; they are not
finished code.

---

## 1. Summary

**What's already strong**

- **The requirements document is excellent.** It is specific, it gives reasons, it
  separates requirements from "current implementation" tuning and from superseded
  experiments, and it ends with a regression checklist. Most projects don't have this.
- **The visual idea gets a lot out of a little.** One `mix-blend-mode: difference`
  layer plus white foreground elements handles inversion for both themes, the bars,
  the link boxes and the toggle glyph, with no per-theme branching.
- **It respects the platform.** Links are real `<a>` elements and are never
  `preventDefault`ed. The toggle is a real `<button>` whose label names the next action.
  Motion runs on CSS animations, and JavaScript only picks values and sequences states.
  There is a `<noscript>` fallback, and the theme is set before first paint.
- **Resource hygiene.** Measurements are coalesced into one `requestAnimationFrame`.
  Listeners, observers and frames are cleaned up. `observePixelRatio` is a small
  single-purpose utility. Storage access is wrapped in try/catch everywhere.
- **Comments explain *why*, not *what*.** Examples: "Changing duration alone would
  jump…", "Computed CSS keywords can be lowercase; canvas enums are case-sensitive."
- **Small footprint.** About 890 lines in total, three runtime-free dev dependencies,
  and no UI library.

**What keeps it from being production-grade**

0. **Two requirement failures found in the browser runs:** reduced motion doesn't stop
   the link animations (a CSS specificity bug), and the toggle glyph shows seams at
   DPR 1.5. (§2)
1. **Responsibilities are in the wrong places.** `ThemeToggle` aligns the heading and
   also owns theme persistence. `wordHitArea` does edge alignment, raster painting,
   underline geometry and hit testing. `App.svelte` holds an undocumented DOM contract
   (`data-first-name`, `data-baseline`, `data-edge-ink`) that other modules reach into.
   (§3)
2. **Duplicated infrastructure.** The measure scheduler, the "alpha mask → canvas →
   data URL" routine, the theme-resolution logic, the animation durations and the
   invert colour are each written two or three times. (§4)
3. **No automated verification.** The README lists about 20 regression checks and the
   dev container already installs Playwright, but there are no tests, no lint and no
   type-check script. One type error is sitting unnoticed. (§8)
4. **Stale toolchain and a manual deploy.** Svelte 3.49 and Vite 3 (both from 2022)
   carry 7 `npm audit` advisories. The build output is committed to `docs/` by hand,
   and that folder name collides with the conventional place for documentation. (§9)
5. **Magic numbers and positional naming.** Examples: `#first/#second/#third`,
   `13 / 64 * 8vh * -0.9`, the thresholds `32` / `128` / `254`, `hitSlop = 1`, and
   `min_y` in snake_case. (§5)

Suggested order of work is in §11.

---

## 2. Browser verification

**How this was checked.** Automated Playwright runs in headless Chromium, Firefox and
WebKit on Linux, against the Vite dev server. Viewports: 1440×900, 390×844, 844×390,
969/970×800. Pixel densities: DPR 1, 1.5 and 2. Screenshot pixels were analysed
directly. Not covered: real touch devices, iOS Safari, macOS/Windows font rendering,
and the production bundle.

### Passes (the requirements are well met)

- **Layout.** No horizontal overflow anywhere. **969 vs 970:** identical apart from a
  uniform 1px shift; there is no spacing jump. (The actual wrap happens at 934/935.)
- **Edge contact.** The "g", the wrapped "y" and the toggle "o" all reach within 0–1
  device pixel of the edge in all three engines, at DPR 1, 1.5 and 2 and widths from
  320 to 1440. Every 1px case is a partially covered anti-aliased pixel, not a real
  gap.
- **Link motion.** Underline draw (~230ms), rightward retract (~350ms), upward grow
  (~120ms, with balanced padding of ~9–10px above and below), and upward collapse
  (~360ms). Drag-off while pressed holds the rectangle until release. Double-click
  gives grow → shrink → grow → shrink with no sudden full box.
- **Navigation.** The `click` event is never `defaultPrevented`. The PDF request fires
  2–5ms after the click, including twice on a double-click.
- **Hit boxes.** A per-pixel `elementFromPoint` scan finds solid rectangles, 0px
  overlap between rows, and correct word association, in all engines and viewports
  tested.
- **Theme.** Follows the system setting in both directions. The explicit choice
  persists and survives reload. Clearing storage returns to system, and live system
  changes are followed while nothing is saved. The label updates, and Enter and Space
  both work.
- **Accessibility tree.** `main` → `h1 "Tony Mastromarino"` → `nav "Primary"` (3
  links) → the button. All decoration is hidden. Contrast is 21:1 by construction.
- **Runtime.** No console errors or warnings in any engine. **No `requestAnimationFrame`
  calls** while idle or during mouse movement. No long tasks. Bars keep their progress
  across 11 consecutive resizes without restarting.

### Failures and concerns

1. **FAIL: reduced motion doesn't stop the link animations** (all three engines).
   With `prefers-reduced-motion: reduce`, the underline still draws over ~240ms and
   the box still grows over ~120ms; only the release collapse is instant.
   - **Root cause:** the override
     `@media (prefers-reduced-motion: reduce) { .menu :global(.link-bar) { animation: none } }`
     ([Menu.svelte:185-187](src/lib/Menu.svelte#L185-L187)) is *less specific* than
     the phase rules `a[data-phase='hover'] :global(.link-bar) { animation: … }`, so
     the phase rules win.
   - **Fix:** put motion inside `@media (prefers-reduced-motion: no-preference) { … }`
     (animate only when there's no reduced-motion preference) instead of trying to
     cancel it afterwards. That removes the specificity race for good. The `DURATIONS`
     change in §3.3 also lets JS and CSS agree on one reduced-motion rule.
   - Add a Playwright test with `emulateMedia({ reducedMotion: 'reduce' })`.
2. **CONCERN: seams in the toggle glyph at DPR 1.5** — this breaks the README
   requirement. Faint horizontal lines appear at the slice cuts:
   - Chromium: luminance ≈32/255 on rows that should be pure black;
   - WebKit: ≈63/255;
   - Firefox: small notches at the cut edges at both 1.5× and 2×.

   DPR 1 and 2 are clean in Chromium and WebKit. **Likely cause:** the cuts are snapped
   relative to the glyph's raster origin, but the button's CSS box (`left`/`top`,
   `background-size: 100% 100%`) sits on a fractional device pixel, so each clipped
   layer resamples the bitmap on its own. The `.middle` layer's `transform` also gives
   it its own compositing layer.

   **Suggested alternative:**
   - snap the button's own `x`/`y`/`width`/`height` to device pixels;
   - draw each of the three slices into its own `<canvas>` sized exactly in device
     pixels, so there's no scaling and no `clip-path`.

   This fits with the canvas-instead-of-data-URL change in §7.1.
3. **CONCERN (dev only): first frame is white for dark-theme visitors.** On the dev
   server, Vite injects `app.css` through JavaScript, so the first paint has
   `data-theme="dark"` but no stylesheet yet. The production build loads the CSS with
   a `<link>` in `<head>`, so this probably doesn't affect the live site (not
   verified). **Cheap hardening either way:** have the inline head script also set
   `document.documentElement.style.colorScheme`, or add a two-line inline `<style>` for
   the `[data-theme]` background. Then the canvas colour is right before any CSS
   arrives.
4. **CONCERN: FOUT and render-blocking fonts.** The two Google Fonts stylesheets block
   first paint (a 2.5s font-CSS delay held the first frame for 2.6s). After that, text
   renders in the fallback fonts, including a bold fallback serif, and WebKit's fallback
   wraps "Tony" onto its own line before the swap. The site stays usable with fonts
   blocked. Self-hosting plus `preload` (§9.3) shortens this considerably.
5. **Note: Chromium heading width jumps in whole pixels while resizing** (for example
   10px between widths 384 and 383). Firefox and WebKit scale smoothly. This is most
   likely headless-Linux hinting; check it on real Chrome before acting.

### Nitpicks

- After a click the link sits in a `spent` state, so a pointer still hovering shows no
  underline until it leaves and re-enters. This matters for Ctrl/Cmd-click (new tab)
  and `mailto:`, where the page stays open. The README's release rule allows it, but
  re-arming hover after the release completes (if the pointer is still over the link)
  may feel better. **Your call.**
- On the last frame of the release collapse, a ~4.5px sliver at the top of the box
  briefly shows at the underline position. This was seen in automation; confirm by
  eye. It probably comes from the phase change `release → spent` re-applying the base
  `top`/`height` with a `120ms` transition while the scale animation is removed.
  Making `spent` (and idle) explicitly `transition: none` should remove it.
- The fixed `<nav>` box takes the clicks in the empty space beside the words. That's
  harmless today, but `pointer-events: none` on `.menu` would make the "only the
  word rectangles are interactive" intent explicit.

---

## 3. Architecture and SOLID

### 3.1 `ThemeToggle.svelte` has three jobs (SRP)

It currently:

1. aligns the whole heading to the viewport edges (`alignHeading(target)`), including
   the wrapped first name;
2. measures the last "o", builds its half-filled glyph and positions a fixed button
   over it;
3. resolves, persists and syncs the theme preference (system, `localStorage`, the
   `storage` event).

Evidence that these don't belong together: its cleanup function reaches back into the
heading with `target.closest('h1')` and `querySelector('[data-first-name]')` to undo
styles set by a different module ([ThemeToggle.svelte:48-55](src/lib/ThemeToggle.svelte#L48-L55)).
A change to the heading markup in `App.svelte` can silently break the toggle's cleanup.
The toggle also can't be reused, or tested, without a heading.

**Suggested alternative:** split into three parts that each have one reason to change:

| Unit | Owns | Knows nothing about |
| --- | --- | --- |
| `Heading.svelte` | the `<h1>` markup, its baseline markers, edge alignment (`use:alignEdges`), and the anchor element for the toggle | themes |
| `theme.js` (store) | preference, resolved theme, `toggle()`, system and cross-tab sync, writing `data-theme` | the DOM layout |
| `ThemeToggle.svelte` | glyph measurement, the button, the slice animation | persistence, heading alignment |

`Heading` renders the toggle next to the letter it replaces. That removes the `target`
prop, the `bind:this` in `App`, and the `tick().then(...)` race workaround:

```svelte
<!-- Heading.svelte (sketch) -->
<h1 use:alignEdges>
  <span class="first-name">Tony<Baseline /><span class="edge-ink" aria-hidden="true"></span></span>
  Mastromarin<span bind:this={toggleAnchor}>o<Baseline /></span>
</h1>
{#if toggleAnchor}<ThemeToggle anchor={toggleAnchor} />{/if}
```

### 3.2 `wordHitArea` does far more than its name says (SRP, least surprise)

[wordHitArea.js](src/lib/wordHitArea.js) is a 122-line Svelte action that:

- **creates four DOM children per link by hand** (baseline, ink, bar, hit area), which
  are invisible from the `.svelte` template;
- **edge-aligns the first link** (translateX to the solid "g" stroke);
- **paints raster overlays** for every link;
- **computes underline geometry** and sets `--underline-*` / `--ink-*` custom properties;
- **computes hit rectangles** and splits overlaps between rows;
- **turns off pointer events on the `<a>`** and hands them to the child span.

Because the elements are created imperatively, `Menu.svelte` has to style them through
`:global(.link-bar)`. A reader of `Menu.svelte` sees `.link-bar` styles for an element
that appears nowhere in its markup.

**Suggested alternative:**

- Declare the extra elements in markup, in a per-link component (§3.3), so the
  structure is visible and scoped styles work without `:global`.
- Break the action into named steps, backed by pure functions where possible:
  - `measureWordInk(link) → box` (raster plus `inkBounds`, DOM read only);
  - `splitVerticalOverlaps(boxes) → boxes` (pure, unit-testable);
  - `underlineGeometry({ baselineY, fontSize, dpr, linkRect }) → { top, height, width }`
    (pure);
  - `alignLeftEdge(link)` (the "g" correction, used only for the first link and opted
    into explicitly, e.g. `<MenuLink alignEdge="left">`, rather than `i === 0`).
- Keep one action (`use:wordHitArea`) as orchestration only: schedule, measure
  everything (reads), then apply everything (writes). See §7.2.

### 3.3 Link motion state lives in the parent, keyed by string id

The README says "each link owns its animation state", but `Menu.svelte` keeps every
link's state in three parent-level collections (`phases`, `timers`, `intents`) keyed by
`'first' | 'second' | 'third'`. The state machine (`advance()`) is the most intricate
logic in the project, yet it:

- is spread over six functions and ten inline event handlers;
- has no written list of its states or transitions (`''`, `hover`, `exit`, `press`,
  `release` and `spent`, where `spent` and `''` look the same);
- repeats its durations (240/120/360) in both JS and CSS
  ([Menu.svelte:39-46](src/lib/Menu.svelte#L39-L46) vs [Menu.svelte:151-175](src/lib/Menu.svelte#L151-L175));
- can only be tested by driving a real browser.

**Suggested alternative:** a `MenuLink.svelte` component per link, backed by a small,
framework-free state machine:

```js
// linkMotion.js (sketch)
/** Durations are the single source of truth; CSS reads them as custom properties. */
export const DURATIONS = { hover: 240, press: 120, exit: 360, release: 360 };

/**
 * Link motion, one instance per link.
 *
 *   idle ──hover──▶ hover ──unhover──▶ exit ──▶ idle
 *     │               │
 *     └────press──────┴──▶ press ──(released)──▶ release ──▶ idle
 *
 * A phase always runs to completion. Input during a phase only updates `intent`,
 * and at most one press is queued.
 */
export function createLinkMotion({ onPhase, reducedMotion }) { … }
```

`MenuLink` then becomes: `const motion = createLinkMotion(...)`, then
`<a data-phase={$phase} on:pointerenter={motion.hover} …>`. The state machine can be
unit-tested with fake timers, covering the double-click, rapid hover and
"at most one pending press" requirements directly.

Pass durations to CSS as `style:--hover-ms={DURATIONS.hover}` so the timeline and the
keyframes can't drift apart.

### 3.4 Content is hard-coded inside presentation (OCP)

The name and the three links live in `App.svelte` and `Menu.svelte`. The per-link
horizontal offsets are in CSS, keyed to positional ids:

```css
#first  { left: calc(13 / 64 * 8vh * -0.9); }
#second { left: calc(41 / 64 * 8vh); }
#third  { left: calc(174 / 64 * 8vh); }
/* …and again for portrait with 6vh */
```

Adding, removing or reordering a link means editing markup, ids and six CSS rules in
step. The ids are also global to the document, so `#first` could clash with anything.

**Suggested alternative:** one data module, with offsets as ratios of the link font
size, and a single CSS rule:

```js
// content.js
export const NAME = { first: 'Tony', last: 'Mastromarino' };
/** Offsets are multiples of the link font size (from the original 64px design grid). */
export const LINKS = [
  { label: 'github', href: 'https://github.com/tonydoesathing', offset: -13 / 64, landscapeScale: 0.9 },
  { label: 'resume', href: '/TonyMastromarinoResume.pdf',       offset: 41 / 64 },
  { label: 'email',  href: 'mailto:mastromarino.tony@gmail.com', offset: 174 / 64 },
];
```

```css
.menu { --link-size: 8vh; font-size: var(--link-size); line-height: calc(var(--link-size) * 47 / 64); }
@media (orientation: portrait) { .menu { --link-size: 6vh; left: 1vh; } }
a { left: calc(var(--offset) * var(--link-size)); }
```

The "−0.9 in landscape only" quirk becomes a named, commented field rather than a
one-off selector. `index.html`'s `<noscript>` block could be generated from the same
data (for example with a tiny Vite `transformIndexHtml` plugin), or at least carry a
`<!-- keep in sync with src/content.js -->` comment.

### 3.5 Hidden DOM contracts via data attributes (DIP)

`alignHeading`, `measureLetter`, `rasterizeText` and `ThemeToggle` all depend on
specific markup shapes:

- `element.querySelector('[data-baseline]')`;
- `closest('h1')`;
- `[data-first-name]`, `[data-edge-ink]`;
- `element.firstChild` must be the text node ([rasterizeText.js:12,36](src/lib/rasterizeText.js#L12)).

None of this is written down, and a stray whitespace or wrapper element breaks it with
no error.

**Suggested alternative:** have the low-level utilities take their inputs explicitly:

```js
rasterizeText({ textNode, baselineY, style, hitSlop })
```

Let only the component that owns the markup resolve those inputs. A JSDoc
`@typedef TextTarget` documents the contract once. The zero-width baseline span repeats
in three places (App ×2, created in JS ×3). It should become a `<Baseline />` component,
or a helper that measures the baseline with `Range` and `getClientRects()`.

### 3.6 `measureLetter` is misnamed and in the wrong place

It doesn't just measure. It builds the half-filled "o" artwork (`halfFilledGlyph`),
which only the theme toggle uses. Move it next to the toggle as `themeGlyph.js`, or
name it `buildToggleGlyph`. `ThemeToggle` then also mutates the object it gets back
(`bounds.x = viewportInkRight() - bounds.width`). Return the final value instead.

---

## 4. DRY: duplicated logic

| What | Where | Suggested single home |
| --- | --- | --- |
| rAF-coalesced "remeasure on fonts, resize, DPR or element resize" scheduler with disposal (about 20 lines) | [ThemeToggle.svelte:12-47](src/lib/ThemeToggle.svelte#L12-L47), [wordHitArea.js:216-295](src/lib/wordHitArea.js#L216-L295) | `onLayoutChange(callback, { observe })` → `dispose`, or a `use:remeasure` action |
| Raster alpha → white `ImageData` → canvas → `toDataURL` | [edgeText.js:21-33](src/lib/edgeText.js#L21-L33), [measureLetter.js:28-56](src/lib/measureLetter.js#L28-L56) | `alphaMask(raster, bounds, alphaAt?)` returning a canvas |
| Device-pixel snapping `Math.round(v * dpr) / dpr` | wordHitArea, measureLetter, edgeText, rasterizeText (floor/ceil variants) | `pixels.js`: `snap`, `snapDown`, `snapUp`, `dpr()` |
| Theme key `'theme'`, the valid values, and system resolution | [index.html:6-13](index.html#L6-L13), [ThemeToggle.svelte:59-122](src/lib/ThemeToggle.svelte#L59-L122) | `theme.js` constants. The head script has to stay inline, but can be injected from the same source at build time, or carry a cross-reference comment in both places |
| `color: white` + `mix-blend-mode: difference` ("invert what's beneath") | app.css `h1`, `.menu`, `.link-bar`, ThemeToggle `button` | one documented utility class or custom property, e.g. `.inverts { color: #fff; mix-blend-mode: difference; }`, with a single comment explaining the trick |
| `aria-hidden` + `pointer-events: none` on bars | `.decoration` container **and** each `.bar` | the container alone is enough |
| Motion durations | JS `run(id, 'hover', 240)` and CSS `240ms` | JS constants passed to CSS custom properties (§3.3) |
| Link-offset rules | 3 landscape + 3 portrait selectors | one rule with `--offset` × `--link-size` (§3.4) |
| h1 styles | half in `app.css` (font, colour, blend, z-index), half in `App.svelte` (position, size) | all of it in `Heading.svelte` |

---

## 5. Naming, magic numbers and readability

| Current | Problem | Suggested |
| --- | --- | --- |
| `Rectangle.svelte` | Describes the shape, not the role | `SweepBar.svelte` (and `.decoration` → `.backdrop`) |
| `min_y`, `max_speed`, … | snake_case in a camelCase codebase. Units vary (fractions of vw/vh, px/s) and aren't stated | `minTop`, `speedRange: [24, 36] /* CSS px/s */`, or a single `BAR_CONFIG` object with units in the names (`widthVw`, `heightVh`) |
| `inkBounds(raster, 32)`, `inkBounds(raster, 254)`, `alpha >= 128` | Alpha thresholds with no names | `ALPHA.ANY = 1`, `ALPHA.HIT = 32`, `ALPHA.STROKE = 128`, `ALPHA.SOLID = 254`, each with a one-line reason |
| `rasterizeText(link, baseline, 1)` | Positional boolean-ish `hitSlop` | an options object `{ hitSlop: 1 }`. Better: drop the stroke trick and inflate the measured box by a constant (the same result, easier to follow) |
| `viewportInkRight()` | Sounds like it measures ink; it actually returns the viewport's right edge rounded up to a device pixel | `viewportRightEdge()` in `pixels.js` |
| `phases`, `intents`, `intent(id)`, `next` | `next` is the *intent*, not the next phase. `spent` vs `''` | covered by the state-machine rewrite (§3.3) |
| `#first/#second/#third` | Positional ids | no ids. Use data-driven `--offset` |
| `calc(6 / 128 * 15vh * -1)` in `h1` | Unexplained pre-alignment offset | a named custom property with a comment: "approximate side bearing of 'o' in Forum (6/128 em); refined by `alignEdges` once fonts load" |
| `line-height: calc(8vh / (64 / 47))` | Harder to read than it needs to be | `calc(var(--link-size) * 47 / 64)` |
| `rgba(0, 0, 0, 1)` | Verbose | `#000` / `#fff` |
| z-index `3`, `5`, `10` | Scattered values | `--layer-menu`, `--layer-heading`, `--layer-toggle` defined once |
| [App.svelte:10](src/App.svelte#L10) (a single 200-character line of nested spans) | Hard to read. Whitespace-sensitive, so it looks like it can't be reformatted | Move it into `Heading.svelte`, formatted over several lines with Svelte `{' '}` or HTML comments to control whitespace |

**Documentation gaps.** `checkJs: true` is on, but there is no JSDoc. The recurring
raster object (`{ data, width, height, scale, offsetX, offsetY }`) should be an
`@typedef Raster` with units: raster pixels vs CSS pixels, and which coordinate space
`offsetX` lives in. Mixing up those two coordinate spaces is the most likely source of
future bugs. A short module header on each utility would help too: what it does, its
inputs, its outputs, and which requirement it serves (link to the README section).

---

## 6. Correctness and robustness

1. **Type error that no one sees.** `svelte-check` reports
   `rasterizeText.js:25 Type 'string' is not assignable to type 'CanvasFontKerning'`.
   Map it through a whitelist the same way `TEXT_RENDERING` does. Add
   `"check": "svelte-check"` to `package.json` and run it in CI.
2. **Inconsistent hover/focus handling between the links and the toggle.**
   `Menu` uses `pointerenter`/`pointerleave` and only reacts to `:focus-visible`
   focus. `ThemeToggle` uses `mouseenter`/`mouseleave` and reacts to *any* focus. On
   touch, browsers send emulated `mouseenter` events after a tap, and focus follows a
   click. So the toggle's slice can stay in its hover (left-shifted) position after a
   tap or click until focus leaves. Use pointer events and a `:focus-visible` check in
   both. Better still, share a small `hoverIntent` helper.
3. **Cleanup that can throw.** In `ThemeToggle`'s destroy, `target.closest('h1')` is
   `null` if the anchor has already been detached. This goes away with the §3.1 split,
   because each module then undoes only its own changes.
4. **Dead cleanup code.** `wordHitArea.destroy` loops over every combination of
   `ink`/`underline` and `left`/`top`/`width`/`height`, so it removes `--ink-left`,
   `--ink-width` and `--underline-left`, which are never set. Keep an explicit list of
   the properties that are written, and remove exactly those.
5. **Bold weight that doesn't render as bold.** The menu asks for `font-weight: bold`,
   but Google Fonts only supplies Roboto 400 and `font-synthesis: none` stops the browser
   faking bold, so the loaded page shows regular Roboto. `rasterizeText` then needs a
   special case ("if the web font is loaded use 400, otherwise use the computed weight")
   to match. The README records this as intentional, but a reader of the CSS will
   assume the links are bold. Suggestion: self-host the exact faces (§9.3) and declare
   the weight that is actually shown. The fallback (before load, or if fonts are
   blocked) would then show regular rather than bold; that's a visible change only in
   the fallback state, so it's **your call**. At minimum, add a comment at the CSS
   rule.
6. **The toggle doesn't exist until measurement succeeds.** `{#if bounds}` means that
   if the canvas is blocked (for example, anti-fingerprinting modes in Firefox or Brave
   return blank or noisy `getImageData`), there is **no theme control at all**, and
   blocked canvas reads also break edge alignment and hit areas. Suggestion: always
   render the button, positioned over the letter by its DOM box, and upgrade to the
   raster glyph when measurement succeeds. Treat "`inkBounds` returned null" as the
   plain-DOM path everywhere, not only in some places.
7. **Tab order doesn't follow reading order.** DOM order is github → resume → email →
   toggle, but the toggle sits visually in the title above the links. The §3.1 split
   (toggle rendered inside or next to `Heading`) fixes this naturally.
8. **Focus-ring weight differs.** Links use a 2px outline, the toggle 1px. Make them
   the same (2px) through a shared token.

---

## 7. Performance

The site is light, and none of these are urgent. They matter because they are the
patterns a reviewer will notice.

1. **PNG encode and decode on every remeasure.** `toDataURL()` is called for each
   link, the wrapped first name and the toggle glyph, and every call encodes a PNG
   that the browser then decodes again as a background image. During a window drag
   this happens once per frame. **Alternative:** append the `<canvas>` itself as the
   overlay, sized in CSS pixels. No encoding, no decoding and no data-URL strings in
   the style attribute. The toggle's three slices can each be a canvas drawn from one
   source with `drawImage`.
2. **Interleaved reads and writes.** Inside `scheduleMeasure`, style writes
   (`transform`, `setProperty`, overlay `cssText`) alternate with reads
   (`getBoundingClientRect`, `getComputedStyle`), which forces a synchronous layout
   several times per pass. **Alternative:** do all reads first, then all writes.
   The pure-function split in §3.2 makes this ordering natural.
3. **Redundant rasterization.** Each measure pass rasterizes every link twice (display
   and hit slop), plus the first link a third time for alignment. The hit box is the
   display ink box inflated by a constant, so one raster per word is enough.
4. **Two independent schedulers** each register resize, font and DPR listeners and run
   separate rAF callbacks. A shared `onLayoutChange` (§4) coalesces them into one
   frame.

---

## 8. Testing and verification

There is no automated coverage. Meanwhile the README's "Regression checks" section is a
careful ~20-item manual checklist, and the dev container already installs Playwright
with all three browser engines. Automating that checklist would give the biggest
maintainability gain, and it demonstrates the project well.

**Suggested setup:**

- **Vitest** for the pure units: `inkBounds`, `splitVerticalOverlaps`,
  `underlineGeometry`, the pixel-snap helpers, theme resolution (saved beats system,
  invalid falls back, `null` resumes auto), and the link-motion state machine with
  fake timers (double-click sequence, the one-pending-press cap, hover in the middle of
  an exit).
- **Playwright** (`@playwright/test` as a devDependency with a `playwright.config.js`)
  running the README checklist across chromium, firefox and webkit, at
  `deviceScaleFactor` 1, 1.5 and 2:
  - edge contact: sample screenshot pixels at the left of "g", the right of "y" and
    the right of the toggle "o";
  - 969 vs 970 wrapped-title spacing;
  - `elementFromPoint` grid scans for solid, non-overlapping hit boxes;
  - `click` events are never `defaultPrevented`;
  - theme defaults, override, reload, cross-tab (two pages), cleared storage, and
    blocked storage (`addInitScript` that makes `localStorage` throw);
  - `emulateMedia({ reducedMotion: 'reduce' })`;
  - no console errors.
- **Visual snapshots** (`toHaveScreenshot`) with the bars hidden through a test-only
  stylesheet, covering desktop, portrait, landscape and both themes.
- Rewrite the README's "Regression checks" as "Run `npm test`; these checks are
  automated in `tests/e2e/…`". Keep a short list of the checks that genuinely need a
  person (cross-display DPR moves, real touch devices).

---

## 9. Tooling, build and deployment

1. **Upgrade the stack.** Svelte 3.49 → 5, Vite 3 → current, vite-plugin-svelte 1 →
   current. `npm audit` reports 7 advisories (6 high). They are mostly SSR-only and
   don't affect this static site, but a portfolio shouldn't show red audit output.
   Svelte 5 runes also suit this code well:
   - `$state` / `$derived` for theme and motion;
   - `$effect` with returned cleanup instead of paired `onMount` + manual `disposed`
     flags;
   - attachments (`{@attach}`) as the modern replacement for actions.

   **Do this first**, so the refactor isn't done twice.
2. **Deploy with GitHub Actions instead of committing `docs/`.** Today every source
   change has to be followed by a manual `npm run build` and a commit of hashed bundles
   (the README even lists this as a regression check). That produces noisy diffs,
   leaves room for drift, keeps a duplicate résumé PDF in `public/` and `docs/`, and
   takes over the folder name normally used for documentation. **Alternative:** the
   official `actions/upload-pages-artifact` + `actions/deploy-pages` workflow on push to
   `master`, running `npm ci && npm run check && npm test && npm run build`. Output
   goes to `dist/` (already git-ignored), and `docs/` is deleted from the repo.
3. **Self-host fonts** (for example `@fontsource/forum`, `@fontsource/roboto`, or
   subset `.woff2` files in `public/`):
   - no render-blocking third-party CSS (currently two legacy `css?family=` requests
     with no `preconnect`);
   - no visitor IPs sent to Google (a known GDPR concern);
   - deterministic font versions, which matters because the edge alignment is
     calibrated against these exact glyph rasters;
   - `<link rel="preload">` for the two faces shortens the FOUT and re-measure window.
4. **Add lint and format:** ESLint (flat config) with `eslint-plugin-svelte`, plus
   Prettier with `prettier-plugin-svelte`. Add scripts `lint`, `format`, `check` and
   `test`.
5. **`package.json` metadata:** add `description`, `engines.node` (matching the dev
   container's Node 22), and `repository`. Consider `"packageManager"` for reproducible
   installs.
6. **Dev container:** it installs Codex and Claude Code at `latest`, plus the ChatGPT
   extension. That's fine for you, but for a public portfolio consider moving personal
   tooling to your user-level dotfiles and pinning versions, so the project's
   container only holds what the project needs. `.vscode/extensions.json` could
   recommend the ESLint and Prettier extensions once those are added.

---

## 10. Documentation

- **Split the README.** Keep `README.md` short and aimed at a visitor or contributor:
  what this is, a screenshot, `npm install / dev / test / build`, how deploy works, and
  a one-paragraph architecture overview with links. Move the requirements spec to
  `DESIGN.md` (or `docs/requirements.md` once `docs/` is freed up). It's good material;
  it just isn't a README.
- **Add an architecture section** covering:
  - the "measure the real font raster, display the raster, keep the DOM text for
    semantics" pipeline;
  - the three coordinate spaces (CSS px, device px, raster px);
  - the inversion trick (white + `difference`);
  - where each requirement is implemented. A small Mermaid diagram of
    `fonts/resize/DPR → schedule → measure (read) → apply (write)` would help a
    newcomer more than any comment.
- **Cross-link code and spec.** Module headers could cite the README heading they
  implement, for example `// Implements: "Link hitboxes" (DESIGN.md#link-hitboxes)`.
- **Setup instructions** are currently "run `npm install`". Add the dev, build and
  preview commands, plus the `--host 0.0.0.0` note from `setup.sh`.

---

## 11. Suggested order of work

Each step keeps the site visually identical and can be checked against the previous
step with screenshots.

0. **Fix the two failures in §2:** the reduced-motion specificity bug (a one-rule
   change) and the DPR 1.5 toggle seams.
1. **Safety net first:** add Playwright visual and behavioural tests for the current
   behaviour (§8). They are what prove the later refactors changed nothing.
2. **Toolchain:** upgrade Svelte, Vite and the plugin. Add `check`, `lint`, `format`.
   Fix the `fontKerning` type error. Switch to Actions deployment and delete `docs/`.
3. **Extract shared infrastructure:** `pixels.js`, `alphaMask`, `onLayoutChange`,
   `theme.js` store, `content.js`, CSS tokens (invert, layers, durations).
4. **Restructure components:**
   - `Heading` (with alignment) and `ThemeToggle` (visual only);
   - `LinkMenu` → `MenuLink` + `linkMotion.js`;
   - `Rectangle` → `SweepBar`.
5. **Performance polish:** canvas overlays instead of data URLs, read-then-write
   batching, one raster per word.
6. **Robustness:** a DOM-box fallback when canvas reads fail, pointer-event parity for
   the toggle, a consistent focus ring, and tab order.
7. **Docs:** README/DESIGN split, architecture diagram, JSDoc typedefs.

**Proposed layout.** It's deliberately shallow; this is a ~900-line project and
shouldn't be over-foldered:

```
src/
  main.js
  App.svelte                 composition only
  content.js                 name, links, offsets
  styles/tokens.css          palette, invert, layers, focus ring
  components/
    Heading.svelte           h1 + use:alignEdges + hosts ThemeToggle
    ThemeToggle.svelte
    LinkMenu.svelte
    MenuLink.svelte
    SweepBar.svelte
  lib/
    theme.js                 store + constants (shared with index.html head script)
    linkMotion.js            pure state machine + DURATIONS
    layout/
      onLayoutChange.js      fonts/resize/DPR/ResizeObserver → one rAF
      pixels.js              dpr, snap, viewportRightEdge
      rasterizeText.js
      inkBounds.js
      alphaMask.js
      alignEdges.js          action
      wordHitArea.js         action (orchestration only)
      themeGlyph.js
tests/
  unit/…                     vitest
  e2e/…                      playwright (the README checklist)
```
