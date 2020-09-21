const store = require('../../../store');
const {
  renderGenericComponent,
} = require('./adyen_checkout/renderGenericComponent');
const {
  setCheckoutConfiguration,
} = require('./adyen_checkout/checkoutConfiguration');
const {
  assignPaymentMethodValue,
  showValidation,
} = require('./adyen_checkout/helpers');
const { validateComponents } = require('./adyen_checkout/validateComponents');

$('#dwfrm_billing').submit((e) => {
  e.preventDefault();

  const form = $(this);
  const url = form.attr('action');

  $.ajax({
    type: 'POST',
    url,
    data: form.serialize(),
    async: false,
    success(data) {
      store.formErrorsExist = 'fieldErrors' in data;
    },
  });
});

setCheckoutConfiguration();

if (window.installments) {
  try {
    const installments = JSON.parse(window.installments);
    store.checkoutConfiguration.paymentMethodsConfiguration.card.installments = installments;
  } catch (e) {} // eslint-disable-line no-empty
}
if (window.paypalMerchantID !== 'null') {
  store.checkoutConfiguration.paymentMethodsConfiguration.paypal.merchantId =
    window.paypalMerchantID;
}

// Submit the payment
$('button[value="submit-payment"]').on('click', () => {
  if (document.querySelector('#selectedPaymentOption').value === 'AdyenPOS') {
    document.querySelector('#terminalId').value = document.querySelector(
      '#terminalList',
    ).value;
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
module.exports.methods = { renderGenericComponent };
