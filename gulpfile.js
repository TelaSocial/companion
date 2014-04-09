'use strict';

//libraries
var pkg = require('./package.json'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    assemble = require('gulp-assemble'),
    cordova = require('cordova'),
    CordovaError = require('cordova/src/CordovaError'),
    Q = require('q');

//paths
var paths = {
        root: __dirname,
        sources: {
            layouts: 'src/templates/layouts/',
            partials: 'src/templates/partials/*.hbs',
            pages: 'src/templates/pages/*.hbs',
            data: 'src/data/*.json',
            scripts: 'src/scripts/**/*.js'
        },
        build: {
            root: 'dist',
            www: 'dist/www/',
            js: 'dist/www/js',
            cordova: 'dist/cordova/',
            cordova_www: 'dist/cordova/www/'
        }
    };

//globals
var red = gutil.colors.red,
    // magenta = gutil.colors.magenta,
    // cyan = gutil.colors.cyan,
    // green = gutil.colors.green,
    blue = gutil.colors.blue;

//----------------------------------------------------------------------------
// tasks
//----------------------------------------------------------------------------

gulp.task('createBuildDir', function(cb){
    mkdirp(paths.build.root, function(err) {
        if(err){ throw err; }
        cb(null);
    });
});

//web
gulp.task('web:buildScripts', function(){
    return gulp.src(paths.sources.scripts)
                .pipe(gulp.dest(
                    paths.build.js
                ));
});
gulp.task('web:buildPages', function(){
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
});
gulp.task(  'web:build', [
                'web:buildScripts',
                'web:buildPages'
            ], function(){
    return true;
});


//cordova
var cordovaLog = function(msg){
    console.log('[' + blue('cordova')+ '] ', msg);
};
cordova.on('log', cordovaLog);
cordova.on('verbose', cordovaLog);

var cordovaCdToRoot = function(){
    process.env.PWD = path.join(paths.root, paths.build.cordova);
};

//creates a cordova folder for the app
gulp.task('cordova:create', ['createBuildDir'], function(cb){
    var name = pkg.name,
        dir = paths.build.cordova,
        id = pkg.cordovaConfig.id,
        cfg = pkg.cordovaConfig.extra,
        promise;

    promise = new Q(cordova.create(dir, id, name, cfg));
    promise.then(cb);
});

gulp.task('cordova:addAndroid', ['cordova:create'], function(cb){
    var promise;
    cordovaCdToRoot();
    promise = new Q(cordova.platform('add', 'android'));
    promise.then(cb);
});

//install 3 plugins
gulp.task('cordova:addPlugins', ['cordova:addAndroid'], function(cb){
    var promise,
        pluginsToInstall = [
            'https://github.com/EddyVerbruggen/Calendar-PhoneGap-Plugin.git',
            'https://github.com/Red-Folder/bgs-core.git',
            'https://github.com/Red-Folder/bgs-sample.git'
        ];
    cordovaCdToRoot();
    promise = new Q(cordova.plugin('add', pluginsToInstall));
    promise.then(cb);
});

//run all the initial cordova-related tasks
gulp.task('cordova:setup',['cordova:addPlugins']);

gulp.task('cordova:copyWeb', ['web:build'], function(){
    return gulp.src([
                        './**/*.html',
                        './js/**/*.js',
                        './css/**/*.css',
                        './img/**/*.*'
                    ], {
                        cwd: paths.build.www + '**'
                    })
                .pipe(gulp.dest(
                    paths.build.cordova_www
                ));
});

gulp.task('cordova:build', ['cordova:copyWeb'], function(cb){
    var promise;
    cordovaCdToRoot();
    promise = new Q(cordova.build());
    promise.then(cb);
});

//default
gulp.task('default', function() {
});

//catch CordovaErrors
process.on('uncaughtException', function(err){
    var harmlessErrors = [
            /Path already exists and is not empty/g,
            /Platform android already added/g
        ],
        shouldExit = true;
    if (err instanceof CordovaError) {
        cordovaLog(red(err.message));
    } else {
        console.error(err.stack);
    }
    harmlessErrors.forEach(function(pattern){
        if (pattern.test(err.message)){
            shouldExit = false;
        }
    });
    if (shouldExit) {
        process.exit(1);
    }
});

