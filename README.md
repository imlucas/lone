# lone.js

[![linux build status](https://secure.travis-ci.org/imlucas/lone.png)](http://travis-ci.org/imlucas/lone)
[![windows build status](https://ci.appveyor.com/api/projects/status/github/imlucas/lone)](https://ci.appveyor.com/project/imlucas/lone)


Turn node.js apps into standalone executables, with cross-platform and
binary add-on support.

```
npm install -g lone && lone ./path-to-app;
your app is ready: ./path-to-app/dist/app_OSX_64
```

## explain

neat trick, but how? a slight twist on how node-webkit does it.

1. get the node source
2. add `lone/_third_party_main.js` to library files in `node.gyp`
3. compile node
4. run `npm install` on `./path-to-app`
5. put everything from `./path-to-app` in a tarball
6. `mkdir -p ./path-to-app/dist && cat out/Release/node app.tar.gz > ./path-to-app/dist/app_OSX_64`
7. when `app_OSX_64`is executed, node calls `_third_party_main.js`
8. read `app_OSX_64` looking for a boundary where node stops and the app tarball begins
9. slice out the app tarball into a buffer that's inflated into a tmp directory and run
10. marinate, rotate, and cover

## Gulp + GitHub Releases

Your source gets published to npm but how do you make your shiny new binaries
available for easy downloading?  Here's a gulp task that will build
your binaries with lone and then upload them to GitHub releases.

First, we'll need some extra dev deps so:

```
npm install --save-dev gulp async github-release gulp-rename keepup
```

Now add a `gulpfile.js` to the root of your project:

```javascript
var gulp = require('gulp'),
  exec = require('child_process').exec,
  async = require('async'),
  release = require('github-release'),
  rename = require('gulp-rename'),
  keepup = require('keepup');

// Delete crap we don't need, which ends up saving several megabytes.
function cleanup(cb){
  var tasks = [],
    blobs = '{test*,doc*,example*,bench*,image*,tool*,lcov-report*}',
    paths = [
      './node_modules/**/' + blobs,
      './node_modules/**/node_modules/**/' + blobs,
      './node_modules/**/node_modules/**/node_modules/**/' + blobs,
      './node_modules/**/node_modules/.bin',
      './node_modules/**/node_modules/**/node_modules/.bin'
    ];

  tasks = paths.map(function(p){
    return function(done){
      exec('rm -rf ' + p, done);
    };
  });
  tasks.push(function(done){exec('npm dedupe', done);});
  async.parallel(tasks, cb);
}

gulp.task('dist', function(cb){
  cleanup(function(){
    console.log('  → creating binaries for distribution');
    keepup('./node_modules/.bin/lone ')
      .on('data', function(buf){process.stdout.write(buf);})
      .on('stderr', function(buf){process.stderr.write(buf);})
      .on('complete', function(){
        var finalName = pkg.name + '_' + platform;
        if(platform === 'windows') finalName += '.exe';

        console.log('  ✔︎ Binary created: ' + path.resolve(
          __dirname + '/../dist/' + finalName));

        console.log('  → uploading release to github');

        gulp.src('./.lone/dist/' + pkg.name)
          .pipe(rename(finalName))
          .pipe(release(pkg))
          .on('end', function(){
            console.log('  ✔︎ Dist complete and uploaded to github');
            cb();
          });
      })
      .on('crash', function(data){
        console.log('  ✘ Binary build failed.  Check logs.  (exit code '+data.code+')');
        cb(new Error('Binary build failed.  Check logs.  (exit code '+data.code+')'));
      });
  });
});
```

Now we just run `gulp dist` on any platform and our app binaries are avilable
on GitHub without having to mess around with windows paths or cygwin.

## License

MIT

## Continuum of making computers do things

3 classes of solutions: cli, "status bar", gui.

Naive model of methods for implementing solutions:

- scripts: perl, bash, python, BAT
- module: publish to pypi, npm, artifactory, etc
- native cli: c*, qt, many-others, way it's always been done
- dynamic cli: `lone`, `go compile`
- dynamic gui: node-webkit, atom-shell, brackets-shell
- native gui: Cocoa, winfx

|      class       |      upsides      |                  downsides                  |
| :--------------- | :---------------- | :------------------------------------------ |
| script           | worksforme        | 30 scripts to start mongod and none correct |
| module           | reusable in web   | need toolchain, language bias, etc          |
| native cli       | what people want. | hard, expensive                             |
| dynamic cli      | what people want. | emerging                                    |
| dynamic gui      | what people want. | emerging                                    |
| native gui       | what people want. | really really hard                          |

## Status Bar Apps

Usually a feature of native gui apps, "status bar" apps (eg cloudup, dropbox, etc)
should have a home of their own rather than glumping into lone's scope.
This statusbar module might use lone under the hood, but definitely needs to
be separate.  [Rumps](https://github.com/jaredks/rumps) is an example python impl.
