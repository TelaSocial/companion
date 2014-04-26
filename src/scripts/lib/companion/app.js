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
        feedData,
        bookmarkedSessions;

    var populateSchedule = function(data, isRefresh){
        var template = isRefresh ? templates.schedule : templates.app,
            destinationElement = isRefresh ? $('#schedule-view') : $('#app'),
            view = $('.list-view-button.active').length > 0 ? 'list' : defaultView,
            templateData = {
                schedule_type: view,
                title: 'Companion App',
                schedule: data
            },
            html;
        console.log('populateSchedule '+view);
        html = template(templateData);
        // console.log(html);
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

    var initListView = function(){
        var body = $('body');
        setupTimeNav();
        // enable scrollspy!
        body.scrollspy({
            target: '#time-nav',
            offset: boddyPaddingTop
        });
        //bind on nav update event
        body.off('activate.bs.scrollspy');
        body.on('activate.bs.scrollspy', timeNavUpdated);
    };

    var initTableView = function(){
        setupTableLine();
    };

    var initSessions = function(){
        // time navigation buttons (list view)
        $('#time-nav li a').click(timeNavClicked);

        // add to calendar buttons
        $('.calendar-add-button').click(cordovaFunctions.addToCalendarButtonClicked);

        // bookmark buttons
        $('.bookmark-button').click(bookmarkButtonClicked);

        //add favorite class to all bookmarked sessions
        $('.session').each(function(){
            var sessionElement = $(this),
                sessionId = sessionElement.data('id');
            if (bookmarkedSessions[sessionId] !== undefined){
                sessionElement.addClass('favorite');
            }
        });
        //apply filters
        applyBookmarksFilter();
        //setup collapsable sessions in and out events
        $('.session .collapse').off('show.bs.collapse');
        $('.session .collapse').on('show.bs.collapse', function () {
            var colapseElement = $(this),
                sessionElement = colapseElement.parents('.session').first();
            sessionElement.addClass('opened');
        });
        $('.session .collapse').off('shown.bs.collapse');
        $('.session .collapse').on('shown.bs.collapse', function () {
            console.log('shown.bs.collapse');
            var colapseElement = $(this),
                body = $('html,body'),
                sessionElement = colapseElement.parents('.session').first(),
                sessionOffsetTop = sessionElement.offset().top,
                //using body.scrollTop() to get current position of the main scroll doesnt work on android webview
                bodyScrollTop = isCordova ? window.pageYOffset : body.scrollTop(),
                needsScroll = (sessionOffsetTop - (bodyScrollTop + boddyPaddingTop) < 0),
                animationTime = 500; //miliseconds
            console.log('needsScroll'+needsScroll);
            if (needsScroll){
                body.animate({
                        scrollTop: (sessionOffsetTop - boddyPaddingTop)
                    },
                    animationTime
                );
            }
        });
        $('.session .collapse').off('hidden.bs.collapse');
        $('.session .collapse').on('hidden.bs.collapse', function () {
            var colapseElement = $(this),
                sessionElement = colapseElement.parents('.session').first();
            sessionElement.removeClass('opened');
        });
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
            activeButton = switchElement.find('.active'),
            isListActive = activeButton.hasClass('list-view-button'),
            inactiveButton = isListActive ? switchElement.find('.table-view-button') : switchElement.find('.list-view-button'),
            nextView = isListActive ? 'table' : 'list',
            destinationElement = $('#schedule-view'),
            scheduleData = parser.parse(feedData),
            templateData = {
                schedule_type: nextView,
                schedule: scheduleData
            };
        if (nextView === 'list') {
            destinationElement.removeClass('schedule--table');
            destinationElement.addClass('schedule--list');
            destinationElement.attr('style', 'width:100%;');
        } else{
            destinationElement.removeClass('schedule--list');
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
                initListView();
                // body.scrollspy('refresh');
            }else{
                initTableView();
            }
            initSessions();
        }, 1);
    };

    var addBookmark = function(sessionId){
        var isFilteredViewOn = $('#filter-bookmarks').hasClass('active'),
            sessionElement = $('#session-'+sessionId);
        bookmarkedSessions[sessionId] = {
            id: sessionId
            //reminder: after json refactor, just put the whole session here
        };
        companionStore.saveBookmarks(bookmarkedSessions, function(savedData){
            console.log('bookmark added, bookmarks:'+JSON.stringify(savedData));
        });
        if (isFilteredViewOn){
            sessionElement.removeClass('filtered-out');
        }
    };

    var removeBookmark = function(sessionId){
        var isFilteredViewOn = $('#filter-bookmarks').hasClass('active'),
            sessionElement = $('#session-'+sessionId);
        delete bookmarkedSessions[sessionId];
        companionStore.saveBookmarks(bookmarkedSessions, function(savedData){
            console.log('bookmark deleted, bookmarks:'+JSON.stringify(savedData));
        });
        if (isFilteredViewOn){
            sessionElement.addClass('filtered-out');
        }
    };

    var bookmarkButtonClicked = function(){
        var button = $(this),
            session = button.parents('.session'),
            sessionId = session.data('id'),
            isSessionFavorite = session.hasClass('favorite');
        if (isSessionFavorite){
            session.removeClass('favorite');
            removeBookmark(sessionId);
        } else{
            session.addClass('favorite');
            addBookmark(sessionId);
        }
    };

    var applyBookmarksFilter = function(){
        var isFilterOn = $('#filter-bookmarks').hasClass('active');
        if (isFilterOn){
            $('.session:not(.favorite)').addClass('filtered-out');
        }else{
            $('.session:not(.favorite)').removeClass('filtered-out');
        }
    };

    var toggleBookmarksFilter = function(event){
        console.log('toggleBookmarksFilter');
        var toggleButton = $('#filter-bookmarks'),
            isFilterOn = toggleButton.hasClass('active');
        event.preventDefault();
        if (isFilterOn){
            toggleButton.removeClass('active');
        }else{
            toggleButton.addClass('active');
        }
        applyBookmarksFilter();
    };

    var manualFetchClicked = function(){
        var buttonElement = $(this);
        buttonElement.addClass('loading');
        loadFeed();
    };

    var setupAppHeaderBar = function(){

        //refresh button
        $('#refresh-feed').click(manualFetchClicked);

        //toggle bookmarks-only filter
        $('#filter-bookmarks').click(toggleBookmarksFilter);
        //list view toggle (lists vs tables)
        $('#list-view-toggle').click(scheduleViewSwitchClicked);

        //clear cache buttons
        $('#erase-feed').click(function(){
            companionStore.eraseXML(function(){
                console.log('local feed erased');
            });
        });
        $('#erase-bookmarks').click(function(){
            companionStore.eraseBookmarks(function(){
                console.log('bookmarks erased');
                $('.favorite').removeClass('favorite');
                bookmarkedSessions = {};
            });
        });
        $('#erase-all').click(function(){
            companionStore.nuke(function(){
                console.log('all local data erased');
            });
        });
    };

    var updateLocalFeed = function(){
        var timestamp = Date.now();
        companionStore.updateXML(feedData, timestamp, function(){
            console.log('feed updated locally');
        });
    };

    var feedLoaded = function(data, textStatus, xhr, fromCache) {
        var scheduleData = parser.parse(data),
            isRefresh = $('#schedule-view').length > 0;
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
        populateSchedule(scheduleData, isRefresh);
        //4. start framework - example: $(document).foundation()
        if (defaultView === 'list'){
            initListView();
        }else{
            initTableView();
        }
        //setup App main bar buttons
        if (!isRefresh){
            setupAppHeaderBar();
        }
        //bind session element events
        initSessions();
    };

    var loadFeed = function(){
        console.log('loadFeed');
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
                var xhr = new window.XMLHttpRequest(),
                    progressbar = document.getElementById('progressMeter');
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
                    if (progressbar){
                        progressbar.setAttribute('style', 'width:' + percentString +';');
                    }
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
            $('#refresh-feed').removeClass('loading');
        });
    };

    var loadCached = function(xmlData){
        console.log('loadCached');
        feedLoaded(xmlData, 200, null, true);
    };

    var onDeviceReady = function(){
        console.log('device ready');
        //load stored bookmarks
        companionStore.bookmarks(function(storedBookmarks){
            console.log('stored bookmarks:'+JSON.stringify(storedBookmarks));
            bookmarkedSessions = (storedBookmarks !== null) ? storedBookmarks : {};
            //then load information about last fetched xml
            companionStore.getLastFetchInfo(function(info){
                if (info === null){
                    //no feed information was found, this is the first run
                    loadFeed();
                }else{
                    //load the stored xml
                    companionStore.cachedXML(loadCached);
                    if (Date.now() - info.time > POLL_INTERVAL){
                        console.log('needs to poll, latest fetch: '+info.time);
                    }
                }
            });
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