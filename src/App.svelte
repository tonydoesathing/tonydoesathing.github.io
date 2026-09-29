<script>
  import Heading from './components/Heading.svelte';
  import LinkMenu from './components/LinkMenu.svelte';
  import SweepBar from './components/SweepBar.svelte';
</script>

<main>
  <Heading />
  <LinkMenu />

  <div class="backdrop" aria-hidden="true">
    <SweepBar />
    <SweepBar />
    <SweepBar />
  </div>
</main>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }
</style>
