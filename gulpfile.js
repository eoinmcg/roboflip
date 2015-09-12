var fs = require('fs'),
    cheerio = require('cheerio'),
    gulp = require('gulp'),
    concat = require('gulp-concat'),
    htmlmin = require('gulp-htmlmin'),
    rimraf = require('gulp-rimraf'),
    rename = require('gulp-rename'),
    replace = require('gulp-replace'),
    webserver = require('gulp-webserver'),
    uglify = require('gulp-uglify'),
    unzip = require('gulp-unzip'),
    zip = require('gulp-zip');

    config = { js: [] };

gulp.task('build', ['initbuild', 'jsmin', 'addjs', 'zip', 'unzip', 'clean', 'report']);


gulp.task('serve', function() {
  gulp.src('.')
    .pipe(webserver({
      livereload: false,
      host: '0.0.0.0',
      port: 8013,
      open: true
    }));
});


gulp.task('initbuild', function() {

  var stream, html, $, js = [];
 
  // delete prev files
  stream = gulp.src('game.zip')
        .pipe(rimraf());

  stream = gulp.src('g.js')
        .pipe(rimraf());

  stream = gulp.src('index.html')
        .pipe(rimraf());


  // get a list of all js scripts from our dev file
  html = fs.readFileSync('dev.html', 'utf-8', function(e, data) {
    return data;
  });

  $ = cheerio.load(html);

  $('script').each(function() {
    js.push($(this).attr('src'));
  });

  config.js = js;
  console.log(js);

});

gulp.task('jsmin', ['initbuild'], function() {

  var stream = gulp.src(config.js)
    .pipe(concat('g.js'))
    // .pipe(uglify())
    .pipe(gulp.dest('.'));

  return stream;

});

gulp.task('addjs', ['jsmin'], function() {

    var js = fs.readFileSync('g.js', 'utf-8', function(e, data) {
      return data;
    });

    var stream = gulp.src('dev.html')
      .pipe(replace(/<.*?script.*?>.*?<\/.*?script.*?>/igm, ''))
      .pipe(replace(/<\/body>/igm, '<script>'+js+'</script></body>'))
      // .pipe(htmlmin({collapseWhitespace: true}))
      .pipe(rename('index.html'))
      .pipe(gulp.dest('./tmp'));

    return stream;

});

gulp.task('zip', ['addjs'], function() {
  var stream = gulp.src('tmp/index.html')
      .pipe(zip('game.zip'))
      .pipe(gulp.dest('.'));

  return stream;
});


gulp.task('unzip', ['zip'], function() {
  var stream = gulp.src('game.zip')
      .pipe(unzip())
      .pipe(gulp.dest('.'));

  return stream;
});


gulp.task('clean', ['unzip'], function() {
  var stream = gulp.src('tmp/')
        .pipe(rimraf());


  return stream;
});

gulp.task('report', ['clean'], function() {
  var stat = fs.statSync('game.zip'),
      limit = 1024 * 13,
      size = stat.size,
      remaining = limit - size,
      percentage = (remaining / limit) * 100;

  percentage = Math.round(percentage * 100) / 100

  console.log('\n\n-------------');
  console.log('BYTES USED: ' + stat.size);
  console.log('BYTES REMAINING: ' + remaining);
  console.log(percentage +'%');
  console.log('-------------\n\n');
});


gulp.task('encode', function()  {
  var files = fs.readdirSync('./a'),
      gifs = [],
      n, parts, base64;

  for ( n in files) {
    if (files[n].indexOf('.gif') !== -1) {
      gifs.push(files[n]);
    }
  }

  for (n = 0; n < gifs.length; n += 1) {

    fs.readFileSync('.a/'+gifs[n], function(err, data) {
     console.log(err, data);
    });
    parts = gifs[n].split('.'); 
    console.log(parts[0], gifs[n], base64);
  }

});
