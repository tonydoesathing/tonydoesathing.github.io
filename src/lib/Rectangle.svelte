<script>
import { tweened } from 'svelte/motion';



import { onMount } from "svelte";


    export let min_y = 1/3; // percentage of screen height
    export let min_duration=20*1000; // in miliseconds
    export let max_duration = 30*1000; // in miliseconds
    export let min_width = 0.5; // percentage of screen width
    export let max_width = 1.5;
    export let min_height = 1/24;
    export let max_height = 1/8;
    let width=0;
    let height=0;
    let y;
	$: innerWidth = 0
	$: innerHeight = 0
    let leftpos;
    let duration;

    
    const reset = ()=>{
        width = Math.random()*((max_width-min_width)*innerWidth)+min_width*innerWidth;
        
        height = Math.random()*((max_height-min_height)*innerHeight)+min_height*innerHeight;
        y=Math.random()*(innerHeight*(1-min_y))+min_y*innerHeight;
        duration = Math.random()*(max_duration-min_duration)+min_duration;

        leftpos=tweened(-width, {
            duration: duration,
        });
        
        leftpos.set(innerWidth);
        setTimeout(()=>{
            reset();
        }, duration);
        
    }

    onMount(async () => {
        reset();
	});

</script>
<svelte:window bind:innerWidth  bind:innerHeight />



<svg width="{width}" height="{height}" style="top:{y}; right:{$leftpos};">
    <rect  width="{width}" height="{height}"/>
</svg>
