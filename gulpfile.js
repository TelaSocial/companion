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
            styles: 'src/styles/'
        },
        build: {
            root: 'dist',
            www: 'dist/www/',
            data: 'dist/www/data',
            js: 'dist/www/js/',
            css: 'dist/www/css',
            scss: 'dist/www/css/src/styles/',
            cordova: 'dist/cordova/',
            cordova_www: 'dist/cordova/www/'
        }
    };

//gulp tasks libraries
var WebTasks = require('./src/scripts/gulp-tasks/web'),
    CordovaTasks = require('./src/scripts/gulp-tasks/cordova'),
    tasks = {
        web: new WebTasks(paths),
        cordova: new CordovaTasks(paths, pkg)
    };


// tasks
gulp.task('createBuildDir', function(cb){
    mkdirp(paths.build.root, function(err) {
        if(err){ throw err; }
        cb(null);
    });
});

gulp.task('t', function(){
    var i = gulp.src(paths.sources.scripts);
    console.log(i);
});

//web
gulp.task('web:buildData', tasks.web.buildData);
gulp.task('web:buildScripts', tasks.web.buildScripts);
gulp.task('web:buildStyles', tasks.web.buildStyles);
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

gulp.task('cordova:copyWeb', ['web:build'], tasks.cordova.copyWeb);
gulp.task('cordova:build', ['cordova:copyWeb'], tasks.cordova.build);

//default
gulp.task('default', function() {});


