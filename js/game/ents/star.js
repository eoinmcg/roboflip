$.Star = $.Sprite.extend({
  init: function(g, o) {
    this._super(g, o);
    this.scale = 6;
    this.group = 'star';
    this.speed = g.bg.speed * -1;
    this.frames = 1;
    this.mkImg('star');

    this.vx = ( g.bg.speed / 1000 ) * -1;
    this.vy = 0.05 * (this.x > (g.w / 2) ? 1 : -1);

  },

  update: function() {

    this._super();
    this.hitGroup('player');

  },


  doDamage: function(o) {
    var g = this.g;
    if (o.group === 'player') {
        this.remove = true;
        g.audio.play('powerup');
        g.ents.push(new $.Msg(g, {
          text: this.val,
          col: 'p',
          x: this.x, y: this.y
        }));
    }
  }




});


