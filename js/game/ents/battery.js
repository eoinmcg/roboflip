$.Battery = $.Sprite.extend({
  init: function(g, o) {
    this._super(g, o);
    this.scale = 6;
    this.group = 'battery';
    this.speed = g.bg.speed * -1;
    this.frames = 1;
    this.mkImg('battery');

    this.vx = ( g.bg.speed / 1000 ) * -1;
    this.x = 480;
    this.y = 120;

  },

  update: function() {

    this._super();
    this.hitGroup('player');

  },


  doDamage: function(o) {
    var g = this.g;
    if (o.group === 'player') {
        this.remove = true;
        g.ents.push(new $.Msg(g, {
          text: g.p1.doPowerup(),
          col: 'p',
          x: this.x, y: this.y
        }));
    }
  }




});



