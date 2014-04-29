## requirements

* The build system was tested with node.js version v0.10.15.
* You will need to have android sdk (./tools) in your PATH.
* You will need [Gulp installed globally](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md#1-install-gulp-globally)

## install dev dependencies

```
npm install
```

## build only the web distro

```
gulp web:build
```

## create cordova app folders and install plugins

```
gulp cordova:setup
```

## package web distro into cordova (cordova build)
```
gulp cordova:build
```

## run the cordova build on a device
```
gulp cordova:run
```

## cordova release
```
gulp cordova:release
```
