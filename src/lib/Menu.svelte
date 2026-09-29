<script>
  import { onDestroy } from 'svelte';
  import { wordHitArea } from './wordHitArea.js';

  let phases = {};
  const timers = new Map();
  const intents = new Map();
  const links = [
    { id: 'first', label: 'github', href: 'https://github.com/tonydoesathing' },
    { id: 'second', label: 'resume', href: '/TonyMastromarinoResume.pdf' },
    { id: 'third', label: 'email', href: 'mailto:mastromarino.tony@gmail.com' },
  ];
  function setPhase(id, phase) { phases = { ...phases, [id]: phase }; }
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
    timers.set(id, setTimeout(() => {
      timers.delete(id);
      if (phase === 'exit' || phase === 'release') setPhase(id, 'spent');
      advance(id);
    }, delay));
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

<nav use:wordHitArea class="menu" aria-label="Primary">
  {#each links as link}
    <a id={link.id} href={link.href}
      data-phase={phases[link.id] || ''}
      on:pointerenter={() => enter(link.id)}
      on:focus={event => { if (event.currentTarget.matches(':focus-visible')) enter(link.id); }}
      on:pointerdown={event => press(event, link.id)}
      on:pointerup={() => release(link.id)}
      on:pointerleave={() => leave(link.id)}
      on:pointercancel={() => leave(link.id)}
      on:keydown={event => press(event, link.id)}
      on:keyup={() => release(link.id)}
      on:blur={() => leave(link.id)}
      on:click={() => release(link.id)}>{link.label}</a>
  {/each}
</nav>

<style>
  .menu {
    position: fixed;
    bottom: 10%;
    z-index: 3;
    mix-blend-mode: difference;
    font-family: Roboto, sans-serif;
    font-weight: bold;
    font-size: 8vh;
    line-height: calc(8vh / (64 / 47));
    color: white;
  }

  a {
    display: block;
    position: relative;
    width: max-content;
    color: inherit;
    text-decoration: none;
  }

  #first { left: calc(13 / 64 * 8vh * -0.9); }
  #second { left: calc(41 / 64 * 8vh); }
  #third { left: calc(174 / 64 * 8vh); }


  a:focus-visible {
    outline: 2px solid white;
    outline-offset: 3px;
  }

  @media screen and (orientation: portrait) {
    .menu {
      left: 1vh;
      font-size: 6vh;
      line-height: calc(6vh / (64 / 47));
    }

    #first { left: calc(13 / 64 * 6vh * -1); }
    #second { left: calc(41 / 64 * 6vh); }
    #third { left: calc(174 / 64 * 6vh); }
  }

  /* The underline's bottom and width stay fixed as it grows into the box. */
  a {
    --box-top: calc(var(--ink-top) - (var(--underline-top) + var(--underline-height) - var(--ink-top) - var(--ink-height)));
  }
  .menu :global(.link-bar) {
    position: absolute;
    pointer-events: none;
    background: white;
    mix-blend-mode: difference;
    left: 0;
    top: var(--underline-top);
    width: var(--underline-width);
    height: var(--underline-height);
    transform: scaleX(0);
    transform-origin: left;
    transition: top 120ms linear, height 120ms linear;
  }
  a[data-phase='hover'] :global(.link-bar) {
    transform: scaleX(1);
    animation: bar-enter 240ms linear both;
  }
  a[data-phase='press'] :global(.link-bar),
  a[data-phase='release'] :global(.link-bar) {
    top: var(--box-top);
    height: calc(var(--underline-top) + var(--underline-height) - var(--box-top));
    transform: scaleX(1);
  }
  /* Explicit start geometry also applies to queued presses: the previous
     release may still have full box dimensions beneath its collapsed scale. */
  a[data-phase='press'] :global(.link-bar) {
    transition: none;
    animation: bar-grow 120ms linear both;
  }
  a[data-phase='exit'] :global(.link-bar) {
    transform-origin: right;
    animation: bar-exit 360ms linear both;
  }
  a[data-phase='release'] :global(.link-bar) {
    transform-origin: center top;
    animation: bar-exit-up 360ms linear both;
  }
  @keyframes bar-grow {
    from { top: var(--underline-top); height: var(--underline-height); }
    to { top: var(--box-top); height: calc(var(--underline-top) + var(--underline-height) - var(--box-top)); }
  }
  @keyframes bar-enter { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes bar-exit { from { transform: scaleX(1); } to { transform: scaleX(0); } }
  @keyframes bar-exit-up { from { transform: scaleY(1); } to { transform: scaleY(0); } }

  @media (prefers-reduced-motion: reduce) {
    .menu :global(.link-bar) { transition: none; animation: none; }
  }
</style>
