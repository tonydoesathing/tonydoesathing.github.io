<script>
  import { onMount, tick } from 'svelte';
  import { measureLetter } from './measureLetter';

  export let target;
  let bounds;

  onMount(() => {
    let disposed = false;
    let observer;
    const measure = () => {
      if (disposed || !target) return;
      bounds = measureLetter(target);
      target.style.color = 'transparent';
    };

    tick().then(() => {
      if (disposed) return;
      measure();
      observer = new ResizeObserver(measure);
      observer.observe(target.parentElement);
    });
    document.fonts.ready.then(measure);
    document.fonts.addEventListener('loadingdone', measure);
    window.addEventListener('resize', measure);
    return () => {
      disposed = true;
      observer?.disconnect();
      document.fonts.removeEventListener('loadingdone', measure);
      window.removeEventListener('resize', measure);
      if (target) target.style.removeProperty('color');
    };
  });

  let dark = document.documentElement.dataset.theme === 'dark';
  let motion = '';
  let pressed = false;

  function play() {
    if (pressed) return;
    motion = 'enter';
  }

  function leave() {
    if (pressed) release();
    else if (motion !== 'recover') motion = 'exit';
  }

  function fire() {
    motion = 'fire';
  }

  function press(event) {
    if (event.type === 'keydown' && (event.repeat || ![' ', 'Enter'].includes(event.key))) return;
    if (event.type === 'pointerdown' && event.button !== 0) return;
    pressed = true;
    fire();
  }

  function release(event) {
    if (event?.type === 'keyup' && ![' ', 'Enter'].includes(event.key)) return;
    if (!pressed) return;
    pressed = false;
    motion = 'recover';
  }

  function toggle() {
    dark = !dark;
    const theme = dark ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('theme', theme); } catch {}
  }

</script>

{#if bounds}
<button
  style="left: {bounds.x}px; top: {bounds.y}px; width: {bounds.width}px; height: {bounds.height}px; --cut-top: {bounds.cutTop}px; --cut-bottom: {bounds.cutBottom}px; --glyph: url('{bounds.glyph}')"
  type="button"
  aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
  on:click={toggle}
  on:mouseenter={play}
  on:mouseleave={leave}
  on:focus={play}
  on:pointerdown={press}
  on:pointerup={release}
  on:pointercancel={release}
  on:keydown={press}
  on:keyup={release}
  on:blur={leave}
>
  <span class="art {motion}" aria-hidden="true">
    <span class="glyph top"></span>
    <span class="glyph middle"></span>
    <span class="glyph bottom"></span>
  </span>
</button>
{/if}

<style>
  button {
    position: fixed;
    z-index: 10;
    padding: 0;
    border: 0;
    background: transparent;
    color: white;
    mix-blend-mode: difference;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  button:focus-visible { outline: 1px solid currentColor; outline-offset: 4px; }
  .art { position: absolute; inset: 0; pointer-events: none; }
  .glyph {
    position: absolute;
    inset: 0;
    background-image: var(--glyph);
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }
  /* Cuts are snapped to device pixels to keep the three pieces seamless. */
  .top { clip-path: inset(0 0 calc(100% - var(--cut-top)) 0); }
  .middle {
    clip-path: inset(var(--cut-top) 0 calc(100% - var(--cut-bottom)) 0);
    transform: translateX(0);
    transition: transform 400ms linear;
  }
  .bottom { clip-path: inset(var(--cut-bottom) 0 0 0); }
  .enter .middle { transform: translateX(-4px); }
  .fire .middle { transform: translateX(8px); }
  .fire .middle, .recover .middle { transition-duration: 60ms; }
  @media (prefers-reduced-motion: reduce) {
    .middle { transition: none; }
    .enter .middle, .fire .middle { transform: none; }
  }
</style>
