$.Robo = $.Sprite.extend({

  init: function(g, o) {

    this._super(g,o);

    this.speed = 1;
    this.group = 'player';

    this.frames = 2;
    this.scale = 4;
    this.mkImg('p1');
    this.angle = 0;

    this.speed = 5;
    this.vy = this.speed;

    this.gravity = 0.001;
    this.jump = -0.4;
    this.jumping = false;
    this.flipping = false;
    this.flipped = false;
    this.jumpCount = 0;

    this.jumps = 0;
    this.flips = 0;
    this.pause = false;

    this.powerup = 0;

    this.gun = 1;

  },

  update: function() {

    var g = this.g,
        k = g.input.k;

    if (this.pause) {
      return;
    }

    this.hitGroup('baddies');

    if (g.doJump && this.jumpCount < 2 && this.tick > 2) {

      this.jumpCount += 1;

      if (!this.jumping) {
        g.audio.play('jump');
        this.jumps += 1;
        this.jumping = true;
        this.vy = this.jump;

      } else if (this.jumping) {
        g.audio.play('flip');
        this.flips += 1;
        this.flipping = true;
        this.gravity *= -1;
        this.jump *= -1;
        this.flipped = !this.flipped;
      }

    }

    this._super();

    this.keepOnScreen();

    if (this.x > 450) {
      this.frame = 1;
    }
 
  },


  render: function() {

    if (this.pause) {
      return;
    }
    this._super();
  },

  doDamage: function(o) {
    if (o.group === 'baddies') {
      this.kill();
    }
  },


  receiveDamage: function(o) {
    if (o.group === 'baddies') {
      this.kill();
    }
  },

  kill: function() {

    var g = this.g,
        self = this,
        r = $.H.rnd,
        num = 3;

      this.dead = true;
      this.remove = true;
      g.bg.stop();

      g.ents.push(new $.Explosion(g, {
        x: this.x, y: this.y
      }));
      g.shake.start(50, 50);

  },

  doPowerup: function() {

    var g = this.g;

    this.powerup += 1;

    if (this.powerup > 3) {
      g.score += 100;
      return 100;
    }

    if (this.powerup === 1) {
      g.bulletInterval = 100;
      return 'RAPID FIRE';
    } else if (this.powerup === 2) {
      return 'DOUBLE SHOT';
    } else if (this.powerup === 3) {
      return 'TRIPLE SHOT';
    }

  }




});
