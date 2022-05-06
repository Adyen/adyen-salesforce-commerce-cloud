'use strict';

var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

function csrfFailed() {
    app.getView().render('csrf/csrffailed');
}

exports.Failed = guard.ensure(['get', 'https'], csrfFailed);
