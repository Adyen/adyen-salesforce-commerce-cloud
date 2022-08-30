"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var store = require('../../../../store');

function assignPaymentMethodValue() {
  var adyenPaymentMethod = document.querySelector('#adyenPaymentMethodName'); // if currently selected paymentMethod contains a brand it will be part of the label ID

  var paymentMethodlabelId = store.brand ? "#lb_".concat(store.selectedMethod, "_").concat(store.brand) : "#lb_".concat(store.selectedMethod);

  if (adyenPaymentMethod) {
    adyenPaymentMethod.value = document.querySelector(paymentMethodlabelId).innerHTML;
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


function paymentFromComponent(data) {
  var component = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var requestData = store.splitPaymentsOrderObj ? _objectSpread(_objectSpread({}, data), {}, {
    splitPaymentsOrder: store.splitPaymentsOrderObj
  }) : data;
  $.ajax({
    url: window.paymentFromComponentURL,
    type: 'post',
    data: {
      data: JSON.stringify(requestData),
      paymentMethod: document.querySelector('#adyenPaymentMethodName').value
    },
    success: function success(response) {
      var _response$fullRespons;

      setOrderFormData(response);

      if ((_response$fullRespons = response.fullResponse) !== null && _response$fullRespons !== void 0 && _response$fullRespons.action) {
        component.handleAction(response.fullResponse.action);
      }

      if (response.paymentError || response.error) {
        component.handleError();
      }
    }
  });
}

function makePartialPayment(data) {
  $.ajax({
    url: 'Adyen-partialPayment',
    type: 'POST',
    data: JSON.stringify(data),
    contentType: 'application/json; charset=utf-8',
    async: false,
    success: function success(response) {
      var splitPaymentsOrder = {
        pspReference: response.order.pspReference,
        orderData: response.order.orderData
      };
      store.splitPaymentsOrderObj = {
        splitPaymentsOrder: splitPaymentsOrder
      };
      store.splitPaymentsOrderObj.remainingAmount = response.remainingAmountFormatted;
      setOrderFormData(response);
    }
  }).fail(function () {});
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
  var _document$querySelect;

  // If 'type' input field is present use this as type, otherwise default to function input param
  store.selectedMethod = document.querySelector("#component_".concat(type, " .type")) ? document.querySelector("#component_".concat(type, " .type")).value : type;
  resetPaymentMethod();
  document.querySelector('button[value="submit-payment"]').disabled = ['paypal', 'paywithgoogle', 'googlepay', 'amazonpay'].indexOf(type) > -1;
  document.querySelector("#component_".concat(type)).setAttribute('style', 'display:block'); // set brand for giftcards if hidden inputfield is present

  store.brand = (_document$querySelect = document.querySelector("#component_".concat(type, " .brand"))) === null || _document$querySelect === void 0 ? void 0 : _document$querySelect.value;
}

function displayValidationErrors() {
  store.selectedPayment.node.showValidation();
  return false;
}

var selectedMethods = {};

function doCustomValidation() {
  return store.selectedMethod in selectedMethods ? selectedMethods[store.selectedMethod]() : true;
}

function showValidation() {
  return store.selectedPaymentIsValid ? doCustomValidation() : displayValidationErrors();
}

function getInstallmentValues(maxValue) {
  var values = [];

  for (var i = 1; i <= maxValue; i += 1) {
    values.push(i);
  }

  return values;
}

function createShowConfirmationForm(action) {
  if (document.querySelector('#showConfirmationForm')) {
    return;
  }

  var template = document.createElement('template');
  var form = "<form method=\"post\" id=\"showConfirmationForm\" name=\"showConfirmationForm\" action=\"".concat(action, "\">\n    <input type=\"hidden\" id=\"additionalDetailsHidden\" name=\"additionalDetailsHidden\" value=\"null\"/>\n    <input type=\"hidden\" id=\"merchantReference\" name=\"merchantReference\"/>\n    <input type=\"hidden\" id=\"orderToken\" name=\"orderToken\"/>\n    <input type=\"hidden\" id=\"result\" name=\"result\" value=\"null\"/>\n  </form>");
  template.innerHTML = form;
  document.querySelector('body').appendChild(template.content);
}

module.exports = {
  setOrderFormData: setOrderFormData,
  assignPaymentMethodValue: assignPaymentMethodValue,
  paymentFromComponent: paymentFromComponent,
  resetPaymentMethod: resetPaymentMethod,
  displaySelectedMethod: displaySelectedMethod,
  showValidation: showValidation,
  createShowConfirmationForm: createShowConfirmationForm,
  getInstallmentValues: getInstallmentValues,
  makePartialPayment: makePartialPayment
};