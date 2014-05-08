'use strict';

var pkg = require('../../../../package.json');
var cordovaCalendarHelper = require('./cordova_calendar');
var companionStore = require('./store');
var panZoom = require('../jquery.panzoom/jquery.panzoom');
var attachFastClick = require('fastclick');


//custom lodash
var _ = {
        forEach: require('lodash-node/modern/collections/forEach'),
        filter: require('lodash-node/modern/collections/filter'),
        pluck: require('lodash-node/modern/collections/pluck'),
        difference: require('lodash-node/modern/arrays/difference'),
        union: require('lodash-node/modern/arrays/union'),
        isEqual: require('lodash-node/modern/objects/isEqual'),
        keys: require('lodash-node/modern/objects/keys')
    };

var POLL_INTERVAL = 1 * 60 * 1000; //1 minute
var fakeTotal = 201680;  //FISL XML has around 200KB


//from http://stackoverflow.com/a/20392392/2052311
function tryParseJSON (jsonString){
    if (typeof jsonString === 'object'){
        return jsonString;
    }
    try {
        var o = JSON.parse(jsonString);
        if (o && typeof o === 'object' && o !== null) {
            return o;
        }
    }catch (e) {
    }
    return false;
}

module.exports = function($, FISLParser, templates){
    var isCordova = document.URL.substring(0,4) === 'file',
        cordovaFunctions = new cordovaCalendarHelper($),
        boddyPaddingTop = 60 + 10, //px
        defaultView = 'list',
        parser = new FISLParser($, new Date('2014-05-07T00:01-03:00')),
        feedData, // XML
        scheduleData = null, // JSON
        previousScheduleData = null,
        bookmarkedSessions,
        devSyncMode,
        updateInfo,
        updatesLog = [],
        mapPan,
        mapMinScale,
        firstFetchFailed = true;

    var isSessionFavorite = function(session){
        return bookmarkedSessions[session.sessionId] !== undefined;
    };

    var isSessionNotFavorite = function(session){
        return bookmarkedSessions[session.sessionId] === undefined;
    };

    //updates splash screen loading message
    var loadingMessage = function(text){
        console.log('[Loading message] '+text);
        $('#loading-message').html(text);
    };

    var scrollToCurrentTime = function(){
        console.log('scrollToCurrentTime');
        var now = new Date(),
            timestamp = now.getTime(),
            hour = now.getHours(),
            closingTimes = _.pluck(scheduleData.days, 'closingTime'),
            currentDayIndex = 0,
            timeAnchor,
            animationTime = 700, //miliseconds
            body = $('html, body');
        for (var i = 0; i < closingTimes.length; i++) {
            var closingTime = closingTimes[i];
            if (timestamp < closingTime){
                currentDayIndex = i;
                break;
            }
        }
        timeAnchor = $('#day-'+ currentDayIndex +'-time-' + hour);
        console.log('#day-'+ currentDayIndex +'-time-' + hour);
        body.animate(
            {
                scrollTop: timeAnchor.offset().top - boddyPaddingTop + 1
            },
            animationTime
        );
    };

    var schedulePopulated = function(isRefresh){
        var view = isRefresh ? $('body').attr('data-view-mode') : defaultView;
        console.log('schedulePopulated');
        loadingMessage('Aguarde, inicializando interfaces ');
        if (view === 'list'){
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
        if (!isRefresh){
            scrollToCurrentTime();
        }
    };

    var populateSchedule = function(isRefresh){
        // this function is also used for rendering the apps UI on first load
        // (template app.hbs instead of just the partial schedule.hbs)
        var template = isRefresh ? templates.schedule : templates.app,
            destinationElement = isRefresh ? $('#schedule-view') : $('#app'),
            view = isRefresh ? $('body').attr('data-view-mode') : defaultView,
            templateData = {
                schedule_type: view,
                title: 'Companion App',
                version: pkg.version,
                schedule: scheduleData,
                map_image: $('#app').data('map-url'),
                updates_user: _.filter(updatesLog, isSessionFavorite),
                updates_all: _.filter(updatesLog, isSessionNotFavorite),
                lastFetchTime: updateInfo ? updateInfo.time : null
            },
            html;
        console.log('populateSchedule '+view);
        $('body').attr('data-view-mode', view);
        loadingMessage('Aguarde, montando a grade ');
        html = template(templateData);
        window.setTimeout(function(){
            destinationElement.html(html);
            schedulePopulated(isRefresh);
        }, 0);
    };


    //the time nav must fit into 1 single line, so we sum the width of all
    //li's and make it the with of the container ul
    var setupTimeNav = function(){
        var list = $('#time-nav ul'),
            listItems = list.find('li'),
            oneLineWidth = 0;
        listItems.each(function(){
            var liElement = $(this);
            oneLineWidth += liElement.outerWidth();
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
            days = tablesContainer.find('.day'),
            dayMarginRight = 150 + 50,
            widthSum = 0;
        days.each(function(){
            var width = $(this).outerWidth();
            widthSum += width + dayMarginRight;
        });
        tablesContainer.width(widthSum + 15);
    };

    var initListView = function(){
        var body = $('body');
        console.log('initListView');
        if ($('#favorites-tab.active').length){
            $('#time-nav').hide();
        }else{
            $('#time-nav').show();
            setupTimeNav();
            // enable scrollspy!
            body.scrollspy({
                target: '#time-nav',
                offset: boddyPaddingTop
            });
            //bind on nav update event
            body.off('activate.bs.scrollspy');
            body.on('activate.bs.scrollspy', timeNavUpdated);
            body.scrollspy('refresh');
        }
    };

    var initTableView = function(){
        console.log('initTableView');
        setupTableLine();
    };

    var initSessions = function(){
        // time navigation buttons (list view)
        $('#time-nav li a').click(timeNavClicked);

        // add to calendar buttons
        $('.calendar-add-button').click(function(event){
            cordovaFunctions.addToCalendarButtonClicked(
                    event,
                    scheduleData.rooms,
                    scheduleData.zones
            );
        });

        //refresh buttons
        $('.refresh-feed').off();
        $('.refresh-feed').click(manualFetchClicked);

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

        // map links
        $('.room-link').click(mapLinkClicked);

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
                body = $('body'),
                view = body.attr('data-view-mode'),
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
            if (view === 'list'){
                body.scrollspy('refresh');
            }
        });
        $('.session .collapse').off('hidden.bs.collapse');
        $('.session .collapse').on('hidden.bs.collapse', function () {
            var colapseElement = $(this),
                body = $('body'),
                view = body.attr('data-view-mode'),
                sessionElement = colapseElement.parents('.session').first();
            sessionElement.removeClass('opened');
            if (view === 'list'){
                body.scrollspy('refresh');
            }
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
        var radioElement = $(this),
            nextView = radioElement.val(),
            destinationElement = $('#schedule-view'),
            templateData = {
                schedule_type: nextView,
                schedule: scheduleData
            };
        console.log('nextView out',radioElement, nextView);
        if (nextView === 'list') {
            // $('body').attr('data-view-mode', 'list');
            destinationElement.removeClass('schedule--table');
            destinationElement.addClass('schedule--list');
            destinationElement.attr('style', 'width:100%;');
        } else{
            // $('body').attr('data-view-mode', 'table');
            destinationElement.removeClass('schedule--list');
            destinationElement.addClass('schedule--table');
        }

        destinationElement.html('Aguarde…');
        window.setTimeout(function(){
            var destinationElement = $('#schedule-view'),
                template = templates.schedule,
                html = template(templateData);
        console.log('nextView in',nextView);
            destinationElement.html(html);
            if (nextView === 'list') {
                $('body').attr('data-view-mode', 'list');
            }else{
                $('body').attr('data-view-mode', 'table');
            }
        }, 1);
    };

    var addBookmark = function(sessionId){
        var isFilteredViewOn = $('#favorites-tab').hasClass('active'),
            sessionElement = $('#session-'+sessionId);
        // console.log('assBookmark',scheduleData.sessions[sessionId]);
        bookmarkedSessions[sessionId] = scheduleData.sessions[sessionId];
        companionStore.saveBookmarks(bookmarkedSessions, function(savedData){
            console.log('bookmark added, bookmarks:'+JSON.stringify(savedData));
        });
        if (isFilteredViewOn){
            sessionElement.removeClass('filtered-out');
        }
    };

    var removeBookmark = function(sessionId){
        var isFilteredViewOn = $('#favorites-tab').hasClass('active'),
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

    var initMapPanZoom = function(){
        var imageWidth = 533;
        var containerWidth = $('body').width() * 0.9;
        console.log(containerWidth);
        mapMinScale = (containerWidth / imageWidth) * 0.8;
        console.log('initMapPanZoom, minscale = '+mapMinScale);
        mapPan = new panZoom($('.map-base')[0],{
            minScale: mapMinScale,
            contain: 'invert'
        });
    };

    var displayPanel = function(panelName){
        var tabName = '#'+panelName+'-tab',
            viewName = '#'+panelName+'-view';
        $('#app-menu .navbar-nav > li.active').removeClass('active');
        $(tabName).addClass('active');
        $('.app-panel').removeClass('selected');
        $(viewName).addClass('selected');

    };

    var openMapTab = function(roomID){
        //select map panel
        displayPanel('map');
        console.log('openMapTab roomID='+roomID);
        // mapPan.reset();
        // mapPan.resetDimensions();
        console.log('MapPanZoom, zoom = '+mapMinScale);
        mapPan.zoom(mapMinScale * 1.2);
    };

    var mapLinkClicked = function(event){
        var sessionElement = $(this).parents('.session').first(),
            roomID = sessionElement.data('room');
        console.log('mapLinkClicked, roomID='+roomID);
        event.preventDefault();
        openMapTab(roomID);
    };

    var applyBookmarksFilter = function(){
        var isFilterOn = $('#favorites-tab').hasClass('active');
        if (isFilterOn){
            $('.session:not(.favorite)').addClass('filtered-out');
        }else{
            $('.session:not(.favorite)').removeClass('filtered-out');
        }
    };

    var manualFetchClicked = function(event){
        var buttonElement = $(this);
        event.preventDefault();
        buttonElement.addClass('loading');
        loadFeed();
    };

    var updateMenuSyncMessage = function(){
        console.log('updateMenuSyncMessage');
        //update sync time on each dropdown open
        var updateInfoContainer = $('#last-sync-menu-header'),
                template = templates.last_sync_time;
        updateInfoContainer.html(
            template({
                lastFetchTime: updateInfo.time
            })
        );
        console.log('sync display updated');
    };

    var appTabClicked = function (event){
        var linkElement = $(this),
            parentLi = linkElement.parents('li').first(),
            allTabs = parentLi.parents('.nav').first().find('li'),
            isDisabled = parentLi.hasClass('disabled'),
            sectionName = linkElement.attr('id').split('-')[0],
            view = $('body').attr('data-view-mode');
        event.preventDefault();
        console.log(sectionName);
        if (isDisabled) {
            return false;
        }
        allTabs.removeClass('active');
        parentLi.addClass('active');

        //hide all app panels
        $('.app-panel').removeClass('selected');

        window.setTimeout(function(){
        //different actions depending on which tab selected
        if ( (sectionName === 'schedule') || (sectionName === 'favorites') ){
            applyBookmarksFilter();
            $('#schedule-view').addClass('selected');
            if (view === 'list'){
                initListView();
                scrollToCurrentTime();
            }else{
                initTableView();
            }
            initSessions();
        } else {
            $('#'+ sectionName +'-view').addClass('selected');
        }
        if (sectionName === 'notifications'){
            redrawNotifications();
        } else if (sectionName === 'map'){
            console.log('Map tab clicked');
            openMapTab();
        } else if (sectionName === 'menu'){
            displayPanel('menu');
            updateMenuSyncMessage();
        }
        }, 0);
    };

    var setupAppHeaderBar = function(){

        //main sections tabs
        var mainSections = [
                '#schedule-section-link',
                '#favorites-section-link',
                '#map-section-link',
                '#notifications-section-link',
                '#menu-section-link'
            ];
        $(mainSections.join(',')).click(appTabClicked);

        //map pan and zoom setup
        initMapPanZoom();

        //developer submenu toggle
        $('#developer-submenu-toggle').click(function(e){
            var toggleLink = $(this),
                affectedItems = $(toggleLink.data('target'));
            toggleLink.toggleClass('closed');
            affectedItems.toggleClass('collapse');
            e.stopPropagation();
        });

        //list view toggle (lists vs tables)
        $('#list-view-toggle input[type="radio"]').on('change', scheduleViewSwitchClicked);

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
        $('#erase-notifications').click(function(){
            companionStore.eraseUpdates(function(){
                console.log('notifications erased');
                updatesLog = [];
                redrawNotifications();
            });
        });
        $('#erase-all').click(function(){
            companionStore.nuke(function(){
                console.log('all local data erased');
            });
        });
    };

    var redrawNotifications = function(){
        var destinationElement = $('#notifications-view'),
            template = templates.notifications;
        destinationElement.html(
            template({
                updates_user: _.filter(updatesLog, isSessionFavorite),
                updates_all: _.filter(updatesLog, isSessionNotFavorite)
            })
        );
    };

    var compareSchedules = function(){
        console.log('compareSchedules!');
        var recentChanges = [],
            oldSessionIDs = _.keys(previousScheduleData.sessions),
            newSessionIDs = _.keys(scheduleData.sessions),
            removedSessions = _.difference(oldSessionIDs, newSessionIDs),
            timestamp = Date.now();

        //removed sessions
        // console.log('Removed sessions:'+removedSessions);
        _.forEach(removedSessions, function(sessionID){
            recentChanges.push({
                sessionId: sessionID,
                sessionTitle: previousScheduleData.sessions[sessionID].title,
                updateType: 'cancel',
                time: timestamp
            });
        });

        //updated and added sessions
        _.forEach(scheduleData.sessions, function(session){
            if (previousScheduleData.sessions[session.id] !== undefined){
                var oldSession = previousScheduleData.sessions[session.id],
                    changed = !_.isEqual(session, oldSession);
                if (changed){
                    // console.log(oldSession.title + ' has changed');
                    if (oldSession.title !== session.title){
                        recentChanges.push({
                            sessionId: session.id,
                            sessionTitle: oldSession.title,
                            updateType: 'rename',
                            time: timestamp
                        });
                    }
                    if (oldSession.roomID !== session.roomID){
                        recentChanges.push({
                            sessionId: session.id,
                            sessionTitle: oldSession.title,
                            updateType: 'room',
                            time: timestamp,
                            oldValues: {
                                roomID: oldSession.roomID
                            }
                        });
                    }
                    if (oldSession.start !== session.start){
                        recentChanges.push({
                            sessionId: session.id,
                            sessionTitle: oldSession.title,
                            updateType: 'start',
                            time: timestamp,
                            oldValues: {
                                start: oldSession.start
                            }
                        });
                    }
                }
            }else{
                // console.log('Session '+session.id+' is a new one!');
                recentChanges.push({
                    sessionId: session.id,
                    sessionTitle: session.title,
                    updateType: 'new',
                    time: timestamp
                });
            }
        });

        // console.log('latest changes: '+JSON.stringify(recentChanges, null, '  '));
        updatesLog = _.union(recentChanges.reverse(), updatesLog);

        companionStore.saveUpdatesLog(updatesLog, function(dataSaved){
            // console.log('all changes saved: '+JSON.stringify(dataSaved, null, '  '));
        });
        redrawNotifications();
    };

    var updateLocalFeed = function(){
        var timestamp = scheduleData.parsed_date ? scheduleData.parsed_date : Date.now();

        companionStore.updateFeed(scheduleData, timestamp, function(storedData){
            console.log('feed updated locally ',storedData);
            updateMenuSyncMessage();
        });
        companionStore.getLastFetchInfo(function(info){
            console.log('local updateInfo loaded:',info);
            updateInfo = info;
        });

    };

    var feedLoaded = function(data, textStatus, xhr, fromCache) {
        var isRefresh = $('#schedule-view').length > 0;
        previousScheduleData = scheduleData;
        scheduleData = tryParseJSON(data);
        feedData = data;
        firstFetchFailed = false;

        if (scheduleData === false){
            console.log('the loaded feed is not a json, parse the xml');
            scheduleData = parser.parse(data);
        }
        console.log('XML size='+data.length);
        if (xhr !== null){
            console.log('XML all headers='+xhr.getAllResponseHeaders());
        }
        if (!fromCache){
            //compare new scheduleData with the old one
            if (previousScheduleData !== null){
                compareSchedules();
            }
            //store fetched data and metadata
            updateLocalFeed();
        }
        populateSchedule(isRefresh);
    };

    var loadFeed = function(anotherURL){
        console.log('loadFeed');
        var appElement = $('#app'),
            feedURL = appElement.data('feed-url'),
            localFeed = appElement.data('local-feed-url'),
            isRefresh = $('#schedule-view').length > 0;

        loadingMessage('Aguarde, atualizando a grade ');

        if (!isCordova) {
            feedURL = localFeed;
        }
        if (isRefresh && devSyncMode){
            feedURL = 'data/schedule2.xml';
        }
        if (anotherURL) {
            feedURL = anotherURL;
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
                        percentString;
                    if (evt.lengthComputable) {
                        total = evt.total;
                    }else{
                        //FISL server reports 18446744073709552000 as total, which is probably wrong
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
            console.log('request failed:'+this.url);
            if (firstFetchFailed && this.url !== localFeed){
                console.log('fetch packaged backup at '+ localFeed);
                loadFeed(localFeed);
            }else{
                console.log('the request failed but the user should have something cached');
                console.log('some kind of visual hint might be useful');
            }
        }).always(function() {
            $('.refresh-feed').removeClass('loading');
        });
    };

    var loadCached = function(xmlData){
        // console.log('loadCached '+xmlData);
        if (xmlData !== null){
            feedLoaded(xmlData, 200, null, true);
        }else{
            console.log('local storage has update info but not the actual feed');
            loadFeed();
        }
    };

    var onDeviceReady = function(){
        $('#splash-version').text(pkg.version);
        devSyncMode = ($('#app').data('sync-dev-mode') === 'on');
        console.log('device ready, debug:'+devSyncMode);
        loadingMessage('Aguarde, carregando dados locais ');

        attachFastClick(document.body);

        //load stored bookmarks
        companionStore.bookmarks(function(storedBookmarks){
            // console.log('stored bookmarks:'+JSON.stringify(storedBookmarks));
            bookmarkedSessions = (storedBookmarks !== null) ? storedBookmarks : {};
            //then load stored notifications history
            companionStore.updates(function(storedUpdates){
                updatesLog = (storedUpdates !== null) ? storedUpdates : [];
                // console.log('stored Updates Log:'+JSON.stringify(storedUpdates));
                //then load information about last fetched xml
                companionStore.getLastFetchInfo(function(info){
                    console.log('local updateInfo loaded:',info);
                    updateInfo = info;
                    if (info === null){
                        //no feed information was found, this is the first run
                        console.log('no feed information was found, this is the first run');
                        loadFeed();
                    }else{
                        //load the stored xml
                        console.log('loading stored feed');
                        companionStore.cachedFeed(loadCached);
                        if (Date.now() - info.time > POLL_INTERVAL){
                            console.log('needs to poll, latest fetch: '+info.time);
                        }
                    }
                });
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