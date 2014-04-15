'use strict';

var http = require('http'),
    fs = require('fs'),
    cheerio = require('cheerio'),
    FISLParser = require('../../lib/fisl/feed-parser');

module.exports = function(paths, urls){

    var download = function(url, dest, cb) {
      var file = fs.createWriteStream(dest);
      http.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
          file.close(cb);  // close() is async, call cb after close completes.
        });
      }).on('error', function(err) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        if (cb) cb(err.message);
      });
    };

    this.fetchXML = function(){
        console.log('fetching ' + urls.fisl.gridXML + '...');
        download(
            urls.fisl.gridXML,
            paths.sources.data + 'schedule.xml',
            function(err){
                if (err !== undefined){
                    console.log('Error: '+err);
                }
            }
        );
    };

    this.buildJSON = function(){
            var filecontents = fs.readFileSync(
                    paths.sources.data + 'schedule.xml',
                    {
                        encoding: 'utf-8'
                    }
                ).toString(),
                $ = cheerio.load(filecontents, {
                                    xmlMode: true
                }),
                parser = new FISLParser($, new Date('2014-05-07T00:01-03:00')),
                days = {};

            //grouped by rooms
            days = parser.parse();
            fs.writeFileSync(
                paths.sources.data + 'schedule_grouped_by_room.json',
                JSON.stringify(days, null, '  ')
            );

            //grouped by time
            days = parser.parse(null, 'time');
            fs.writeFileSync(
                paths.sources.data + 'schedule_grouped_by_time.json',
                JSON.stringify(days, null, '  ')
            );
    };
};
