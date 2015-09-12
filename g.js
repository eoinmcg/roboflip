/**
 * SfxrParams
 *
 * Copyright 2010 Thomas Vian
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Thomas Vian
 */
/** @constructor */
function SfxrParams() {
  //--------------------------------------------------------------------------
  //
  //  Settings String Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Parses a settings array into the parameters
   * @param array Array of the settings values, where elements 0 - 23 are
   *                a: waveType
   *                b: attackTime
   *                c: sustainTime
   *                d: sustainPunch
   *                e: decayTime
   *                f: startFrequency
   *                g: minFrequency
   *                h: slide
   *                i: deltaSlide
   *                j: vibratoDepth
   *                k: vibratoSpeed
   *                l: changeAmount
   *                m: changeSpeed
   *                n: squareDuty
   *                o: dutySweep
   *                p: repeatSpeed
   *                q: phaserOffset
   *                r: phaserSweep
   *                s: lpFilterCutoff
   *                t: lpFilterCutoffSweep
   *                u: lpFilterResonance
   *                v: hpFilterCutoff
   *                w: hpFilterCutoffSweep
   *                x: masterVolume
   * @return If the string successfully parsed
   */
  this.setSettings = function(values)
  {
    for ( var i = 0; i < 24; i++ )
    {
      this[String.fromCharCode( 97 + i )] = values[i] || 0;
    }

    // I moved this here from the reset(true) function
    if (this['c'] < .01) {
      this['c'] = .01;
    }

    var totalTime = this['b'] + this['c'] + this['e'];
    if (totalTime < .18) {
      var multiplier = .18 / totalTime;
      this['b']  *= multiplier;
      this['c'] *= multiplier;
      this['e']   *= multiplier;
    }
  }
}

/**
 * SfxrSynth
 *
 * Copyright 2010 Thomas Vian
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Thomas Vian
 */
