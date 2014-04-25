'use strict';

//custom lodash
var _ = {
        compact: require('lodash-node/modern/arrays/compact')
    };

var FeedParser = function($, eventDate){

    // var sortByStart = function (a,b){
    //     return a.start > b.start ? 1 : -1;
    // };
    // var sortByRoomIndex = function(a,b){
    //     return a.roomIndex > b.roomIndex ? 1 : -1;
    // };
    this.parse = function (data){
        //on nodejs data will be null because the xml was passed to cheerio and is already the doc in $
        //on the browser, data will be the xml text string returned from an ajax dataType:'text' call
        var $xml = (typeof data === 'string') ? $(data) : $('response'),
            authorElements = $xml.find('authorship person'),
            slotElements = $xml.find('slots slot'),
            roomElements = $xml.find('rooms room'),
            minimumInterval = Number($xml.find('hours').first().attr('minimum_interval')),
            // endOfDay = '00:00:00.000Z',
            // startOfDay = '23:59:59.000Z',
            // weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
            presenters = {}, // for each session the group of people giving that talk
            sessions = {},
            rooms = {},
            days = [],
            roomOrder = [];

        //Fill the presenters dictionary
        //key is sessionID (aka candidate attribute in the XML)
        //value is an array of people
        authorElements.each(function(){
            var person = $(this),
                id = person.attr('id'),
                name = person.attr('name'),
                sessionID = person.attr('candidate'),
                main = person.attr('main') === '1';
            if (presenters[sessionID] === undefined){
                presenters[sessionID] = [];
            }
            if (name !== ''){
                presenters[sessionID].push({
                    id: id,
                    name: name,
                    main: main
                });
            }
            //presenters array is sorted with the main presenters first,
            //then alphabetically
            if (presenters[sessionID].length > 1){
                presenters[sessionID].sort(function(a,b){
                    return a.name > b.name ? 1 : -1;
                });
                presenters[sessionID].sort(function(a,b){
                    return a.main < b.main ? 1 : -1;
                });
            }
        });

        // console.log(presenters);
        // process.exit();

        //Fill the rooms dictionary and the roomOrder array
        roomElements.each(function(){
            var room = $(this),
                id = room.attr('id'),
                venue = room.find('venue').first().text(),
                capacity = Number(room.find('capacity').first().text()),
                translation = room.find('translation').first().text().toUpperCase() === 'TRUE',
                name = room.find('name').first().text(),
                position = Number(room.find('position').first().text());

            rooms[id] = {
                id: id,
                venue: venue,
                capacity: capacity,
                translation: translation,
                name: name,
                position: position
            };

            roomOrder[position] = id;
        });
        roomOrder = _.compact(roomOrder);

        // console.log(rooms);
        // console.log(roomOrder);
        // process.exit();


        //- TBD Fill the areas dictionary
        //- TBD Fill the zones dictionary


        // In the xml session information are stored under slot elements
        // which are 'slots in the schedule calendar'
        // a slot id is not an id unique to the session, the session id
        // is the 'candidate' attribute on FISL's XML.
        //
        // The reason for this I believe is because each talk is a 'candidate'
        // in the selection process that is made by the same system.
        slotElements.each(function(){
            var slot = $(this),
                // attributes from the XML elements
                sessionID = slot.attr('candidate'),
                title = slot.attr('title'),
                abstract = slot.attr('abstract'),
                areaID = slot.attr('area'),
                zoneID = slot.attr('zone'),
                level = slot.attr('level'),
                roomID = slot.attr('room'),
                // slotID = slot.attr('id'), // useless?
                colspan = Number(slot.attr('colspan')),
                date = slot.attr('date'),
                hour = slot.attr('hour'),
                minute = slot.attr('minute'),
                //
                start = date + 'T' + hour + ':' + minute + ':00-03:00',
                duration = colspan * minimumInterval, //minutes
                session = {};

            session = {
                id: sessionID,
                title: title,
                abstract: abstract,
                areaID: areaID,
                zoneID: zoneID,
                level: level,
                start: start,
                duration: duration,
                roomID: roomID
            };
            sessions[sessionID] = session;
        });

        // console.log(sessions);
        // process.exit();


    // -TBD Fill the days of the event




        // if (grouped_by === 'room'){
        //     for (var d = days.length - 1; d >= 0; d--) {
        //             //sort sessions in a room by starting time
        //             for (var j = days[d].rooms.length - 1; j >= 0; j--) {
        //                 days[d].rooms[j].sessions.sort(sortByStart);
        //             }

        //             //created a sorted times array from the times dictionary
        //             var timeArray = [],
        //                 maxColspan = 0;
        //             for (var key in days[d].times){
        //                 var start = key,
        //                     colspan = days[d].times[key],
        //                     label = start.substring(0, 5);
        //                 maxColspan += colspan;
        //                 timeArray.push({
        //                     start: start,
        //                     colspan: colspan,
        //                     label: label
        //                 });
        //             }
        //             timeArray.sort(sortByStart);
        //             //replace times dict with times array
        //             days[d].times = timeArray;
        //             days[d].maxColspan = maxColspan;

        //             //for each session, include the interval after the end for
        //             //which the room will remain empty until the next session
        //             //for the first session of each room also include the interval
        //             //since the beggining of the day that the room remained empty
        //             for (var k = days[d].rooms.length - 1; k >= 0; k--) {
        //                 for (var l = 0; l < days[d].rooms[k].sessions.length; l++) {
        //                     var session = days[d].rooms[k].sessions[l],
        //                         isFirst = (l === 0),
        //                         isLast = (l === days[d].rooms[k].sessions.length - 1),
        //                         startDate = new Date(session.start),
        //                         startDateSplit = startDate.toISOString().split('T'),
        //                         end = new Date(startDate.getTime() + session.duration * 60 * 1000).getTime(),
        //                         nextSession = isLast ? null : days[d].rooms[k].sessions[l+1],
        //                         nextSessionStart = isLast ?
        //                             new Date(startDateSplit[0] + 'T' + endOfDay).getTime() :
        //                             new Date(nextSession.start).getTime(),
        //                         dayStart;

        //                     if (isFirst){
        //                         dayStart = new Date(startDateSplit[0] + 'T' + startOfDay).getTime();
        //                         session.intervalBefore = (startDate.getTime() - dayStart) / 1000 / 60;
        //                         session.intervalBeforeColspan = session.intervalBefore / minimumInterval;
        //                     }
        //                     session.intervalAfter = (nextSessionStart - end) / 1000 / 60;
        //                     session.intervalAfterColspan = session.intervalAfter / minimumInterval;
        //                 }
        //             }
        //     }
        // }
        // if (grouped_by === 'time'){
        //     sessions.sort(sortByStart);
        //     for (var s = 0; s < sessions.length; s++) {
        //         var session = sessions[s],
        //             start = session.start,
        //             dayIndex = session.dayIndex,
        //             label = start.split('T')[1].substring(0, 5),
        //             shortLabel = label.replace(':00','');
        //         if (days[dayIndex].times[start] === undefined){
        //             days[dayIndex].times[start] = {
        //                 sessions:[],
        //                 label: label,
        //                 shortLabel: shortLabel,
        //             };
        //         }
        //         days[dayIndex].times[start].sessions.push(session);
        //     }

        //     //sort by room position after
        //     for (var d = days.length - 1; d >= 0; d--) {
        //         var day = days[d];
        //         for (var t in day.times) {
        //             var time = day.times[t];
        //             time.sessions = time.sessions.sort(sortByRoomIndex);
        //         }
        //     }
        // }

        // console.log(JSON.stringify(days, null, '  '));
        return  {
                    presenters: presenters,
                    rooms: rooms,
                    sessions: sessions
                };
    };
};
module.exports = FeedParser;