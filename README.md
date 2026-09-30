# Personal Site

This is a landing page for my GitHub, built with Svelte and Vite and published through GitHub Pages.

## Setup and development

Install Node 22 (see `.nvmrc`), then run `npm install`. Optionally, use the dev container.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload. |
| `npm run build` | Production build to `dist/`. |
| `npm run preview` | Serve the built `dist/` locally. |
| `npm run check` | Type-check JS and Svelte with `svelte-check`. |
| `npm run lint` | ESLint, then Prettier in check mode. |
| `npm run format` | Rewrite files with Prettier. |
| `npm test` | Unit tests, then end-to-end tests (see Regression checks). |

GitHub Actions (`.github/workflows/deploy.yml`) checks, tests, builds and deploys every push to `master`. In the repository's Pages settings, the source must be set to **GitHub Actions**.


## Requirements and design decisions

This is the reference for the owner’s established requirements and adopted behavior. Later decisions supersede earlier experiments. Values identified as **current implementation** document the existing composition and tuning; they are not permission to redesign it.

### Purpose and content

- Keep the site a minimal portfolio-style landing page built around the name, three links, moving bars, and an integrated theme control.
- Display the title **Tony Mastromarino**.
- Keep the lowercase links in this order:

| Label | Destination |
| --- | --- |
| github | `https://github.com/tonydoesathing` |
| resume | `/TonyMastromarinoResume.pdf` |
| email | `mailto:mastromarino.tony@gmail.com` |

- Keep links as real anchors. Mouse clicks, touch, keyboard activation, modified clicks, and normal browser link behavior must continue to work.
- Navigation must happen normally and immediately. Never prevent or delay navigation to finish an animation; it is fine if leaving the page cuts the animation short.

### Visual style and composition

- Preserve the established text locations, sizes, tight spacing, and staggered link arrangement. Fixing hitboxes or animation must not move the typography.
- Keep the monochrome primary/background palette. Light and dark modes swap these colors.
- Preserve the typography-led composition, hard rectangular bars, inversion effects, and intentional contact with screen edges.
- Motion should fit the page’s horizontal movement. Use the adopted underline, rectangle, and slice behavior rather than unrelated hover effects.
- The final site must contain only its base experience: no motion preview panels, numbered options, direction selectors, or “Follow links” controls.

**Current implementation of the layout:**

| Element | Layout and typography |
| --- | --- |
| Title | Forum; fixed at `top: 30%`; right aligned; `font-size: 15vh`, changing to `15vw` in portrait orientation. |
| Title line spacing | Unitless `line-height: 0.8` at every viewport size and orientation. |
| Link menu | Roboto, requested bold with font synthesis disabled; fixed at `bottom: 10%`; staggered horizontal positions. |
| Landscape links | `font-size: 8vh`; line height `8vh × 47/64`. |
| Portrait links | `font-size: 6vh`; line height `6vh × 47/64`; menu starts at `left: 1vh`. |
| Page margin | Preserve the existing `8px` body margin as part of the composition. |

The fonts are self-hosted in `public/fonts`: the latin-subset Forum and Roboto 400 files Google Fonts serves, with their OFL licences. Only the latin subset is included; add the matching subset file if content needs other scripts.

The link offsets before optical edge alignment are `−0.9 × 13/64`, `41/64`, and `174/64` times the landscape link font size. In portrait, the first becomes `−13/64` times the link font size; the other ratios remain the same. Preserve the resulting placement rather than replacing it with a conventionally spaced menu.

### Responsive wrapping and exact edge alignment

- The heading may wrap between the first and last names when space requires it.
- Wrapped heading spacing must stay consistent across breakpoints. In particular, the previously observed jump between widths 969 and 970 must not return.
- Use `line-height: 0.8` everywhere, including unwrapped layouts. The vertical adjustment resulting from that decision was accepted.
- Align visible glyph ink to viewport edges, not merely the text element’s box or the font’s side bearings:
  - The solid left edge of the **g** in **github** must touch the left edge of the screen.
  - When **Tony** occupies its own line, the right edge of its **y** must touch the right edge of the screen.
  - The final **o**, which is the theme control, must touch the right edge of the screen.
- A faint antialiased column that looks like a gap is not sufficient for the left edge of the **g**. Align the solid stroke there.
- Preserve vertical positions and wrapping when correcting horizontal alignment.
- Recalculate alignment when fonts load, the viewport changes, or display pixel density changes, including moving the window between displays.
- Verify across Chromium, Firefox, and WebKit/Safari, mobile and desktop sizes, and standard, Retina, and fractional pixel densities.

