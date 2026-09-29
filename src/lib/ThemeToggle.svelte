<script>
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

<button
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

<style>
  button {
    position: fixed;
    right: max(1rem, env(safe-area-inset-right));
    bottom: max(1rem, env(safe-area-inset-bottom));
    z-index: 10;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    color: white;
    mix-blend-mode: difference;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  button:focus-visible { outline: 1px solid currentColor; outline-offset: 4px; }
  .art { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
  .glyph {
    position: absolute;
    left: 11px;
    top: 11px;
    width: 20px;
    height: 20px;
    border: 1px solid currentColor;
    border-radius: 50%;
    background: linear-gradient(90deg, currentColor 50%, transparent 50%);
  }
  /* The glyph is 22px including its border; whole-pixel cuts avoid seams. */
  .top { clip-path: inset(0 0 14px 0); }
  .middle {
    clip-path: inset(8px 0 8px 0);
    transform: translateX(0);
    transition: transform 400ms linear;
  }
  .bottom { clip-path: inset(14px 0 0 0); }
  .enter .middle { transform: translateX(-4px); }
  .fire .middle { transform: translateX(8px); }
  .fire .middle, .recover .middle { transition-duration: 160ms; }
  .fire .glyph {
    background: linear-gradient(90deg, transparent 50%, currentColor 50%);
  }
  @media (prefers-reduced-motion: reduce) {
    .middle { transition: none; }
    .enter .middle, .fire .middle { transform: none; }
  }
</style>
