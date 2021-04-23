"use strict";

var store = require('../../../store');

var _require = require('./adyen_checkout/renderGenericComponent'),
    renderGenericComponent = _require.renderGenericComponent;

var _require2 = require('./adyen_checkout/checkoutConfiguration'),
    setCheckoutConfiguration = _require2.setCheckoutConfiguration;

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

if (window.cardholderNameBool !== 'null') {
  store.checkoutConfiguration.paymentMethodsConfiguration.card.hasHolderName = true;
  store.checkoutConfiguration.paymentMethodsConfiguration.card.holderNameRequired = true;
}

if (window.installments) {
  try {
    var installments = JSON.parse(window.installments);
    store.checkoutConfiguration.paymentMethodsConfiguration.card.installments = installments;
  } catch (e) {} // eslint-disable-line no-empty

}

if (window.googleMerchantID !== 'null' && window.Configuration.environment === 'live') {
  var id = 'merchantIdentifier';
  store.checkoutConfiguration.paymentMethodsConfiguration.paywithgoogle.configuration[id] = window.googleMerchantID;
}

if (window.paypalMerchantID !== 'null') {
  store.checkoutConfiguration.paymentMethodsConfiguration.paypal.merchantId = window.paypalMerchantID;
} // Submit the payment


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
    return true;
  }

  assignPaymentMethodValue();
  validateComponents();
  return showValidation();
});
/**
 * Assigns stateData value to the hidden stateData input field
 * so it's sent to the backend for processing
 */

module.exports.methods = {
  renderGenericComponent: renderGenericComponent
};