$.Blocker = $.Sprite.extend({


  init: function(g, o) {

    this._super(g,o);
    this.scale  = 5;
    this.mkImg('blocker');
    this.group = 'baddies';
    this.health = 10;


  },


  update: function() {

    this._super();

    var g = this.g,
        p1 = g.p1;

    if (!p1.dead) {
      this.vx = -(this.speed);
      this.vy = 0;
    } else {
      this.vx = 0; 
      this.vy = 0;
    }

    this.hitGroup('player');

  },

  receiveDamage: function() {
    this.g.emitter.particle(2, this.x, this.y);
    this.x += 2;
    this.health -= 2;
    // if (this.health > 0) {
    //   this.kill();
    // }
  },


  kill: function() {
      // return;
  }



});



