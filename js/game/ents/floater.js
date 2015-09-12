$.Floater = $.Sprite.extend({
  init: function(g, o) {
    this._super(g, o);
    this.scale = $.H.rnd(2,5);
    this.health = this.scale * 10;
    this.group = 'baddies';
    this.speed = 1;
    this.frames = 2;
    this.frameChange = 10;
    this.mkImg('floater');
    this.frameRate = 120;

    this.x = $.H.rnd(( g.w / 2 ) - ( this.w / 2 ));
    this.y = $.H.rnd(( g.h / 2 ) - ( this.h / 2 ));

    this.setDir();
  },

  update: function() {
    // this._super();

    var g = this.g;
    this.lastX = this.x;
    this.lastY = this.y;

    if (this.gravity) {
      this.vy += this.gravity;
    }

    this.x += this.vx * g.dt; 
    this.y += this.vy * g.dt; 

    this.atEdget = this.keepOnScreen();
    if (this.atEdget) {
      this.setDir();
    }

    this.cx = this.x + (this.w / 2);
    this.cy = this.y + (this.y / 2);

    this.tick += 1;

    if (this.frameNext < 0) {
      this.frameNext = this.frameRate;
      this.frame = (this.frame === this.frames) ? 1 : this.frame += 1;
    }

    this.frameNext -= g.dt;
    this.hurt -= g.dt;

  },

  render: function() {

    // this._super();
    var g = this.g,
        i= this.i;

      if (this.hurt > 0) {
        i = this.iHurt;
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

  },


  receiveDamage: function() {
    var g = this.g;
    this.hurt = this.hurtTime;
    g.emitter.particle(2, this.x, this.y);
      this.health -= 10;
      if (this.health < 0) {

        g.ents.push(new $.Msg(g, {
          text: this.scale * 10,
          x: this.x, y: this.y
        }));
        
        if (!g.ios) {
          g.shake.start(this.scale * 5, this.scale * 5);
          g.ents.push(new $.Explosion(g, {
            x: this.x, y: this.y
          }));
        } 
        this.remove = true;
      }
  },

  kill: function() {
      return;
  },

  setDir: function() {
    this.vx = ( $.H.rnd(0, 200) - 100 ) / 1000;  
    this.vy = ( $.H.rnd(0, 200) - 100 ) / 1000;  
    this.flipX = this.vx > 0 ? true : false;
 }



});

