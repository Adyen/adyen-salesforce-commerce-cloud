const store = require('../../../../store');

function assignPaymentMethodValue() {
  const adyenPaymentMethod = document.querySelector('#adyenPaymentMethodName');
  // if currently selected paymentMethod contains a brand it will be part of the label ID
  const paymentMethodlabelId = `#lb_${store.selectedMethod}`;
  if (adyenPaymentMethod) {
    adyenPaymentMethod.value = store.brand
      ? store.brand
      : document.querySelector(paymentMethodlabelId)?.innerHTML;
  }
}

function setOrderFormData(response) {
  if (response.orderNo) {
    document.querySelector('#merchantReference').value = response.orderNo;
  }
  if (response.orderToken) {
    document.querySelector('#orderToken').value = response.orderToken;
  }
}

/**
 * Makes an ajax call to the controller function PaymentFromComponent.
 * Used by certain payment methods like paypal
 */
function paymentFromComponent(data, component = {}) {
  const requestData = store.partialPaymentsOrderObj
    ? { ...data, partialPaymentsOrder: store.partialPaymentsOrderObj }
    : data;
  $.ajax({
    url: window.paymentFromComponentURL,
    type: 'post',
    data: {
      data: JSON.stringify(requestData),
      paymentMethod: document.querySelector('#adyenPaymentMethodName').value,
    },
    success(response) {
      setOrderFormData(response);
      if (response.fullResponse?.action) {
        component.handleAction(response.fullResponse.action);
      } else if (response.isApplePay) {
        document.querySelector('#result').value = JSON.stringify(response);
        document.querySelector('#showConfirmationForm').submit();
      } else if (response.paymentError || response.error) {
        component.handleError();
      }
    },
  });
}

function makePartialPayment(requestData) {
  let error;
  $.ajax({
    url: 'Adyen-partialPayment',
    type: 'POST',
    data: JSON.stringify(requestData),
    contentType: 'application/json; charset=utf-8',
    async: false,
    success(response) {
      if (response.error) {
        error = {
          error: true,
        };
      } else {
        const { giftCards, ...rest } = response;
        store.checkout.options.amount = rest.remainingAmount;
        store.partialPaymentsOrderObj = rest;
        store.addedGiftCards = giftCards;
        setOrderFormData(response);
      }
    },
  }).fail(() => {});
  return error;
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
    ['paypal', 'paywithgoogle', 'googlepay', 'amazonpay', 'applepay'].indexOf(
      type,
    ) > -1;

  document
    .querySelector(`#component_${type}`)
    .setAttribute('style', 'display:block');
  // set brand for giftcards if hidden inputfield is present
  store.brand = document.querySelector(`#component_${type} .brand`)?.value;
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

function getInstallmentValues(maxValue) {
  const values = [];
  for (let i = 1; i <= maxValue; i += 1) {
    values.push(i);
  }
  return values;
}

function createShowConfirmationForm(action) {
  if (document.querySelector('#showConfirmationForm')) {
    return;
  }
  const template = document.createElement('template');
  const form = `<form method="post" id="showConfirmationForm" name="showConfirmationForm" action="${action}">
    <input type="hidden" id="additionalDetailsHidden" name="additionalDetailsHidden" value="null"/>
    <input type="hidden" id="merchantReference" name="merchantReference"/>
    <input type="hidden" id="orderToken" name="orderToken"/>
    <input type="hidden" id="result" name="result" value="null"/>
  </form>`;

  template.innerHTML = form;
  document.querySelector('body').appendChild(template.content);
}

module.exports = {
  setOrderFormData,
  assignPaymentMethodValue,
  paymentFromComponent,
  resetPaymentMethod,
  displaySelectedMethod,
  showValidation,
  createShowConfirmationForm,
  getInstallmentValues,
  makePartialPayment,
};
