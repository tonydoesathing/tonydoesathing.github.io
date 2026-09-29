<!-- A zero-size marker in the text flow: its top is the text's baseline. -->
<script>
  /** @type {{ marker?: HTMLElement }} */
  let { marker = $bindable() } = $props();
</script>

<span bind:this={marker} aria-hidden="true"></span>

<style>
  span {
    display: inline-block;
    width: 0;
    height: 0;
    vertical-align: baseline;
  }
</style>
