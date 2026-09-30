<!-- The theme button over the name's last "o": its sliced glyph and motion. -->
<script>
  /** @import { letterBox, themeGlyph } from './themeGlyph.js' */
  import { onMount } from 'svelte';
  import { syncTheme, theme } from '../lib/theme.svelte.js';

  // The button's box over the letter it replaces, with the artwork (source,
  // scale and cuts) once the letter is measured; null hides the button.
  /** @type {{ glyph: ReturnType<typeof themeGlyph> | ReturnType<typeof letterBox> }} */
  let { glyph } = $props();

  onMount(syncTheme);

  // The glyph's three slices, as device rows [from, to). Each is a canvas the
  // glyph's size showing only its own rows, so they meet without seams.
  const slices = $derived.by(() => {
    if (!glyph || !('source' in glyph)) return [];
    const [top, bottom] = glyph.cuts;
    return [
      { name: 'top', from: 0, to: top },
      { name: 'middle', from: top, to: bottom },
      { name: 'bottom', from: bottom, to: glyph.source.height },
    ];
  });

  // Copies the slice's rows unscaled: canvases are one pixel per device pixel.
  const drawSlice = (from, to) => canvas => {
    const { source } = glyph;
    canvas.width = source.width;
    canvas.height = source.height;
    const rows = [0, from, source.width, to - from];
    canvas.getContext('2d').drawImage(source, ...rows, ...rows);
  };

  let motion = $state('');
  let pressed = false;

  function play() {
    if (pressed) return;
    motion = 'enter';
  }

  // Only keyboard focus counts as hover: a tap or click also focuses the
  // button, and that mustn't leave the slice shifted.
  function focus(event) {
    if (event.currentTarget.matches(':focus-visible')) play();
  }

  function leave() {
    if (pressed) release();
    else if (motion !== 'recover') motion = 'exit';
  }

  function press(event) {
    if (event.type === 'keydown' && (event.repeat || ![' ', 'Enter'].includes(event.key))) return;
    if (event.type === 'pointerdown' && event.button !== 0) return;
    pressed = true;
    motion = 'fire';
  }

  function release(event) {
    if (event?.type === 'keyup' && ![' ', 'Enter'].includes(event.key)) return;
    if (!pressed) return;
    pressed = false;
    motion = 'recover';
  }
</script>

{#if glyph}
  <button
    style="transform: translate({glyph.x}px, {glyph.y}px); width: {glyph.width}px; height: {glyph.height}px"
    class="inverts"
    type="button"
    aria-label={theme.current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    onclick={theme.toggle}
    onpointerenter={play}
    onpointerleave={leave}
    onfocus={focus}
    onpointerdown={press}
    onpointerup={release}
    onpointercancel={release}
    onkeydown={press}
    onkeyup={release}
    onblur={leave}
  >
    <span class="art raster {motion}" aria-hidden="true">
      {#each slices as { name, from, to } (name)}
        <canvas
          class={name}
          style:width="{glyph.source.width}px"
          style:height="{glyph.source.height}px"
          style:scale={1 / glyph.scale}
          {@attach drawSlice(from, to)}
        ></canvas>
      {/each}
    </span>
  </button>
{/if}

<style>
  /* Positioned by transform, not left/top: at fractional DPRs, layout rounding
     (Chromium) misses the device grid and leaves seams at the slice cuts. */
  button {
    position: fixed;
    left: 0;
    top: 0;
    z-index: var(--layer-toggle);
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  button:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 4px;
  }
  .art {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  /* Laid out at their pixel size and scaled down by the pixel ratio: WebKit
     draws canvases on whole CSS pixels, so a fractional size is resampled. */
  canvas {
    position: absolute;
    left: 0;
    top: 0;
    transform-origin: 0 0;
  }
  /* Motion is opt-in, so reduced motion keeps the slices at rest. It uses
     translate, which applies after the canvases' scale. */
  @media (prefers-reduced-motion: no-preference) {
    .middle {
      transition: translate 400ms linear;
    }
    .enter .middle {
      translate: -4px;
    }
    .fire .middle {
      translate: 8px;
    }
    .fire .middle,
    .recover .middle {
      transition-duration: 60ms;
    }
  }
</style>
