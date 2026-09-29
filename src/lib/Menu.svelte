<nav class="menu" aria-label="Primary">
  <a id="first" href="https://github.com/tonydoesathing">github</a>
  <a id="second" href="/TonyMastromarinoResume.pdf">resume</a>
  <a id="third" href="mailto:mastromarino.tony@gmail.com">email</a>
</nav>

<style>
  .menu {
    position: fixed;
    bottom: 10%;
    z-index: 3;
    mix-blend-mode: difference;
    font-family: Roboto, sans-serif;
    font-weight: bold;
    font-size: 8vh;
    line-height: calc(8vh / (64 / 47));
    color: white;
  }

  a {
    display: block;
    position: relative;
    width: max-content;
    color: inherit;
    text-decoration: none;
  }

  #first { left: calc(13 / 64 * 8vh * -0.9); }
  #second { left: calc(41 / 64 * 8vh); }
  #third { left: calc(174 / 64 * 8vh); }

  a:hover,
  a:focus-visible {
    text-decoration: underline;
  }

  a:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 3px;
  }

  @media screen and (orientation: portrait) {
    .menu {
      left: 1vh;
      font-size: 6vh;
      line-height: calc(6vh / (64 / 47));
    }

    #first { left: calc(13 / 64 * 6vh * -1); }
    #second { left: calc(41 / 64 * 6vh); }
    #third { left: calc(174 / 64 * 6vh); }
  }
</style>
