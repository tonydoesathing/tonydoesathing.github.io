<script>
  /** @import { themeGlyph } from './themeGlyph.js' */
  import { onMount } from 'svelte';
  import { syncTheme, theme } from '../lib/theme.svelte.js';

  // The artwork, positioned over the letter it replaces; null hides the button.
  /** @type {{ glyph: ReturnType<typeof themeGlyph> }} */
  let { glyph } = $props();

  onMount(syncTheme);

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
    style="transform: translate({glyph.x}px, {glyph.y}px); width: {glyph.width}px; height: {glyph.height}px; --cut-top: {glyph.cutTop}px; --cut-bottom: {glyph.cutBottom}px; --glyph: url('{glyph.image}')"
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
    <span class="art {motion}" aria-hidden="true">
      <span class="glyph top"></span>
      <span class="glyph middle"></span>
      <span class="glyph bottom"></span>
    </span>
  </button>
{/if}

<style>
  /* Positioned by transform, not left/top: at fractional DPRs, layout rounding
     (Chromium) and clip-path origins (Firefox) miss the device grid and leave
     seams at the slice cuts. */
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
  .glyph {
    position: absolute;
    inset: 0;
    background-image: var(--glyph);
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }
  /* Cuts are snapped to device pixels to keep the three pieces seamless. */
  .top {
    clip-path: inset(0 0 calc(100% - var(--cut-top)) 0);
  }
  .middle {
    clip-path: inset(var(--cut-top) 0 calc(100% - var(--cut-bottom)) 0);
  }
  .bottom {
    clip-path: inset(var(--cut-bottom) 0 0 0);
  }
  /* Motion is opt-in, so reduced motion keeps the slices at rest. */
  @media (prefers-reduced-motion: no-preference) {
    .middle {
      transition: transform 400ms linear;
    }
    .enter .middle {
      transform: translateX(-4px);
    }
    .fire .middle {
      transform: translateX(8px);
    }
    .fire .middle,
    .recover .middle {
      transition-duration: 60ms;
    }
  }
</style>
