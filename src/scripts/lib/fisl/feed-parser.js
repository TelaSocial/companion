'use strict';
var FeedParser = function($, eventDate){

    this.parse = function (data){

// (default)    day
//               |
//               +-> room
//                     |
//                     +-> session


        var $xml = (typeof data === 'string') ? $(data) : $('response'),
            authorElements = $xml.find('authorship person'),
            slotElements = $xml.find('slots slot'),
            roomElements = $xml.find('rooms room'),
            roomIdToIndex = {},
            candidates = {},
            rooms = [],
            days = [];

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
                return false;
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
                authors = candidates[candidate],
                start = date + 'T' + hour + ':' + minute + ':00-03:00',
                startDate = new Date(start),
                sessionDay = startDate.getDate(),
                eventDay = eventDate.getDate(),
                dayIndex = sessionDay - eventDay,
                roomIndex = roomIdToIndex[room],
                emptyRooms = [];

            if (days[dayIndex] === undefined){
                for (var i = rooms.length - 1; i >= 0; i--) {
                    emptyRooms.push({
                        sessions: []
                    });
                }
                days[dayIndex] = {
                    rooms: emptyRooms
                };
            }
            if (days[dayIndex].rooms[roomIndex] === null){
                console.log('FOO');
            }
            var session = {
                id: id,
                title: title,
                abstract: abstract,
                start: start,
                authors: authors,
                areaId: area,
                zoneId: zone,
                level: level
            };
            days[dayIndex].rooms[roomIndex].sessions.push(session);
        });
        // console.log(JSON.stringify(days, null, '  '));
        return  {
                    days: days,
                    rooms: rooms
                };
    };
};
module.exports = FeedParser;