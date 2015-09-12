
$.Msg = $.Sprite.extend({

  init: function(g, o) {
    this._super(g, o);
    this.vy = -1;
    this.lifespan = 2;
    this.ttl = this.lifespan;
    this.w = 10;
    this.h = 10;
    this.col = o.col || 'w';
    this.f = g.mkFont(this.col, 3);
    this.vx = -0.09;
    this.vy = -0.05;
  },

  update: function() {
    var g = this.g;
    this._super();

    this.x += this.vx * g.dt; 
    this.y += this.vy * g.dt; 

    this.ttl -= g.dt / 1000;
    if (this.ttl < 0) {
      this.kill();
    } 
  },

  render: function() {
    var g = this.g;

    g.ctx.globalAlpha = (this.ttl / this.lifespan);
    g.draw.text(this.text, this.f, this.x, this.y);
    g.ctx.globalAlpha = 1;
  }

});
