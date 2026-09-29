<script>
  import { onMount, tick } from 'svelte';

  export let min_y = 1 / 3;
  // CSS pixels per second, independent of the viewport and bar width.
  export let min_speed = 24;
  export let max_speed = 36;
  export let min_width = 0.5;
  export let max_width = 1.5;
  export let min_height = 1 / 24;
  export let max_height = 1 / 8;

  let pass;
  let bar;
  let duration;
  let distance;
  let viewportWidth;
  const random = (min, max) => min + Math.random() * (max - min);

  function reset() {
    pass = {
      width: random(min_width, max_width) * 100,
      height: random(min_height, max_height) * 100,
      y: random(min_y, 1) * 100,
      speed: random(min_speed, max_speed),
      // Only the first pass begins partway across the screen.
      start: pass ? 0 : random(0.05, 0.95),
    };
    updateDuration();
  }

  function updateDuration() {
    viewportWidth = window.innerWidth;
    distance = viewportWidth * (1 + pass.width / 100);
    duration = distance / pass.speed * 1000;
  }

  async function resize() {
    if (!pass || viewportWidth === window.innerWidth) return;
    const animation = bar?.getAnimations()[0];
    const progress = animation?.effect.getComputedTiming().progress;
    updateDuration();
    await tick();
    // Changing duration alone would jump to a different point in the sweep.
    if (animation && progress != null) {
      animation.currentTime = (progress - pass.start) * duration;
    }
  }

  onMount(reset);
</script>

<svelte:window on:resize={resize} />

<!-- Negative delay places the first pass partway through its CSS animation. -->
{#if pass}
  {#key pass}
    <div
      bind:this={bar}
      class="bar"
      aria-hidden="true"
      style="--width: {pass.width}vw; --height: {pass.height}vh; --y: {pass.y}vh; --duration: {duration}ms; --distance: {distance}px; --delay: {-pass.start * duration}ms"
      on:animationend={reset}
    ></div>
  {/key}
{/if}

<style>
  .bar {
    position: fixed;
    left: 100%;
    top: var(--y);
    width: var(--width);
    height: var(--height);
    background: var(--primary);
    pointer-events: none;
    /* Where a bar rests when motion is reduced. */
    transform: translateX(-70vw);
  }

  @media (prefers-reduced-motion: no-preference) {
    .bar { animation: drift var(--duration) linear var(--delay) both; }
  }

  @keyframes drift {
    from { transform: translateX(0); }
    to { transform: translateX(calc(-1 * var(--distance))); }
  }
</style>