/** @constructor */
function SfxrSynth() {
  // All variables are kept alive through function closures

  //--------------------------------------------------------------------------
  //
  //  Sound Parameters
  //
  //--------------------------------------------------------------------------

  this._params = new SfxrParams();  // Params instance

  //--------------------------------------------------------------------------
  //
  //  Synth Variables
  //
  //--------------------------------------------------------------------------

  var _envelopeLength0, // Length of the attack stage
      _envelopeLength1, // Length of the sustain stage
      _envelopeLength2, // Length of the decay stage

      _period,          // Period of the wave
      _maxPeriod,       // Maximum period before sound stops (from minFrequency)

      _slide,           // Note slide
      _deltaSlide,      // Change in slide

      _changeAmount,    // Amount to change the note by
      _changeTime,      // Counter for the note change
      _changeLimit,     // Once the time reaches this limit, the note changes

      _squareDuty,      // Offset of center switching point in the square wave
      _dutySweep;       // Amount to change the duty by

  //--------------------------------------------------------------------------
  //
  //  Synth Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Resets the runing variables from the params
   * Used once at the start (total reset) and for the repeat effect (partial reset)
   */
  this.reset = function() {
    // Shorter reference
    var p = this._params;

    _period       = 100 / (p['f'] * p['f'] + .001);
    _maxPeriod    = 100 / (p['g']   * p['g']   + .001);

    _slide        = 1 - p['h'] * p['h'] * p['h'] * .01;
    _deltaSlide   = -p['i'] * p['i'] * p['i'] * .000001;

    if (!p['a']) {
      _squareDuty = .5 - p['n'] / 2;
      _dutySweep  = -p['o'] * .00005;
    }

    _changeAmount =  1 + p['l'] * p['l'] * (p['l'] > 0 ? -.9 : 10);
    _changeTime   = 0;
    _changeLimit  = p['m'] == 1 ? 0 : (1 - p['m']) * (1 - p['m']) * 20000 + 32;
  }

  // I split the reset() function into two functions for better readability
  this.totalReset = function() {
    this.reset();

    // Shorter reference
    var p = this._params;

    // Calculating the length is all that remained here, everything else moved somewhere
    _envelopeLength0 = p['b']  * p['b']  * 100000;
    _envelopeLength1 = p['c'] * p['c'] * 100000;
    _envelopeLength2 = p['e']   * p['e']   * 100000 + 12;
    // Full length of the volume envelop (and therefore sound)
    // Make sure the length can be divided by 3 so we will not need the padding "==" after base64 encode
    return ((_envelopeLength0 + _envelopeLength1 + _envelopeLength2) / 3 | 0) * 3;
  }

  /**
   * Writes the wave to the supplied buffer ByteArray
   * @param buffer A ByteArray to write the wave to
   * @return If the wave is finished
   */
  this.synthWave = function(buffer, length) {
    // Shorter reference
    var p = this._params;

    // If the filters are active
    var _filters = p['s'] != 1 || p['v'],
        // Cutoff multiplier which adjusts the amount the wave position can move
        _hpFilterCutoff = p['v'] * p['v'] * .1,
        // Speed of the high-pass cutoff multiplier
        _hpFilterDeltaCutoff = 1 + p['w'] * .0003,
        // Cutoff multiplier which adjusts the amount the wave position can move
        _lpFilterCutoff = p['s'] * p['s'] * p['s'] * .1,
        // Speed of the low-pass cutoff multiplier
        _lpFilterDeltaCutoff = 1 + p['t'] * .0001,
        // If the low pass filter is active
        _lpFilterOn = p['s'] != 1,
        // masterVolume * masterVolume (for quick calculations)
        _masterVolume = p['x'] * p['x'],
        // Minimum frequency before stopping
        _minFreqency = p['g'],
        // If the phaser is active
        _phaser = p['q'] || p['r'],
        // Change in phase offset
        _phaserDeltaOffset = p['r'] * p['r'] * p['r'] * .2,
        // Phase offset for phaser effect
        _phaserOffset = p['q'] * p['q'] * (p['q'] < 0 ? -1020 : 1020),
        // Once the time reaches this limit, some of the    iables are reset
        _repeatLimit = p['p'] ? ((1 - p['p']) * (1 - p['p']) * 20000 | 0) + 32 : 0,
        // The punch factor (louder at begining of sustain)
        _sustainPunch = p['d'],
        // Amount to change the period of the wave by at the peak of the vibrato wave
        _vibratoAmplitude = p['j'] / 2,
        // Speed at which the vibrato phase moves
        _vibratoSpeed = p['k'] * p['k'] * .01,
        // The type of wave to generate
        _waveType = p['a'];

    var _envelopeLength      = _envelopeLength0,     // Length of the current envelope stage
        _envelopeOverLength0 = 1 / _envelopeLength0, // (for quick calculations)
        _envelopeOverLength1 = 1 / _envelopeLength1, // (for quick calculations)
        _envelopeOverLength2 = 1 / _envelopeLength2; // (for quick calculations)

    // Damping muliplier which restricts how fast the wave position can move
    var _lpFilterDamping = 5 / (1 + p['u'] * p['u'] * 20) * (.01 + _lpFilterCutoff);
    if (_lpFilterDamping > .8) {
      _lpFilterDamping = .8;
    }
    _lpFilterDamping = 1 - _lpFilterDamping;

    var _finished = false,     // If the sound has finished
        _envelopeStage    = 0, // Current stage of the envelope (attack, sustain, decay, end)
        _envelopeTime     = 0, // Current time through current enelope stage
        _envelopeVolume   = 0, // Current volume of the envelope
        _hpFilterPos      = 0, // Adjusted wave position after high-pass filter
        _lpFilterDeltaPos = 0, // Change in low-pass wave position, as allowed by the cutoff and damping
        _lpFilterOldPos,       // Previous low-pass wave position
        _lpFilterPos      = 0, // Adjusted wave position after low-pass filter
        _periodTemp,           // Period modified by vibrato
        _phase            = 0, // Phase through the wave
        _phaserInt,            // Integer phaser offset, for bit maths
        _phaserPos        = 0, // Position through the phaser buffer
        _pos,                  // Phase expresed as a Number from 0-1, used for fast sin approx
        _repeatTime       = 0, // Counter for the repeats
        _sample,               // Sub-sample calculated 8 times per actual sample, averaged out to get the super sample
        _superSample,          // Actual sample writen to the wave
        _vibratoPhase     = 0; // Phase through the vibrato sine wave

    // Buffer of wave values used to create the out of phase second wave
    var _phaserBuffer = new Array(1024),
        // Buffer of random values used to generate noise
        _noiseBuffer  = new Array(32);
    for (var i = _phaserBuffer.length; i--; ) {
      _phaserBuffer[i] = 0;
    }
    for (var i = _noiseBuffer.length; i--; ) {
      _noiseBuffer[i] = Math.random() * 2 - 1;
    }

    for (var i = 0; i < length; i++) {
      if (_finished) {
        return i;
      }

      // Repeats every _repeatLimit times, partially resetting the sound parameters
      if (_repeatLimit) {
        if (++_repeatTime >= _repeatLimit) {
          _repeatTime = 0;
          this.reset();
        }
      }

      // If _changeLimit is reached, shifts the pitch
      if (_changeLimit) {
        if (++_changeTime >= _changeLimit) {
          _changeLimit = 0;
          _period *= _changeAmount;
        }
      }

      // Acccelerate and apply slide
      _slide += _deltaSlide;
      _period *= _slide;

      // Checks for frequency getting too low, and stops the sound if a minFrequency was set
      if (_period > _maxPeriod) {
        _period = _maxPeriod;
        if (_minFreqency > 0) {
          _finished = true;
        }
      }

      _periodTemp = _period;

      // Applies the vibrato effect
      if (_vibratoAmplitude > 0) {
        _vibratoPhase += _vibratoSpeed;
        _periodTemp *= 1 + Math.sin(_vibratoPhase) * _vibratoAmplitude;
      }

      _periodTemp |= 0;
      if (_periodTemp < 8) {
        _periodTemp = 8;
      }

      // Sweeps the square duty
      if (!_waveType) {
        _squareDuty += _dutySweep;
        if (_squareDuty < 0) {
          _squareDuty = 0;
        } else if (_squareDuty > .5) {
          _squareDuty = .5;
        }
      }

      // Moves through the different stages of the volume envelope
      if (++_envelopeTime > _envelopeLength) {
        _envelopeTime = 0;

        switch (++_envelopeStage)  {
          case 1:
            _envelopeLength = _envelopeLength1;
            break;
          case 2:
            _envelopeLength = _envelopeLength2;
        }
      }

      // Sets the volume based on the position in the envelope
      switch (_envelopeStage) {
        case 0:
          _envelopeVolume = _envelopeTime * _envelopeOverLength0;
          break;
        case 1:
          _envelopeVolume = 1 + (1 - _envelopeTime * _envelopeOverLength1) * 2 * _sustainPunch;
          break;
        case 2:
          _envelopeVolume = 1 - _envelopeTime * _envelopeOverLength2;
          break;
        case 3:
          _envelopeVolume = 0;
          _finished = true;
      }

      // Moves the phaser offset
      if (_phaser) {
        _phaserOffset += _phaserDeltaOffset;
        _phaserInt = _phaserOffset | 0;
        if (_phaserInt < 0) {
          _phaserInt = -_phaserInt;
        } else if (_phaserInt > 1023) {
          _phaserInt = 1023;
        }
      }

      // Moves the high-pass filter cutoff
      if (_filters && _hpFilterDeltaCutoff) {
        _hpFilterCutoff *= _hpFilterDeltaCutoff;
        if (_hpFilterCutoff < .00001) {
          _hpFilterCutoff = .00001;
        } else if (_hpFilterCutoff > .1) {
          _hpFilterCutoff = .1;
        }
      }

      _superSample = 0;
      for (var j = 8; j--; ) {
        // Cycles through the period
        _phase++;
        if (_phase >= _periodTemp) {
          _phase %= _periodTemp;

          // Generates new random noise for this period
          if (_waveType == 3) {
            for (var n = _noiseBuffer.length; n--; ) {
              _noiseBuffer[n] = Math.random() * 2 - 1;
            }
          }
        }

        // Gets the sample from the oscillator
        switch (_waveType) {
          case 0: // Square wave
            _sample = ((_phase / _periodTemp) < _squareDuty) ? .5 : -.5;
            break;
          case 1: // Saw wave
            _sample = 1 - _phase / _periodTemp * 2;
            break;
          case 2: // Sine wave (fast and accurate approx)
            _pos = _phase / _periodTemp;
            _pos = (_pos > .5 ? _pos - 1 : _pos) * 6.28318531;
            _sample = 1.27323954 * _pos + .405284735 * _pos * _pos * (_pos < 0 ? 1 : -1);
            _sample = .225 * ((_sample < 0 ? -1 : 1) * _sample * _sample  - _sample) + _sample;
            break;
          case 3: // Noise
            _sample = _noiseBuffer[Math.abs(_phase * 32 / _periodTemp | 0)];
        }

        // Applies the low and high pass filters
        if (_filters) {
          _lpFilterOldPos = _lpFilterPos;
          _lpFilterCutoff *= _lpFilterDeltaCutoff;
          if (_lpFilterCutoff < 0) {
            _lpFilterCutoff = 0;
          } else if (_lpFilterCutoff > .1) {
            _lpFilterCutoff = .1;
          }

          if (_lpFilterOn) {
            _lpFilterDeltaPos += (_sample - _lpFilterPos) * _lpFilterCutoff;
            _lpFilterDeltaPos *= _lpFilterDamping;
          } else {
            _lpFilterPos = _sample;
            _lpFilterDeltaPos = 0;
          }

          _lpFilterPos += _lpFilterDeltaPos;

          _hpFilterPos += _lpFilterPos - _lpFilterOldPos;
          _hpFilterPos *= 1 - _hpFilterCutoff;
          _sample = _hpFilterPos;
        }

        // Applies the phaser effect
        if (_phaser) {
          _phaserBuffer[_phaserPos % 1024] = _sample;
          _sample += _phaserBuffer[(_phaserPos - _phaserInt + 1024) % 1024];
          _phaserPos++;
        }

        _superSample += _sample;
      }

      // Averages out the super samples and applies volumes
      _superSample *= .125 * _envelopeVolume * _masterVolume;

      // Clipping if too loud
      buffer[i] = _superSample >= 1 ? 32767 : _superSample <= -1 ? -32768 : _superSample * 32767 | 0;
    }

    return length;
  }
}

