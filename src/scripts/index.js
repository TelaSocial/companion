'use strict';

var Handlebars = require('hbsfy/runtime');
require('./lib/handlebars-helpers/helpers')(Handlebars);
Handlebars.registerPartial('day_list', require('../templates/partials/day_list.hbs'));
Handlebars.registerPartial('day_table', require('../templates/partials/day_table.hbs'));
Handlebars.registerPartial('session', require('../templates/partials/session.hbs'));

var templates = {
    schedule: require('../templates/partials/schedule.hbs')
};

var FISLParser = require('./lib/fisl/feed-parser');

// if you want to bundle jQuery instead of using an extra
// <script> tag for it, uncomment the line below
// var jQuery = require('jquery');

var app = require('./lib/companion/app');
app(
    jQuery.noConflict(),
    FISLParser,
    templates
);