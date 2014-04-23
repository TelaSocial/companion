'use strict';

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
    setLastFetchInfo: function(metadata, cb){
        console.log('setLatestUpdateMetadata! '+ typeof cb);
        localforage.setItem('updateInfo', metadata).then(cb);
    },
    getLastFetchInfo: function(cb){
        console.log('getLatestUpdateMetadata');
        localforage.getItem('updateInfo').then(cb);
    }
};
