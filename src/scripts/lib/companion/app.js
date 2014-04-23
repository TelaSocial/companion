'use strict';

var cordovaCalendarHelper = require('./cordova_calendar');

var companionStore = require('./store');

var POLL_INTERVAL = 1 * 60 * 1000; //1 minute

module.exports = function($, FISLParser, templates){
    var isCordova = document.URL.substring(0,4) === 'file',
        cordovaFunctions = new cordovaCalendarHelper($),
        boddyPaddingTop = 50, //px
        defaultView = 'list',
        parser = new FISLParser($, new Date('2014-05-07T00:01-03:00')),
        feedData;

    var populateSchedule = function(data, viewArg){
        var template = templates.app,
            destinationElement = $('#app'),
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
        timeNav.stop(true);
        timeNav.animate({
            scrollLeft: (liElement.offset().left - timeNavList.offset().left - halfScreenWidth + (liElement.width() / 2))
        }, 500);
    };

    var setupTableLine = function(){
        var tablesContainer = $('.schedule--table'),
            tables = tablesContainer.find('table'),
            tdMaxWidth = 300, //px
            tableBordersWidth = 2,
            dayMarginRight = 150,
            paddingRight = 15,
            widthSum = 0,
            columnCount;
        tables.each(function(){
            var rows = $(this).find('tr');
            columnCount = 0;
            rows.each(function(){
                var cells = $(this).find('td');
                columnCount = Math.max(columnCount, cells.length);
            });
            console.log('add: '+(columnCount * tdMaxWidth));
            widthSum += columnCount * tdMaxWidth + tableBordersWidth;
        });
        console.log('setupTableLine:'+widthSum);
        tablesContainer.width(
            widthSum +
            paddingRight +
            (tables.length - 1) * dayMarginRight
        );
    };

    var initFramework = function(){
        var body = $('body');

        //if using Bootstrap
        if (body.scrollspy !== undefined){

            setupTimeNav();

            setupTableLine();

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

    var scheduleViewSwitchClicked = function(){
        var switchElement = $(this),
            body = $('body'),
            activeButton = switchElement.find('.active'),
            isListActive = activeButton.hasClass('list-view-button'),
            inactiveButton = isListActive ? switchElement.find('.table-view-button') : switchElement.find('.list-view-button'),
            nextView = isListActive ? 'table' : 'list',
            destinationElement = $('#schedule-view'),
            templateData = {
                schedule_type: nextView
            },
            groupedBy = (nextView === 'list') ? 'time' : 'room',
            scheduleData = parser.parse(feedData, groupedBy);
        if (nextView === 'list') {
            templateData.schedule_grouped_by_time = scheduleData;
            destinationElement.removeClass('schedule--table');
            destinationElement.attr('style', 'width:100%;');
        } else{
            templateData.schedule_grouped_by_room = scheduleData;
            destinationElement.addClass('schedule--table');
        }

        console.log('scheduleViewSwitchClicked ',nextView, activeButton, inactiveButton);
        activeButton.removeAttr('disabled');
        activeButton.removeClass('active');
        inactiveButton.addClass('active');
        inactiveButton.attr('disabled','true');


        destinationElement.html('Aguarde…');
        window.setTimeout(function(){
            var destinationElement = $('#schedule-view'),
                template = templates.schedule,
                html = template(templateData);
            destinationElement.html(html);
            if (nextView === 'list') {
                setupTimeNav();
                body.scrollspy('refresh');
            }else{
                setupTableLine();
            }
            setupButtons();

        }, 1);
    };

    var setupButtons = function(){
        // time navigation buttons
        $('#time-nav li a').click(timeNavClicked);

        // add to calendar buttons
        $('.calendar-add-button').click(cordovaFunctions.addToCalendarButtonClicked);

        //clear cache buttons
        $('#erase-feed').click(function(){
            companionStore.eraseXML(function(){
                console.log('local feed erased');
            });
        });
        $('#erase-all').click(function(){
            companionStore.nuke(function(){
                console.log('all local data erased');
            });
        });
    };

    var setupViewToggle = function(){
        //list view toggle (lists vs tables)
        $('#list-view-toggle').click(scheduleViewSwitchClicked);
    };

    var updateLocalFeed = function(){
        var timestamp = Date.now();
        companionStore.updateXML(feedData, timestamp, function(){
            console.log('feed updated locally');
        });
    };

    var feedLoaded = function(data, textStatus, xhr, fromCache) {
        var groupedBy = (defaultView === 'list') ? 'time' : 'room',
            scheduleData = parser.parse(data, groupedBy);
        feedData = data;
        console.log('XML size='+data.length);
        if (xhr !== null){
            console.log('XML all headers='+xhr.getAllResponseHeaders());
        }
        if (!fromCache){
            //store fetched data and metadata
            updateLocalFeed();
        }
        //3. render schedule
        populateSchedule(scheduleData);
        //4. start framework - example: $(document).foundation()
        initFramework();
        //5. bind button clicks
        setupButtons();
        setupViewToggle();
    };

    var firstLoad = function(){
        console.log('firstLoad');
        var appElement = $('#app'),
            feedURL = appElement.data('feed-url'),
            localFeed = appElement.data('local-feed-url');

        if (!isCordova) {
            feedURL = localFeed;
        }
        //1. fetch feed

        console.log('Loading ' + feedURL + '...');
        //download everything
        $.ajax({
            xhr: function() {
                var xhr = new window.XMLHttpRequest();
                xhr.addEventListener('progress', function(evt) {
                    var percentComplete,
                        total,
                        fakeTotal,
                        percentString;
                    if (evt.lengthComputable) {
                        total = evt.total;
                    }else{
                        //FISL server reports 18446744073709552000 as total, which is probably wrong
                        fakeTotal = 173893;  //FISL XML has around 173893 bytes -> less than 200KB
                        total = fakeTotal;
                    }
                    percentComplete = Math.min((evt.loaded / total), 1);
                    percentString = (Math.round(percentComplete * 100)+'%');
                    document.getElementById('progressMeter').setAttribute('style', 'width:' + percentString +';');
                }, false);
                return xhr;
            },
            url: feedURL,
            dataType: 'text'
        })
        //2. parse feed
        .done(feedLoaded)
        .fail(function() {
            console.log('error');
        }).always(function() {
            console.log('finished');
        });
    };

    var loadCached = function(xmlData){
        console.log('loadCached');
        feedLoaded(xmlData, 200, null, true);
    };

    var onDeviceReady = function(){
        console.log('device ready');
        companionStore.getLastFetchInfo(function(info){
            if (info === null){
                firstLoad();
            }else{
                companionStore.cachedXML(loadCached);
                if (Date.now() - info.time > POLL_INTERVAL){
                    console.log('needs to poll, latest fetch: '+info.time);
                }
            }
        });
    };
    $(document).ready(function() {
        if (isCordova) {
            document.addEventListener('deviceready', onDeviceReady, false);
        } else {
            onDeviceReady();
        }
    });
};