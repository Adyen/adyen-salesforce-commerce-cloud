'use strict';

/**
 * Controller that renders the home page.
 * These empty controllers are called by the client-side TLS detectors to collect reporting information
 *
 * @module controllers/TLS
 */

var guard = require('~/cartridge/scripts/guard');

/**
 * @function BadTLS called when a browser is detected that does not support TLS 1.1 or later.
 */
function BadTLS() {}

/**
 * @function BadBrowser called a browser is detected that does not support TLS 1.1 or later.
 */
function BadBrowser() {}

/*
 * Export the publicly available controller methods
 */

/* @see module:controllers/TLS-BadTLS */
exports.BadTLS = guard.ensure(['get'], BadTLS);

/* @see module:controllers/TLS-BadBrowser */
exports.BadBrowser = guard.ensure(['get'], BadBrowser);