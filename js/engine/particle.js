$.Particle = $.Sprite.extend({

  init: function(g, o){

    var cols = ['blaze'],
        i;

    this._super(g, o);

    this.name = 'particle';
    this.scale = 1;
    this.group = 'na';

    this.w = 4;
    this.h = 4;

    this.v = (Math.random() * 5) + 5;
    this.lifespan = $.H.rnd(20,50);
    this.ttl = this.lifespan;
    this.alpha = 1;


    this.vx = ( $.H.rnd(0, 600) - 300 ) / 1000;  
    this.vy = ( $.H.rnd(0, 600) - 300 ) / 1000;  

  },


  update: function() {
    this._super();

    // var g = this.g;
    // this.vx += 0.0095 * g.dt;
    // this.vy += 0.0095 * g.dt;

    this.ttl -= 1;
    if (this.ttl < 0) {
      this.remove = true;  
    }

  },


  render: function() {

    var g = this.g;

    g.ctx.globalAlpha = (this.ttl / this.lifespan);
    // this._super();
    g.draw.rect(this.x, this.y, 5, 5, $.cols.zornskin);
    g.ctx.globalAlpha = 1;

  }


});




