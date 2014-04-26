'use strict';

//custom lodash
var _ = {
        sortBy: require('lodash-node/modern/collections/sortBy'),
        map: require('lodash-node/modern/collections/map'),
        forEach: require('lodash-node/modern/collections/forEach'),
        compact: require('lodash-node/modern/arrays/compact'),
        indexOf: require('lodash-node/modern/arrays/indexOf'),
        keys: require('lodash-node/modern/objects/keys')
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
            weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
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
                //replace with lodash sortBy
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
                //
                startDate = new Date(start),
                sessionDay = startDate.getDate(),
                eventDay = eventDate.getDate(),
                dayIndex = sessionDay - eventDay, //this wont work if both dates aren't in the same month
                dayShortLabel = weekDays[startDate.getDay()] + ' ' + sessionDay,
                timeLabel = start.split('T')[1].substring(0, 5),
                timeShortLabel = timeLabel.replace(':00',''),
                roomOrderIndex = _.indexOf(roomOrder, roomID),
                startTime = startDate.getTime(),
                endTime = startTime + duration * 60 * 1000,
                roomSession,
                //
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

            //include this session in the proper day, time and room
            if (days[dayIndex] === undefined){
                days[dayIndex] = {
                    shortLabel: dayShortLabel,
                    closingTime: 0,
                    times: {},
                    rooms: _.map(roomOrder, function(roomID){
                        return {
                            id: roomID,
                            sessions: []
                        };
                    })
                };
            }

            // insert a session id and empty intervals in the proper room
            // bucket for that day and session
            // plus the start time that will be used for ordering later

            roomSession = {
                sessionID:sessionID,
                startTime: startTime,
                endTime: endTime,
                colspan: colspan
            };
            days[dayIndex].rooms[roomOrderIndex].sessions.push(roomSession);


            if (days[dayIndex].times[start] === undefined){
                days[dayIndex].times[start] = {
                    start: start,
                    label: timeLabel,
                    shortLabel: timeShortLabel,
                    sessions:[]
                };
            }
            days[dayIndex].times[start].sessions.push(sessionID);
            days[dayIndex].closingTime = Math.max(days[dayIndex].closingTime, endTime);

        });


        _.forEach(days, function(day){
            //list of sessions by time

            //sort times and convert the times dictionary to a times array
            var timeDictKeys = _.keys(day.times).sort();
            day.times = _.map(timeDictKeys, function(key){
                return day.times[key];
            });
            //include colspan on each time according to the duration until next time
            _.forEach(day.times, function(timeBreak, index, times){
                var nextStart = (index < times.length - 1) ?
                        new Date(times[index + 1].start).getTime() :
                        day.closingTime,
                    timeBreakSize = nextStart - new Date(timeBreak.start).getTime();
                timeBreak.colspan = timeBreakSize / 1000 / 60 / minimumInterval;
            });

            // list of sessions by room

            _.forEach(day.rooms, function(room){
                //order sessions in a room bucket by starting time
                room.sessions = _.sortBy(room.sessions, 'startTime');
                //run through the sessions to add empty intervals information
                //between sessions of the same room
                _.forEach(room.sessions, function(roomSession, index, sequence){
                    var previousEnd = (index > 0) ?
                            sequence[index - 1].endTime :
                            new Date(day.times[0].start).getTime(),
                        emptyBefore = roomSession.startTime - previousEnd,
                        emptyAfter = (index === sequence.length - 1) ?
                            day.closingTime - roomSession.endTime : 0;
                    if (emptyBefore > 0){
                        roomSession.emptyBefore = emptyBefore / 1000 / 60 / minimumInterval;
                    }
                    if (emptyAfter > 0){
                        roomSession.emptyAfter = emptyAfter / 1000 / 60 / minimumInterval;
                    }
                });
            });
        });

        return  {
                    days: days,
                    presenters: presenters,
                    rooms: rooms,
                    sessions: sessions
                };
    };
};
module.exports = FeedParser;