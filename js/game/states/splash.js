$.Splash = $.State.extend({

  init: function(g) {

    this._super(g);

    this.h1 = g.mkFont('g', 6);
    this.p = g.mkFont('w', 2);

    this.fade = 0;
    this.skull = g.draw.scale(g.imgs.skull_w, 6);

    $.fullScreen = function() {
      $.H.fullScreen(g.c);
    };

    window.addEventListener('click', $.fullScreen);
    window.addEventListener('keydown', $.fullScreen);
    window.addEventListener('touchstart', $.fullScreen);

  },


  update: function() {

    var g = this.g;

    this._super();

    this.fade += ( 0.01 * ( g.dt * 5 ) ) / 100;

    if (this.fade > 2)  {
      g.audio.play('powerup');
      g.changeState('Title');
    }
    
  },


  render: function() {

    var g = this.g,
        s = this,
        c = $.cols, n; 

    g.draw.rect(0, 0, g.w, g.h, $.cols.black);

    g.ctx.globalAlpha = this.fade;
      g.draw.text('EOINMCG PRESENTS', this.p, false, 100);

    g.ctx.globalAlpha = this.fade / 10;
    g.ctx.drawImage(this.skull, 220, 150);
    g.ctx.globalAlpha = 1;

    s._super();

  }



});


