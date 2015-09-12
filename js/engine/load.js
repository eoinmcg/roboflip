$.Load = function(g) {

    this.g = g;

    this.imgsLoaded = 0;
    this.imgsTotal = Object.keys($.data.i).length;

    this.init = function() {

        var g = this.g,
            append = 'data:image/gif;base64,',
            i = $.data.i, n;

        // g.draw.rect(0, 0, g.w, g.h, $.cols.nightblue);

        for (n in i) {
            if (i.hasOwnProperty(n)) {
                g.imgs[n] = new Image();
                g.imgs[n].onload = this.checkLoaded();
                g.imgs[n].src = append + i[n];
            }
        }
    };


    this.checkLoaded = function() {

        var g = this.g,
            s = this,
            p;
        this.imgsLoaded += 1;

        // p = (s.imgsLoaded / s.imgsTotal) * g.w;

        // g.draw.rect(0, 150, p, 50, $.cols.slimegreen);

        if (s.imgsLoaded === s.imgsTotal) {
          window.setTimeout(function() {
            s.mkFonts();
          }, 10);
        }

    };





    this.mkFonts = function() {
        var g = this.g,
            fonts = {
              b: [0,0,0],
              w: [255,255,255],
              g: [163,206,39],
              p: [224,111,139]
            },
            i = g.imgs,
            n;

        for (n in fonts) {
          g.fonts[n] = $.H.resize(g.imgs.font, 1, fonts[n]);
        }

        for (n in i) {
          i[n + '_w'] = $.H.resize(i[n], 1, [255,255,255]);
        }
      
        window.setTimeout(function() {
          g.init();
        }, 10);

    };

    this.init();

};
