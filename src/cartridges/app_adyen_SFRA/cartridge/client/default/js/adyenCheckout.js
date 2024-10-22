const store = require('../../../store');
const {
  renderGenericComponent,
} = require('./adyen_checkout/renderGenericComponent');
const {
  setCheckoutConfiguration,
  actionHandler,
} = require('./adyen_checkout/checkoutConfiguration');
const {
  assignPaymentMethodValue,
  showValidation,
  paymentFromComponent,
} = require('./adyen_checkout/helpers');
const { validateComponents } = require('./adyen_checkout/validateComponents');

$('#dwfrm_billing').submit(function apiRequest(e) {
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

if (
  window.googleMerchantID !== 'null' &&
  window.Configuration.environment.includes('live')
) {
  const id = 'merchantId';
  store.checkoutConfiguration.paymentMethodsConfiguration.paywithgoogle.configuration[
    id
  ] = window.googleMerchantID;
  store.checkoutConfiguration.paymentMethodsConfiguration.googlepay.configuration[
    id
  ] = window.googleMerchantID;
}

$('body').on('checkout:updateCheckoutView', (event, data) => {
  if (data.order.orderEmail) {
    const { clickToPayConfiguration } =
      store.checkoutConfiguration.paymentMethodsConfiguration.card;
    clickToPayConfiguration.shopperEmail = data.order.orderEmail;
  }
});

// Submit the payment
$('button[value="submit-payment"]').on('click', () => {
  if (store.paypalTerminatedEarly) {
    paymentFromComponent({
      cancelTransaction: true,
      merchantReference: document.querySelector('#merchantReference').value,
    });
    store.paypalTerminatedEarly = false;
  }
  if (document.querySelector('#selectedPaymentOption').value === 'AdyenPOS') {
    document.querySelector('#terminalId').value =
      document.querySelector('#terminalList').value;
  }

  if (
    document.querySelector('#selectedPaymentOption').value ===
      'AdyenComponent' ||
    document.querySelector('#selectedPaymentOption').value === 'CREDIT_CARD'
  ) {
    assignPaymentMethodValue();
    validateComponents();
    return showValidation();
  }
  return true;
});

module.exports = {
  renderGenericComponent,
  actionHandler,
};
