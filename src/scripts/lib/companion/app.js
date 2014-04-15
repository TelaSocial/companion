'use strict';
module.exports = function($){
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
            success = function(message) { alert('Success: ' + JSON.stringify(message)); },
            error = function(message) { alert('Error: ' + message); };
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
    var onDeviceReady = function(){
        console.log('device ready');
        //setup add to calendar buttons
        setupAddToCalendarButtons();
    };
    $(document).ready(function() {
        if (isCordova) {
            document.addEventListener('deviceready', onDeviceReady, false);
        } else {
            onDeviceReady();
        }
    });
    $(document).foundation();
};