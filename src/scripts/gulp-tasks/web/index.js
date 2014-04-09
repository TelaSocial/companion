'use strict';
var gulp = require('gulp'),
    assemble = require('gulp-assemble');

module.exports = function(paths){

    this.buildScripts = function(){
        return  gulp.src(paths.sources.scripts).pipe(
                    gulp.dest(paths.build.js)
                );
    };

    this.buildPages = function(){
        var options = {
            layoutdir: paths.sources.layouts,
            partials: paths.sources.partials,
            data: paths.sources.data,
            log: {
                level: 'error' // verbose, debug, info, warning, error, critical
            }
        };
        return gulp.src(paths.sources.pages)
            .pipe(assemble('www', options))
            .pipe(gulp.dest(paths.build.www));
    };
};
