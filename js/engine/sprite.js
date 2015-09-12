$.Sprite = Class.extend({

  init: function(g, o){

    var n;
    this.g = g;
    this.angle = 0;
    this.id = Date.now();
    this.offscreen = false;
    this.remove = false;
    this.dead = false;
    this.tick = 0;
    this.vx = 0;
    this.vy = 0;
    this.scale = 1;
    this.alpha = 1;
    this.col = $.cols.slimegreen;
    this.frames = 1;
    this.frame = 1;
    this.gravity = 0;
    this.frameRate = 80;
    this.frameNext = 0;
    this.hurt = 0;
    this.hurtTime = 200;

    for (n in o) {
      this[n] = o[n];
    }

  },


  update: function() {

    var g = this.g;

    this.tick += ( g.dt / 100 );

    this.lastX = this.x;
    this.lastY = this.y;

    this.x += this.vx * g.dt; 
    this.y += this.vy * g.dt; 

    if (this.gravity) {
      this.vy += this.gravity * g.dt;
    }

    this.offscreen = this.checkOffScreen();

    this.cx = this.x + (this.w / 2);
    this.cy = this.y + (this.y / 2);

    if (this.frameNext < 0) {
      this.frameNext = this.frameRate;
      this.frame = (this.frame === this.frames) ? 1 : this.frame += 1;
    }

    this.frameNext -= g.dt;

  },

  render: function() {

    var g = this.g,
        i = this.i;

    if (i) {

      if (this.flipped) {
        i = g.draw.flip(i, 0, 1);
      }
      if (this.flipX) {
        i = g.draw.flip(i, 1, 0);
      }

      g.ctx.drawImage(i, 
        ( this.frame * this.w ) - this.w, 0,
        this.w, this.h,
        ~~this.x, ~~this.y,
        this.w, this.h
        );
    } else {
      this.g.draw.rect(~~this.x, ~~this.y, this.w, this.h, this.col);
    }

  },


  keepOnScreen: function() {

    var g = this.g,
        yBound = g.bg.ground || 0,
        atEdge = false;

    

    if (this.x < 0) {
      this.x = 0;
      atEdge = true;
    } else if (this.x > ( g.w - this.w )) {
      this.x = g.w - this.w;
      atEdge = true;
    }

    if (this.y < yBound) {
      this.y = yBound;
      this.jumping = false;
      this.flipping = false;
      this.jumpCount = 0;
      atEdge = true;
    } else if(( this.y ) > ( g.h - yBound ) - this.h) {
      this.y = g.h - this.h - yBound;
      this.jumping = false;
      this.flipping = false;
      this.jumpCount = 0;
      atEdge = true;
    }

    return atEdge;

  },


  checkOffScreen: function() {

    var g = this.g;
    return (this.x < 0 || 
        this.x > (g.w - this.w) || 
        this.y < 0 || 
        this.y > (g.h - this.h)
      );

  },


  doDamage: function(o) {
    this.remove = true;
  },


  kill: function() {

    this.dead = true;
    this.remove = true;

  },

  receiveDamage: function(o) {
    this.kill();
  },

  hitGroup: function(group) {

    var g = this.g,
      i = g.ents.length;

      while (i--) {
      if (g.ents[i] && g.ents[i].group === group && 
          g.ents[i].id !== this.id &&
          this.hit(g.ents[i])) {
        this.doDamage(g.ents[i]);
        g.ents[i].receiveDamage(this);
      } 
    }

  },


  hit: function(o) {

    return !((o.y+o.h-1<this.y) || (o.y>this.y+this.h-1) ||
      (o.x+o.w-1<this.x) || (o.x>this.x+this.w-1));
      
  },


  mkImg:  function(name) {
      
      var g = this.g;

      this.i = g.draw.scale(g.imgs[name], this.scale);

      this.w = ( this.i.width / this.frames);
      this.h = this.i.height;
      this.iHurt = g.draw.scale(g.imgs[name + '_w'], this.scale);


  }



});
