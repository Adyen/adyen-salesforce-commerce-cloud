'use strict';

var address = require('./address'),
    billing = require('./billing'),
    multiship = require('./multiship'),
    shipping = require('./shipping');

/**
 * @function Initializes the page events depending on the checkout stage (shipping/billing)
 */
exports.init = function () {
    address.init();
    if ($('.checkout-shipping').length > 0) {
        shipping.init();
    } else if ($('.checkout-multi-shipping').length > 0) {
        multiship.init();
    } else {
        billing.init();
    }

    //if on the order review page and there are products that are not available diable the submit order button
    if ($('.order-summary-footer').length > 0) {
        if ($('.notavailable').length > 0) {
            $('.order-summary-footer .submit-order .button-fancy-large').attr('disabled', 'disabled');
        }
    }
};
