"use strict";

var _excluded = ["giftCards"];
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var store = require('../../../../store');
function assignPaymentMethodValue() {
  var adyenPaymentMethod = document.querySelector('#adyenPaymentMethodName');
  // if currently selected paymentMethod contains a brand it will be part of the label ID
  var paymentMethodlabelId = "#lb_".concat(store.selectedMethod);
  if (adyenPaymentMethod) {
    var _document$querySelect;
    adyenPaymentMethod.value = store.brand ? store.brand : (_document$querySelect = document.querySelector(paymentMethodlabelId)) === null || _document$querySelect === void 0 ? void 0 : _document$querySelect.innerHTML;
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
  var requestData = store.partialPaymentsOrderObj ? _objectSpread(_objectSpread({}, data), {}, {
    partialPaymentsOrder: store.partialPaymentsOrderObj
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
      } else if (response.isApplePay) {
        document.querySelector('#result').value = JSON.stringify(response);
        document.querySelector('#showConfirmationForm').submit();
      } else if (response.paymentError || response.error) {
        component.handleError();
      }
    }
  });
}
function makePartialPayment(requestData) {
  var error;
  $.ajax({
    url: 'Adyen-partialPayment',
    type: 'POST',
    data: JSON.stringify(requestData),
    contentType: 'application/json; charset=utf-8',
    async: false,
    success: function success(response) {
      if (response.error) {
        error = {
          error: true
        };
      } else {
        var giftCards = response.giftCards,
          rest = _objectWithoutProperties(response, _excluded);
        store.checkout.options.amount = rest.remainingAmount;
        store.partialPaymentsOrderObj = rest;
        store.addedGiftCards = giftCards;
        setOrderFormData(response);
      }
    }
  }).fail(function () {});
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
  var _document$querySelect2;
  // If 'type' input field is present use this as type, otherwise default to function input param
  store.selectedMethod = document.querySelector("#component_".concat(type, " .type")) ? document.querySelector("#component_".concat(type, " .type")).value : type;
  resetPaymentMethod();
  document.querySelector('button[value="submit-payment"]').disabled = ['paypal', 'paywithgoogle', 'googlepay', 'amazonpay', 'applepay'].indexOf(type) > -1;
  document.querySelector("#component_".concat(type)).setAttribute('style', 'display:block');
  // set brand for giftcards if hidden inputfield is present
  store.brand = (_document$querySelect2 = document.querySelector("#component_".concat(type, " .brand"))) === null || _document$querySelect2 === void 0 ? void 0 : _document$querySelect2.value;
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