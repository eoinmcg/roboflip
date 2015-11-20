$.H = {
	listen: function(event, callback) {
		window.addEventListener(event, callback, false);
	},

  el: function(id) {
    return document.getElementById(id);
  },

  rnd: function (min, max) {
    return ~~(Math.random() * max) + min;
  },

  rndArray: function(a) {
      return a[~~(Math.random() * a.length)]; 
  },

  textWidth: function(s, f) {

      return ( s.length * (3 * f.scale) ) +
              ( s.length * (1 * f.scale) );

  },


  // tween: function (t, b, c, d) {
  //     return c*t/d + b;
  // },

  // getDist: function(v1, v2) {
  //   var dx = v1.x - v2.x,
  //       dy = v1.y - v2.y;

  //   return Math.sqrt((dx * dx) + (dy * dy));
  // },


  // getAngle: function(v1, v2) {
  //   var dx = v1.x - v2.x,
  //       dy = v1.y - v2.y;

  //   return (Math.atan2(dy, dx));
  // },

    toggleFullScreen: function() {

      var d = document;

       if (!d.fullscreenElement &&    // alternative standard method
        !d.mozFullScreenElement && !d.webkitFullscreenElement) {  // current working methods
         if (d.documentElement.requestFullscreen) {
           d.documentElement.requestFullscreen();
         } else if (d.documentElement.mozRequestFullScreen) {
           d.documentElement.mozRequestFullScreen();
         } else if (d.documentElement.webkitRequestFullscreen) {
           d.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
         }
          fs.className = '';
       } else {
          if (d.cancelFullScreen) {
             d.cancelFullScreen();
          } else if (d.mozCancelFullScreen) {
             d.mozCancelFullScreen();
          } else if (d.webkitCancelFullScreen) {
            d.webkitCancelFullScreen();
          }
       }
    },


  mkFavicon: function(i) {

    var canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    var ctx = canvas.getContext('2d');

    try {
        ctx.drawImage(i, 0, 0);
    } catch (e) {
        // window.location.href=window.location.href;
        return;
    }

    var l = document.createElement('link');
    l.type = 'image/x-icon';
    l.rel = 'shortcut icon';
    l.href = canvas.toDataURL("image/x-icon");
    document.getElementsByTagName('head')[0].appendChild(l);
  },


  mkCanvas: function(w, h) {
  
    var c = document.createElement('canvas'),
        ctx = c.getContext('2d');
    
    c.width = w;
    c.height = h;

		ctx.mozImageSmoothingEnabled = false;
		ctx.webkitImageSmoothingEnabled = false;
		ctx.msImageSmoothingEnabled = false;
		ctx.imageSmoothingEnabled = false;

    return c;
  },

	resize: function(img, scale, col) {
	
        scale = scale || 1;
        col = col || false;

        var widthScaled = img.width * scale;
        var heightScaled = img.height * scale;
        
        var orig = document.createElement('canvas');
        orig.width = img.width;
        orig.height = img.height;
        var origCtx = orig.getContext('2d');
        origCtx.drawImage(img, 0, 0);


        var origPixels = origCtx.getImageData(0, 0, img.width, img.height);
        
        var scaled = document.createElement('canvas');
        scaled.width = widthScaled;
        scaled.height = heightScaled;
        var scaledCtx = scaled.getContext('2d');
        var scaledPixels = scaledCtx.getImageData( 0, 0, widthScaled, heightScaled );
        var y, x;
        
        for( y = 0; y < heightScaled; y++ ) {
            for( x = 0; x < widthScaled; x++ ) {
                var index = (Math.floor(y / scale) * img.width + Math.floor(x / scale)) * 4;
                var indexScaled = (y * widthScaled + x) * 4;
                scaledPixels.data[ indexScaled ] = origPixels.data[ index ];
                scaledPixels.data[ indexScaled+1 ] = origPixels.data[ index+1 ];
                scaledPixels.data[ indexScaled+2 ] = origPixels.data[ index+2 ];
                scaledPixels.data[ indexScaled+3 ] = origPixels.data[ index+3 ];
                if (origPixels.data[index+3] === 0) {
                    scaledPixels.data[ indexScaled ] = 0;
                    scaledPixels.data[ indexScaled+1 ] = 0;
                    scaledPixels.data[ indexScaled+2 ] = 0;
                    scaledPixels.data[ indexScaled+3 ] = 0;
                } else if (col) {
                    scaledPixels.data[ indexScaled ] = col[0];
                    scaledPixels.data[ indexScaled+1 ] = col[1];
                    scaledPixels.data[ indexScaled+2 ] = col[2];
                    scaledPixels.data[ indexScaled+3 ] = 255;
                }
            }
        }

        scaledCtx.putImageData( scaledPixels, 0, 0 );
        var image = new Image();
        image.src = scaled.toDataURL('image/png');
        return image;

	}
};

