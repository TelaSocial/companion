'use strict';

module.exports = function($, FISLParser, templates){
    var isCordova = document.URL.substring(0,4) === 'file';

    var addToCalendarButtonClicked = function (event){
        var button = $(this),
            sessionItem = button.parents('.session').first(),
            sessionTitle = sessionItem.find('.session-title').text().trim(),
            sessionAbstract = sessionItem.find('.session-abstract').text().trim(),
            start = sessionItem.data('start'),
            duration = sessionItem.data('duration'), //minutes
            roomId = sessionItem.data('room'),
            roomName = $('#'+roomId).text(),
            title = sessionTitle,
            location = 'Sala: ' + roomName + ' (FISL 15)',
            notes = sessionAbstract,
            startDate = new Date(start),
            endDate = new Date(startDate.getTime() + duration * 60 * 1000),
            success = function(message) { console.log('Success: ' + JSON.stringify(message)); },
            error = function(message) { console.log('Error: ' + message); };
        event.preventDefault();
        console.log('addToCalendarButtonClicked');
        console.log(sessionItem);
        console.log(title);
        console.log(location);
        console.log(notes);
        console.log(startDate);
        console.log(endDate);

        if ((window.plugins !== undefined) && (window.plugins.calendar !== undefined)){
            // create an event silently (on Android < 4 an interactive dialog is shown)
            // window.plugins.calendar.createEvent(title,location,notes,startDate,endDate,success,error);

            // create an event interactively (only supported on Android)
            window.plugins.calendar.createEventInteractively(title,location,notes,startDate,endDate,success,error);
        } else {
            console.log('Add to calender not supported in your platform');
        }
    };

    var setupAddToCalendarButtons = function(){
        $('.calendar-add-button').click(addToCalendarButtonClicked);
    };

    var populateSchedule = function(data){
        var template = templates['schedule'],
            destinationElement = $('#app'),
            progressMeter = $('.meter').first(),
            html = template(
                {
                    schedule_type: 'list',
                    schedule_grouped_by_time: data
                }
            );
        // console.log(html);
        progressMeter.width('80%');
        destinationElement.html(html);
    };
    var firstLoad = function(){
        var appElement = $('#app'),
            feedURL = appElement.data('feed-url'),
            localFeed = appElement.data('local-feed-url'),
            isCordova = document.URL.substring(0,4) === 'file',
            progressMeter = $('.meter').first();

        if (!isCordova) {
            feedURL = localFeed;
        }
        //1. fetch feed

        console.log('Loading ' + feedURL + '...');
        $.ajax(feedURL, {
            dataType: 'text'
        })
        //2. parse feed
        .done(function(data) {
            var parser = new FISLParser($, new Date('2014-05-07T00:01-03:00')),
                scheduleData = parser.parse(data);
            progressMeter.width('25%');
            console.log(scheduleData);
            //3. render schedule
            populateSchedule(scheduleData);
            //4. start foundation
            $(document).foundation();
            //5. bind calendar button clicks
            setupAddToCalendarButtons();
        }).fail(function() {
            console.log('error');
        }).always(function() {
            console.log('finished');
        });

    };

    var onDeviceReady = function(){
        console.log('device ready');
        firstLoad();
    };
    $(document).ready(function() {
        if (isCordova) {
            document.addEventListener('deviceready', onDeviceReady, false);
        } else {
            onDeviceReady();
        }
    });
};