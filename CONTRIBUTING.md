## requirements

* The build system was tested with node.js version v0.10.15.
* You will need to have android sdk (./tools) in your PATH.

## install dependencies

```
npm install
cd node_modules/gulp-assemble/
npm install git://github.com/assemble/assemble.git#504abaa4df1c377e5525d6f800447ec3552960fb
cd ../../
```

## create cordova app folders and install plugins

```
npm run-script cordova-setup
```

or simply

```
gulp cordova:setup
```

If you have Gulp installed globally.

## package web distro into cordova (cordova build)
```
gulp cordova:build
```

## build only the web distro
```
gulp web:build
```
