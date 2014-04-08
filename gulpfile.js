'use strict';

//libraries
var pkg = require('./package.json'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    cordova = require('cordova'),
    CordovaError = require('cordova/src/CordovaError'),
    Q = require('q');

//paths
var paths = {
        sources: {
            layouts: 'src/templates/layouts/',
            partials: 'src/templates/partials/*.hbs',
            pages: 'src/templates/pages/*.hbs',
            data: 'src/data/*.json'
        },
        build: {
            root: 'dist',
            www: 'dist/www/',
            cordova: 'dist/cordova/',
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

var cordovaLog = function(msg){
    console.log('[' + blue('cordova')+ '] ', msg);
};

//creates a cordova folder for the app
gulp.task('cordova:create', ['createBuildDir'], function(cb){
    var name = pkg.name,
        dir = paths.build.cordova,
        id = pkg.cordovaConfig.id,
        cfg = pkg.cordovaConfig.extra,
        promise;

    cordova.on('log', cordovaLog);
    cordova.on('verbose', cordovaLog);
    promise = new Q(cordova.create(dir, id, name, cfg));
    promise.then(function(){
        gutil.log('cordova create finished.');
        cb(null);
    });
});

gulp.task('cordova:addAndroid', ['cordova:create'], function(){
    process.env.PWD = path.join(process.env.PWD, paths.build.cordova);
    console.log('process.env.PWD', process.env.PWD);
    cordova.platform('add', 'android');
});

//run all the initial cordova-related tasks
gulp.task('cordova:setup',
    [
        'cordova:addAndroid'
// - cordova plugin add https://github.com/EddyVerbruggen/Calendar-PhoneGap-Plugin.git
// - cordova plugin add https://github.com/Red-Folder/bgs-core
// - cordova plugin add https://github.com/Red-Folder/bgs-sample
    ]
);

//default
gulp.task('default', function() {
});

//catch CordovaErrors
process.on('uncaughtException', function(err){
    if (err instanceof CordovaError) {
        gutil.log(red(err.message));
    } else {
        console.error(err.stack);
    }
    process.exit(1);
});

