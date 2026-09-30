<!-- The staggered link menu, fitted to its rendered words. -->
<script>
  import MenuLink from './MenuLink.svelte';
  import { fitWords } from '../lib/fitWords.js';
  import { LINKS } from '../content.js';

  // State, so each MenuLink can bind into it.
  /** @type {MenuLink[]} */
  const links = $state([]);
</script>

<nav
  class="menu inverts"
  aria-label="Primary"
  {@attach () => fitWords(links.map(link => link.word()))}
>
  {#each LINKS as link, i (link.label)}
    <MenuLink {...link} bind:this={links[i]} />
  {/each}
</nav>

<style>
  .menu {
    --link-size: 8vh;
    position: fixed;
    bottom: 10%;
    z-index: var(--layer-menu);
    font-family: Roboto, sans-serif;
    font-weight: bold;
    font-size: var(--link-size);
    line-height: calc(var(--link-size) * 47 / 64);
    /* Only the words take pointer input, not the space beside them. */
    pointer-events: none;
  }

  /* Forced colours paint a backplate over each line box, which would cover
     the previous word's glyphs where the tight lines overlap them. */
  @media (forced-colors: active) {
    .menu {
      line-height: normal;
    }
  }

  @media screen and (orientation: portrait) {
    .menu {
      --link-size: 6vh;
      left: 1vh;
    }
  }
</style>
