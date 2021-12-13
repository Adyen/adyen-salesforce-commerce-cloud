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
if (window.cardholderNameBool !== 'null') {
  store.checkoutConfiguration.paymentMethodsConfiguration.card.hasHolderName = true;
  store.checkoutConfiguration.paymentMethodsConfiguration.card.holderNameRequired = true;
}

if (window.installments) {
  try {
    const installments = JSON.parse(window.installments);
    store.checkoutConfiguration.paymentMethodsConfiguration.card.installments = installments;
  } catch (e) {} // eslint-disable-line no-empty
}
if (
  window.googleMerchantID !== 'null' &&
  window.Configuration.environment === 'live'
) {
  const id = 'merchantIdentifier';
  store.checkoutConfiguration.paymentMethodsConfiguration.paywithgoogle.configuration[
    id
  ] = window.googleMerchantID;
  store.checkoutConfiguration.paymentMethodsConfiguration.googlepay.configuration[
    id
  ] = window.googleMerchantID;
}

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
    document.querySelector('#terminalId').value = document.querySelector(
      '#terminalList',
    ).value;
  }

  if (
    document.querySelector('#selectedPaymentOption').value === 'AdyenComponent'
  ) {
    assignPaymentMethodValue();
    validateComponents();
    return showValidation();
  }
  return true;
});

// confirm onAdditionalDetails event and paymentsDetails response
store.checkoutConfiguration.onAdditionalDetails = (state) => {
  $.ajax({
    type: 'POST',
    url: 'Adyen-PaymentsDetails',
    data: JSON.stringify(state.data),
    contentType: 'application/json; charset=utf-8',
    async: false,
    success(data) {
      console.log(data);
      if (data.isSuccessful) {
        window.location.href = data.redirectUrl;
      } else if (!data.isFinal && typeof data.action === 'object') {
        actionHandler(data.action);
      } else {
        // $('#action-modal').modal('hide');
        document.getElementById('cardError').style.display = 'block';
      }
    },
  });
};

console.log('adyenCheckout loaded');

const actionHandler = (action) => {
  const checkout = new AdyenCheckout(store.checkoutConfiguration);
  checkout.createFromAction(action).mount('#action-container');
  // $('#action-modal').modal({ backdrop: 'static', keyboard: false });
};



/**
 * Assigns stateData value to the hidden stateData input field
 * so it's sent to the backend for processing
 */
module.exports = {
  renderGenericComponent,
  actionHandler
};
