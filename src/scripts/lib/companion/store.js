'use strict';

/*
Stored records:

updateInfo: {
    time: epoch miliseconds timestamp,
    size: file size in bytes
}

latestFeed: raw xml document
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
    updateXML: function(data, timestamp, cb){
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
    getLastFetchInfo: function(cb){
        console.log('getLatestUpdateMetadata');
        localforage.getItem('updateInfo').then(cb);
    },
    cachedXML: function(cb){
        localforage.getItem('latestFeed',cb);
    }
};
