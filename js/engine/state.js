$.State = Class.extend({

  init: function(g){
    this.g = g;
    this.fader = 0;

    g.jump = 0;
    g.lastJump = 0;
    g.doJump = false;


  },


  update: function() {

    var g = this.g,
        i = g.ents.length,
        e;

    g.lastJump = g.jump;
    g.jump = ( g.mobile ) ? g.input.touchLeft : g.input.k[32];
    g.doJump = (g.lastJump === 0 & g.jump === 1) ?
      true : false;

    while(i--) {
      if (g.ents[i] && !g.ents[i].remove) {
        g.ents[i].update();
      }
    }
    
    i = g.ents.length;
    while (i--) {
          if (g.ents[i].remove) {
              g.ents.splice(i, 1);
          }
    }


    i = g.events.length;
    while(i--) {
      e = g.events[i]; 
      if (!e) {
        break;
      }
      e.time -= ( g.dt / 1000 );
      if (e.time < 0) {
        e.cb.call(this);
        g.events.splice(i, 1);
      }
    }


    this.fader = Math.sin(g.tick * 3) + 1;

  },


  render: function() {

    var g = this.g,
        i, x, y;

    for (i = 0; i < g.ents.length; i += 1) {
      // g.ents[i].render();
      if (!g.ents[i].remove) {
        g.ents[i].render();
      }
    }

  }

});

