
for the experimental zoomable version, the companion.java must look like this:

    package com.telasocial.companion;
    import android.os.Bundle;
    import org.apache.cordova.*;
    import android.webkit.WebSettings;
    public class companion extends CordovaActivity
    {
        @Override
        public void onCreate(Bundle savedInstanceState)
        {
            super.onCreate(savedInstanceState);
            super.init();
            // Set by <content src="index.html" /> in config.xml
            super.loadUrl(Config.getStartUrl());
            //super.loadUrl("file:///android_asset/www/index.html");
            WebSettings settings = super.appView.getSettings();
            settings.setBuiltInZoomControls(true);
            settings.setSupportZoom(true);
        }
    }

-----

- the script tag loading cordova.js doesn't need to exist in the web distribution

---

## User Story-oriented, release plan

* 08/04 - Initial prototype; anything that creates a work flow for users; feasibility analysis is done and plan for tests/builds. User can see real agenda, user can add agenda item to his calendar. No off-line storage, no background check service enabled.
* 15/04 - MVP - critical features are in; devices range is increased/defined, aiming to seek potential user problems out of testing. Offline is measured; Background service is being tested; Subscription user story is fully implemented.
* 22/04 - Release 1; with wider set of users, under tests;
* 29/04 - Release 2 (FISL-cobrand); with wider community;
* 06/05 - Release 3;(Launch team);
