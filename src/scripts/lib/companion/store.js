'use strict';

/*
Stored records:

- updateInfo: Object with the attributes:
    - time: epoch miliseconds timestamp,
    - size: file size in bytes

- latestFeed: String containing the raw xml document

- bookmarkedSessions: Object which is a hash table
                      where each key is a session id.
                      The values are session objects.

- updatesLog: Array with the history of all schedule updates since the user
installed the app (or cleared the data)

*/

module.exports = {
    config: function(){
        localforage.config({
            name        : 'Companion',
            version     : 0.3,
            size        : 4980736, // Size of database, in bytes. WebSQL-only for now.
            storeName   : 'companionStore',
            description : 'some description'
        });
    },
    updateFeed: function(data, timestamp, cb){
        var metadata = {
                time: timestamp,
                size: data.length
            };
        //store metadata
        localforage.setItem('updateInfo', metadata)
        //the store the feed
        .then(function(){
            localforage.setItem('latestFeed', data, cb);
        });
    },
    saveBookmarks: function(bookmarks, cb){
        localforage.setItem('bookmarkedSessions', bookmarks, cb);
    },
    saveUpdatesLog: function(updates, cb){
        localforage.setItem('updatesLog', updates, cb);
    },
    getLastFetchInfo: function(cb){
        localforage.getItem('updateInfo').then(cb);
    },
    cachedFeed: function(cb){
        localforage.getItem('latestFeed',cb);
    },
    bookmarks: function(cb){
        localforage.getItem('bookmarkedSessions', cb);
    },
    updates: function(cb){
        localforage.getItem('updatesLog', cb);
    },
    eraseXML: function(cb){
        localforage.removeItem('latestFeed', function(){
            localforage.removeItem('updateInfo', cb);
        });
    },
    eraseBookmarks: function(cb){
        localforage.removeItem('bookmarkedSessions', cb);
    },
    eraseUpdates: function(cb){
        localforage.removeItem('updatesLog', cb);
    },
    nuke: function(cb){
        localforage.clear(cb);
    }
};
