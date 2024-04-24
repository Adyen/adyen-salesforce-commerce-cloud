/* eslint-disable prefer-regex-literals */
const processInclude = require('base/util');
const baseCheckout = require('base/checkout/checkout');
const adyenCheckout = require('./adyenCheckout');
const billing = require('./checkout/billing');

// Compatibility Adyen SFRA 5.x.x & 6.x.x
const checkout =
  window.AdyenSFRA6Enabled !== 'null'
    ? require('./checkout/checkoutSFRA6')
    : require('./checkout/checkoutSFRA5');

$(document).ready(function () { // eslint-disable-line
  const name = 'paymentError';
  const error = new RegExp(`[?&]${encodeURIComponent(name)}=([^&]*)`).exec(
    window.location.search,
  );
  const paymentStage = new RegExp('[?&]stage=payment([^&]*)').exec(
    window.location.search,
  );
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

  $('#selectedPaymentOption').val(
    $('.payment-options .nav-item .active').parent().attr('data-method-id'),
  );
});

$('.payment-options .nav-link').click(function setAttr() {
  $('#selectedPaymentOption').val($(this).parent().attr('data-method-id'));
});
