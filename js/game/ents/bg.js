$.Bg =  Class.extend({ 

  init: function(g, o){

    o = o || {};
    var numStars = o.numStars || 20,
        i = g.imgs;
        sc = g.draw.scale;

    this.g = g;
    this.c = $.H.mkCanvas(g.w, g.h);
    this.ctx = this.c.getContext('2d');
    this.draw = new $.Draw(this.ctx, g.w, g.h);

    this.ground = o.ground || 40;
    this.groundTileImg = o.groundTile || i.ground;
    this.groundTileScale = o.groundTile || i.ground;
    this.speed = o.speed;

    this.tiles = [];

    // var floor = this.makeFloor(sc(this.groundTileImg, this.groundTileScale));
    var floor = sc(i.ground, 4);

    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 280, i: floor, speed: -o.speed
    }));

    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 0, i: g.draw.flip( floor, 0, 1 ), speed: -o.speed
    }));

    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 230, i: g.draw.scale(g.imgs.bg1, 10), speed: -( o.speed / 1.5 )

    }));

    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 41, i: g.draw.scale(g.imgs.window, 8), speed: -( o.speed / 2 )

    }));

    this.stars = [];
    while (numStars--) {
      this.stars.push({
        x: $.H.rnd(0, g.w), 
        y: $.H.rnd(0, g.h)});
    }



  },


  update: function() {

    var g = this.g, 
        i = this.tiles.length;

    while (i--) {
      this.tiles[i].update();
    }


  },

  render: function() {

    var g = this.g, 
        i = this.stars.length, s;

    this.ctx.fillStyle = $.cols.black;
    this.ctx.fillRect(0, 0, g.w, g.h);


    while (i--) {
      s = this.stars[i];
      this.draw.circle(s.x, s.y, 1, $.cols.blind);
    }

    i = this.tiles.length;
    while (i--) {
      this.tiles[i].render();
    }

    g.ctx.drawImage(this.c, 0, 0);

  },

  stop: function() {
    var t = this.tiles.length;

    this.speed = 0;
    while(t--) {
      this.tiles[t].speed = 0;
    }
  },

  makeFloor: function(i) {
    
    var parts = 10,
        c = $.H.mkCanvas(i.width * 10, i.height),
        ctx = c.getContext('2d'),
        n; 

    for (n = 0; n < parts; n += 1) {
      ctx.drawImage(i, i.width * n, 0);
    }
    
    return c;
  }

});


