<script>
  import { onMount, tick } from 'svelte';
  import { measureLetter } from './measureLetter.js';
  import { alignHeading } from './alignHeading.js';
  import { viewportInkRight } from './edgeText.js';
  import { observePixelRatio } from './observePixelRatio.js';

  export let target;
  let bounds;

  onMount(() => {
    let disposed = false;
    let observer;
    let pendingFrame = 0;

    // Fonts and resizing can notify several listeners together. Rasterize once
    // per pending frame; this is not an ongoing JavaScript animation loop.
    const scheduleMeasure = () => {
      if (disposed || !target || pendingFrame) return;
      pendingFrame = requestAnimationFrame(() => {
        pendingFrame = 0;
        alignHeading(target);
        bounds = measureLetter(target);
        // The cropped bitmap has no side bearing: pin its last pixel directly.
        if (bounds) bounds.x = viewportInkRight() - bounds.width;
        if (bounds) target.style.color = 'transparent';
        else target.style.removeProperty('color');
      });
    };

    const stopObservingPixels = observePixelRatio(scheduleMeasure);
    tick().then(() => {
      if (disposed) return;
      observer = new ResizeObserver(scheduleMeasure);
      observer.observe(target.parentElement);
    });
    document.fonts.ready.then(scheduleMeasure);
    document.fonts.addEventListener('loadingdone', scheduleMeasure);
    window.addEventListener('resize', scheduleMeasure);

    return () => {
      disposed = true;
      cancelAnimationFrame(pendingFrame);
      observer?.disconnect();
      stopObservingPixels();
      document.fonts.removeEventListener('loadingdone', scheduleMeasure);
      window.removeEventListener('resize', scheduleMeasure);
      if (target) {
        target.style.removeProperty('color');
        target.closest('h1').style.removeProperty('transform');
        const firstName = target.closest('h1').querySelector('[data-first-name]');
        firstName.style.removeProperty('left');
        firstName.style.removeProperty('color');
        firstName.querySelector('[data-edge-ink]').style.cssText = '';
      }
    };
  });

  let dark = document.documentElement.dataset.theme === 'dark';
  let preference = null;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const validPreference = value => value === 'light' || value === 'dark' ? value : null;

  function applyTheme() {
    dark = preference ? preference === 'dark' : systemTheme.matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }

  onMount(() => {
    try { preference = validPreference(localStorage.getItem('theme')); } catch {}
    applyTheme();
    const onSystemChange = () => { if (!preference) applyTheme(); };
    const onStorageChange = event => {
      if (event.key !== 'theme' && event.key !== null) return;
      // Ignore unrelated sessionStorage events. A cleared setting resumes auto.
      try { if (event.storageArea !== localStorage) return; } catch { return; }
      preference = validPreference(event.newValue);
      applyTheme();
    };
    systemTheme.addEventListener('change', onSystemChange);
    window.addEventListener('storage', onStorageChange);
    return () => {
      systemTheme.removeEventListener('change', onSystemChange);
      window.removeEventListener('storage', onStorageChange);
    };
  });
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

  function toggle() {
    preference = dark ? 'light' : 'dark';
    applyTheme();
    try {
      localStorage.setItem('theme', preference);
    } catch {
      // The control also works when browser storage is unavailable.
    }
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
