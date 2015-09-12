$.Gameover = $.State.extend({

  init: function(g) {

    this._super(g);

    this.h1 = g.mkFont('b', 7);
    this.h2 = g.mkFont('g', 5);
    this.p = g.mkFont('w', 2);

    if (g.newHi) {
      this.skull = g.draw.scale(g.imgs.star_w, 27);
    } else {
      this.skull = g.draw.scale(g.imgs.skull_w, 27);
    }

    g.audio.play('die');
  },

  update: function() {

    var g = this.g;

    this._super();

    if ( g.doJump && g.tick > 1) {
      g.ents.push(new $.Fader(g, {
        col: $.cols.pigmeat,
        dir: -1,
        cb: function() {
          g.changeState('Title');
        }
      }));
    }
  },

  render: function() {

    var g = this.g;

    this._super();

    g.draw.rect(0, 0, g.w, g.h, $.cols.bloodred);

    g.draw.text('GAME OVER', this.h1, false, 70);
    g.ctx.globalAlpha = 0.05;
    g.ctx.drawImage(this.skull, 220, 100 + (this.fader * 20));
    g.ctx.globalAlpha = 1;

    if (g.newHi) {
      g.ctx.globalAlpha = this.fader;
      g.draw.text('NEW HISCORE', this.h2, false, 170);
      g.ctx.globalAlpha = 1;
    }

  }




});


