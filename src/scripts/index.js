'use strict';
// if you want to bundle jQuery instead of using an extra
// <script> tag for it, uncomment the line below
// var jQuery = require('jquery');

var app = require('./lib/companion/app');
app(jQuery.noConflict());