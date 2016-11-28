'use strict';

var progress = require('./progress'),
    util = require('./util');

var currentRequests = [];

/**
 * @function
 * @description Ajax request to get json response
 * @param {Boolean} async  Asynchronous or not
 * @param {String} url URI for the request
 * @param {Object} data Name/Value pair data request
 * @param {Function} callback  Callback function to be called
 */
var getJson = function (options) {
    options.url = util.toAbsoluteUrl(options.url);
    // return if no url exists or url matches a current request
    if (!options.url || currentRequests[options.url]) {
        return;
    }

    currentRequests[options.url] = true;

    // make the server call
    $.ajax({
        dataType: 'json',
        url: options.url,
        async: (typeof options.async === 'undefined' || options.async === null) ? true : options.async,
        data: options.data || {}
    })
    // success
    .done(function (response) {
        if (options.callback) {
            options.callback(response);
        }
    })
    // failed
    .fail(function (xhr, textStatus) {
        if (textStatus === 'parsererror') {
            window.alert(Resources.BAD_RESPONSE);
        }
        if (options.callback) {
            options.callback(null);
        }
    })
    // executed on success or fail
    .always(function () {
        // remove current request from hash
        if (currentRequests[options.url]) {
            delete currentRequests[options.url];
        }
    });
};
/**
 * @function
 * @description ajax request to load html response in a given container
 * @param {String} url URI for the request
 * @param {Object} data Name/Value pair data request
 * @param {Function} callback  Callback function to be called
 * @param {Object} target Selector or element that will receive content
 */
var load = function (options) {
    options.url = util.toAbsoluteUrl(options.url);
    // return if no url exists or url matches a current request
    if (!options.url || currentRequests[options.url]) {
        return;
    }

    currentRequests[options.url] = true;

    // make the server call
    $.ajax({
        dataType: 'html',
        url: util.appendParamToURL(options.url, 'format', 'ajax'),
        data: options.data,
        xhrFields: {
            withCredentials: true
        }
    })
    .done(function (response) {
        // success
        if (options.target) {
            $(options.target).empty().html(response);
        }
        if (options.callback) {
            options.callback(response);
        }
    })
    .fail(function (xhr, textStatus) {
        // failed
        if (textStatus === 'parsererror') {
            window.alert(Resources.BAD_RESPONSE);
        }
        options.callback(null, textStatus);
    })
    .always(function () {
        progress.hide();
        // remove current request from hash
        if (currentRequests[options.url]) {
            delete currentRequests[options.url];
        }
    });
};

exports.getJson = getJson;
exports.load = load;
