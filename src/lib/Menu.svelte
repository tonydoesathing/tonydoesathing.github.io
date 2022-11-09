<style>
.menu{
    position: fixed;
    bottom: 10%;
    z-index: 3;
    mix-blend-mode: difference;
}
h2{
    position: relative;
    font-size: 8vh;
  line-height: calc(8vh/(64/47));
}

#first{
    left:calc(13/64*8vh*-1);
}
#second{
    left:calc(41/64*8vh);
}
#third{
    left:calc(174/64*8vh);
}

@media screen and (orientation:portrait) {
    .menu{
        left:1vh;
    }
  h2{
    font-size: 6vh;
    line-height: calc(6vh/(64/47));
  }
  #first{
    left:calc(13/64*6vh*-1);
}
#second{
    left:calc(41/64*6vh);
}
#third{
    left:calc(174/64*6vh);
}
}



a{
    text-decoration: none;
}


</style>


<div class="menu">
    <a href="https://github.com/tonydoesathing"><h2 id="first">github</h2></a>
    <a href="http://tonydoesathing.github.io/TonyMastromarinoResume.pdf"><h2 id="second">resume</h2> </a>
    <a href="mailto:t_mastromarino@coloradocollege.edu"><h2 id="third">email</h2></a>
</div>