$.Crate = $.Sprite.extend({
  init: function(g, o) {
    this._super(g, o);
    this.scale = 4;
    this.health = this.scale * 10;
    this.group = 'baddies';
    this.speed = g.bg.speed * -1;
    this.frames = 1;
    this.mkImg('crate');
    this.iHurt = g.draw.scale(g.imgs.crate_w, this.scale);
    this.frameRate = 120;
    this.hurt = 0;
    this.hurtTime = 200;

    this.x = 500;
    this.y = o.y || ( g.h - g.bg.ground ) - this.h;
    // this.vx = ( $.H.rnd(0, 200) - 100 ) / 1000;  
    // this.vx = ( ( $.H.rnd(0, 200) ) / 1000 ) * -1;  
    this.vx = ( g.bg.speed / 1000 ) * -1;

  },

  update: function() {

    var g = this.g;
    this.lastX = this.x;
    this.lastY = this.y;


    if (g.bg.speed !== 0) {
      this.x += this.vx * g.dt; 
    }

    if (this.x < -this.w) {
      this.x = g.w * 2 + $.H.rnd(0, g.w);
    }

    this.frameNext -= g.dt;
    this.hurt -= g.dt;

  },

  render: function() {

    // this._super();
    var g = this.g,
        i= this.i;

      if (this.hurt > 0) {
        i = this.iHurt;
      }


      g.ctx.drawImage(i, 
        ( this.frame * this.w ) - this.w, 0,
        this.w, this.h,
        ~~this.x, ~~this.y,
        this.w, this.h
        );

  },


  receiveDamage: function() {
    var g = this.g;
    this.hurt = this.hurtTime;
    g.emitter.particle(2, this.x, this.y);
      this.health -= 0;
      if (this.health < 0) {

      g.shake.start(this.scale * 5, this.scale * 5);
      g.ents.push(new $.Explosion(g, {
        x: this.x, y: this.y
      }));
        this.remove = true;
      }
  },

  kill: function() {
      return;
  }




});

