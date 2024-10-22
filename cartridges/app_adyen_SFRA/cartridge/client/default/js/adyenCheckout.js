"use strict";

var store = require('../../../store');
var _require = require('./adyen_checkout/renderGenericComponent'),
  renderGenericComponent = _require.renderGenericComponent;
var _require2 = require('./adyen_checkout/checkoutConfiguration'),
  setCheckoutConfiguration = _require2.setCheckoutConfiguration,
  actionHandler = _require2.actionHandler;
var _require3 = require('./adyen_checkout/helpers'),
  assignPaymentMethodValue = _require3.assignPaymentMethodValue,
  showValidation = _require3.showValidation,
  paymentFromComponent = _require3.paymentFromComponent;
var _require4 = require('./adyen_checkout/validateComponents'),
  validateComponents = _require4.validateComponents;
$('#dwfrm_billing').submit(function apiRequest(e) {
  e.preventDefault();
  var form = $(this);
  var url = form.attr('action');
  $.ajax({
    type: 'POST',
    url: url,
    data: form.serialize(),
    async: false,
    success: function success(data) {
      store.formErrorsExist = 'fieldErrors' in data;
    }
  });
});
setCheckoutConfiguration();
if (window.googleMerchantID !== 'null' && window.Configuration.environment.includes('live')) {
  var id = 'merchantId';
  store.checkoutConfiguration.paymentMethodsConfiguration.paywithgoogle.configuration[id] = window.googleMerchantID;
  store.checkoutConfiguration.paymentMethodsConfiguration.googlepay.configuration[id] = window.googleMerchantID;
}
$('body').on('checkout:updateCheckoutView', function (event, data) {
  if (data.order.orderEmail) {
    var clickToPayConfiguration = store.checkoutConfiguration.paymentMethodsConfiguration.card.clickToPayConfiguration;
    clickToPayConfiguration.shopperEmail = data.order.orderEmail;
  }
});

// Submit the payment
$('button[value="submit-payment"]').on('click', function () {
  if (store.paypalTerminatedEarly) {
    paymentFromComponent({
      cancelTransaction: true,
      merchantReference: document.querySelector('#merchantReference').value
    });
    store.paypalTerminatedEarly = false;
  }
  if (document.querySelector('#selectedPaymentOption').value === 'AdyenPOS') {
    document.querySelector('#terminalId').value = document.querySelector('#terminalList').value;
  }
  if (document.querySelector('#selectedPaymentOption').value === 'AdyenComponent' || document.querySelector('#selectedPaymentOption').value === 'CREDIT_CARD') {
    assignPaymentMethodValue();
    validateComponents();
    return showValidation();
  }
  return true;
});
module.exports = {
  renderGenericComponent: renderGenericComponent,
  actionHandler: actionHandler
};