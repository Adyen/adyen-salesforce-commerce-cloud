'use strict';

/**
 * Checks the TLS and displays a warning if appropriate
 * @function getUserAgent Checks the TLS and displays a warning if appropriate
 **/
function getUserAgent() {
    // Use an external service to check the TLS of the browser
    // NOTE: this implementation uses https://www.howsmyssl.com
    //     you may also wish to consider the API available at https://www.ssllabs.com/projects/ssllabs-apis/index.html
    var url = 'https://www.howsmyssl.com/a/check';
    var cookieName = 'dw_TLSWarning';
    var cookieValue = getCookie(cookieName);

    // Test to see if this browser has already been flagged by looking at its cookies
    if (!cookieValue) {
        getTLS(url, function (message) {
            if (message.length > 0) {
                showWarning(message[0]);

                // the browser is bad - set the cookie to true (for 15 minutes)
                setCookie(cookieName, 'true', 15);
            } else {
                // else the browser is good, set the cookie to false (for 30 days) so we don't check again
                setCookie(cookieName, 'false', 60 * 24 * 30);
            }
        });
    } else if (cookieValue === 'true') {
        // if we already know that this is an invalid browser, show the warning
        showWarning(Resources.TLS_WARNING);
    }
}

/**
 * Calls out to the TLS service and calls the callback with a message (if necessary)
 * @function getTLS
 *
 * @param {string} url - URL of external TLS-checking API
 * @param {function} callback - function to call with response
 **/
function getTLS(url, callback) {
    var message = [];

    // First, see if the browser is among the suspect browsers to see if a TLS check is necessary
    var userAgent = navigator.userAgent;

    /** This list derived from https://www.ssllabs.com/ssltest/clients.html **/
    var badBrowsers = ['MSIE 6.0','MSIE 7.0','MSIE 8.0','MSIE 9.0','MSIE 10.0',
                       'Android 2.3.7', 'Android 4.0.4', 'Android 4.1.1', 'Android 4.2.2', 'Android 4.3',
                       'Safari 5.1.9 / OS X 10.6.8', 'Safari 6.0.4 / OS X 10.8.4 '];
    function checkTLSLevel(data) {
        // If we can determine the TLS level, check to see if it's less than 1.2
        if (parseFloat(data.tls_version.split(' ')[1]) < 1.1) {
            message.push(Resources.TLS_WARNING);
            callback(message);

            //If you want to track statistics on bad TLS hits, include this call
            $.ajax({url: Urls.TLSBadTLS});
        }
    }

    function reportBadBrowser () {
        // If the TLS level cannot be determined just report that this browser is suspect
        message.push(Resources.TLS_WARNING);
        callback(message);

        //If you want to track statistics on deprecated browsers, include this call
        $.ajax({url: Urls.TLSBadBrowser});
    }

    for (var i = 0; i < badBrowsers.length; i++) {
        if (userAgent.match(badBrowsers[i])) {
            // It's a suspect browser, let's see what it's TLS level is
            $.ajax({
                url: url
            }).done(checkTLSLevel).fail(reportBadBrowser);
            break;
        }
    }

    /** For testing purposes, uncomment this block
        message.push(Resources.TLS_WARNING);
    **/
    callback(message);
}

/**
 * @function showWarning turns on the browser-compatibility-alert and sets the message
 *
 * @param {string} message - the message that will be shown upon detection of a bad browser
 **/
function showWarning(message) {
    $('<div/>').addClass('browser-compatibility-alert').append($('<p/>').addClass('browser-error').html(message)).appendTo('#browser-check');
}

/**
 * @function getCookie
 *
 * @param {string} key - The cookie name
 * @returns {string} value - the value of the cookie if found, null otherwise
 **/
function getCookie(key) {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
        var tokens = cookies[i].split('=');
        var cookieKey = tokens[0].trim();
        if (cookieKey === key) {
            return tokens[1];
        }
    }
    return '';
}

/**
 * @function setCookie
 *
 * @param {string} key - The cookie name
 * @param {string} value - The cookie value
 * @param {integer} minutes - The number of minutes to expire the cookie
 **/
function setCookie (key, value, minutes) {
    var date = new Date();
    date.setTime(date + (minutes * 60 * 1000));

    document.cookie = key + '=' + value + '; expires=' + date.toGMTString() + '; path=/';
}

/**
 * Export the getUserAgent function
 */

exports.getUserAgent = getUserAgent;
