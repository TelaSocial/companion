companion
=========

## Releasing an APK

    cordova release

The above command will generate an APK file, unsigned, in the ./platforms/android/ant-build/ directory. 

## Initial Instructions for Packaging to Android

You can follow the [Android instructions for packaging/signing](http://developer.android.com/tools/publishing/app-signing.html) which involves basically: 

    $ keytool -genkey -v -keystore my-release-key.keystore
    -alias alias_name -keyalg RSA -keysize 2048 -validity 10000

For the key, which you should keep in a safe directory. And then you can sign the *resease* Jar created previously: 

    $ jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore
    my_application.apk alias_name


