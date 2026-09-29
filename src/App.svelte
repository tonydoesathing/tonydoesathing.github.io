<script>
  import Menu from './lib/Menu.svelte';
  import Rectangle from './lib/Rectangle.svelte';
  import ThemeToggle from './lib/ThemeToggle.svelte';

  let lastLetter;
</script>

<main>
  <!-- Keep the letter and a zero-width baseline marker in the original text flow. -->
  <h1><span class="first-name" data-first-name>Tony<span class="baseline" data-baseline aria-hidden="true"></span><span data-edge-ink aria-hidden="true"></span></span> Mastromarin<span bind:this={lastLetter}>o<span class="baseline" data-baseline aria-hidden="true"></span></span></h1>
  <Menu />
  <ThemeToggle target={lastLetter} />

  <div class="decoration" aria-hidden="true">
    <Rectangle />
    <Rectangle />
    <Rectangle />
  </div>
</main>

<style>
  .first-name { position: relative; }

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
