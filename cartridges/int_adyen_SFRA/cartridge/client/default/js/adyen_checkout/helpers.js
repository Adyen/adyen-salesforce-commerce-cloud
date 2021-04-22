"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var store = require('../../../../store');

var _require = require('./qrCodeMethods'),
    qrCodeMethods = _require.qrCodeMethods;

function assignPaymentMethodValue() {
  var adyenPaymentMethod = document.querySelector('#adyenPaymentMethodName');
  adyenPaymentMethod.value = document.querySelector("#lb_".concat(store.selectedMethod)).innerHTML;
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
      paymentMethod: document.querySelector('#adyenPaymentMethodName').value
    },
    success: function success(response) {
      var _response$fullRespons;

      if (response.orderNo) {
        document.querySelector('#merchantReference').value = response.orderNo;
      }

      if ((_response$fullRespons = response.fullResponse) !== null && _response$fullRespons !== void 0 && _response$fullRespons.action) {
        component.handleAction(response.fullResponse.action);
      }
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
  store.selectedMethod = type;
  resetPaymentMethod();
  document.querySelector('button[value="submit-payment"]').disabled = ['paypal', 'paywithgoogle', 'mbway'].concat(_toConsumableArray(qrCodeMethods)).indexOf(type) > -1;
  document.querySelector("#component_".concat(type)).setAttribute('style', 'display:block');
}

function showInputError(input) {
  input.classList.add('adyen-checkout__input--error');
}

function validateAch() {
  var inputs = document.querySelectorAll('#component_ach > input');
  var filteredInputs = Object.values(inputs).filter(function (_ref) {
    var value = _ref.value;
    return !(value !== null && value !== void 0 && value.length);
  });
  filteredInputs.forEach(showInputError);
  return !filteredInputs.length;
}

function validateRatepay() {
  var _input$value;

  var input = document.querySelector('#dateOfBirthInput');
  var inputIsFilled = (_input$value = input.value) === null || _input$value === void 0 ? void 0 : _input$value.length;

  if (!inputIsFilled) {
    showInputError(input);
  }

  return !!inputIsFilled;
}

function displayValidationErrors() {
  store.selectedPayment.node.showValidation();
  return false;
}

var selectedMethods = {
  ach: validateAch,
  ratepay: validateRatepay
};

function doCustomValidation() {
  return store.selectedMethod in selectedMethods ? selectedMethods[store.selectedMethod]() : true;
}

function showValidation() {
  return store.selectedPaymentIsValid ? doCustomValidation() : displayValidationErrors();
}

module.exports = {
  assignPaymentMethodValue: assignPaymentMethodValue,
  paymentFromComponent: paymentFromComponent,
  resetPaymentMethod: resetPaymentMethod,
  displaySelectedMethod: displaySelectedMethod,
  showValidation: showValidation
};