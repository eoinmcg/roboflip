$.Tile = Class.extend({

  init: function(g, o) {
    this.g = g;
    this.i = o.i;
    this.x = o.x;
    this.y = o.y;
    this.speed = ( o.speed / 1000 );
    this.w = this.i.width;
    this.h = this.i.height;
    this.ctx = o.ctx;

    this.numTiles = Math.ceil(g.w / this.w) + 2;

    this.tiles = [];
    for (i = 0; i < this.numTiles; i += 1) {
      this.tiles.push({
        x: i * this.w,
        y: this.y
        });
    }
  },

  update: function() {
    var g = this.g, 
        i, t, newX;


    for (i = 0; i < this.numTiles; i +=1 ) {
      t = this.tiles[i];
      newX = this.speed * g.dt;
      if (t.x < -this.w) {
        // t.x = ( ( this.numTiles - 1 ) * this.w ) + (this.speed * 2);
        // t.x = ( ( this.numTiles - 1 ) * this.w ) - (newX * 1);
        t.x = this.findLastTile() + this.w;
      } 
      t.x += newX;
    }
  },

  findLastTile: function() {
    var tile, last = 0, i = this.tiles.length;

    while (i--) {
      last = ( this.tiles[i].x > last ) ? this.tiles[i].x : last;
    }

    return last;

  },

  render: function() {

    var i, t;

    for (i = 0; i < this.numTiles; i +=1 ) {
      t = this.tiles[i];
      this.ctx.drawImage(this.i, ~~t.x, ~~t.y);
    }

  }

});

