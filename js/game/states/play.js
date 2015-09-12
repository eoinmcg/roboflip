$.Play = $.State.extend({

  init: function(g) {

   this._super(g);

   this.h1 = g.mkFont('g', 5);
   this.p = g.mkFont('w', 3);
   g.newHi = false;

    g.plays += 1;
    g.score = 0;

    this.levelNum = 0;
    g.waves = [];

    this.p1 = new $.Robo(g, {
      x: 60, y: 200 
    });
    g.p1 = this.p1;
    g.ents.push(this.p1);

    this.portal = new $.Portal(g, {});
    g.ents.push(this.portal);

    this.gameover = false;
    g.state = this;

    this.bulletDelay = 0;
    g.bulletInterval = 200;

    g.audio.play('alarm');
    this.nextLevel();
  },


  update: function() {

    var g = this.g,
        s = this,
        i = g.input,
        k = i.k;

    this._super();

    this.bg.update();

    if (( i.touchRight ||  k[16] ) && 
        this.bulletDelay < 0 && !s.p1.dead && !s.p1.pause) {

      this.bulletDelay = g.bulletInterval;
      g.ents.push(new $.Bullet(g, {
        x: this.p1.x + ( this.p1.w / 2 ), y: this.p1.y + (this.p1.h / 3),
        angle: 0
      }));
      if (g.p1.powerup > 1) {
        g.ents.push(new $.Bullet(g, {
          x: this.p1.x + ( this.p1.w / 2 ), y: this.p1.y + (this.p1.h / 3),
          angle: -0.3
        }));
      }
      if (g.p1.powerup > 2) {
        g.ents.push(new $.Bullet(g, {
          x: this.p1.x + ( this.p1.w / 2 ), y: this.p1.y + (this.p1.h / 3),
          angle: 0.3
        }));
      }
    }

    this.bulletDelay -= g.dt;

    if (g.p1.dead && !this.gameover) {
      this.gameover = true;
      if (g.score > g.hiScore) {
        g.newHi = true;
        g.hiScore = g.score;
        try {
          localStorage.setItem('hiScore', g.score);
        } catch(e) {}
       }
      g.ents.push(new $.Fader(g, {col: $.cols.bloodred, cb: function() {
        g.changeState('Gameover');
      }}));
    }

    if (this.gameover && g.doJump) {
      g.changeState('Title');
    }

    // if (g.bg.speed !== 0 && !g.p1.dead) {
      g.distance -= g.dt;
    // }

    if (g.distance < 0) {
      g.p1.vx = 0.5;
      this.portal.show();
      g.bg.stop();
    } 

    if (g.p1.x > 450) {
      this.portal.active = true;
    }
    if (g.distance < -2000 && !this.gameover) {
      this.portal.active = true;
    }

    if (this.portal.active) {
      this.levelUp();
    }
    
  },


  render: function() {

    var g = this.g,
        s = this,
        numBaddies = g.ents.length,
        c = $.cols, n; 


    this.bg.render();

    s._super();



    if (!this.gameover) {
      // g.draw.text(g.fps, this.p, 400, 40);
      // g.draw.text(numBaddies, this.p, 40, 40);
      g.draw.text(g.score, this.p, 40, 40);
    }


  },


  levelUp: function() {

    var g = this.g,
        s = this,
        i = g.ents.length;

    if (g.p1.pause) {
      return;
    }

    g.audio.play('levelup');
    g.p1.pause = true;
    while (i--) {
      if (g.ents[i].group === 'baddies') {
        g.ents[i].remove = true;
      }
    }
    i = g.ents.length;
    while (i--) {
      if (g.ents[i].remove) {
        g.ents.splice(i, 1);
      }
    }

    g.events = [];

    s.p1.x = g.w / 3;
    s.portal.hide();

    g.ents.push(new $.Fader(g, {col: $.cols.nightblue, cb: function() {
      g.ents.push(new $.Fader(g, {col: $.cols.nightblue, cb: function() {
        g.state.nextLevel();
        g.p1.pause = false;
      }, dir: -1 }));
    }}));

  },


  nextLevel: function() {

    var g = this.g,
        s = this,
        l, i;


    if (this.levelNum > ( $.L.length - 1 )) {
      this.levelNum = 0;
    }

    this.level = $.L[this.levelNum];
    l = this.level;
    if (l.baddies[0] === 'all') {
      l.baddies = Object.keys($.data.moves);
    }
    this.bg = new $[l.bg](g, l.bgSettings);


    if (l.powerup) {
    g.addEvent({
      time: l.powerup,
      cb: function() {
        g.ents.push(new $.Battery(g, {}));
      }
    });
    }

    g.addEvent({
      time: 2,
      cb: function() {
        s.spawnWave();
        for (i = 0; i < l.init.length; i += 1) {
          g.ents.push(new $[ l.init[i][0] ](g, l.init[i][1]));
        }
      }
    });



    g.bg = this.bg;
    g.level = this.level;
    g.distance = g.level.distance;
    g.p1.x = 60;
    g.p1.vx = 0;
    s.portal.hide();
    g.p1.pause = false;

    this.levelNum += 1;

  },

  spawnWave: function() {

    var g = this.g, 
        s = this,
        l = this.level,
        size = l.waveSize,
        waveId = new Date().getTime(),
        m = $.H.rndArray(l.baddies),
        i;


    if (g.distance < 100 || g.p1.dead || l.baddies.length === 0) {
      return;
    }
    
    g.waves[waveId] = size;
    for (i = 0; i < l.waveSize; i += 1) {
        g.addEvent({
          time: 0.2 * i,
          cb: function() {
            g.ents.push(new $.Drone(g, {
              m: m,
              waveId: waveId,
              x:500
            }));
          }
        });
    }
  
    g.addEvent({
      time: l.interval,
      cb: function() {
        s.spawnWave();
      }
    });

  }


  

});