**Implementation and limitation:** the site measures and crops font rasters for consistent visible edges while retaining the original text in the document. Browser compositing at fractional scaling can still affect the last physical pixel; a one-device-pixel fringe was observed at the right edge in a Chromium fractional-scale screenshot. This is a known rendering limitation, not a relaxation of the intended edge alignment.

### Background bars and inversion

- Preserve the central effect: horizontal bars sweep across the screen, and the title and links invert where the bars pass beneath them.
- Keep randomness in the bars’ geometry, placement, and speed.
- Drive continuous movement with CSS animation, outside a JavaScript frame-by-frame animation loop, for smooth and efficient rendering.
- Bars must move at a slow, consistent pixel speed independent of screen width. A desktop viewport must not make them move faster than a mobile viewport.
- On initial load, bars begin at randomized progress across their paths rather than all starting at the screen edge.
- Subsequent passes may start offscreen and get newly randomized values.
- Resizing must preserve movement progress rather than visibly restarting the sweep.
- Decorative bars must not intercept pointer events or become interactive content.

**Current implementation:** three independent bars travel from right to left using linear CSS transform animations. Each pass chooses a speed between **24 and 36 CSS pixels/second**, width between **50 and 150vw**, height between **1/24 and 1/8 of the viewport height**, and top position between **one-third and the full viewport height**. Initial progress is randomized between **5% and 95%**. JavaScript selects each pass and adjusts timing on resize; it does not advance the bars every frame.

### Link hitboxes

- Every word must have a complete, solid rectangular hitbox, including the spaces between letters and the holes inside letters.
- Do not use individual letter-shaped hit regions. That experiment was explicitly rejected.
- Keep hitboxes snug around the visible words rather than using oversized font line boxes that overlap neighboring links.
- Divide shared areas between adjacent rows so hovering one link does not select another.
- Preserve native link behavior and visible keyboard focus.
- Keep hitboxes stationary throughout hover and press effects.
- Visual animation bounds and interactive hitboxes have different purposes. Do not size the pressed graphic from the padded or divided hitbox.

**Current implementation:** font raster measurements produce compact rectangular targets with a small edge allowance. Vertical overlaps are split halfway between neighboring rectangles. Browser hit testing handles the targets without continuous JavaScript pointer tracking.

### Adopted link motion

The permanent treatment is the former **option 7: balanced underline box with upward release**, with **rightward underline motion**.

| State | Required appearance and movement |
| --- | --- |
| Idle | The word stays in place, without a visible bar. |
| Hover / keyboard focus | A substantial underline draws from left to right beneath the word. Match the heavier feel of the original link underlines, not a hairline. |
| Hover exit | The underline retracts toward the right. |
| Press | That same underline grows upward into a rectangle that inverts the word. It must read as one continuous shape, not an underline disappearing while a separate box appears. |
| Pressed geometry | Keep the underline’s width, horizontal location, and bottom edge fixed. Extend the top above the visible text by the same distance that the underline’s outside bottom edge sits below the visible text. This creates balanced space above and below, as if there were an overline too. |
| Release | The rectangle shrinks upward: its bottom rises toward its fixed top until it disappears. Its width stays constant during this collapse. |

- The typography itself must remain stationary.
- Do not morph the underline into a smaller ink-bound rectangle by moving its bottom or changing its width. The fixed underline footprint and balanced top extension are intentional refinements.
- Measure the visible text to establish the expanded top; do not use the font line box or link hitbox as a substitute.
- Each link owns its animation state. Moving onto another link must not cut off the previous link’s exit.
- Repeated input must not restart an in-flight animation or cause a visible jump.
- Let the current motion finish, then handle the latest hover intent or a queued press. Avoid an unbounded backlog of clicks.
- A double-click must produce **grow upward → shrink upward → grow upward from the underline → shrink upward**. The second press must not suddenly display a full rectangle.
- The same completion rule applies to rapid hover-off/hover-on sequences.
- Animation queuing is visual only. It must never queue, suppress, or delay actual link navigation.

**Current tuning:** underline entry **240ms**, upward growth **120ms**, underline exit and upward collapse **360ms**, all linear. Underline thickness is approximately **font size / 12**, snapped to device pixels. At most one extra press is pending per link.

### Theme control: appearance and motion

- The theme switcher is the **last o in Mastromarino**, replacing that letter visually in exactly its original position and size.
- Keep the control icon-only. It is no longer a separate bottom-right button.
- Reuse the actual Forum **o** glyph, preserving its noncircular contour and uneven stroke thickness. Do not substitute a geometric circle.
- Fill half of the glyph’s interior while preserving its font outline.
- Keep the original letter in the text layout so integrating the control does not alter spacing or wrapping.
- Animate only a horizontal middle slice of the glyph:
  - On hover/focus, the slice moves left.
  - On press, it shoots back in the opposite direction, to the right.
  - On release, it returns to the center.
