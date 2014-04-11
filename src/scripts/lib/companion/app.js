'use strict';
module.exports = function($){
    var isCordova = document.URL.substring(0,4) === 'file';
    var onDeviceReady = function(){
        console.log('device ready');
    };
    $(document).ready(function() {
        if (isCordova) {
            document.addEventListener('deviceready', onDeviceReady, false);
        } else {
            onDeviceReady();
        }
    });
};