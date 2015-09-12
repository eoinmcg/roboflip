$.Bg2 =  $.Bg.extend({ 

  init: function(g, o){

    this._super(g, o);    

    var n = 40,
        i = g.imgs;
        sc = g.draw.scale;

    this.g = g;
    this.c = $.H.mkCanvas(g.w, g.h);
    this.ctx = this.c.getContext('2d');
    this.draw = new $.Draw(this.ctx, g.w, g.h);

    this.ground = 40;
    this.speed = o.speed;

    this.tiles = [];

    var floor = this.makeFloor(sc(i.ground1, 4));

    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 280, i: floor, speed: -o.speed
    }));

    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 0, i: g.draw.flip( floor, 0, 1 ), speed: -o.speed
    }));

    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 230, i: g.draw.scale(g.imgs.bg2, 10), speed: -( o.speed / 1.5 )

    }));


    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 0, i: g.draw.scale(g.imgs.window, 5), speed: -( o.speed / 2 )
    }));
    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 160, i: g.draw.scale(g.imgs.window, 5), speed: -( o.speed / 2 )
    }));

    this.stars = [];
    while (n--) {
      this.stars.push({
        x: $.H.rnd(0, g.w), 
        y: $.H.rnd(0, g.h)});
    }



  }


});