// Adapted from http://codebase.es/riffwave/
var synth = new SfxrSynth();
// Export for the Closure Compiler
window['jsfxr'] = function(settings) {
  // Initialize SfxrParams
  synth._params.setSettings(settings);
  // Synthesize Wave
  var envelopeFullLength = synth.totalReset();
  var data = new Uint8Array(((envelopeFullLength + 1) / 2 | 0) * 4 + 44);
  var used = synth.synthWave(new Uint16Array(data.buffer, 44), envelopeFullLength) * 2;
  var dv = new Uint32Array(data.buffer, 0, 44);
  // Initialize header
  dv[0] = 0x46464952; // "RIFF"
  dv[1] = used + 36;  // put total size here
  dv[2] = 0x45564157; // "WAVE"
  dv[3] = 0x20746D66; // "fmt "
  dv[4] = 0x00000010; // size of the following
  dv[5] = 0x00010001; // Mono: 1 channel, PCM format
  dv[6] = 0x0000AC44; // 44,100 samples per second
  dv[7] = 0x00015888; // byte rate: two bytes per sample
  dv[8] = 0x00100002; // 16 bits per sample, aligned on every two bytes
  dv[9] = 0x61746164; // "data"
  dv[10] = used;      // put number of samples here

  // Base64 encoding written by me, @maettig
  used += 44;
  var i = 0,
      base64Characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
      output = 'data:audio/wav;base64,';
  for (; i < used; i += 3)
  {
    var a = data[i] << 16 | data[i + 1] << 8 | data[i + 2];
    output += base64Characters[a >> 18] + base64Characters[a >> 12 & 63] + base64Characters[a >> 6 & 63] + base64Characters[a & 63];
  }
  return output;
}


var $ = {
  v: 0.1,
  // http://androidarts.com/palette/16pal.htm
  cols : {
    black: '#000',
    ash: '#9d9d9d',
    blind: '#fff',
    bloodred: '#be2633',
    pigmeat: '#e06f8b',
    oldpoop: '#493C2B',
    newpoop: '#a46422',
    blaze: '#eb8931',
    zornskin: '#f7e26b',
    shadegreen: '#2f484e',
    leafgreen: '#44891A',
    slimegreen: '#A3CE27',
    nightblue: '#1B2632',
    seablue: '#005784',
    skyblue: '#31A2F2',
    cloudblue: '#B2DCEF'
  }
};



// -----------------------------------------------------------------------------
// Class object based on John Resigs code; inspired by base2 and Prototype
// http://ejohn.org/blog/simple-javascript-inheritance/

var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
var lastClassId = 0;

Class = function(){};
var inject = function(prop) {	
	var proto = this.prototype;
	var _super = {};
	for( var name in prop ) {		
		if( 
			typeof(prop[name]) == "function" &&
			typeof(proto[name]) == "function" && 
			fnTest.test(prop[name])
		) {
			_super[name] = proto[name]; // save original function
			proto[name] = (function(name, fn){
				return function() {
					var tmp = this._super;
					this._super = _super[name];
					var ret = fn.apply(this, arguments);			 
					this._super = tmp;
					return ret;
				};
			})( name, prop[name] );
		}
		else {
			proto[name] = prop[name];
		}
	}
};

