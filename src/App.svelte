<script>
  import Menu from './lib/Menu.svelte';
  import Rectangle from './lib/Rectangle.svelte';
  import ThemeToggle from './lib/ThemeToggle.svelte';
  import { NAME } from './content.js';

  let lastLetter;
</script>

<main>
  <!-- Keep the letter and a zero-width baseline marker in the original text flow,
       on one line so formatting can't add whitespace between the spans.
       The final letter is split off to anchor the theme toggle. -->
  <!-- prettier-ignore -->
  <h1 class="inverts"><span class="first-name" data-first-name>{NAME.first}<span class="baseline" data-baseline aria-hidden="true"></span><span data-edge-ink aria-hidden="true"></span></span> {NAME.last.slice(0, -1)}<span bind:this={lastLetter}>{NAME.last.at(-1)}<span class="baseline" data-baseline aria-hidden="true"></span></span></h1>
  <Menu />
  <ThemeToggle target={lastLetter} />

  <div class="decoration" aria-hidden="true">
    <Rectangle />
    <Rectangle />
    <Rectangle />
  </div>
</main>

<style>
  .first-name {
    position: relative;
  }

  .baseline {
    display: inline-block;
    width: 0;
    height: 0;
    vertical-align: baseline;
  }

  .decoration {
    position: fixed;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  h1 {
    position: fixed;
    z-index: var(--layer-heading);
    margin: 0;
    font-family: Forum, serif;
    font-size: 15vh;
    line-height: 0.8;
    top: 30%;
    right: calc(6 / 128 * 15vh * -1);
    text-align: right;
  }

  @media screen and (orientation: portrait) {
    h1 {
      font-size: 15vw;
      right: calc(6 / 128 * 15vw * -1);
    }
  }
</style>
