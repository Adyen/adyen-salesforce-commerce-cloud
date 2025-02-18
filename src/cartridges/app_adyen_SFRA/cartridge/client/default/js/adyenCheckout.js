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
const { httpClient } = require('./commons/httpClient');

$('#dwfrm_billing').submit(async function apiRequest(e) {
  e.preventDefault();

  const form = $(this);
  const formDataObject = form.serializeArray().reduce((obj, item) => {
    obj[item.name] = item.value;
    return obj;
  }, {});
  const url = form.attr('action');

  const data = await httpClient({
    method: 'POST',
    url,
    data: formDataObject,
  });

  store.formErrorsExist = 'fieldErrors' in data;
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
      store.paymentMethodsConfiguration.scheme;
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
