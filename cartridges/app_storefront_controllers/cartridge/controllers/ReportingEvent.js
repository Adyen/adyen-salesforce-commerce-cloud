'use strict';

/**
 * Controller that is the module hook for reporting events. Typically no modifications are needed here.
 * Salesforce Commerce Cloud analytics is based on log file analysis. Log file entries are generated using remote includes in page templates.
 *
 * @module controllers/ReportingEvent
 */

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * This is main method to handle all reporting events.
 */
function start() {
    app.getView().render('util/reporting/reporting');
}

/*
 * Web exposed methods
 */
/** Handles all reporting events.
 * @see module:controllers/ReportingEvent~start */
exports.Start = guard.ensure(['get'], start);
