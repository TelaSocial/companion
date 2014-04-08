'use strict';

//libraries
var pkg = require('./package.json'),
    gulp = require('gulp'),
    cordova = require('cordova'),
    CordovaError = require('cordova/src/CordovaError'),
    gutil = require('gulp-util');

//paths
var paths = {
        sources: {
            layouts: 'src/templates/layouts/',
            partials: 'src/templates/partials/*.hbs',
            pages: 'src/templates/pages/*.hbs',
            data: 'src/data/*.json'
        },
        build: {
            www: 'dist/www/',
            cordova: 'dist/cordova/',
        }
    };

//globals
var magenta = gutil.colors.magenta,
    red = gutil.colors.red,
    // cyan = gutil.colors.cyan,
    // blue = gutil.colors.blue,
    green = gutil.colors.green;

//----------------------------------------------------------------------------
// tasks
//----------------------------------------------------------------------------

//creates a cordova folder for the app
gulp.task('cordova:create', function(){
    var name = pkg.name,
        dir = paths.build.cordova,
        id = pkg.cordovaConfig.id,
        cfg = pkg.cordovaConfig.extra;

    gutil.log(
        'Setting up', magenta(name),'(' + green(id) + ') at', magenta(dir) + '...'
    );
    cordova.create(dir, id, name, cfg);
});

//run all the initial cordova-related tasks
gulp.task('cordova:setup',
    [
        'cordova:create'
// - cordova platform add android
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

