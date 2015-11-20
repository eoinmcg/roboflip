$.Title = $.State.extend({

  init: function(g) {

    var i;

    this._super(g);
    this.startText = (g.mobile) ?
      'TAP LEFT TO START' : 'PRESS SPACE';


    this.h1 = g.mkFont('g', 6);
    this.p = g.mkFont('w', 2);


    this.bg = new $.BgTitle(g, { speed: 500, numStars: 0 });

    this.hideText = false;



  },


  update: function() {

    var g = this.g;

    this._super();

    this.bg.update();

    if ( g.doJump && g.tick > 0.4) {
      this.hideText = true;
      g.ents.push(new $.Fader(g, {
        col: $.cols.black,
        cb: function() {
          g.changeState(g.plays < 1 ? 'Tutorial' : 'Play');
        }
      }));

    }

    
  },


  render: function() {

    var g = this.g,
        s = this,
        c = $.cols, n; 

    this.bg.render();
    s._super();

    if (!this.hideText) {


      g.draw.text('HI', this.p, 40, 40);
      g.draw.text(g.hiScore, this.p, 60, 40);

      g.ctx.globalAlpha = this.fader;
        g.draw.text(this.startText, this.p, false, 250);
      g.ctx.globalAlpha = 1;

      g.draw.text($.data.title, this.h1, 150, 85);
    }


  }



});


