$.Explosion = $.Sprite.extend({

  init: function(g, o){

    var i;

    this._super(g, o);

    this.name = 'explosion';
    this.scale = 1;
    this.group = 'na';
    this.startX = o.x;
    this.startY = o.y;
    this.particles = o.particles || 3;
    this.magnitude = o.magnitude || 9;
    this.factor = 1;
    this.mkImg('circle');

    g.emitter.particle(this.particles, this.x, this.y);

    g.audio.play('explode');
    this.angle = 0;
    this.grow = 1;

  },


  update: function() {

    var g = this.g;

    this._super();

    if (this.scale <= this.magnitude) {
      this.scale += this.factor;
    }
    if (this.scale === this.magnitude) {
      this.factor *= -1;
    }
    if (this.scale <= 1) {
      this.remove = true;
    }

    this.mkImg('circle');

  },


  render: function() {

    var x = this.startX - (this.w /2),
        y = this.startY - (this.h / 2),
        g = this.g,
        i = this.i;
        // i = g.draw.rotate(this.i, this.angle);
    g.ctx.drawImage(i, x, y);

  }


});


