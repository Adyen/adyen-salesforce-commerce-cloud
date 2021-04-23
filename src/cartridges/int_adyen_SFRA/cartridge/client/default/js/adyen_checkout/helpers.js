const store = require('../../../../store');
const { qrCodeMethods } = require('./qrCodeMethods');

function assignPaymentMethodValue() {
  const adyenPaymentMethod = document.querySelector('#adyenPaymentMethodName');
  adyenPaymentMethod.value = document.querySelector(
    `#lb_${store.selectedMethod}`,
  ).innerHTML;
}

/**
 * Makes an ajax call to the controller function PaymentFromComponent.
 * Used by certain payment methods like paypal
 */
function paymentFromComponent(data, component) {
  $.ajax({
    url: window.paymentFromComponentURL,
    type: 'post',
    data: {
      data: JSON.stringify(data),
      paymentMethod: document.querySelector('#adyenPaymentMethodName').value,
    },
    success(response) {
      if (response.orderNo) {
        document.querySelector('#merchantReference').value = response.orderNo;
      }
      if (response.fullResponse?.action) {
        component.handleAction(response.fullResponse.action);
      }
    },
  }).fail(() => {});
}

function resetPaymentMethod() {
  $('#requiredBrandCode').hide();
  $('#selectedIssuer').val('');
  $('#adyenIssuerName').val('');
  $('#dateOfBirth').val('');
  $('#telephoneNumber').val('');
  $('#gender').val('');
  $('#bankAccountOwnerName').val('');
  $('#bankAccountNumber').val('');
  $('#bankLocationId').val('');
  $('.additionalFields').hide();
}

/**
 * Changes the "display" attribute of the selected method from hidden to visible
 */
function displaySelectedMethod(type) {
  store.selectedMethod = type;
  resetPaymentMethod();
  document.querySelector('button[value="submit-payment"]').disabled =
    ['paypal', 'paywithgoogle', 'mbway', ...qrCodeMethods].indexOf(type) > -1;
  document
    .querySelector(`#component_${type}`)
    .setAttribute('style', 'display:block');
}

function displayValidationErrors() {
  store.selectedPayment.node.showValidation();
  return false;
}

const selectedMethods = {};

function doCustomValidation() {
  return store.selectedMethod in selectedMethods
    ? selectedMethods[store.selectedMethod]()
    : true;
}

function showValidation() {
  return store.selectedPaymentIsValid
    ? doCustomValidation()
    : displayValidationErrors();
}

module.exports = {
  assignPaymentMethodValue,
  paymentFromComponent,
  resetPaymentMethod,
  displaySelectedMethod,
  showValidation,
};
