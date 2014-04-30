'use strict';

//libraries
var pkg = require('./package.json'),
    mkdirp = require('mkdirp'),
    gulp = require('gulp');


//paths
var paths = {
        root: __dirname,
        sources: {
            layouts: 'src/templates/layouts/',
            partials: 'src/templates/partials/*.hbs',
            pages: 'src/templates/pages/*.hbs',
            data: 'src/data/',
            scripts: 'src/scripts/',
            styles: 'src/styles/',
            fonts: 'src/fonts/'
        },
        build: {
            root: 'dist',
            www: 'dist/www/',
            data: 'dist/www/data',
            js: 'dist/www/js/',
            css: 'dist/www/css',
            fonts: 'dist/www/fonts/',
            scss: 'dist/www/css/src/styles/',
            cordova: 'dist/cordova/',
            cordova_www: 'dist/cordova/www/'
        }
    };

//urls
var urls = {
        fisl: {
            gridXML: 'http://papers.softwarelivre.org/papers_ng/public/fast_grid?event_id=4',
            gridHTML: 'http://papers.softwarelivre.org/papers_ng/public/new_grid?day=7'
        }
    };

//gulp tasks libraries
var WebTasks = require('./src/scripts/gulp-tasks/web'),
    CordovaTasks = require('./src/scripts/gulp-tasks/cordova'),
    FISLTasks = require('./src/scripts/gulp-tasks/fisl'),
    tasks = {
        web: new WebTasks(paths),
        cordova: new CordovaTasks(paths, pkg),
        fisl: new FISLTasks(paths, urls)
    };


// tasks
gulp.task('createBuildDir', function(cb){
    mkdirp(paths.build.root, function(err) {
        if(err){ throw err; }
        cb(null);
    });
});

// fisl
gulp.task('fisl:fetchXML', tasks.fisl.fetchXML);
gulp.task('fisl:buildJSON', tasks.fisl.buildJSON);

//web
gulp.task('web:buildData', tasks.web.buildData);
gulp.task('web:bundleScripts', tasks.web.bundleScripts);
gulp.task('web:copyExtraLibraries', tasks.web.copyExtraLibraries);
gulp.task('web:buildScripts',
    [
        'web:bundleScripts',
        'web:copyExtraLibraries'
    ]
);
gulp.task('web:copyFonts', tasks.web.copyFonts);
gulp.task('web:buildStyles',
    [
        'web:copyFonts'
    ], tasks.web.buildStyles);
gulp.task('web:buildPages', tasks.web.buildPages);
gulp.task('web:build',
    [
        'web:buildData',
        'web:buildScripts',
        'web:buildStyles',
        'web:buildPages'
    ]
);

//cordova
gulp.task('cordova:create', ['createBuildDir'], tasks.cordova.create);
gulp.task('cordova:addAndroid', ['cordova:create'], tasks.cordova.addAndroid);
gulp.task('cordova:addPlugins', ['cordova:addAndroid'], tasks.cordova.addPlugins);
gulp.task('cordova:setup',['cordova:addPlugins'], tasks.cordova.setup);

gulp.task('cordova:build', ['web:build'], tasks.cordova.build);
gulp.task('cordova:run', tasks.cordova.run);
gulp.task('cordova:release', tasks.cordova.release);

//default
gulp.task('default', function() {});


