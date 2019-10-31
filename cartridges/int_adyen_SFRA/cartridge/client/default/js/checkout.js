'use strict';

var processInclude = require('base/util');
var adyenCheckout = require('./adyenCheckout');

$(document).ready(function () { // eslint-disable-line
    var name = 'paymentError';
    var error = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search);
    if (error) {
        $('.error-message').show();
        $('.error-message-text').text(decodeURIComponent(error[1]));
        adyenCheckout.methods.displayPaymentMethods();
    }

    processInclude(require('base/checkout/checkout'));
    processInclude(require('./checkout/billing'));
    processInclude(require('./checkout/checkout'));

    $('#selectedPaymentOption').val($('.payment-options .nav-item .active').parent().attr('data-method-id'));
});

$('.payment-options .nav-link').click(function () {
    $('#selectedPaymentOption').val($(this).parent().attr('data-method-id'));
});