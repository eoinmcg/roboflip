$.Spark = $.Sprite.extend({
  init: function(g, o) {
    this._super(g, o);
    this.scale = 4;
    this.health = this.scale * 10;
    this.group = 'baddies';
    this.speed = g.bg.speed * -1;
    this.frames = 2;
    this.mkImg('spark');
    this.iHurt = g.draw.scale(g.imgs.spark_w, this.scale);
    this.hurt = 0;
    this.hurtTime = 200;
    this.frameRate = 100;

    this.x = 500;
    // this.y = g.bg.ground + this.h;
    this.vx = ( g.bg.speed / 1000 ) * -1;

  },

  update: function() {

    var g = this.g;

    this._super();

    if (this.x < -this.w) {
      this.x = g.w * 2;
    }


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
    // this.hurt = this.hurtTime;
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

