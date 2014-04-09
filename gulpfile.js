var path = require('path'),
  gulp = require('gulp'),
  zip = require('gulp-zip');


// @todo: support ./test/fixtures/bundled that has some random binary in front
// of the actual bundle.
function app(src){
  var self = {
      zip: function(){
        gulp.src(src + '/*')
          .pipe(zip(path.basename(src) + '.zip'))
          .pipe(gulp.dest('./test/fixtures'));
        return self;
      }
    };
  return self;
}

gulp.task('fixtures', function (){
  ['./test/fixtures/hello'].map(function(src){
    app(src).zip();
  });
});