- Do not add a special inversion, lightening, or fill change to the press effect. The click still changes the whole site’s theme normally.
- Render the split glyph without thin white seams or borders around the middle slice. Align cut boundaries to physical pixels.
- Keep a real keyboard-operable button with an accessible label describing the next theme action.

**Current tuning:** the center slice spans approximately **35–65%** of glyph height; hover offset is **−4px**, press offset **+8px**, resting offset **0**. Hover/exit transition is **400ms**; press/recovery is **60ms**, using linear motion.

### Theme selection, persistence, and restoration

- Light mode uses a white background and black primary color; dark mode swaps them.
- On a first visit with no saved choice, follow the user’s operating-system/browser light or dark preference.
- Apply the resolved theme before the first page paint to avoid flashing the wrong theme.
- Save an explicit toggle choice and restore it on subsequent visits. A valid saved choice takes precedence over the system preference.
- Do not save the automatically detected system theme as if the visitor explicitly selected it.
- While no explicit override exists, respond to live system-theme changes.
- A manual choice must remain in effect when the system theme subsequently changes.
- Synchronize saved changes between open tabs. Removing or clearing the saved choice restores system-following behavior.
- Ignore invalid saved values and fall back to the system preference.
- If browser storage is unavailable, the site and toggle must still work; the manual choice can apply for the current page without persistence.
- Keep browser `color-scheme` consistent with the selected theme.

**Current implementation:** the `theme` localStorage key stores `light` or `dark`; `prefers-color-scheme` supplies the default. The visible control remains a two-way light/dark toggle. A separate **Use system** control was discussed as optional and has not been adopted.

### Accessibility, performance, and maintenance

- Respect `prefers-reduced-motion`: background bars become static and interactive movement is disabled while controls and links remain usable.
- Preserve semantic title text, meaningful link names, keyboard activation, visible focus, and the theme button’s accessible action label.
- Keep duplicate raster graphics, baseline markers, and decorative bars out of the accessibility tree.
- Use CSS for continuous visual motion. JavaScript may handle randomness, measurements, input state, preferences, and animation sequencing; avoid continuous animation or mouse-tracking loops.
- Coalesce font/resize measurements and clean up listeners, observers, and timers when components are destroyed.
- Use valid case-sensitive canvas text-rendering values. The earlier `optimizelegibility` warning must not return; the canvas enum is `optimizeLegibility`.
- Keep the code purposeful and clean. Remove unused assets, abandoned effects, preview-only controls, and obsolete state when an experiment is adopted.

## Superseded experiments

These are historical context, not additional requirements to implement:

- The standalone bottom-right theme button was replaced by the final title **o**.
- Theme-button previews, including the bordered-box alternative, were removed after adopting the middle-slice treatment. Its press inversion was subsequently removed.
- Letter-shaped link hitboxes were replaced by solid word rectangles.
- Link motion options 1–6 were experiments. Option 7 was adopted, then refined for thicker underlines and uninterrupted queued motion.
- The left/right comparison selector was removed after choosing **rightward** underline motion.
- Link previews temporarily suppressed navigation for comparison. The production experience must never retain that suppression.

## Regression checks

Run `npm test`, or `npm run test:unit` and `npm run test:e2e` separately. Vitest covers pure helpers in `tests/unit`. Playwright runs `tests/e2e` in Chromium, Firefox and WebKit against its own Vite server on port 5174; outside the dev container, install its browsers first with `npx playwright install`.

The end-to-end suite checks edge contact at DPR 1, 1.5 and 2, toggle seams, 969/970 heading spacing, hit areas (and no pointer input beside the words), navigation, link motion, reduced motion, theme selection and persistence, accessibility and keyboard use, console errors and warnings, and bar progress across resizes. It also checks the plain-text fallback when canvas reads are blank, opaque or unavailable (as under anti-fingerprinting) and in Chromium's forced colours. It also compares Chromium screenshots, with the bars hidden, against the Linux baselines in `tests/e2e/visual.spec.js-snapshots`, so run it in the dev container. After an intended visual change, review the diff and then run `npx playwright test visual --update-snapshots`. CI skips these `@visual` tests (`--grep-invert @visual`), because the baselines are platform-specific.

These still need a person:

- Real touch devices: tap, press and hold, and dragging off a link.
- Moving the window between displays with different pixel densities.
- Real macOS and Windows font rendering, including Safari.
