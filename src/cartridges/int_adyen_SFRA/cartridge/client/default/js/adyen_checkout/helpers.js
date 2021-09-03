const store = require('../../../../store');
const { qrCodeMethods } = require('./qrCodeMethods');

function assignPaymentMethodValue() {
  const adyenPaymentMethod = document.querySelector('#adyenPaymentMethodName');
  // if currently selected paymentMethod contains a brand it will be part of the label ID
  const paymentMethodlabelId = store.brand
    ? `#lb_${store.selectedMethod}_${store.brand}`
    : `#lb_${store.selectedMethod}`;
  adyenPaymentMethod.value = document.querySelector(
    paymentMethodlabelId,
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
  // If 'type' input field is present use this as type, otherwise default to function input param
  store.selectedMethod = document.querySelector(`#component_${type} .type`)
    ? document.querySelector(`#component_${type} .type`).value
    : type;
  resetPaymentMethod();

  document.querySelector('button[value="submit-payment"]').disabled =
    ['paypal', 'paywithgoogle', 'mbway', 'amazonpay', ...qrCodeMethods].indexOf(
      type,
    ) > -1;

  document
    .querySelector(`#component_${type}`)
    .setAttribute('style', 'display:block');
  // set brand for giftcards if hidden inputfield is present
  const giftcardBrand = document.querySelector(`#component_${type} .brand`)
    ?.value;
  if (giftcardBrand) {
    store.brand = giftcardBrand;
  }
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
