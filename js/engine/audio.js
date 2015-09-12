$.Audio = function(sounds) {

  this.sounds = sounds;
  this.sfx = {};

  this.init = function() {

    var n;

    for (n in this.sounds) {
     this.add(n, 10, $.data.sfx[n]);
    }
  };


  this.add = function(key, n, data) {

    // inspired by
    // http://codepen.io/jackrugile/pen/crxws
    var i;

    this.sfx[key] = {
      tick: 0,
      pool: []
    };

    for( i = 0; i < n; i++ ) {
      var a = new Audio();
      a.src = jsfxr( data );
      this.sfx[key].pool.push( a );
    }
  };


  this.play = function(key) {

    var sfx = this.sfx[key];

    sfx.pool[sfx.tick].play();
    sfx.tick = ( sfx.tick < sfx.pool.length - 1 ) ?
      sfx.tick += 1 : sfx.tick = 0;
  };


  this.say = function(text, rate) {
    if (typeof SpeechSynthesisUtterance !== 'undefined') {
      var msg = new SpeechSynthesisUtterance(text);
      msg.pitch = 0.1;
      msg.rate = rate || 0.7;
      speechSynthesis.speak(msg);
    }
  };

};
