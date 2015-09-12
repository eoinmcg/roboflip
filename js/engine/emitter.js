$.Emitter = function(g) {

    this.g = g;


    this.particle = function(p, x, y) {
    
        var g = this.g, i;

        if (g.ios) { return; }

        for (i = 0; i < p; i+= 1) {
            g.ents.push(new $.Particle(g, {
              x: x, y: y }
            ));
        }
        

    };

    this.explosion = function(num, x, y, particles, magnitude) {
      var g = this.g,
          r = $.H.rnd;

      // if (g.ios) { return; }

      while (num--) {
        window.setTimeout(function() {
          g.ents.push(new $.Explosion(g, {
            x: x + r(-10, 10), y: y + r(-10, 10),
            magnitude: magnitude,
            particles: particles
          }));
        }, num * 150);
      }
    };



};
