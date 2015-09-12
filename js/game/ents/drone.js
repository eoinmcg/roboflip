$.Drone = $.Sprite.extend({
  init: function(g, o) {
    this._super(g, o);
    this.scale = 4;
    this.health = 5;
    this.group = 'baddies';
    this.speed = ( g.bg.speed / 4  )* -1;
    this.frames = 2;

    this.t = 0;

    this.m = $.data.moves[o.m];

    this.scale = this.m.scale || 4;
    this.flipped = this.m.flipped || 0;
    this.mkImg(this.m.img || 'drone');

    this.x = o.x || this.m.sx;
    this.y = o.y || this.m.sy;

    this.t = 0;

  },

  update: function() {

    var g = this.g,
        m = this.m;

    this.t += ( g.dt / 1000 );


    this.lastX = this.x;
    this.lastY = this.y;

    this.vx = m.A + m.B * Math.sin(m.C * this.t + m.D);
    this.vy = m.E + m.F * Math.sin(m.G * this.t + m.H);

    this.x += this.vx * ( g.dt / 1000 );
    this.y += this.vy * ( g.dt / 1000 );

    if (this.x < -50) {
      this.remove = true;
    }

    if (this.frameNext < 0) {
      this.frameNext = this.frameRate;
      this.frame = (this.frame === this.frames) ? 1 : this.frame += 1;
    }

    this.frameNext -= g.dt;
    this.hurt -= g.dt;

  },


  receiveDamage: function() {
    var g = this.g;
    this.hurt = this.hurtTime;
    g.emitter.particle(2, this.x, this.y);
      this.health -= 10;
      if (this.health < 0) {

        this.remove = true;
        g.score += this.scale * 10;
        g.ents.push(new $.Explosion(g, {
          x: this.x, y: this.y
        }));
        g.ents.push(new $.Msg(g, {
          text: this.scale * 10,
          x: this.x, y: this.y
        }));
        g.waves[this.waveId] -= 1;
        if (!g.ios) {

          g.shake.start(this.scale * 5, this.scale * 5);
        }

        if (g.waves[this.waveId] === 0) {
          g.score += this.scale * 30;
          g.ents.push(new $.Star(g, {
            val: this.scale * 30,
            x: this.x, y: this.y
          }));


        }

      }
  },


  kill: function() {
      return;
  }




});


