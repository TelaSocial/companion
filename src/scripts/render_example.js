'use strict';

var Handlebars = require('hbsfy/runtime'),
    hbsHelpers = require('./lib/handlebars-helpers/helpers')(Handlebars);

var fs = require('fs');
var schedule_grouped_by_room = JSON.parse(fs.readFileSync(__dirname + '/../data/schedule_grouped_by_room.json', 'utf8'));
var schedule_grouped_by_time = JSON.parse(fs.readFileSync(__dirname + '/../data/schedule_grouped_by_time.json', 'utf8'));

var template = require('../templates/partials/schedule.hbs');

Handlebars.registerPartial('day_list', require('../templates/partials/day_list.hbs'));
Handlebars.registerPartial('day_table', require('../templates/partials/day_table.hbs'));
Handlebars.registerPartial('session', require('../templates/partials/session.hbs'));

var html = template(
    {
        schedule_type_list: true,
        schedule_type: 'table',
        schedule_grouped_by_room: schedule_grouped_by_room,
        schedule_grouped_by_time: schedule_grouped_by_time
    }
);
// document.body.innerHTML = template({ name: "Epeli" });

// var compiledTemplate = Handlebars.templates['dev_links'];

// var html = compiledTemplate({ name : 'World' });

// console.log(html);

document.body.innerHTML = html;