Class.extend = function(prop) {
	var _super = this.prototype;
 
	initializing = true;
	var prototype = new this();
	initializing = false;
 
	for( var name in prop ) {
		if( 
			typeof(prop[name]) == "function" &&
			typeof(_super[name]) == "function" && 
			fnTest.test(prop[name])
		) {
			prototype[name] = (function(name, fn){
				return function() {
					var tmp = this._super;
					this._super = _super[name];
					var ret = fn.apply(this, arguments);			 
					this._super = tmp;
					return ret;
				};
			})( name, prop[name] );
		}
		else {
			prototype[name] = prop[name];
		}
	}
 
	function Class() {
		if( !initializing ) {
			
			// If this class has a staticInstantiate method, invoke it
			// and check if we got something back. If not, the normal
			// constructor (init) is called.
			if( this.staticInstantiate ) {
				var obj = this.staticInstantiate.apply(this, arguments);
				if( obj ) {
					return obj;
				}
			}
			for( var p in this ) {
				if( typeof(this[p]) == 'object' ) {
					this[p] = ig.copy(this[p]); // deep copy!
				}
			}
			if( this.init ) {
				this.init.apply(this, arguments);
			}
		}
		return this;
	}
	
	Class.prototype = prototype;
	Class.prototype.constructor = Class;
	Class.extend = window.Class.extend;
	Class.inject = inject;
	Class.classId = prototype.classId = ++lastClassId;
	
	return Class;
};

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


  fullScreen: function(el) {
    if(el.requestFullscreen) {
      el.requestFullscreen();
    } else if(el.mozRequestFullScreen) {
      el.mozRequestFullScreen();
    } else if(el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if(el.msRequestFullscreen) {
      el.msRequestFullscreen();
    }
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

$.Sprite = Class.extend({

  init: function(g, o){

    var n;
    this.g = g;
    this.angle = 0;
    this.id = Date.now();
    this.offscreen = false;
    this.remove = false;
    this.dead = false;
    this.tick = 0;
    this.vx = 0;
    this.vy = 0;
    this.scale = 1;
    this.alpha = 1;
    this.col = $.cols.slimegreen;
    this.frames = 1;
    this.frame = 1;
    this.gravity = 0;
    this.frameRate = 80;
    this.frameNext = 0;
    this.hurt = 0;
    this.hurtTime = 200;

    for (n in o) {
      this[n] = o[n];
    }

  },


  update: function() {

    var g = this.g;

    this.tick += ( g.dt / 100 );

    this.lastX = this.x;
    this.lastY = this.y;

    this.x += this.vx * g.dt; 
    this.y += this.vy * g.dt; 

    if (this.gravity) {
      this.vy += this.gravity * g.dt;
    }

    this.offscreen = this.checkOffScreen();

    this.cx = this.x + (this.w / 2);
    this.cy = this.y + (this.y / 2);

    if (this.frameNext < 0) {
      this.frameNext = this.frameRate;
      this.frame = (this.frame === this.frames) ? 1 : this.frame += 1;
    }

    this.frameNext -= g.dt;

  },

  render: function() {

    var g = this.g,
        i = this.i;

    if (i) {

      if (this.flipped) {
        i = g.draw.flip(i, 0, 1);
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
    } else {
      this.g.draw.rect(~~this.x, ~~this.y, this.w, this.h, this.col);
    }

  },


  keepOnScreen: function() {

    var g = this.g,
        yBound = g.bg.ground || 0,
        atEdge = false;

    

    if (this.x < 0) {
      this.x = 0;
      atEdge = true;
    } else if (this.x > ( g.w - this.w )) {
      this.x = g.w - this.w;
      atEdge = true;
    }

    if (this.y < yBound) {
      this.y = yBound;
      this.jumping = false;
      this.flipping = false;
      this.jumpCount = 0;
      atEdge = true;
    } else if(( this.y ) > ( g.h - yBound ) - this.h) {
      this.y = g.h - this.h - yBound;
      this.jumping = false;
      this.flipping = false;
      this.jumpCount = 0;
      atEdge = true;
    }

    return atEdge;

  },


  checkOffScreen: function() {

    var g = this.g;
    return (this.x < 0 || 
        this.x > (g.w - this.w) || 
        this.y < 0 || 
        this.y > (g.h - this.h)
      );

  },


  doDamage: function(o) {
    this.remove = true;
  },


  kill: function() {

    this.dead = true;
    this.remove = true;

  },

  receiveDamage: function(o) {
    this.kill();
  },

  hitGroup: function(group) {

    var g = this.g,
      i = g.ents.length;

      while (i--) {
      if (g.ents[i] && g.ents[i].group === group && 
          g.ents[i].id !== this.id &&
          this.hit(g.ents[i])) {
        this.doDamage(g.ents[i]);
        g.ents[i].receiveDamage(this);
      } 
    }

  },


  hit: function(o) {

    return !((o.y+o.h-1<this.y) || (o.y>this.y+this.h-1) ||
      (o.x+o.w-1<this.x) || (o.x>this.x+this.w-1));
      
  },


  mkImg:  function(name) {
      
      var g = this.g;

      this.i = g.draw.scale(g.imgs[name], this.scale);

      this.w = ( this.i.width / this.frames);
      this.h = this.i.height;
      this.iHurt = g.draw.scale(g.imgs[name + '_w'], this.scale);


  }



});

$.State = Class.extend({

  init: function(g){
    this.g = g;
    this.fader = 0;

    g.jump = 0;
    g.lastJump = 0;
    g.doJump = false;


  },


  update: function() {

    var g = this.g,
        i = g.ents.length,
        e;

    g.lastJump = g.jump;
    g.jump = ( g.mobile ) ? g.input.touchLeft : g.input.k[32];
    g.doJump = (g.lastJump === 0 & g.jump === 1) ?
      true : false;

    while(i--) {
      if (g.ents[i] && !g.ents[i].remove) {
        g.ents[i].update();
      }
    }
    
    i = g.ents.length;
    while (i--) {
          if (g.ents[i].remove) {
              g.ents.splice(i, 1);
          }
    }


    i = g.events.length;
    while(i--) {
      e = g.events[i]; 
      if (!e) {
        break;
      }
      e.time -= ( g.dt / 1000 );
      if (e.time < 0) {
        e.cb.call(this);
        g.events.splice(i, 1);
      }
    }


    this.fader = Math.sin(g.tick * 3) + 1;

  },


  render: function() {

    var g = this.g,
        i, x, y;

    for (i = 0; i < g.ents.length; i += 1) {
      // g.ents[i].render();
      if (!g.ents[i].remove) {
        g.ents[i].render();
      }
    }

  }

});


$.Emitter = function(g) {

    this.g = g;


    this.particle = function(p, x, y) {
    
        var g = this.g, i;

        if (g.ios) { return; }

        for (i = 0; i < p; i+= 1) {
            g.ents.push(new $.Particle(g, {
              x: x, y: y }
            ));
        }
        

    };

    this.explosion = function(num, x, y, particles, magnitude) {
      var g = this.g,
          r = $.H.rnd;

      // if (g.ios) { return; }

      while (num--) {
        window.setTimeout(function() {
          g.ents.push(new $.Explosion(g, {
            x: x + r(-10, 10), y: y + r(-10, 10),
            magnitude: magnitude,
            particles: particles
          }));
        }, num * 150);
      }
    };



};

$.Particle = $.Sprite.extend({

  init: function(g, o){

    var cols = ['blaze'],
        i;

    this._super(g, o);

    this.name = 'particle';
    this.scale = 1;
    this.group = 'na';

    this.w = 4;
    this.h = 4;

    this.v = (Math.random() * 5) + 5;
    this.lifespan = $.H.rnd(20,50);
    this.ttl = this.lifespan;
    this.alpha = 1;


    this.vx = ( $.H.rnd(0, 600) - 300 ) / 1000;  
    this.vy = ( $.H.rnd(0, 600) - 300 ) / 1000;  

  },


  update: function() {
    this._super();

    // var g = this.g;
    // this.vx += 0.0095 * g.dt;
    // this.vy += 0.0095 * g.dt;

    this.ttl -= 1;
    if (this.ttl < 0) {
      this.remove = true;  
    }

  },


  render: function() {

    var g = this.g;

    g.ctx.globalAlpha = (this.ttl / this.lifespan);
    // this._super();
    g.draw.rect(this.x, this.y, 5, 5, $.cols.zornskin);
    g.ctx.globalAlpha = 1;

  }


});





$.Tile = Class.extend({

  init: function(g, o) {
    this.g = g;
    this.i = o.i;
    this.x = o.x;
    this.y = o.y;
    this.speed = ( o.speed / 1000 );
    this.w = this.i.width;
    this.h = this.i.height;
    this.ctx = o.ctx;

    this.numTiles = Math.ceil(g.w / this.w) + 2;

    this.tiles = [];
    for (i = 0; i < this.numTiles; i += 1) {
      this.tiles.push({
        x: i * this.w,
        y: this.y
        });
    }
  },

  update: function() {
    var g = this.g, 
        i, t, newX;


    for (i = 0; i < this.numTiles; i +=1 ) {
      t = this.tiles[i];
      newX = this.speed * g.dt;
      if (t.x < -this.w) {
        // t.x = ( ( this.numTiles - 1 ) * this.w ) + (this.speed * 2);
        // t.x = ( ( this.numTiles - 1 ) * this.w ) - (newX * 1);
        t.x = this.findLastTile() + this.w;
      } 
      t.x += newX;
    }
  },

  findLastTile: function() {
    var tile, last = 0, i = this.tiles.length;

    while (i--) {
      last = ( this.tiles[i].x > last ) ? this.tiles[i].x : last;
    }

    return last;

  },

  render: function() {

    var i, t;

    for (i = 0; i < this.numTiles; i +=1 ) {
      t = this.tiles[i];
      this.ctx.drawImage(this.i, ~~t.x, ~~t.y);
    }

  }

});


$.Shake = function(g) {

  this.g = g;
  this.c = g.c;
  this.ttl = 0;
  this.mag = 0;

  this.start = function(mag, ttl) {
    this.mag = mag;
    this.ttl = ttl;
    this.l = (window.innerWidth - this.c.style.width) / 2;
  };

  this.update = function() {

    var g = this.g,
        c = this.c,
        m = $.H.rnd(-this.mag, this.mag);

    if (g.ios) {
      return;
    }

    this.ttl -= 1;

    if (this.ttl === 0) {
        c.style.marginLeft = this.l + 'px';
        c.style.marginTop = '0px';
    } else if (this.ttl > 0) {
      c.style.marginTop = m + 'px';
      c.style.marginLeft = (m + this.l) + 'px';
    }


  };

};

$.Bg =  Class.extend({ 

  init: function(g, o){

    o = o || {};
    var numStars = o.numStars || 20,
        i = g.imgs;
        sc = g.draw.scale;

    this.g = g;
    this.c = $.H.mkCanvas(g.w, g.h);
    this.ctx = this.c.getContext('2d');
    this.draw = new $.Draw(this.ctx, g.w, g.h);

    this.ground = o.ground || 40;
    this.groundTileImg = o.groundTile || i.ground;
    this.groundTileScale = o.groundTile || i.ground;
    this.speed = o.speed;

    this.tiles = [];

    // var floor = this.makeFloor(sc(this.groundTileImg, this.groundTileScale));
    var floor = sc(i.ground, 4);

    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 280, i: floor, speed: -o.speed
    }));

    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 0, i: g.draw.flip( floor, 0, 1 ), speed: -o.speed
    }));

    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 230, i: g.draw.scale(g.imgs.bg1, 10), speed: -( o.speed / 1.5 )

    }));

    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 41, i: g.draw.scale(g.imgs.window, 8), speed: -( o.speed / 2 )

    }));

    this.stars = [];
    while (numStars--) {
      this.stars.push({
        x: $.H.rnd(0, g.w), 
        y: $.H.rnd(0, g.h)});
    }



  },


  update: function() {

    var g = this.g, 
        i = this.tiles.length;

    while (i--) {
      this.tiles[i].update();
    }


  },

  render: function() {

    var g = this.g, 
        i = this.stars.length, s;

    this.ctx.fillStyle = $.cols.black;
    this.ctx.fillRect(0, 0, g.w, g.h);


    while (i--) {
      s = this.stars[i];
      this.draw.circle(s.x, s.y, 1, $.cols.blind);
    }

    i = this.tiles.length;
    while (i--) {
      this.tiles[i].render();
    }

    g.ctx.drawImage(this.c, 0, 0);

  },

  stop: function() {
    var t = this.tiles.length;

    this.speed = 0;
    while(t--) {
      this.tiles[t].speed = 0;
    }
  },

  makeFloor: function(i) {
    
    var parts = 10,
        c = $.H.mkCanvas(i.width * 10, i.height),
        ctx = c.getContext('2d'),
        n; 

    for (n = 0; n < parts; n += 1) {
      ctx.drawImage(i, i.width * n, 0);
    }
    
    return c;
  }

});



