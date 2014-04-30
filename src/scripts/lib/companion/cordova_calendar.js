'use strict';

module.exports = function($){
    this.addToCalendarButtonClicked = function (event, rooms){
        var button = $(event.target),
            sessionItem = button.parents('.session').first(),
            sessionTitle = sessionItem.find('.session-title-link').text().trim(),
            sessionAbstract = sessionItem.find('.session-abstract').text().trim(),
            sessionAuthorsElements = sessionItem.find('.author-name'),
            sessionAuthors = [],
            authorsString = 'Autores: ',
            start = sessionItem.data('start'),
            duration = sessionItem.data('duration'), //minutes
            roomId = sessionItem.data('room'),
            roomName = rooms[roomId].name,
            zoneID = sessionItem.data('zone'),
            zoneName = zoneID, // replace this with the zone name later
            zoneString = 'Zona: '+zoneName,
            title = sessionTitle,
            location = 'Sala: ' + roomName + ' (FISL 15)',
            notes = '',
            startDate = new Date(start),
            endDate = new Date(startDate.getTime() + duration * 60 * 1000),
            success = function(message) { console.log('Success: ' + JSON.stringify(message)); },
            error = function(message) { console.log('Error: ' + message); };
        event.preventDefault();
        console.log('addToCalendarButtonClicked rooms', sessionItem, rooms, roomId, typeof rooms[roomId]);
        sessionAuthorsElements.each(function(){
            sessionAuthors.push($(this).text().trim());
        });
        authorsString += sessionAuthors.join(', ');

        notes += authorsString + '\n';
        notes += zoneString + '\n';
        notes += sessionAbstract;

        console.log('addToCalendarButtonClicked');
        console.log(title);
        console.log(location);
        console.log(notes);
        console.log(start);
        console.log(duration);
        console.log(startDate);
        console.log(endDate);

        if ((window.plugins !== undefined) && (window.plugins.calendar !== undefined)){
            // create an event silently (on Android < 4 an interactive dialog is shown)
            // window.plugins.calendar.createEvent(title,location,notes,startDate,endDate,success,error);

            // create an event interactively (only supported on Android)
            window.plugins.calendar.createEventInteractively(
                title,
                location,
                notes,
                startDate,
                endDate,
                success,
                error
            );
        } else {
            console.log('Add to calender not supported in your platform');
        }
    };
};
