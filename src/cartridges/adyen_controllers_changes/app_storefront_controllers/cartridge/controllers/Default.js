'use strict';

/**
 * Controller that determines the page rendered when a customer accesses the site domain (www.mydomain.com).
 * The Start function that it exports points at the controller that renders the home page.
 * @module controllers/Default
 */

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * This function is called when the site is turned offline (not live).
 */
function offline() {
    app.getView().render('error/siteoffline');
}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** Sets the page rendered when the site domain is accessed.
 * @see module:controllers/Home~show */
exports.Start = app.getController('Home').Show;
/** Sets the controller called when the site is offline.
 * @see module:controllers/Default~offline */
exports.Offline = guard.ensure(['get'], offline);
