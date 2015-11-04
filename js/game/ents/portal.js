$.Portal = $.Sprite.extend({
  init: function(g, o) {
    this._super(g, o);
    this.scale = 4;
    this.health = this.scale * 10;
    this.group = 'portal';
    this.speed = 0;

    this.h = 50;
    this.w = 20;

    this.hide();


  },

  update: function() {

    this._super();
    this.hitGroup('player');

  },


  show: function() {
    var g = this.g;
    this.x = g.w - this.w;
    this.y = g.h /2 - (this.h / 2);
    this.col = $.cols.slimegreen;
  },

  hide: function() {
    var g = this.g;
    this.x = g.w * -2;
    this.active = false;
  },

  doDamage: function(o) {
    var g = this.g,
        s = this;
    if (o.group === 'player') {
      this.active = true;
      this.col = $.cols.pigmeat;

        g.addEvent({
          time: 0.001,
          cb: function() {
            g.score += 100;
            g.ents.push(new $.Msg(g, {
              text: 'BONUS',
              x: s.x, y: s.y
            }));
          }
        });
    }
  }



});


