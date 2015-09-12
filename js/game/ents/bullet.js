$.Bullet = $.Sprite.extend({

  init: function(g, o){

    this._super(g, o);
    this.w = o.size || 8;
    this.h = o.size || 8;
    this.name = 'bullet';
    this.speed = 6 / 10;
    this.ttl = 3000;
    this.group = 'bullets';
    this.scale = 2;
    // this.mkImg('circle');


    this.vx = this.speed * Math.cos(this.angle);
    this.vy = this.speed * Math.sin(this.angle);

    this.col = $.cols.zornskin;

    g.audio.play('shoot');

  },
  

  update: function() {

    this._super();
    this.hitGroup('baddies');
    if (this.offscreen) {
      this.kill();
    }
    this.ttl -= this.tick;
    if (this.ttl < 0) {
      this.remove = true;
    }

  },

  render: function() {

    var g = this.g,
        i = g.draw.scale(g.imgs.circle_w, 2);

    this._super();

    if (this.tick < 0.3) {
      g.ctx.drawImage(i, ~~this.x, ~~this.y);
    }
    

  },


  keepOnScreen: function() {

    var g = this.g;
    if (this.x < 0) {
      this.vx *= -1;
    } else if (this.x > g.w - this.w) {
      this.vx *= -1;
    }

    if (this.y < 0) {
      this.vy *= -1;
    } else if(this.y > g.h - this.h) {
      this.vy *= -1;
    }
  
  }


});


