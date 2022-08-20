<script>
  import svelteLogo from './assets/svelte.svg'
  import Counter from './lib/Counter.svelte'
import Menu from './lib/Menu.svelte'
import Rectangle from './lib/Rectangle.svelte'
</script>

<main>
 
  <h1>Tony Mastromarino</h1>
  <Menu />

  <Rectangle />
  <Rectangle />
  <Rectangle />

  

</main>

<style>
  h1{
    position: fixed;
    font-size: 15vh;
    top:30%;
    right:calc(6/128*15vh*-1);
    text-align: right;
  }
  @media screen and (orientation:portrait) {
  h1{
    font-size: 15vw;
    line-height: 12vw;
    right:calc(6/128*15vw*-1);
  }
}
</style>
