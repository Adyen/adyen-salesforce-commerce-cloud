"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var store = require('../../../../store');
var constants = require('../constants');
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
      csrf_token: $('#adyen-token').val(),
      data: JSON.stringify(requestData),
      paymentMethod: document.querySelector('#adyenPaymentMethodName').value
    },
    success: function success(response) {
      var _response$fullRespons;
      setOrderFormData(response);
      if ((_response$fullRespons = response.fullResponse) !== null && _response$fullRespons !== void 0 && _response$fullRespons.action) {
        component.handleAction(response.fullResponse.action);
      } else if (response.skipSummaryPage) {
        document.querySelector('#result').value = JSON.stringify(response);
        document.querySelector('#showConfirmationForm').submit();
      } else if (response.paymentError || response.error) {
        component.handleError();
      }
    }
  });
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
  var disabledSubmitButtonMethods = constants.DISABLED_SUBMIT_BUTTON_METHODS;
  if (window.klarnaWidgetEnabled) {
    disabledSubmitButtonMethods.push('klarna');
  }
  document.querySelector('button[value="submit-payment"]').disabled = disabledSubmitButtonMethods.findIndex(function (pm) {
    return type.includes(pm);
  }) > -1;
  document.querySelector("#component_".concat(type)).setAttribute('style', 'display:block');
  // set brand for giftcards if hidden inputfield is present
  store.brand = (_document$querySelect2 = document.querySelector("#component_".concat(type, " .brand"))) === null || _document$querySelect2 === void 0 ? void 0 : _document$querySelect2.value;
}
function displayValidationErrors() {
  var _store$selectedMethod;
  if ((_store$selectedMethod = store.selectedMethod) !== null && _store$selectedMethod !== void 0 && _store$selectedMethod.node) {
    store.selectedPayment.node.showValidation();
  }
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
  getInstallmentValues: getInstallmentValues
};