$.Bg1 =  $.Bg.extend({ 

  init: function(g, o){

    this._super(g, o);    

    var n = 20,
        i = g.imgs;
        sc = g.draw.scale;

    this.g = g;
    this.c = $.H.mkCanvas(g.w, g.h);
    this.ctx = this.c.getContext('2d');
    this.draw = new $.Draw(this.ctx, g.w, g.h);

    this.ground = 40;
    this.speed = o.speed;

    this.tiles = [];

    var floor = this.makeFloor(sc(i.ground, 4));

    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 280, i: floor, speed: -o.speed
    }));

    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 0, i: g.draw.flip( floor, 0, 1 ), speed: -o.speed
    }));

    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 230, i: g.draw.scale(g.imgs.bg1, 10), speed: -( o.speed / 1.5 )

    }));

    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 41, i: g.draw.scale(g.imgs.window, 8), speed: -( o.speed / 2 )

    }));

    this.stars = [];
    while (n--) {
      this.stars.push({
        x: $.H.rnd(0, g.w), 
        y: $.H.rnd(0, g.h)});
    }



  }


});


$.Bg2 =  $.Bg.extend({ 

  init: function(g, o){

    this._super(g, o);    

    var n = 40,
        i = g.imgs;
        sc = g.draw.scale;

    this.g = g;
    this.c = $.H.mkCanvas(g.w, g.h);
    this.ctx = this.c.getContext('2d');
    this.draw = new $.Draw(this.ctx, g.w, g.h);

    this.ground = 40;
    this.speed = o.speed;

    this.tiles = [];

    var floor = this.makeFloor(sc(i.ground1, 4));

    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 280, i: floor, speed: -o.speed
    }));

    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 0, i: g.draw.flip( floor, 0, 1 ), speed: -o.speed
    }));

    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 230, i: g.draw.scale(g.imgs.bg2, 10), speed: -( o.speed / 1.5 )

    }));


    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 0, i: g.draw.scale(g.imgs.window, 5), speed: -( o.speed / 2 )
    }));
    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: 160, i: g.draw.scale(g.imgs.window, 5), speed: -( o.speed / 2 )
    }));

    this.stars = [];
    while (n--) {
      this.stars.push({
        x: $.H.rnd(0, g.w), 
        y: $.H.rnd(0, g.h)});
    }



  }


});



$.BgTitle =  $.Bg.extend({ 

  init: function(g, o){

    this._super(g, o);    

    this.tiles = [];

    this.tiles.push(new $.Tile(this.g, {
      ctx: this.ctx, x: 0, y: -5, i: g.draw.scale(g.imgs.window, 10), speed: -( o.speed / 2 )

    }));

  }



});


$.Star = $.Sprite.extend({
  init: function(g, o) {
    this._super(g, o);
    this.scale = 6;
    this.group = 'star';
    this.speed = g.bg.speed * -1;
    this.frames = 1;
    this.mkImg('star');

    this.vx = ( g.bg.speed / 1000 ) * -1;
    this.vy = 0.05 * (this.x > (g.w / 2) ? 1 : -1);

  },

  update: function() {

    this._super();
    this.hitGroup('player');

  },


  doDamage: function(o) {
    var g = this.g;
    if (o.group === 'player') {
        this.remove = true;
        g.audio.play('powerup');
        g.ents.push(new $.Msg(g, {
          text: this.val,
          col: 'p',
          x: this.x, y: this.y
        }));
    }
  }




});



$.Battery = $.Sprite.extend({
  init: function(g, o) {
    this._super(g, o);
    this.scale = 6;
    this.group = 'battery';
    this.speed = g.bg.speed * -1;
    this.frames = 1;
    this.mkImg('battery');

    this.vx = ( g.bg.speed / 1000 ) * -1;
    this.x = 480;
    this.y = 120;

  },

  update: function() {

    this._super();
    this.hitGroup('player');

  },


  doDamage: function(o) {
    var g = this.g;
    if (o.group === 'player') {
        this.remove = true;
        g.ents.push(new $.Msg(g, {
          text: g.p1.doPowerup(),
          col: 'p',
          x: this.x, y: this.y
        }));
    }
  }




});




$.Fader = $.Sprite.extend({
  init: function(g, o) {

    this._super(g, o);
    this.w = 0;
    this.h = g.h;
    this.remove = false;
    this.col = o.col;
    this.cb = o.cb;
    this.dir = o.dir || 1;



  },

  update: function() {

    var g = this.g;

    this.tick = g.dt / 1.5;
    this.w += this.tick;

    if (this.w > g.w) {
      if (this.cb) {
        this.cb();
      }
      this.remove= true;
    }

  },

  render: function() {

    var g = this.g;

    if (this.dir === 1) {
      g.draw.rect(0, 0, this.w, this.h, this.col);
      g.draw.rect(g.w, 0, -this.w, this.h, this.col);
    } else if (this.dir === -1) {
      g.draw.rect(0, 0, g.w - this.w, this.h, this.col);
      g.draw.rect(g.w, 0, -(g.w - this.w), this.h, this.col);
    }



  }


});




