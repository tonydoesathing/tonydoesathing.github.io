# Design

This is the reference for the owner’s established requirements and adopted behavior. Later decisions supersede earlier experiments. Values identified as **current implementation** document the existing composition and tuning; they are not permission to redesign it. Each section ends with the files that implement it, under `src/` apart from `index.html`. See the [README](README.md#how-it-works) for how the pieces fit together.

## Purpose and content

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

**Current implementation:** the name and links live in `content.js`; `index.html` repeats them in a `<noscript>` fallback.

**Implemented in:** `content.js`, `components/MenuLink.svelte`, `index.html`.

## Visual style and composition

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

The fonts are self-hosted in `public/fonts` and preloaded: the latin-subset Forum and Roboto 400 files Google Fonts serves, with their OFL licences. Only the latin subset is included; add the matching subset file if content needs other scripts. Only regular weights exist, so with synthesis off the menu’s requested bold renders regular, as it always has.

The link offsets before optical edge alignment are `−0.9 × 13/64`, `41/64`, and `174/64` times the landscape link font size. In portrait, the first becomes `−13/64` times the link font size; the other ratios remain the same. Preserve the resulting placement rather than replacing it with a conventionally spaced menu. The offsets live in `content.js`.

**Implemented in:** `components/Heading.svelte`, `components/LinkMenu.svelte`, `components/MenuLink.svelte`, `app.css`.

## Responsive wrapping and exact edge alignment

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

**Implementation and limitation:** the site measures and crops font rasters for consistent visible edges while retaining the original text in the document. The heading moves by whole device pixels so its last letter’s ink meets the right edge; each link, and a wrapped **Tony**, is replaced by a cropped raster overlay; the **github** overlay and **Tony**’s are pinned to their edges. The overlays are PNG data URLs rather than canvases, because WebKit places canvases on whole CSS pixels inside fractional or transformed boxes, which breaks edge contact. If the canvas can’t be read back faithfully (unavailable, blank, or noised by anti-fingerprinting), the text stays plain and unaligned rather than risking wrong measurements. Browser compositing at fractional scaling can still affect the last physical pixel; a one-device-pixel fringe was observed at the right edge in a Chromium fractional-scale screenshot. This is a known rendering limitation, not a relaxation of the intended edge alignment.

**Implemented in:** `lib/alignHeading.js`, `lib/fitWords.js`, `lib/edgeText.js`, `lib/rasterizeText.js`, `lib/inkBounds.js`, `lib/onLayoutChange.js`, `lib/pixels.js`.

## Background bars and inversion

- Preserve the central effect: horizontal bars sweep across the screen, and the title and links invert where the bars pass beneath them.
- Keep randomness in the bars’ geometry, placement, and speed.
- Drive continuous movement with CSS animation, outside a JavaScript frame-by-frame animation loop, for smooth and efficient rendering.
- Bars must move at a slow, consistent pixel speed independent of screen width. A desktop viewport must not make them move faster than a mobile viewport.
- On initial load, bars begin at randomized progress across their paths rather than all starting at the screen edge.
- Subsequent passes may start offscreen and get newly randomized values.
- Resizing must preserve movement progress rather than visibly restarting the sweep.
- Decorative bars must not intercept pointer events or become interactive content.

**Current implementation:** three independent bars travel from right to left using linear CSS transform animations. Each pass chooses a speed between **24 and 36 CSS pixels/second**, width between **50 and 150vw**, height between **1/24 and 1/8 of the viewport height**, and top position between **one-third and the full viewport height**. Initial progress is randomized between **5% and 95%**. JavaScript selects each pass and adjusts timing on resize; it does not advance the bars every frame. Inversion comes from white text blended with `mix-blend-mode: difference` (the `.inverts` class): it reads as the primary colour in either theme and flips wherever a bar passes.

**Implemented in:** `components/SweepBar.svelte`, `App.svelte`, `app.css`.

## Link hitboxes

- Every word must have a complete, solid rectangular hitbox, including the spaces between letters and the holes inside letters.
- Do not use individual letter-shaped hit regions. That experiment was explicitly rejected.
- Keep hitboxes snug around the visible words rather than using oversized font line boxes that overlap neighboring links.
- Divide shared areas between adjacent rows so hovering one link does not select another.
- Preserve native link behavior and visible keyboard focus.
- Keep hitboxes stationary throughout hover and press effects.
- Visual animation bounds and interactive hitboxes have different purposes. Do not size the pressed graphic from the padded or divided hitbox.

**Current implementation:** each word’s target is its raster ink box grown by **1 CSS pixel** and rounded outwards to device pixels. Vertical overlaps are split halfway between neighboring rectangles. A hit-area element inside each link takes pointer input; the menu and links themselves ignore the pointer, so the space beside the words is inert. Browser hit testing handles the targets without continuous JavaScript pointer tracking. Without a measurement, a link keeps its own box as its target.

**Implemented in:** `lib/fitWords.js`, `components/MenuLink.svelte`.

## Adopted link motion

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

**Current tuning:** underline entry **240ms**, upward growth **120ms**, underline exit and upward collapse **360ms**, all linear; `DURATIONS` in `lib/linkMotion.js` is the single source for these, and the CSS animations read them. The underline sits **0.06em** below the baseline and is **font size / 12** thick, both snapped to device pixels. At most one extra press is pending per link. After a click, hover shows again only once the pointer leaves and re-enters.

**Implemented in:** `lib/linkMotion.js`, `components/MenuLink.svelte`, `lib/fitWords.js` (geometry).

## Theme control: appearance and motion

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

**Current implementation:** the glyph is drawn from the aligned letter’s raster as three canvases at device resolution, one per slice, cut on device rows and positioned by a transform snapped to device pixels, so the slices meet without seams. Only pointer hover and keyboard (`:focus-visible`) focus shift the slice, so a tap doesn’t leave it shifted. The button follows the heading in the DOM, so it comes before the links in tab order. Links and toggle share a 2px focus ring. If the letter can’t be measured, the button still covers the letter’s text box, with no artwork, and the letter stays visible.

**Implemented in:** `components/ThemeToggle.svelte`, `components/themeGlyph.js`, `components/Heading.svelte`.

## Theme selection, persistence, and restoration

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

**Current implementation:** the `theme` localStorage key stores `light` or `dark`; `prefers-color-scheme` supplies the default. The visible control remains a two-way light/dark toggle. A separate **Use system** control was discussed as optional and has not been adopted. An inline script in `index.html` sets `data-theme` and `color-scheme` before the first paint, so even the page canvas starts in the right colour.

**Implemented in:** `lib/theme.svelte.js`, `index.html`.

## Accessibility, performance, and maintenance

- Respect `prefers-reduced-motion`: background bars become static and interactive movement is disabled while controls and links remain usable.
- Preserve semantic title text, meaningful link names, keyboard activation, visible focus, and the theme button’s accessible action label.
- Keep duplicate raster graphics, baseline markers, and decorative bars out of the accessibility tree.
- Use CSS for continuous visual motion. JavaScript may handle randomness, measurements, input state, preferences, and animation sequencing; avoid continuous animation or mouse-tracking loops.
- Coalesce font/resize measurements and clean up listeners, observers, and timers when components are destroyed.
- Use valid case-sensitive canvas text-rendering values. The earlier `optimizelegibility` warning must not return; the canvas enum is `optimizeLegibility`.
- Keep the code purposeful and clean. Remove unused assets, abandoned effects, preview-only controls, and obsolete state when an experiment is adopted.

**Current implementation:** motion CSS is opt-in under `prefers-reduced-motion: no-preference`, and link phases complete instantly under reduced motion. In forced-colors mode the raster overlays are hidden and the plain text shown, since forced colours defeat the inversion. `onLayoutChange` coalesces font, resize, pixel-ratio and element-resize triggers into one frame, and each pass reads every measurement before writing any.

**Implemented in:** `app.css`, `lib/onLayoutChange.js`, and the reduced-motion rules in each component.

## Superseded experiments

These are historical context, not additional requirements to implement:

- The standalone bottom-right theme button was replaced by the final title **o**.
- Theme-button previews, including the bordered-box alternative, were removed after adopting the middle-slice treatment. Its press inversion was subsequently removed.
- Letter-shaped link hitboxes were replaced by solid word rectangles.
- Link motion options 1–6 were experiments. Option 7 was adopted, then refined for thicker underlines and uninterrupted queued motion.
- The left/right comparison selector was removed after choosing **rightward** underline motion.
- Link previews temporarily suppressed navigation for comparison. The production experience must never retain that suppression.
