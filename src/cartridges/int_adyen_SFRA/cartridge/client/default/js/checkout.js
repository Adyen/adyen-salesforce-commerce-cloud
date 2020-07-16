const processInclude = require('base/util');
const adyenCheckout = require('./adyenCheckout');

$(document).ready(function () { // eslint-disable-line
  const name = 'paymentError';
  const error = new RegExp(`[?&]${encodeURIComponent(name)}=([^&]*)`).exec(
    location.search, // eslint-disable-line no-restricted-globals
  );
  const paymentStage = new RegExp('[?&]stage=payment([^&]*)').exec(
    location.search, // eslint-disable-line no-restricted-globals
  );
  if (error || paymentStage) {
    if (error) {
      $('.error-message').show();
      $('.error-message-text').text(decodeURIComponent(error[1]));
    }
    adyenCheckout.methods.renderGenericComponent();
  }

  processInclude(require('base/checkout/checkout'));
  processInclude(require('./checkout/billing'));
  processInclude(require('./checkout/checkout'));

  $('#selectedPaymentOption').val(
    $('.payment-options .nav-item .active').parent().attr('data-method-id'),
  );
});

$('.payment-options .nav-link').click(function () {
  $('#selectedPaymentOption').val($(this).parent().attr('data-method-id'));
});
