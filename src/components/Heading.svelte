<script>
  import Baseline from './Baseline.svelte';
  import ThemeToggle from './ThemeToggle.svelte';
  import { themeGlyph } from './themeGlyph.js';
  import { alignHeading } from '../lib/alignHeading.js';
  import { NAME } from '../content.js';

  // Elements bound in the markup below. Each span's text node comes first.
  // State, so Baseline can bind into them.
  /** @type {{ span?: HTMLElement, baseline?: HTMLElement, overlay?: HTMLElement }} */
  const firstName = $state({});
  /** @type {{ span?: HTMLElement, baseline?: HTMLElement }} */
  const lastLetter = $state({});

  /**
   * The theme toggle's artwork, drawn from the aligned last letter. Drawn
   * here so it comes from the same raster as the alignment it depends on.
   */
  let toggleGlyph = $state(null);

  // Attachments run after the element's child bindings, so the parts are
  // bound by then.
  function align(heading) {
    const firstText = /** @type {Text} */ (firstName.span.firstChild);
    const lastText = /** @type {Text} */ (lastLetter.span.firstChild);
    return alignHeading(
      heading,
      {
        firstName: {
          element: firstName.span,
          text: firstText,
          baseline: firstName.baseline,
          overlay: firstName.overlay,
        },
        lastLetter: { text: lastText, baseline: lastLetter.baseline },
      },
      raster => (toggleGlyph = raster && themeGlyph(raster)),
    );
  }
</script>

<!-- The final letter is split off for the theme toggle to replace. Its
     baseline markers stay in the text flow; the markup avoids whitespace
     between the spans. -->
<h1 class="inverts" {@attach align}>
  <span class="first-name" bind:this={firstName.span}
    >{NAME.first}<Baseline bind:marker={firstName.baseline} /><span
      class="overlay"
      bind:this={firstName.overlay}
      aria-hidden="true"
    ></span></span
  >
  {NAME.last.slice(0, -1)}<span
    bind:this={lastLetter.span}
    style:color={toggleGlyph ? 'transparent' : null}
    >{NAME.last.at(-1)}<Baseline bind:marker={lastLetter.baseline} /></span
  >
</h1>
<ThemeToggle glyph={toggleGlyph} />

<style>
  h1 {
    --size: 15vh;
    /* Roughly the side bearing of Forum's "o" (6/128 em), so the heading
       starts close to the edge; alignHeading refines it once fonts load. */
    --side-bearing: calc(6 / 128 * var(--size));
    position: fixed;
    z-index: var(--layer-heading);
    margin: 0;
    font-family: Forum, serif;
    font-size: var(--size);
    line-height: 0.8;
    top: 30%;
    right: calc(var(--side-bearing) * -1);
    text-align: right;
  }

  @media screen and (orientation: portrait) {
    h1 {
      --size: 15vw;
    }
  }

  .first-name {
    position: relative;
  }

  .overlay {
    position: absolute;
    pointer-events: none;
    background: 0 0 / 100% 100% no-repeat;
  }
</style>
