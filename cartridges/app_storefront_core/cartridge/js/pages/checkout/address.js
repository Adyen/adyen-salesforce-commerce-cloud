'use strict';

var util = require('../../util');
var shipping = require('./shipping');

/**
 * @function
 * @description Selects the first address from the list of addresses
 */
exports.init = function () {
    var $form = $('.address');
    // select address from list
    $('select[name$="_addressList"]', $form).on('change', function () {
        var selected = $(this).children(':selected').first();
        var selectedAddress = $(selected).data('address');
        if (!selectedAddress) { return; }
        util.fillAddressFields(selectedAddress, $form);
        shipping.updateShippingMethodList();
        // re-validate the form
        $form.validate().form();
    });
};