$.Explosion = $.Sprite.extend({

  init: function(g, o){

    var i;

    this._super(g, o);

    this.name = 'explosion';
    this.scale = 1;
    this.group = 'na';
    this.startX = o.x;
    this.startY = o.y;
    this.particles = o.particles || 3;
    this.magnitude = o.magnitude || 9;
    this.factor = 1;
    this.mkImg('circle');

    g.emitter.particle(this.particles, this.x, this.y);

    g.audio.play('explode');
    this.angle = 0;
    this.grow = 1;

  },


  update: function() {

    var g = this.g;

    this._super();

    if (this.scale <= this.magnitude) {
      this.scale += this.factor;
    }
    if (this.scale === this.magnitude) {
      this.factor *= -1;
    }
    if (this.scale <= 1) {
      this.remove = true;
    }

    this.mkImg('circle');

  },


  render: function() {

    var x = this.startX - (this.w /2),
        y = this.startY - (this.h / 2),
        g = this.g,
        i = this.i;
        // i = g.draw.rotate(this.i, this.angle);
    g.ctx.drawImage(i, x, y);

  }


});




$.Msg = $.Sprite.extend({

  init: function(g, o) {
    this._super(g, o);
    this.vy = -1;
    this.lifespan = 2;
    this.ttl = this.lifespan;
    this.w = 10;
    this.h = 10;
    this.col = o.col || 'w';
    this.f = g.mkFont(this.col, 3);
    this.vx = -0.09;
    this.vy = -0.05;
  },

  update: function() {
    var g = this.g;
    this._super();

    this.x += this.vx * g.dt; 
    this.y += this.vy * g.dt; 

    this.ttl -= g.dt / 1000;
    if (this.ttl < 0) {
      this.kill();
    } 
  },

  render: function() {
    var g = this.g;

    g.ctx.globalAlpha = (this.ttl / this.lifespan);
    g.draw.text(this.text, this.f, this.x, this.y);
    g.ctx.globalAlpha = 1;
  }

});

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


