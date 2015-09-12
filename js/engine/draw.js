$.Draw = function(ctx, w, h) { 

  this.ctx = ctx;
  this.w = w;
  this.h = h;

  this.clear = function() {

    this.ctx.clearRect(0, 0, this.w, this.h);

  };


  this.rect = function(x, y, w, h, col) {

		this.ctx.fillStyle = col;
		this.ctx.fillRect(~~x, ~~y, w, h);

  };


  this.circle = function(x, y, r, col) {

    var ctx = this.ctx;

    x = x + (r / 2);
    y = y + (r / 2);

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2, true); 
    ctx.closePath();
		ctx.fillStyle = col;
    ctx.fill();

  };


  this.rotate = function(i, a) {
    var c = document.createElement('canvas'),
        ctx = c.getContext('2d'),
        size = Math.max(i.width, i.height) + 6,
        deg =  a * (180 / Math.PI);

    c.width = size;
    c.height = size;

    ctx.translate(size/2, size/2);
    ctx.rotate(a + Math.PI/2);
    ctx.drawImage(i, -(i.width/2), -(i.height/2));

    return c;

  };


  this.scale = function(i, scale, n) {

    var c = $.H.mkCanvas(i.width * scale, i.height * scale),
        ctx = c.getContext('2d');

    if (c.width) {
      ctx.save();
      ctx.scale(scale, scale);
      ctx.drawImage(i, 0, 0);
      ctx.restore();
    }


		return c;
  };


  this.flip = function(i, flipH, flipV) {

    var c = $.H.mkCanvas(i.width, i.height),
        ctx = c.getContext('2d'),
        scaleH = flipH ? -1 : 1, 
        scaleV = flipV ? -1 : 1,
        posX = flipH ? i.width * -1 : 0,
        posY = flipV ? i.height * -1 : 0;
    
    c.width = i.width;
    c.height = i.height;

    ctx.save();
    ctx.scale(scaleH, scaleV);
    ctx.drawImage(i, posX, posY, i.width, i.height);
    ctx.restore();

		return c;

  };


  this.text = function(s,f,x,y) {

    var i = 0,
        ctx = this.ctx,
        firstChar = 65,
        offset = 0,
        w = 3 * f.scale,
        h = 5 * f.scale,
        spacing = 1 * f.scale,
        sW =  $.H.textWidth(s, f),
        charPos = 0;

    if (typeof(s) === 'number' || s[0] === '0') {
        s += '';
        offset = 43;
    }

    x = x || (this.w - sW) / 2;


    for (i = 0; i < s.length; i += 1) {
        charPos = ( ( s.charCodeAt(i) - firstChar ) + offset ) * (w + spacing);
          if (charPos > -1) {
            ctx.drawImage(f, 
                charPos, 0, 
                w, h,
                ~~x, ~~y,
                w, h);
          }
            x += w + spacing;
    }
  };
};

