$.Tutorial = $.State.extend({

  init: function(g) {

    this._super(g);

    this.h1 = g.mkFont('g', 5);
    this.p = g.mkFont('w', 3);
    this.p2 = g.mkFont('p', 3);
 
    this.shootKey = g.mobile ? 'TAP RIGHT' : 'SHIFT KEY';
    this.jumpKey = g.mobile ? 'TAP LEFT' : 'SPACE BAR';

    this.bg = new $.Bg1(g, {speed: 200});
    g.bg = this.bg;

    this.hideText = false;

  },

  update: function() {

    var g = this.g;

    this.bg.update();
    this._super();

    if ( g.doJump && g.tick > 1 || g.tick > 5) {
      this.hideText = true;
      g.ents.push(new $.Fader(g, {
        col: $.cols.nightblue,
        cb: function() {
          g.changeState('Play');
        }
      }));
    }
  },

  render: function() {

    var g = this.g;

    this.bg.render();
    this._super();

    if (!this.hideText) {
      g.draw.text('HOW TO PLAY', this.h1, false, 50);

      g.draw.text('SHOOT', this.p, 130, 130);
      g.draw.text(this.shootKey, this.p2, 230, 130);

      g.draw.text('JUMP', this.p, 130, 160);
      g.draw.text(this.jumpKey, this.p2, 230, 160);

      g.ctx.globalAlpha = this.fader;
      g.draw.text('DOUBLE JUMP REVERSES GRAVITY', this.p2, false, 210);
      g.ctx.globalAlpha = 1;
    }

  }




});

