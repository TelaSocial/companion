'use strict';

var debugApp = function($){
    var loadXML = function(){
        // var url = 'http://papers.softwarelivre.org/papers_ng/public/fast_grid?event_id=4',
        var button = $('#load-ajax-button'),
            url = button.data('url');
        console.log('Getting url', url);
        $.get(url, {dataType: 'xml'}, function(data){
            console.log('Load was performed [1]:', data);
        })
        .done(function(data) {
            var textArea = $('#payload'),
                response = $(data).find('response').first(),
                raw = response.html();
            console.log('Load was performed:', data);
            console.log('Response:', $(data).find('response').first().html());
            textArea.val(raw.length > 1 ? raw : 'empty response');
        }).fail(function() {
            console.log('error');
        }).always(function() {
            console.log('finished');
        });
    };
    var onDeviceReady = function(){
        //bind events
        $('#load-ajax-button').click(loadXML);
    };
    $(document).ready(function() {
        var isCordova = document.URL.substring(0,4) === 'file';
        if (isCordova) {
            document.addEventListener('deviceready', onDeviceReady, false);
        } else {
            onDeviceReady();
        }
    });
};
debugApp(jQuery.noConflict());