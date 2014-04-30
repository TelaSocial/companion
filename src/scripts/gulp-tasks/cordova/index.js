'use strict';
var path = require('path'),
    gutil = require('gulp-util'),
    cordova = require('cordova'),
    CordovaError = require('cordova/src/CordovaError'),
    Q = require('q');

var red = gutil.colors.red,
    // magenta = gutil.colors.magenta,
    // cyan = gutil.colors.cyan,
    // green = gutil.colors.green,
    blue = gutil.colors.blue;


module.exports = function(paths, pkg){

    var cordovaLog = function(msg){
        console.log('[' + blue('cordova')+ '] ', msg);
    };
    cordova.on('log', cordovaLog);
    cordova.on('verbose', cordovaLog);
    var cordovaCdToRoot = function(){
        cordovaLog('Starting directory: ' + process.cwd());
        cordovaLog('root:'+__dirname);
        // process.env.PWD = path.join(paths.root, paths.build.cordova);
        cordovaLog(':o '+path.join(paths.root, paths.build.cordova));
        process.chdir(path.join(paths.root, paths.build.cordova));
        // process.exit();
    };

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


    this.create = function(cb){
        var name = pkg.name,
            dir = paths.build.cordova,
            id = pkg.cordovaConfig.id,
            cfg = pkg.cordovaConfig.extra,
            promise;

        if (cfg && cfg.lib && cfg.lib.www && cfg.lib.www.uri){
            cfg.lib.www.uri = path.resolve(dir, cfg.lib.www.uri);
        }
        promise = new Q(cordova.create(dir, id, name, cfg));
        promise.then(cb);
    };

    this.addAndroid = function(cb){
        var promise;
        cordovaCdToRoot();
        promise = new Q(cordova.platform('add', 'android'));
        promise.then(cb);
    };

    this.addPlugins = function(cb){
        var promise,
            pluginsToInstall = [
                'https://github.com/EddyVerbruggen/Calendar-PhoneGap-Plugin.git',
                'https://github.com/Red-Folder/bgs-core.git',
                'https://github.com/Red-Folder/bgs-sample.git'
            ];
        cordovaCdToRoot();
        promise = new Q(cordova.plugin('add', pluginsToInstall));
        promise.then(cb);
    };

    this.build = function(cb){
        var promise;
        cordovaCdToRoot();
        promise = new Q(cordova.build());
        promise.then(cb);
    };

    this.run = function(cb){
        var promise;
        cordovaCdToRoot();
        promise = new Q(cordova.run({
            debug: true
        }));
        promise.then(cb);
    };

    this.release = function(cb){
        var promise;
        cordovaCdToRoot();
        promise = new Q(cordova.run({
            release: true
        }));
        promise.then(cb);
    };

};