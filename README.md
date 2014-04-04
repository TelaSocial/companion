companion
=========

## Related plugins 

For calendar interoperation: 

    cordova plugin add https://github.com/EddyVerbruggen/Calendar-PhoneGap-Plugin.git

For background service to JS 

    cordova plugin add [directory||https://github.com/Red-Folder/bgs-core]

This last plugin asks for another plugin to be used, which instantiates the above, 

    https://github.com/Red-Folder/bgs-sample

## Releasing an APK

This should probably live in a script in our framework. 

    cordova release

The above command will generate an APK file, unsigned, in the ./platforms/android/ant-build/ directory. 

## Initial Instructions for Packaging to Android

You can follow the [Android instructions for packaging/signing](http://developer.android.com/tools/publishing/app-signing.html) which involves basically: 

    $ keytool -genkey -v -keystore my-release-key.keystore
    -alias alias_name -keyalg RSA -keysize 2048 -validity 10000

For the key, which you should keep in a safe directory. And then you can sign the *resease* Jar created previously: 

    $ jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore
    my_application.apk alias_name

Then you can copy to Android with adb push filename-signed.apk /sdcard/path-in-device/file.adk — or push to a market, etc. 
