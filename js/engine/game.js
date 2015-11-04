$.Game = function() {

	this.w = 480;
	this.h = 320;
  this.bgs = {};
  this.imgs = {};
  this.fonts = {};
  this.ents = [];
  this.events = [];
  this.sfx = {};
  this.plays = 0;
  this.time = 0;
  this.dt = 0;
  this.fps = 0;
	this.hiScore = parseInt( localStorage.getItem('hiScore'), 10 ) || 100;

  this.boot = function(state) {

    var g = this;

    this.startState = state || 'Title';
		this.c = document.getElementsByTagName('canvas')[0];
		this.ctx = this.c.getContext('2d');
		this.c.style.width = this.w+'px';	
		this.c.style.height = this.h+'px';	

    this.draw = new $.Draw(this.ctx, this.w, this.h);

    this.load = new $.Load(this);

    document.title = $.data.title;

  };

	this.init = function() {

		var g = this,
        ua = navigator.userAgent.toLowerCase();


    g.mobile =  'createTouch' in document || false;
		g.mobile = 'createTouch' in document || false;
    g.android = ua.indexOf('android') > -1;
    g.ios = /ipad|iphone|ipod/.test(ua);
    g.firefox = ua.indexOf('firefox') > -1;


    g.input = new $.Input(); 
    g.input.init(g);

    g.emitter = new $.Emitter(g);

		// slows down ios loading time for order of magnitude
    if (this.ios) {
      this.audio = { play: function() {}, say: function() {} };
    } else {
      this.audio = new $.Audio($.data.sfx);
      this.audio.init();
    }


    $.H.el('b').style.display = 'block';
    $.H.el('l').style.display = 'none';

    g.resize();
		$.H.listen('resize', function() {
			g.resize();
		});
		$.H.listen('orientationchange', function() {
			g.resize();
		});


    g.shake = new $.Shake(g);
    g.changeState(g.startState);

		function gameLoop() {
			g.loop();
			requestAnimationFrame(gameLoop, g.c);
		}
    gameLoop();

	};


  this.changeState = function(state) {
    var g = this;
    g.ents = [];
    g.events = [];
    g.tick = 0;
    g.state = new $[state](g);
  };


  this.addEvent = function(e) {
    this.events.push(e); 
  };



	this.resize = function() {

    var winH = window.innerHeight,
        winW = window.innerWidth,
        ratio = this.w / this.h,
        w2 = winH * ratio,
        left = ~~( winW - w2 ) / 2;
        scale = w2 / this.w;

    if (winW < winH) {
        $.H.el('l').style.display = 'block';
        $.H.el('h').innerHTML = 'Rotate Device';
        $.H.el('b').style.display = 'none';
    } else {
        $.H.el('l').style.display = 'none';
        $.H.el('b').style.display = 'block';
    }

    this.c.width = this.w;
    this.c.height = this.h;

    this.w2 = this.w / 2;
    this.h2 = this.h / 2;

    this.c.style.width = ~~(w2)+ 'px';
    this.c.style.height = ~~(winH) + 'px';
    this.c.style.marginLeft = ~~( (winW - w2) / 2 )+'px';
	};


	this.loop = function(t) {

    var g = this,
        now = new Date().getTime();

    this.dt = now - (this.time || now);
    this.fps = ~~( 1000 / this.dt );

    this.time = now;

    g.shake.update();
    g.state.update();
    g.state.render();
    g.tick += ( g.dt / 1000);

	};

  this.countGroup = function(name)  {
    var e = this.ents, i = e.length,
        num = 0;

    while(i--) {
        if (e[i].group === name) {
            num += 1;
        }
    }

    return num;
  };

  this.mkFont = function(col, scale) {
    var g = this,
        f = g.draw.scale(g.fonts[col], scale);

    f.scale = scale;
    return f;
  };


  this.findClosest = function(e, group) {

    var g = this,
        i = g.ents.length,
        angle = -1.5,
        closest = g.w * 2,
        selected,
        tmp,
        dist;

    while (i--) {
      tmp = g.ents[i];
      if (tmp.group === group) {

        dist = $.H.getDist(e, tmp);
        if (dist < closest) {
          closest = dist;
          selected = tmp;
        }

      }
    }

    if (selected) {
      angle = $.H.getAngle(selected, e);
    } 

    return {
      dist: closest,
      angle: angle,
      e: selected
    };

  };


};


