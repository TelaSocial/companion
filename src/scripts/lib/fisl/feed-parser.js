'use strict';

var FeedParser = function($, eventDate){

    var sortByStart = function (a,b){
        return a.start > b.start ? 1 : -1;
    };
    var sortByRoomIndex = function(a,b){
        return a.roomIndex > b.roomIndex ? 1 : -1;
    };
    this.parse = function (data, grouped_by){

// grouped_by
// ----------
//
// (room)
//              day
//               |
//               +-> rooms
//                     |
//                     +-> sessions

// (time)
//             day
//              |
//               +-> time
//                     |
//                     +-> sessions


        var $xml = (typeof data === 'string') ? $(data) : $('response'),
            authorElements = $xml.find('authorship person'),
            slotElements = $xml.find('slots slot'),
            roomElements = $xml.find('rooms room'),
            minimumInterval = Number($xml.find('hours').first().attr('minimum_interval')),
            endOfDay = '00:00:00.000Z',
            startOfDay = '23:59:59.000Z',
            weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
            roomIdToIndex = {},
            candidates = {},
            rooms = [],
            sessions = [],
            days = [];

        grouped_by = (grouped_by === undefined) ? 'time' : grouped_by;
        authorElements.each(function(){
            var person = $(this),
                id = person.attr('id'),
                name = person.attr('name'),
                candidate = person.attr('candidate'),
                main = person.attr('main') === '1';
            if (candidates[candidate] === undefined){
                candidates[candidate] = [];
            }
            if (name.length === 0){
                // return false;
            }
            candidates[candidate].push({
                id: id,
                name: name,
                main: main
            });
            if (candidates[candidate].length > 1){
                candidates[candidate].sort(function(a,b){
                    return a.name > b.name ? 1 : -1;
                });
                candidates[candidate].sort(function(a,b){
                    return a.main < b.main ? 1 : -1;
                });
            }
        });
        // console.log(JSON.stringify(candidates, null, '  '));

        roomElements.each(function(){
            var room = $(this),
                id = room.attr('id'),
                venue = room.find('venue').first().text(),
                capacity = Number(room.find('capacity').first().text()),
                translation = room.find('translation').first().text().toUpperCase() === 'TRUE',
                name = room.find('name').first().text(),
                position = Number(room.find('position').first().text());

            rooms.push ({
                id: id,
                venue: venue,
                capacity: capacity,
                translation: translation,
                name: name,
                position: position
            });

            // console.log(id, venue, capacity, translation, name, position);
        });

        rooms.sort(function(a, b){
            return a.position > b.position ? 1 : -1;
        });
        for (var i = rooms.length - 1; i >= 0; i--) {
            roomIdToIndex[rooms[i].id] = i;
        }
        // console.log(JSON.stringify(rooms, null, '  '));

        slotElements.each(function(){
            var slot = $(this),
                id = slot.attr('id'),
                date = slot.attr('date'),
                hour = slot.attr('hour'),
                minute = slot.attr('minute'),
                room = slot.attr('room'),
                candidate = slot.attr('candidate'),
                area = slot.attr('area'),
                title = slot.attr('title'),
                abstract = slot.attr('abstract'),
                zone = slot.attr('zone'),
                level = slot.attr('level'),
                colspan = Number(slot.attr('colspan')),
                authors = candidates[candidate],
                start = date + 'T' + hour + ':' + minute + ':00-03:00',
                duration = colspan * minimumInterval, //minutes
                startDate = new Date(start),
                endDate = new Date(startDate.getTime() + duration * 60 * 1000),
                end = endDate.toISOString(),
                endSplit = end.split('T'),
                startSplit = start.split('T'),
                sessionDay = startDate.getDate(),
                eventDay = eventDate.getDate(),
                dayIndex = sessionDay - eventDay, //this wont work if both dates aren't in the same month
                dayShortLabel = weekDays[startDate.getDay()] + ' ' + sessionDay,
                roomIndex = roomIdToIndex[room],
                roomName = rooms[roomIndex].name,
                emptyRooms = [],
                session = {};

            if (days[dayIndex] === undefined){
                if (grouped_by === 'room'){
                    for (var i = 0; i < rooms.length; i++) {
                        emptyRooms.push({
                            sessions: [],
                            roomName: rooms[i].name
                        });
                    }
                    days[dayIndex] = {
                        rooms: emptyRooms
                    };
                } else {
                    days[dayIndex] = {};
                }
                days[dayIndex].index = dayIndex;
                days[dayIndex].shortLabel = dayShortLabel;
                days[dayIndex].times = {};
            }

            session = {
                id: id,
                title: title,
                abstract: abstract,
                start: start,
                duration: duration,
                end: end,
                authors: authors,
                roomId: room,
                roomIndex: roomIndex,
                dayIndex: dayIndex,
                areaId: area,
                zoneId: zone,
                level: level,
                durationColspan: colspan,
                roomName: roomName
            };
            if (grouped_by === 'room'){
                days[dayIndex].rooms[roomIndex].sessions.push(session);
                endOfDay = (endSplit[1] > endOfDay) ? endSplit[1] : endOfDay;
                startOfDay = (startSplit[1] < startOfDay) ? startSplit[1] : startOfDay;
                if (days[dayIndex].times[startSplit[1]] === undefined){
                    days[dayIndex].times[startSplit[1]] = colspan;
                }else{
                    days[dayIndex].times[startSplit[1]] = Math.min(days[dayIndex].times[startSplit[1]], colspan);
                }
            } else {
                sessions.push(session);
            }
        });

        if (grouped_by === 'room'){
            for (var d = days.length - 1; d >= 0; d--) {
                    //sort sessions in a room by starting time
                    for (var j = days[d].rooms.length - 1; j >= 0; j--) {
                        days[d].rooms[j].sessions.sort(sortByStart);
                    }

                    //created a sorted times array from the times dictionary
                    var timeArray = [];
                    for (var key in days[d].times){
                        var start = key,
                            colspan = days[d].times[key],
                            label = start.substring(0, 5);
                        timeArray.push({
                            start: start,
                            colspan: colspan,
                            label: label
                        });
                    }
                    timeArray.sort(sortByStart);
                    //replace times dict with times array
                    days[d].times = timeArray;

                    //for each session, include the interval after the end for
                    //which the room will remain empty until the next session
                    //for the first session of each room also include the interval
                    //since the beggining of the day that the room remained empty
                    for (var k = days[d].rooms.length - 1; k >= 0; k--) {
                        for (var l = 0; l < days[d].rooms[k].sessions.length; l++) {
                            var session = days[d].rooms[k].sessions[l],
                                isFirst = (l === 0),
                                isLast = (l === days[d].rooms[k].sessions.length - 1),
                                startDate = new Date(session.start),
                                startDateSplit = startDate.toISOString().split('T'),
                                end = new Date(startDate.getTime() + session.duration * 60 * 1000).getTime(),
                                nextSession = isLast ? null : days[d].rooms[k].sessions[l+1],
                                nextSessionStart = isLast ?
                                    new Date(startDateSplit[0] + 'T' + endOfDay).getTime() :
                                    new Date(nextSession.start).getTime(),
                                dayStart;

                            if (isFirst){
                                dayStart = new Date(startDateSplit[0] + 'T' + startOfDay).getTime();
                                session.intervalBefore = (startDate.getTime() - dayStart) / 1000 / 60;
                                session.intervalBeforeColspan = session.intervalBefore / minimumInterval;
                            }
                            session.intervalAfter = (nextSessionStart - end) / 1000 / 60;
                            session.intervalAfterColspan = session.intervalAfter / minimumInterval;
                        }
                    }
            }
        }
        if (grouped_by === 'time'){
            sessions.sort(sortByStart);
            for (var s = 0; s < sessions.length; s++) {
                var session = sessions[s],
                    start = session.start,
                    dayIndex = session.dayIndex,
                    label = start.split('T')[1].substring(0, 5),
                    shortLabel = label.replace(':00','');
                if (days[dayIndex].times[start] === undefined){
                    days[dayIndex].times[start] = {
                        sessions:[],
                        label: label,
                        shortLabel: shortLabel,
                    };
                }
                days[dayIndex].times[start].sessions.push(session);
            }

            //sort by room position after
            for (var d = days.length - 1; d >= 0; d--) {
                var day = days[d];
                for (var t in day.times) {
                    var time = day.times[t];
                    time.sessions = time.sessions.sort(sortByRoomIndex);
                }
            }
        }

        // console.log(JSON.stringify(days, null, '  '));
        return  {
                    days: days,
                    rooms: rooms
                };
    };
};
module.exports = FeedParser;