$.Crate = $.Sprite.extend({
  init: function(g, o) {
    this._super(g, o);
    this.scale = 4;
    this.health = this.scale * 10;
    this.group = 'baddies';
    this.speed = g.bg.speed * -1;
    this.frames = 1;
    this.mkImg('crate');
    this.iHurt = g.draw.scale(g.imgs.crate_w, this.scale);
    this.frameRate = 120;
    this.hurt = 0;
    this.hurtTime = 200;

    this.x = 500;
    this.y = o.y || ( g.h - g.bg.ground ) - this.h;
    // this.vx = ( $.H.rnd(0, 200) - 100 ) / 1000;  
    // this.vx = ( ( $.H.rnd(0, 200) ) / 1000 ) * -1;  
    this.vx = ( g.bg.speed / 1000 ) * -1;

  },

  update: function() {

    var g = this.g;
    this.lastX = this.x;
    this.lastY = this.y;


    if (g.bg.speed !== 0) {
      this.x += this.vx * g.dt; 
    }

    if (this.x < -this.w) {
      this.x = g.w * 2 + $.H.rnd(0, g.w);
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
      this.health -= 0;
      if (this.health < 0) {

      g.shake.start(this.scale * 5, this.scale * 5);
      g.ents.push(new $.Explosion(g, {
        x: this.x, y: this.y
      }));
        this.remove = true;
      }
  },

  kill: function() {
      return;
  }




});


$.Spark = $.Sprite.extend({
  init: function(g, o) {
    this._super(g, o);
    this.scale = 4;
    this.health = this.scale * 10;
    this.group = 'baddies';
    this.speed = g.bg.speed * -1;
    this.frames = 2;
    this.mkImg('spark');
    this.iHurt = g.draw.scale(g.imgs.spark_w, this.scale);
    this.hurt = 0;
    this.hurtTime = 200;
    this.frameRate = 100;

    this.x = 500;
    // this.y = g.bg.ground + this.h;
    this.vx = ( g.bg.speed / 1000 ) * -1;

  },

  update: function() {

    var g = this.g;

    this._super();

    if (this.x < -this.w) {
      this.x = g.w * 2;
    }


  },

  render: function() {

    // this._super();
    var g = this.g,
        i= this.i;

      if (this.hurt > 0) {
        i = this.iHurt;
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
    // this.hurt = this.hurtTime;
    g.emitter.particle(2, this.x, this.y);
      this.health -= 0;
      if (this.health < 0) {

      g.shake.start(this.scale * 5, this.scale * 5);
      g.ents.push(new $.Explosion(g, {
        x: this.x, y: this.y
      }));
        this.remove = true;
      }
  },

  kill: function() {
      return;
  }




});


$.Drone = $.Sprite.extend({
  init: function(g, o) {
    this._super(g, o);
    this.scale = 4;
    this.health = 5;
    this.group = 'baddies';
    this.speed = ( g.bg.speed / 4  )* -1;
    this.frames = 2;

    this.t = 0;

    this.m = $.data.moves[o.m];

    this.scale = this.m.scale || 4;
    this.flipped = this.m.flipped || 0;
    this.mkImg(this.m.img || 'drone');

    this.x = o.x || this.m.sx;
    this.y = o.y || this.m.sy;

    this.t = 0;

  },

  update: function() {

    var g = this.g,
        m = this.m;

    this.t += ( g.dt / 1000 );


    this.lastX = this.x;
    this.lastY = this.y;

    this.vx = m.A + m.B * Math.sin(m.C * this.t + m.D);
    this.vy = m.E + m.F * Math.sin(m.G * this.t + m.H);

    this.x += this.vx * ( g.dt / 1000 );
    this.y += this.vy * ( g.dt / 1000 );

    if (this.x < -50) {
      this.remove = true;
    }

    if (this.frameNext < 0) {
      this.frameNext = this.frameRate;
      this.frame = (this.frame === this.frames) ? 1 : this.frame += 1;
    }

    this.frameNext -= g.dt;
    this.hurt -= g.dt;

  },


  receiveDamage: function() {
    var g = this.g;
    this.hurt = this.hurtTime;
    g.emitter.particle(2, this.x, this.y);
      this.health -= 10;
      if (this.health < 0) {

        this.remove = true;
        g.score += this.scale * 10;
        g.ents.push(new $.Explosion(g, {
          x: this.x, y: this.y
        }));
        g.ents.push(new $.Msg(g, {
          text: this.scale * 10,
          x: this.x, y: this.y
        }));
        g.waves[this.waveId] -= 1;
        if (!g.ios) {

          g.shake.start(this.scale * 5, this.scale * 5);
        }

        if (g.waves[this.waveId] === 0) {
          g.score += this.scale * 30;
          g.ents.push(new $.Star(g, {
            val: this.scale * 30,
            x: this.x, y: this.y
          }));


        }

      }
  },


  kill: function() {
      return;
  }




});



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



$.Portal = $.Sprite.extend({
  init: function(g, o) {
    this._super(g, o);
    this.scale = 4;
    this.health = this.scale * 10;
    this.group = 'portal';
    this.speed = 0;

    this.h = 50;
    this.w = 20;

    this.hide();


  },

  update: function() {

    this._super();
    this.hitGroup('player');

  },


  show: function() {
    var g = this.g;
    this.x = g.w - this.w;
    this.y = g.h /2 - (this.h / 2);
    this.col = $.cols.slimegreen;
  },

  hide: function() {
    var g = this.g;
    this.x = g.w * -2;
    this.active = false;
  },

  doDamage: function(o) {
    var g = this.g;
    if (o.group === 'player') {
      this.active = true;
      this.col = $.cols.pigmeat;
        g.score += 100;
        g.ents.push(new $.Msg(g, {
          text: 'BONUS',
          x: this.x, y: this.y
        }));
    }
  }



});



$.Splash = $.State.extend({

  init: function(g) {

    this._super(g);

    this.h1 = g.mkFont('g', 6);
    this.p = g.mkFont('w', 2);

    this.fade = 0;
    this.skull = g.draw.scale(g.imgs.skull_w, 6);

  },


  update: function() {

    var g = this.g;

    this._super();

    this.fade += ( 0.01 * ( g.dt * 5 ) ) / 100;

    if (this.fade > 2)  {
      g.audio.play('powerup');
      g.changeState('Title');
    }
    
  },


  render: function() {

    var g = this.g,
        s = this,
        c = $.cols, n; 

    g.draw.rect(0, 0, g.w, g.h, $.cols.black);

    g.ctx.globalAlpha = this.fade;
      g.draw.text('EOINMCG PRESENTS', this.p, false, 100);

    g.ctx.globalAlpha = this.fade / 10;
    g.ctx.drawImage(this.skull, 220, 150);
    g.ctx.globalAlpha = 1;

    s._super();

  }



});



$.Title = $.State.extend({

  init: function(g) {

    var i;

    this._super(g);
    this.startText = (g.mobile) ?
      'TAP LEFT TO START' : 'PRESS SPACE';


    this.h1 = g.mkFont('g', 6);
    this.p = g.mkFont('w', 2);


    if (g.plays === 0) {
      g.audio.say($.data.title);
    }

    this.bg = new $.BgTitle(g, { speed: 500, numStars: 0 });

    this.hideText = false;
  },


  update: function() {

    var g = this.g;

    this._super();

    this.bg.update();

    if ( g.doJump && g.tick > 0.4) {
      this.hideText = true;
      g.ents.push(new $.Fader(g, {
        col: $.cols.black,
        cb: function() {
          g.changeState(g.plays < 1 ? 'Tutorial' : 'Play');
        }
      }));

    }

    
  },


  render: function() {

    var g = this.g,
        s = this,
        c = $.cols, n; 

    this.bg.render();
    s._super();

    if (!this.hideText) {


      g.draw.text('HI', this.p, 40, 40);
      g.draw.text(g.hiScore, this.p, 60, 40);

      g.ctx.globalAlpha = this.fader;
        g.draw.text(this.startText, this.p, false, 250);
      g.ctx.globalAlpha = 1;

      g.draw.text($.data.title, this.h1, 150, 85);
    }


  }



});



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




$.Tutorial = $.State.extend({

  init: function(g) {

    this._super(g);

    this.h1 = g.mkFont('g', 5);
    this.p = g.mkFont('w', 3);
    this.p2 = g.mkFont('p', 3);
 
    this.shootKey = g.mobile ? 'TAP RIGHT' : 'SHIFT KEY';
    this.jumpKey = g.mobile ? 'TAP LEFT' : 'SPACE BAR';

    this.bg = new $.Bg1(g, {speed: 200});
    g.bg = this.bg;

    this.hideText = false;

  },

  update: function() {

    var g = this.g;

    this.bg.update();
    this._super();

    if ( g.doJump && g.tick > 1 || g.tick > 5) {
      this.hideText = true;
      g.ents.push(new $.Fader(g, {
        col: $.cols.nightblue,
        cb: function() {
          g.changeState('Play');
        }
      }));
    }
  },

  render: function() {

    var g = this.g;

    this.bg.render();
    this._super();

    if (!this.hideText) {
      g.draw.text('HOW TO PLAY', this.h1, false, 50);

      g.draw.text('SHOOT', this.p, 130, 130);
      g.draw.text(this.shootKey, this.p2, 230, 130);

      g.draw.text('JUMP', this.p, 130, 160);
      g.draw.text(this.jumpKey, this.p2, 230, 160);

      g.ctx.globalAlpha = this.fader;
      g.draw.text('DOUBLE JUMP REVERSES GRAVITY', this.p2, false, 210);
      g.ctx.globalAlpha = 1;
    }

  }




});


$.Gameover = $.State.extend({

  init: function(g) {

    this._super(g);

    this.h1 = g.mkFont('b', 7);
    this.h2 = g.mkFont('g', 5);
    this.p = g.mkFont('w', 2);

    if (g.newHi) {
      this.skull = g.draw.scale(g.imgs.star_w, 27);
    } else {
      this.skull = g.draw.scale(g.imgs.skull_w, 27);
    }

    g.audio.play('die');
  },

  update: function() {

    var g = this.g;

    this._super();

    if ( g.doJump && g.tick > 1) {
      g.ents.push(new $.Fader(g, {
        col: $.cols.pigmeat,
        dir: -1,
        cb: function() {
          g.changeState('Title');
        }
      }));
    }
  },

  render: function() {

    var g = this.g;

    this._super();

    g.draw.rect(0, 0, g.w, g.h, $.cols.bloodred);

    g.draw.text('GAME OVER', this.h1, false, 70);
    g.ctx.globalAlpha = 0.05;
    g.ctx.drawImage(this.skull, 220, 100 + (this.fader * 20));
    g.ctx.globalAlpha = 1;

    if (g.newHi) {
      g.ctx.globalAlpha = this.fader;
      g.draw.text('NEW HISCORE', this.h2, false, 170);
      g.ctx.globalAlpha = 1;
    }

  }




});



$.L = [
 {
    distance: 10000,
    bg: 'Bg1',
    bgSettings: {speed: 400},
    baddies: [],
    waveSize: 3,
    interval: 3,
    init: [
      ['Crate', {}],
      ['Crate', {y: 40}]
    ]
  },
  {
    distance: 10000,
    bg: 'Bg1',
    bgSettings: {speed: 400},
    baddies: ['straightBot'],
    waveSize: 3,
    interval: 3,
    init: [
      ['Crate', {}],
      ['Crate', {y: 40}]
    ]
  },
  {
    distance: 10000,
    bg: 'Bg1',
    powerup: 1,
    bgSettings: {speed: 400},
    baddies: ['sway', 'straightTop'],
    waveSize: 4,
    interval: 3,
    init: [
      ['Crate', {}]
    ]
  },
  {
    distance: 10000,
    bg: 'Bg1',
    powerup: 3,
    bgSettings: {speed: 400},
    baddies: ['topbot', 'bottop'],
    waveSize: 5,
    interval: 3,
    init: [
      ['Spark', {y: 150}]
    ]
  },
  {
    distance: 20000,
    bg: 'Bg2',
    powerup: 4,
    bgSettings: {speed: 400},
    baddies: ['topbot', 'bottop', 'circle'],
    waveSize: 5,
    interval: 2,
    init: [
      ['Crate', {}],
      ['Crate', {y: 40}]
    ]
  },
  {
    distance: 20000,
    bg: 'Bg2',
    powerup: 3,
    bgSettings: {speed: 600},
    baddies: ['all'],
    waveSize: 5,
    interval: 2,
    init: [
      ['Crate', {}],
      ['Crate', {y: 40}]
    ]
  }
];

$.data = {

  title: 'ROBO FLIP',

  i: {

    circle: 'R0lGODlhBgAGAKEDAL4mM+uJMffia////yH5BAEKAAMALAAAAAAGAAYAAAIN3AB2EQkhRHuxLWuQKQA7', 

    floater: 'R0lGODlhDgAIAKEDAL4mMzGi8vfia////yH+EUNyZWF0ZWQgd2l0aCBHSU1QACH5BAEKAAMALAAAAAAOAAgAAAIdXIZnuOEPIQBxVirxE4MLJ4ShwyRHhHiGUppPyxQAOw==', 

    spark: 'R0lGODlhDgAHAKECAOuJMffia////////yH+EUNyZWF0ZWQgd2l0aCBHSU1QACH5BAEKAAMALAAAAAAOAAcAAAIYxGZ4u+acWohoHgCCmE7b+4HRQ43XyRwFADs=',

    p1: 'R0lGODlhDAAIAMIFAAUDC74mMzWADJrKH/3//P///////////yH5BAEKAAcALAAAAAAMAAgAAAMfeLonMkM5KF9sVgUS9tkdgVFj5GRlRU4RsLiHCzNKAgA7',

  crawler: 'R0lGODlhEAAIAKECAL4mM/fia////////yH5BAEKAAIALAAAAAAQAAgAAAIZlI8Skba4WIoIAHnsc/TE/WHhFJYmZSpjAQA7',

    drone: 'R0lGODlhEAAIAKEDAL4mM+Bvi/fia////yH5BAEKAAMALAAAAAAQAAgAAAIenBOmu4j8VBAuHSernbXhoSXASJYmMJyGurYKmhoFADs=',

  star: 'R0lGODlhBQAFAIABAPfia////yH5BAEKAAEALAAAAAAFAAUAAAIITGCGB43OWAEAOw==',

  battery: 'R0lGODlhAwAFAKECAESJGqPOJ////////yH5BAEKAAIALAAAAAADAAUAAAIGFAwBuZoFADs=',

    font: 'R0lGODlhjwAFAIABAAAAAMwAACH5BAEKAAEALAAAAACPAAUAAAJ0DGKHcLzOFDRJ0UbXzdJ2lFQbRo5ipJ1TA7XsW2KanNWyZXpuzuNSz5txQDZTChSrsI6kHQpVu/wer9GvWuw5ssMp1LmbuZKeDdN4NVqT1BAydWvHi14ityTUSZHLE3El0uWHN/Vg9WYoOPe01YEl9VgVUQAAOw==',

    window: 'R0lGODlhIAAiAKECABsmMi9ITv///////yH5BAEKAAMALAAAAAAgACIAAAJZDI6py2gNo5O0PTCy3rzviXnimB0GiXpmmLbD6rpwnM40ad9irnd8/wGcgCohixgcIpPH5cvoZEY1P2SVeAVme1td9/alhWNjGXT6VEZXTSy7An/HK5c5pQAAOw==',

    ground: 'R0lGODlhCgAKAKECAABXhDGi8v///////yH5BAEKAAIALAAAAAAKAAoAAAIQjI+gyxztoIRvWlBlVqiHAgA7',

    ground1: 'R0lGODlhCgAKAKEBABsmMi9ITi9ITi9ITiH5BAEKAAIALAAAAAAKAAoAAAIPhI8RoMoNo5y02vucQ7wAADs=',

    bg1: 'R0lGODlhFAAFAIABAC9ITv///yH5BAEKAAEALAAAAAAUAAUAAAIRjI+pG+CMXnNSPTpxzZzeWgAAOw==',

    bg2: 'R0lGODlhFAAFAIAAAC9ITi9ITiH5BAEKAAEALAAAAAAUAAUAAAIPjI+pBr0fmoRpTnpAxqYAADs=',

    skull: 'R0lGODlhCAAIAIABAAAAAP///yH5BAEKAAEALAAAAAAIAAgAAAIOTIBoyc27nDuKJnMyMAUAOw==',

    crate: 'R0lGODlhCgAKAKECAC9ITp2dnf///////yH5BAEKAAMALAAAAAAKAAoAAAIZXI5nAd0JEkMRiTotxuHSLoSc80hmsJhDAQA7'


  },



  sfx: {
      jump: [0,,0.2432,,0.1709,0.3046,,0.1919,,,,,,0.5923,,,,,1,,,,,0.5],
      flip: [0,0.001,0.2379,0.1592,0.0225,0.85,,0.0659,0.0917,,-0.6595,-0.2759,0.7809,0.0597,0.0205,0.3604,-0.0083,-0.5261,0.3385,-0.0003,0.0833,,0.6489,0.5],
      powerup: [0,,0.0129,0.5211,0.4714,0.4234,,,,,,0.4355,0.5108,,,,,,1,,,,,0.5],
      shoot: [2,,0.1128,,0.178,0.7748,0.0046,-0.4528,,,,,,0.185,0.0994,,,,1,,,,,0.5],
      explode: [3,,0.3708,0.5822,0.3851,0.0584,,-0.0268,,,,-0.0749,0.7624,,,,,,1,,,,,0.5],
      levelup: [1,0.115,0.2886,0.4061,0.6535,0.0666,,0.3295,0.0262,-0.0114,,0.2484,0.4319,0.7129,-0.7396,,,-0.906,0.9658,0.1462,0.6577,0.0129,0.0448,0.56],
      die: [2,0.1987,0.388,0.4366,0.0335,0.5072,,0.1128,-0.1656,0.1987,,-0.376,0.2686,-0.684,0.1392,-0.6819,-0.8117,-0.1072,0.9846,0.057,,0.004,-0.0045,0.56],
      alarm: [1,0.0241,0.9846,0.6067,0.3041,0.1838,,0.0565,0.1439,-0.3068,0.1402,0.0867,0.7339,0.1332,-0.3119,-0.3257,0.2875,-0.0014,0.5866,0.0086,-0.9675,0.3643,,0.5]
  },

  moves: {
      straightTop: {
        sx: 500, sy: 42, scale: 4, img: 'crawler', flipped: 1,
        A: -200, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0
      },
      straightBot: {
        sx: 500, sy: 247, scale: 4, img: 'crawler',
        A: -200, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0
      },
      topbot: {
        sx: 500, sy: 50, scale: 3, img: 'floater',
        A: -200, B: 0, C: 0, D: 0, E: 80, F: 0, G: 0, H: 0
      },
      bottop: {
        sx: 500, sy: 230, scale: 3, img: 'floater',
        A: -200, B: 0, C: 0, D: 0, E: -80, F: 0, G: 0, H: 0
      },
      sway: {
        sx: 500, sy: 60, scale: 4, img: 'drone',
        A: -100, B: 0, C: 0, D: 0, E: 0, F: 360, G: 4, H: 0
      },
      circle: {
        sx: 500, sy: 160, scale: 5, img: 'drone',
        A: -150, B: -100, C: 5, D: 0, E: 50, F: 200, G: 10, H: Math.PI/2
      }
  }

};


window.addEventListener('load', function() {
  var g = new $.Game();
  g.boot('Splash');

}, false);

