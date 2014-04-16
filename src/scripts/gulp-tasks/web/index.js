'use strict';
var gulp = require('gulp'),
    assemble = require('gulp-assemble'),
    yfm = require('assemble-front-matter'),
    glob = require('glob'),
    _ = require ('lodash'),
    sass = require('gulp-sass'),
    through = require('through2'),
    browserify = require('browserify'),
    hbsfy = require('hbsfy').configure({
        extensions: ['hbs']
    }),
    brfs = require('brfs');

module.exports = function(paths){

    //to make browserify compatible with gulp streams
    //see https://github.com/gulpjs/plugins/issues/47#issuecomment-38038638
    function bundle(options) {
      return through.obj(function(file, encoding, callback) {
        var bundle = browserify()
          .require(file, { entry: file.path })
          .transform(hbsfy)
          .transform('brfs')
          .bundle(options);
        file.contents = bundle;
        this.push(file);
        callback();
      });
    }

    // Sometimes whe want to mix browserify bundled libs with cdn-available
    // libraries (such as jquery, etc), those libs that goes on extra
    // <script> tags are defined in the YAML front matter of the page
    // template files.
    //
    // This function runs through all pages, collect all js paths that are libs
    // from their frontmatter setups, and then copy them to the dist folder
    this.copyExtraLibraries = function(){
        glob(paths.sources.pages, {}, function (er, files) {
            var jsFiles = [],
                libPattern = 'js/lib/';
            files.forEach(function(filename){
                var data = yfm.extract(filename).context;
                jsFiles = _.union(
                                jsFiles,
                                _.map(data.js, function(filepath){
                                        return filepath;
                                    }
                                )
                            );
            });
            _.remove(jsFiles, function(filename){
                return filename.substring(0, libPattern.length) !== libPattern;
            });
            jsFiles = _.map(jsFiles, function(filename){
                return filename.replace(/js\//,'');
            });
            gulp.src(jsFiles, { cwd: paths.sources.scripts + '**'})
                .pipe(gulp.dest(paths.build.js));
        });
    };

    this.bundleScripts = function(){
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

    this.buildData = function(){
        return  gulp.src(paths.sources.data + '**/*.*')
                    .pipe(gulp.dest(paths.build.data));
    };


};
