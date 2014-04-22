'use strict';

var cordovaCalendarHelper = require('./cordova_calendar');

module.exports = function($, FISLParser, templates){
    var isCordova = document.URL.substring(0,4) === 'file',
        cordovaFunctions = new cordovaCalendarHelper($),
        boddyPaddingTop = 50, //px
        defaultView = 'table',
        parser = new FISLParser($, new Date('2014-05-07T00:01-03:00'));

    var populateSchedule = function(data, viewArg){
        var template = templates.app,
            destinationElement = $('#app'),
            progressMeter = $('.meter').first(),
            view = viewArg ? viewArg : defaultView,
            templateData = {
                schedule_type: view,
                title: 'Companion App',
            },
            html;
        console.log('populateSchedule '+view);
        if (view === 'list') {
            templateData.schedule_grouped_by_time = data;
        } else{
            templateData.schedule_grouped_by_room = data;
        }
        // console.log(html);
        progressMeter.width('80%');
        html = template(templateData);
        destinationElement.html(html);
    };

    //the time nav must fit into 1 single line, so we sum the width of all
    //li's and make it the with of the container ul
    var setupTimeNav = function(){
        var list = $('#time-nav ul'),
            listItems = list.find('li'),
            oneLineWidth = 0;
        listItems.each(function(){
            var liElement = $(this);
            oneLineWidth += liElement.width();
        });
        list.width(oneLineWidth + 20);
    };

    var timeNavUpdated = function(activateEvent){
        var liElement = $(activateEvent.target),
            timeNav = liElement.parents('.navbar').first(),
            timeNavList = liElement.parents('.nav').first(),
            halfScreenWidth = $(window).width() / 2;
        timeNav.scrollLeft(liElement.offset().left - timeNavList.offset().left - halfScreenWidth + (liElement.width() / 2));
    };

    var initFramework = function(){
        var body = $('body');

        //if using Bootstrap
        if (body.scrollspy !== undefined){

            setupTimeNav();

            // enable scrollspy!
            body.scrollspy({
                target: '#time-nav',
                offset: boddyPaddingTop
            });
            //bind on nav update event
            body.on('activate.bs.scrollspy', timeNavUpdated);

            //setup list view collapsables in and out events
            $('.session .collapse').on('show.bs.collapse', function () {
                var colapseElement = $(this),
                    sessionElement = colapseElement.parents('.session').first();
                sessionElement.addClass('opened');
            });
            $('.session .collapse').on('shown.bs.collapse', function () {
                var colapseElement = $(this),
                    body = $('html,body'),
                    sessionElement = colapseElement.parents('.session').first(),
                    sessionOffsetTop = sessionElement.offset().top,
                    //using body.scrollTop() to get current position of the main scroll doesnt work on android webview
                    bodyScrollTop = isCordova ? window.pageYOffset : body.scrollTop(),
                    needsScroll = (sessionOffsetTop - (bodyScrollTop + boddyPaddingTop) < 0),
                    animationTime = 500; //miliseconds
                if (needsScroll){
                    body.animate({
                            scrollTop: (sessionOffsetTop - boddyPaddingTop)
                        },
                        animationTime
                    );
                }
            });
            $('.session .collapse').on('hide.bs.collapse', function () {
                var colapseElement = $(this),
                    sessionElement = colapseElement.parents('.session').first();
                sessionElement.removeClass('opened');
            });
        }

    };

    var timeNavClicked = function(event){
        var link = $(this),
            target = $(link.attr('href')),
            targetTop = target.offset().top,
            animationTime = 700, //miliseconds
            body = $('html, body');
        event.preventDefault();
        body.animate(
            {
                scrollTop: targetTop - boddyPaddingTop + 1
            },
            animationTime
        );
    };

    var setupButtons = function(){
        // time navigation buttons
        $('#time-nav li a').click(timeNavClicked);

        // add to calendar buttons
        $('.calendar-add-button').click(cordovaFunctions.addToCalendarButtonClicked);
    };

    var firstLoad = function(){
        var appElement = $('#app'),
            feedURL = appElement.data('feed-url'),
            localFeed = appElement.data('local-feed-url'),
            isCordova = document.URL.substring(0,4) === 'file',
            progressMeter = $('.meter').first();

        if (!isCordova) {
            feedURL = localFeed;
        }
        //1. fetch feed

        console.log('Loading ' + feedURL + '...');
        $.ajax(feedURL, {
            dataType: 'text'
        })
        //2. parse feed
        .done(function(data) {
            var groupedBy = (defaultView === 'list') ? 'time' : 'room',
                scheduleData = parser.parse(data, groupedBy);
            progressMeter.width('25%');
            //3. render schedule
            populateSchedule(scheduleData);
            //4. start framework - example: $(document).foundation()
            initFramework();
            //5. bind button clicks
            setupButtons();
        }).fail(function() {
            console.log('error');
        }).always(function() {
            console.log('finished');
        });

    };

    var onDeviceReady = function(){
        console.log('device ready');
        firstLoad();
    };
    $(document).ready(function() {
        if (isCordova) {
            document.addEventListener('deviceready', onDeviceReady, false);
        } else {
            onDeviceReady();
        }
    });
};