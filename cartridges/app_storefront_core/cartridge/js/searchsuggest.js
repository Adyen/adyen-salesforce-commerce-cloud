'use strict';

var util = require('./util');

var currentQuery = null,
    lastQuery = null,
    runningQuery = null,
    listTotal = -1,
    listCurrent = -1,
    delay = 30,
    $resultsContainer;
/**
 * @function
 * @description Handles keyboard's arrow keys
 * @param keyCode Code of an arrow key to be handled
 */
function handleArrowKeys(keyCode) {
    switch (keyCode) {
        case 38:
            // keyUp
            listCurrent = (listCurrent <= 0) ? (listTotal - 1) : (listCurrent - 1);
            break;
        case 40:
            // keyDown
            listCurrent = (listCurrent >= listTotal - 1) ? 0 : listCurrent + 1;
            break;
        default:
            // reset
            listCurrent = -1;
            return false;
    }

    $resultsContainer.children().removeClass('selected').eq(listCurrent).addClass('selected');
    $('input[name="q"]').val($resultsContainer.find('.selected .suggestionterm').first().text());
    return true;
}

var searchsuggest = {
    /**
     * @function
     * @description Configures parameters and required object instances
     */
    init: function (container, defaultValue) {
        var $searchContainer = $(container);
        var $searchForm = $searchContainer.find('form[name="simpleSearch"]');
        var $searchField = $searchForm.find('input[name="q"]');

        // disable browser auto complete
        $searchField.attr('autocomplete', 'off');

        // on focus listener (clear default value)
        $searchField.focus(function () {
            if (!$resultsContainer) {
                // create results container if needed
                $resultsContainer = $('<div/>').attr('id', 'search-suggestions').appendTo($searchContainer);
            }
            if ($searchField.val() === defaultValue) {
                $searchField.val('');
            }
        });

        $(document).on('click', function (e) {
            if (!$searchContainer.is(e.target)) {
                setTimeout(this.clearResults, 200);
            }
        }.bind(this));
        // on key up listener
        $searchField.keyup(function (e) {

            // get keyCode (window.event is for IE)
            var keyCode = e.keyCode || window.event.keyCode;

            // check and treat up and down arrows
            if (handleArrowKeys(keyCode)) {
                return;
            }
            // check for an ENTER or ESC
            if (keyCode === 13 || keyCode === 27) {
                this.clearResults();
                return;
            }

            currentQuery = $searchField.val().trim();

            // no query currently running, init an update
            if (!runningQuery) {
                runningQuery = currentQuery;
                setTimeout(this.suggest.bind(this), delay);
            }
        }.bind(this));
    },

    /**
     * @function
     * @description trigger suggest action
     */
    suggest: function () {
        // check whether query to execute (runningQuery) is still up to date and had not changed in the meanwhile
        // (we had a little delay)
        if (runningQuery !== currentQuery) {
            // update running query to the most recent search phrase
            runningQuery = currentQuery;
        }

        // if it's empty clear the results box and return
        if (runningQuery.length === 0) {
            this.clearResults();
            runningQuery = null;
            return;
        }

        // if the current search phrase is the same as for the last suggestion call, just return
        if (lastQuery === runningQuery) {
            runningQuery = null;
            return;
        }

        // build the request url
        var reqUrl = util.appendParamToURL(Urls.searchsuggest, 'q', runningQuery);

        // execute server call
        $.get(reqUrl, function (data) {
            var suggestionHTML = data,
                ansLength = suggestionHTML.trim().length;

            // if there are results populate the results div
            if (ansLength === 0) {
                this.clearResults();
            } else {
                // update the results div
                $resultsContainer.html(suggestionHTML).fadeIn(200);
            }

            // record the query that has been executed
            lastQuery = runningQuery;
            // reset currently running query
            runningQuery = null;

            // check for another required update (if current search phrase is different from just executed call)
            if (currentQuery !== lastQuery) {
                // ... and execute immediately if search has changed while this server call was in transit
                runningQuery = currentQuery;
                setTimeout(this.suggest.bind(this), delay);
            }
            this.hideLeftPanel();
        }.bind(this));
    },
    /**
     * @function
     * @description
     */
    clearResults: function () {
        if (!$resultsContainer) { return; }
        $resultsContainer.fadeOut(200, function () {$resultsContainer.empty();});
    },
    /**
     * @function
     * @description
     */
    hideLeftPanel: function () {
        //hide left panel if there is only a matching suggested custom phrase
        if ($('.search-suggestion-left-panel-hit').length === 1 && $('.search-phrase-suggestion a').text().replace(/(^[\s]+|[\s]+$)/g, '').toUpperCase() === $('.search-suggestion-left-panel-hit a').text().toUpperCase()) {
            $('.search-suggestion-left-panel').css('display', 'none');
            $('.search-suggestion-wrapper-full').addClass('search-suggestion-wrapper');
            $('.search-suggestion-wrapper').removeClass('search-suggestion-wrapper-full');
        }
    }
};

module.exports = searchsuggest;
