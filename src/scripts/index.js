'use strict';

var Handlebars = require('hbsfy/runtime');
require('./lib/handlebars-helpers/helpers')(Handlebars);
var scheduleTemplate = require('../templates/partials/schedule.hbs'),
    lastSyncTemplate = require('../templates/partials/last_sync_time.hbs'),
    notificationsTemplate = require('../templates/partials/notifications.hbs');
Handlebars.registerPartial('app_menu', require('../templates/partials/app_menu.hbs'));
Handlebars.registerPartial('last_sync_time', lastSyncTemplate);
Handlebars.registerPartial('schedule', scheduleTemplate);
Handlebars.registerPartial('day_list', require('../templates/partials/day_list.hbs'));
Handlebars.registerPartial('time_list', require('../templates/partials/time_list.hbs'));
Handlebars.registerPartial('time_nav', require('../templates/partials/time_nav.hbs'));
Handlebars.registerPartial('timenav_day_times', require('../templates/partials/timenav_day_times.hbs'));
Handlebars.registerPartial('day_table', require('../templates/partials/day_table.hbs'));
Handlebars.registerPartial('day_table_rows', require('../templates/partials/day_table_rows.hbs'));
Handlebars.registerPartial('session', require('../templates/partials/session.hbs'));
Handlebars.registerPartial('notifications', notificationsTemplate);
Handlebars.registerPartial('update_item', require('../templates/partials/update_item.hbs'));
Handlebars.registerPartial('map', require('../templates/partials/map.hbs'));
Handlebars.registerPartial('menu', require('../templates/partials/menu.hbs'));

var templates = {
    app: require('../templates/partials/app.hbs'),
    schedule: scheduleTemplate,
    last_sync_time: lastSyncTemplate,
    notifications: notificationsTemplate
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