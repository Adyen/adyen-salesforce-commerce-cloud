'use strict';

var ajax = require('./ajax'),
    util = require('./util');
/**
 * @function
 * @description Load details to a given gift certificate
 * @param {String} id The ID of the gift certificate
 * @param {Function} callback A function to called
 */
exports.checkBalance = function (id, callback) {
    // load gift certificate details
    var url = util.appendParamToURL(Urls.giftCardCheckBalance, 'giftCertificateID', id);

    ajax.getJson({
        url: url,
        callback: callback
    });
};
