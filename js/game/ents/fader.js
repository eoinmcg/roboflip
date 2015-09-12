$.Fader = $.Sprite.extend({
  init: function(g, o) {

    this._super(g, o);
    this.w = 0;
    this.h = g.h;
    this.remove = false;
    this.col = o.col;
    this.cb = o.cb;
    this.dir = o.dir || 1;



  },

  update: function() {

    var g = this.g;

    this.tick = g.dt / 1.5;
    this.w += this.tick;

    if (this.w > g.w) {
      if (this.cb) {
        this.cb();
      }
      this.remove= true;
    }

  },

  render: function() {

    var g = this.g;

    if (this.dir === 1) {
      g.draw.rect(0, 0, this.w, this.h, this.col);
      g.draw.rect(g.w, 0, -this.w, this.h, this.col);
    } else if (this.dir === -1) {
      g.draw.rect(0, 0, g.w - this.w, this.h, this.col);
      g.draw.rect(g.w, 0, -(g.w - this.w), this.h, this.col);
    }



  }


});



