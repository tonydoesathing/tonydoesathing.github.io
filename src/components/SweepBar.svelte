<script>
  import { onMount, tick } from 'svelte';

  // [min, max] ranges; each pass picks uniformly within them. Speed is in
  // CSS pixels per second, independent of the viewport and bar width.
  let {
    widthVw = [50, 150],
    heightVh = [100 / 24, 100 / 8],
    topVh = [100 / 3, 100],
    speedPxPerSecond = [24, 36],
  } = $props();

  let pass = $state.raw();
  let duration = $state();
  let distance = $state();
  let delay = $state();
  let bar = $state();
  let viewportWidth;
  /** @param {number[]} range */
  const random = ([min, max]) => min + Math.random() * (max - min);

  function reset() {
    pass = {
      width: random(widthVw),
      height: random(heightVh),
      y: random(topVh),
      speed: random(speedPxPerSecond),
      // Only the first pass begins partway across the screen.
      start: pass ? 0 : random([0.05, 0.95]),
    };
    updateDuration();
  }

  function updateDuration() {
    viewportWidth = window.innerWidth;
    distance = viewportWidth * (1 + pass.width / 100);
    duration = (distance / pass.speed) * 1000;
    delay = -pass.start * duration;
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

<svelte:window onresize={resize} />

<!-- Negative delay places the first pass partway through its CSS animation. -->
{#if pass}
  {#key pass}
    <div
      bind:this={bar}
      class="bar"
      style="--width: {pass.width}vw; --height: {pass.height}vh; --y: {pass.y}vh; --duration: {duration}ms; --distance: {distance}px; --delay: {delay}ms"
      onanimationend={reset}
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
    /* Where a bar rests when motion is reduced. */
    transform: translateX(-70vw);
  }

  @media (prefers-reduced-motion: no-preference) {
    .bar {
      animation: drift var(--duration) linear var(--delay) both;
    }
  }

  @keyframes drift {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(calc(-1 * var(--distance)));
    }
  }
</style>
