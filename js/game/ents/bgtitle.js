$.BgTitle =  $.Bg.extend({ 

  init: function(g, o){

    this._super(g, o);    

    this.tiles = [];

    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: -5, i: g.draw.scale(g.imgs.window, 10), speed: -( o.speed / 2 )

    }));

  }



});

