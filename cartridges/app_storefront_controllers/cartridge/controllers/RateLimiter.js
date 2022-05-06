'use strict';

/**
 * RateLimiting capability that can be added into any pipeline
 *
 * @module controllers/RateLimiter
 */

/* Script Modules */
var guard = require('~/cartridge/scripts/guard');
var rateLimiter = require('app_storefront_core/cartridge/scripts/util/RateLimiter');

/*
 * @describe hides the Captcha by unsetting the session attribute
 */
function hideCaptcha () {
    rateLimiter.hideCaptcha();
}

/*
 * Web exposed methods
 */
/** @see module:controllers/RateLimiter~HideCaptcha */
exports.HideCaptcha = guard.ensure(['get'], hideCaptcha);
