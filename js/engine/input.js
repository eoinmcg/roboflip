$.Input = function() {

  this.init = function(g) {
    var s = this,
      l = window.addEventListener;

    this.g = g;

    s.k = [];
    s.k[32] = 0;
    s.k[16] = 0;
    s.touching = 0;
    s.touchLeft = 0;
    s.touchRight = 0;
    s.pos = {
      x: 0, y: 0
    };


		l('mousedown', function(e) {
      s.trackTouch([e]);
		});

		l('touchstart', function(e) {
      s.touching = 1;
      s.trackTouch(e.touches);
		});

		l('touchmove', function(e) {
      e.preventDefault();
      s.trackTouch(e.touches);
		});

		l('touchend', function(e) {
      e.preventDefault();
      s.trackTouch(e.touches);
      s.touching = 0;
		});


    l('keydown', function(e) {
        s.k[e.keyCode] = 1;

    }, false);
    l('keyup', function(e) {
        s.k[e.keyCode] = 0;
    }, false);
  };

  this.trackTouch = function(touches) {

    var s = this,
        c = this.g.c,
				offsetY = c.offsetTop,
				offsetX = c.offsetLeft,
        scale = parseInt(c.style.width, 10) / c.width,
				x, y, i;

		s.touchLeft = 0;
		s.touchRight = 0;

    s.pos.x = ~~((touches[0].pageX - offsetX) / scale);
    s.pos.y = ~~((touches[0].pageY - offsetY) / scale);


		for (i = 0; i < touches.length; i += 1) {
			if (i > 1) { break; }
			x = ~~((touches[i].pageX - offsetX) / scale);
			y = ~~((touches[i].pageY - offsetY) / scale);
			if (x < c.width / 2) {
				this.touchLeft = 1;
			} else {
				this.touchRight = 1;
			}
		}

  };


};
