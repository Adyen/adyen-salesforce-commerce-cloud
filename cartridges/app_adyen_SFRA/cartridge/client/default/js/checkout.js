"use strict";

/* eslint-disable prefer-regex-literals */
var processInclude = require('base/util');
var baseCheckout = require('base/checkout/checkout');
var adyenCheckout = require('./adyenCheckout');
var billing = require('./checkout/billing');

// Compatibility Adyen SFRA 5.x.x & 6.x.x
var checkout = window.AdyenSFRA6Enabled !== 'null' ? require('./checkout/checkoutSFRA6') : require('./checkout/checkoutSFRA5');
$(document).ready(function () {
  // eslint-disable-line
  var name = 'paymentError';
  var error = new RegExp("[?&]".concat(encodeURIComponent(name), "=([^&]*)")).exec(window.location.search);
  var paymentStage = new RegExp('[?&]stage=payment([^&]*)').exec(window.location.search);
  if (error || paymentStage) {
    if (error) {
      $('.error-message').show();
      $('.error-message-text').text(decodeURIComponent(error[1]));
    }
    adyenCheckout.renderGenericComponent();
  }
  processInclude(baseCheckout);
  processInclude(billing);
  processInclude(checkout);
  $('#selectedPaymentOption').val($('.payment-options .nav-item .active').parent().attr('data-method-id'));
});
$('.payment-options .nav-link').click(function setAttr() {
  $('#selectedPaymentOption').val($(this).parent().attr('data-method-id'));
});