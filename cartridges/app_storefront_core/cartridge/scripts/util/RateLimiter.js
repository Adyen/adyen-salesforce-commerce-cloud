'use strict';

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');

/**
*   @description This script checks the custom session attribute 'CounterLabel', increments it, and tests the
*   incremented value against a preference-set threshold
*
*   It returns PIPELET_NEXT if the threshold has not been exceeded and PIPELET_ERROR if the threshold is exceeded
*
*   @input CounterLabel : String
*/

function execute(args) {
    var counterLabel = args.CounterLabel;

    if (!counterLabel) {
        Logger.error('counterLabel not supplied');
        return PIPELET_ERROR;
    }

    return isOverThreshold(counterLabel) ? PIPELET_ERROR : PIPELET_NEXT;
}

/**
 * @module isOverThreshold returns true if the counter over the threshold, increments the counter otherwise
 * @param counterLabel
 * @returns boolean indicating if the counter is over the threshold
 */
function isOverThreshold(counterLabel) {
    var sessionCount = session.privacy[counterLabel];
    var threshold = Site.getCurrent().getCustomPreferenceValue('rateLimiterThreshold') ? Site.getCurrent().getCustomPreferenceValue('rateLimiterThreshold') : 5;

    if (sessionCount >= threshold) {
        Logger.error('Limited Field count exceeded: ' + counterLabel);
        return true;
    }
    session.privacy[counterLabel]++;

    return false;
}

/*
 * @describe hides the Captcha by unsetting the session attribute
 */
function hideCaptcha () {
   session.privacy.showCaptcha = false;
}

/*
 * @describe shows the Captcha by setting the session attribute
 */
function showCaptcha () {
   session.privacy.showCaptcha = true;
}

/** Testable functions **/

module.exports = {
    execute: execute,
    isOverThreshold: isOverThreshold,
    hideCaptcha: hideCaptcha,
    showCaptcha: showCaptcha
};
