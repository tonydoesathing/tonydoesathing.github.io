<script>
  import { onMount } from 'svelte';
  import { measureLetter } from './measureLetter.js';
  import { alignHeading } from './alignHeading.js';
  import { onLayoutChange } from './onLayoutChange.js';
  import { viewportRightEdge } from './pixels.js';
  import { syncTheme, theme } from './theme.svelte.js';

  let { target } = $props();
  let bounds = $state();

  onMount(syncTheme);

  $effect(() => {
    if (!target) return;
    const stopMeasuring = onLayoutChange(
      () => {
        alignHeading(target);
        const letter = measureLetter(target);
        // The cropped bitmap has no side bearing: pin its last pixel directly.
        // Both terms are whole device pixels, so x needs no extra snap.
        bounds = letter && { ...letter, x: viewportRightEdge() - letter.width };
        if (bounds) target.style.color = 'transparent';
        else target.style.removeProperty('color');
      },
      { observe: [target.parentElement] },
    );
    return () => {
      stopMeasuring();
      target.style.removeProperty('color');
      target.closest('h1').style.removeProperty('transform');
      const firstName = target.closest('h1').querySelector('[data-first-name]');
      firstName.style.removeProperty('left');
      firstName.style.removeProperty('color');
      firstName.querySelector('[data-edge-ink]').style.cssText = '';
    };
  });

  let motion = $state('');
  let pressed = false;

  function play() {
    if (pressed) return;
    motion = 'enter';
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

{#if bounds}
  <button
    style="transform: translate({bounds.x}px, {bounds.y}px); width: {bounds.width}px; height: {bounds.height}px; --cut-top: {bounds.cutTop}px; --cut-bottom: {bounds.cutBottom}px; --glyph: url('{bounds.glyph}')"
    class="inverts"
    type="button"
    aria-label={theme.current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    onclick={theme.toggle}
    onmouseenter={play}
    onmouseleave={leave}
    onfocus={play}
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
