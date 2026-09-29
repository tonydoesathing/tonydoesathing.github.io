<script>
  import { onDestroy } from 'svelte';
  import { wordHitArea } from './wordHitArea.js';
  import { LINKS } from '../content.js';

  let phases = {};
  // Plain Maps: this bookkeeping never renders, so it needn't be reactive.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const timers = new Map();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const intents = new Map();
  function setPhase(id, phase) {
    phases = { ...phases, [id]: phase };
  }
  function intent(id) {
    if (!intents.has(id)) intents.set(id, { hover: false, held: false, press: false });
    return intents.get(id);
  }
  function reset() {
    timers.forEach(clearTimeout);
    timers.clear();
    intents.clear();
    phases = {};
  }
  // Let each CSS motion complete. Repeated input updates the next intent,
  // rather than replacing a running animation or building an unbounded queue.
  function run(id, phase, duration) {
    setPhase(id, phase);
    const delay = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : duration;
    timers.set(
      id,
      setTimeout(() => {
        timers.delete(id);
        if (phase === 'exit' || phase === 'release') setPhase(id, 'spent');
        advance(id);
      }, delay),
    );
  }
  function advance(id) {
    if (timers.has(id)) return;
    const next = intent(id);
    if (phases[id] === 'press') {
      if (!next.held) run(id, 'release', 360);
    } else if (next.press) {
      next.press = false;
      run(id, 'press', 120);
    } else if (next.hover && phases[id] !== 'hover') {
      run(id, 'hover', 240);
    } else if (!next.hover && phases[id] === 'hover') {
      run(id, 'exit', 360);
    }
  }
  function enter(id) {
    intent(id).hover = true;
    advance(id);
  }
  function press(event, id) {
    if (event.type === 'pointerdown' && event.button !== 0) return;
    if (event.type === 'keydown' && (event.key !== 'Enter' || event.repeat)) return;
    const next = intent(id);
    next.held = true;
    next.hover = false;
    // A second click waits for the first rectangle to finish collapsing.
    next.press = true;
    advance(id);
  }
  function release(id) {
    intent(id).held = false;
    advance(id);
  }
  function leave(id) {
    const next = intent(id);
    next.hover = false;
    next.held = false;
    advance(id);
  }
  onDestroy(reset);
</script>

<nav use:wordHitArea class="menu inverts" aria-label="Primary">
  {#each LINKS as link (link.label)}
    <a
      href={link.href}
      style:--offset={link.offset}
      style:--landscape-scale={link.landscapeScale}
      data-phase={phases[link.label] || ''}
      on:pointerenter={() => enter(link.label)}
      on:focus={event => {
        if (event.currentTarget.matches(':focus-visible')) enter(link.label);
      }}
      on:pointerdown={event => press(event, link.label)}
      on:pointerup={() => release(link.label)}
      on:pointerleave={() => leave(link.label)}
      on:pointercancel={() => leave(link.label)}
      on:keydown={event => press(event, link.label)}
      on:keyup={() => release(link.label)}
      on:blur={() => leave(link.label)}
      on:click={() => release(link.label)}>{link.label}</a
    >
  {/each}
</nav>

<style>
  .menu {
    --link-size: 8vh;
    position: fixed;
    bottom: 10%;
    z-index: var(--layer-menu);
    font-family: Roboto, sans-serif;
    font-weight: bold;
    font-size: var(--link-size);
    line-height: calc(var(--link-size) * 47 / 64);
  }

  /* Offsets are multiples of the link size, set per link from content.js;
     --scale applies the landscape-only factor. */
  a {
    --scale: var(--landscape-scale, 1);
    display: block;
    position: relative;
    left: calc(var(--offset) * var(--scale) * var(--link-size));
    width: max-content;
    color: inherit;
    text-decoration: none;
  }

  a:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 3px;
  }

  @media screen and (orientation: portrait) {
    .menu {
      --link-size: 6vh;
      left: 1vh;
    }

    a {
      --scale: 1;
    }
  }

  /* The underline's bottom and width stay fixed as it grows into the box. */
  a {
    --box-top: calc(
      var(--ink-top) -
        (var(--underline-top) + var(--underline-height) - var(--ink-top) - var(--ink-height))
    );
  }
  .menu :global(.link-bar) {
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
  a[data-phase='hover'] :global(.link-bar) {
    transform: scaleX(1);
  }
  a[data-phase='press'] :global(.link-bar),
  a[data-phase='release'] :global(.link-bar) {
    top: var(--box-top);
    height: calc(var(--underline-top) + var(--underline-height) - var(--box-top));
    transform: scaleX(1);
  }
  a[data-phase='exit'] :global(.link-bar) {
    transform-origin: right;
  }
  a[data-phase='release'] :global(.link-bar) {
    transform-origin: center top;
  }

  /* Motion is opt-in, so reduced motion shows each phase's end state at once. */
  @media (prefers-reduced-motion: no-preference) {
    a[data-phase='hover'] :global(.link-bar) {
      animation: bar-enter 240ms linear both;
    }
    /* Explicit start geometry also applies to queued presses: the previous
       release may still have full box dimensions beneath its collapsed scale. */
    a[data-phase='press'] :global(.link-bar) {
      animation: bar-grow 120ms linear both;
    }
    a[data-phase='exit'] :global(.link-bar) {
      animation: bar-exit 360ms linear both;
    }
    a[data-phase='release'] :global(.link-bar) {
      animation: bar-exit-up 360ms linear both;
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
