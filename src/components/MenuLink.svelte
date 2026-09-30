<!-- One menu link: a real anchor with its ink overlay, underline box and hit
     area. DESIGN.md: "Adopted link motion", "Link hitboxes". -->
<script>
  import { onDestroy } from 'svelte';
  import Baseline from './Baseline.svelte';
  import { createLinkMotion, DURATIONS } from '../lib/linkMotion.js';

  /** @type {import('../content.js').Link} */
  let { label, href, offset, landscapeScale, alignEdge } = $props();

  let phase = $state('idle');
  const motion = createLinkMotion(next => (phase = next));
  onDestroy(motion.stop);

  // Elements bound in the markup below; state, so Baseline can bind into it.
  /** @type {{ link?: HTMLElement, baseline?: HTMLElement, overlay?: HTMLElement, hitArea?: HTMLElement }} */
  const parts = $state({});

  /**
   * This link's parts, for LinkMenu to fit to the rendered word.
   *
   * @returns {import('../lib/fitWords.js').Word}
   */
  export function word() {
    const { link, baseline, overlay, hitArea } = parts;
    const text = /** @type {Text} */ (link.firstChild);
    return { link, text, baseline, overlay, hitArea, alignEdge };
  }

  function press(event) {
    if (event.type === 'pointerdown' && event.button !== 0) return;
    if (event.type === 'keydown' && (event.key !== 'Enter' || event.repeat)) return;
    motion.press();
  }

  function focus(event) {
    if (event.currentTarget.matches(':focus-visible')) motion.enter();
  }
</script>

<!-- The label comes first, so it's the link's first child. -->
<a
  {href}
  bind:this={parts.link}
  data-phase={phase}
  style:--offset={offset}
  style:--landscape-scale={landscapeScale}
  style:--hover-duration="{DURATIONS.hover}ms"
  style:--press-duration="{DURATIONS.press}ms"
  style:--exit-duration="{DURATIONS.exit}ms"
  style:--release-duration="{DURATIONS.release}ms"
  onpointerenter={motion.enter}
  onfocus={focus}
  onpointerdown={press}
  onpointerup={motion.release}
  onpointerleave={motion.leave}
  onpointercancel={motion.leave}
  onkeydown={press}
  onkeyup={motion.release}
  onblur={motion.leave}
  onclick={motion.release}
  >{label}<Baseline bind:marker={parts.baseline} /><span
    class="overlay raster"
    bind:this={parts.overlay}
    aria-hidden="true"
  ></span><span class="bar inverts" aria-hidden="true"></span><span
    class="hit-area"
    bind:this={parts.hitArea}
    aria-hidden="true"
  ></span></a
>

<style>
  /* Offsets are multiples of the menu's link size, set per link from
     content.js; --scale applies the landscape-only factor. */
  a {
    --scale: var(--landscape-scale, 1);
    display: block;
    position: relative;
    left: calc(var(--offset) * var(--scale) * var(--link-size));
    width: max-content;
    color: inherit;
    text-decoration: none;
    pointer-events: auto;
  }

  a:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 3px;
  }

  @media screen and (orientation: portrait) {
    a {
      --scale: 1;
    }
  }

  .overlay {
    position: absolute;
    pointer-events: none;
    background: 0 0 / 100% 100% no-repeat;
  }

  /* Takes over pointer input from the link once fitWords places it. */
  .hit-area {
    position: absolute;
    pointer-events: auto;
    cursor: pointer;
  }

  /* The underline's bottom and width stay fixed as it grows into the box. */
  a {
    --box-top: calc(
      var(--ink-top) -
        (var(--underline-top) + var(--underline-height) - var(--ink-top) - var(--ink-height))
    );
  }
  .bar {
    position: absolute;
    pointer-events: none;
    background: currentColor;
    left: 0;
    top: var(--underline-top);
    width: var(--underline-width);
    height: var(--underline-height);
    transform: scaleX(0);
    transform-origin: left;
  }
  a[data-phase='hover'] .bar {
    transform: scaleX(1);
  }
  a[data-phase='press'] .bar,
  a[data-phase='release'] .bar {
    top: var(--box-top);
    height: calc(var(--underline-top) + var(--underline-height) - var(--box-top));
    transform: scaleX(1);
  }
  a[data-phase='exit'] .bar {
    transform-origin: right;
  }
  a[data-phase='release'] .bar {
    transform-origin: center top;
  }

  /* Motion is opt-in, so reduced motion shows each phase's end state at once. */
  @media (prefers-reduced-motion: no-preference) {
    a[data-phase='hover'] .bar {
      animation: bar-enter var(--hover-duration) linear both;
    }
    /* Explicit start geometry also applies to queued presses: the previous
       release may still have full box dimensions beneath its collapsed scale. */
    a[data-phase='press'] .bar {
      animation: bar-grow var(--press-duration) linear both;
    }
    a[data-phase='exit'] .bar {
      animation: bar-exit var(--exit-duration) linear both;
    }
    a[data-phase='release'] .bar {
      animation: bar-exit-up var(--release-duration) linear both;
    }
  }
  @keyframes bar-grow {
    from {
      top: var(--underline-top);
      height: var(--underline-height);
    }
    to {
      top: var(--box-top);
      height: calc(var(--underline-top) + var(--underline-height) - var(--box-top));
    }
  }
  @keyframes bar-enter {
    from {
      transform: scaleX(0);
    }
    to {
      transform: scaleX(1);
    }
  }
  @keyframes bar-exit {
    from {
      transform: scaleX(1);
    }
    to {
      transform: scaleX(0);
    }
  }
  @keyframes bar-exit-up {
    from {
      transform: scaleY(1);
    }
    to {
      transform: scaleY(0);
    }
  }
</style>
