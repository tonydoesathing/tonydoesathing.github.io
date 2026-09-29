<script>
  import Menu from './lib/Menu.svelte';
  import Rectangle from './lib/Rectangle.svelte';
  import ThemeToggle from './lib/ThemeToggle.svelte';
</script>

<main>
  <h1>Tony Mastromarino</h1>
  <Menu />
  <ThemeToggle />

  <div class="decoration" aria-hidden="true">
    <Rectangle />
    <Rectangle />
    <Rectangle />
  </div>
</main>

<style>
  .decoration {
    position: fixed;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  h1 {
    position: fixed;
    font-size: 15vh;
    top: 30%;
    right: calc(6 / 128 * 15vh * -1);
    text-align: right;
  }

  @media screen and (orientation: portrait) {
    h1 {
      font-size: 15vw;
      line-height: 12vw;
      right: calc(6 / 128 * 15vw * -1);
    }
  }
</style>
