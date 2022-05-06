'use strict';

/**
 * Renders the home page.
 *
 * @module controllers/Resources
 */
var guard = require('~/cartridge/scripts/guard');
var ISML = require('dw/template/ISML');

/**
 * Renders template containing transient resources
 */
function loadTransient() {
    ISML.renderTemplate('resources/appresources_transient');
}

/** @see module:controllers/Resources-LoadTransient */
exports.LoadTransient = guard.ensure(['get'], loadTransient);
