'use strict';
var jQuery = require('jquery'),
    FISLParser = require('./lib/fisl/feed-parser');

var debugApp = function($){
    var isCordova = document.URL.substring(0,4) === 'file';
    var loadXML = function(){
        var button = $(this),
            textArea = $('#payload'),
            url = button.data('url');
        console.log('Getting url ' + url);
        textArea.val('Getting url ' + url);
        $.ajax(url, {
            dataType: 'text'
        })
        .done(function(data) {
            console.log('Load was performed [1]: ' + (typeof data));
            var textArea = $('#payload'),
                parser = new FISLParser($, new Date('2014-05-07T00:01-03:00'));
            textArea.val(data);
            parser.parse(data);
        }).fail(function() {
            console.log('error');
        }).always(function() {
            console.log('finished');
        });
    };
    var onDeviceReady = function(){
        //bind events
        $('.load-ajax-button').click(loadXML);
    };
    $(document).ready(function() {
        if (isCordova) {
            document.addEventListener('deviceready', onDeviceReady, false);
        } else {
            onDeviceReady();
        }
    });
};
debugApp(jQuery.noConflict());