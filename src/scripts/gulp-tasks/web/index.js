'use strict';
var gulp = require('gulp'),
    assemble = require('gulp-assemble'),
    sass = require('gulp-sass'),
    through = require('through2'),
    browserify = require('browserify');

module.exports = function(paths){

    this.buildData = function(){
        return  gulp.src(paths.sources.data + '**/*.*')
                    .pipe(gulp.dest(paths.build.data));
    };

    //to make browserify compatible with gulp streams
    //see https://github.com/gulpjs/plugins/issues/47#issuecomment-38038638
    function bundle(options) {
      return through.obj(function(file, encoding, callback) {
        var bundle = browserify()
          .require(file, { entry: file.path })
          .bundle(options);
        file.contents = bundle;
        this.push(file);
        callback();
      });
    }

    this.buildScripts = function(){
        var options = {
                browserify: {
                    debug: false
                }
            };

        return gulp.src(paths.sources.scripts + '*.js')
                .pipe(bundle(options.browserify))
                .pipe(gulp.dest(paths.build.js));
    };

    this.buildStyles = function(){
        var options = {
            sourceComments: 'map' //'none', 'normal', 'map'
        };
        //copy sass files to dist
        if (options.sourceComments === 'map'){
            gulp.src(['**/*.scss'], {cwd: paths.sources.styles + '**'})
            .pipe(gulp.dest(paths.build.scss));
        }
        return gulp.src(paths.sources.styles + '**/*.scss')
                .pipe(sass(options))
                .pipe(gulp.dest(paths.build.css));
    };

    this.buildPages = function(){
        var options = {
            layoutdir: paths.sources.layouts,
            partials: paths.sources.partials,
            data: paths.sources.data + '*.json',
            log: {
                level: 'error' // verbose, debug, info, warning, error, critical
            }
        };
        return gulp.src(paths.sources.pages)
            .pipe(assemble('www', options))
            .pipe(gulp.dest(paths.build.www));
    };
};
