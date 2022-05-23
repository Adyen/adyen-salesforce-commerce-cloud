"use strict";

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var store = require('../../../store');

var helpers = require('./adyen_checkout/helpers');

function handleAuthorised(response) {
  var _response$fullRespons, _response$fullRespons2, _response$fullRespons3, _response$fullRespons4, _response$fullRespons5;

  document.querySelector('#result').value = JSON.stringify({
    pspReference: (_response$fullRespons = response.fullResponse) === null || _response$fullRespons === void 0 ? void 0 : _response$fullRespons.pspReference,
    resultCode: (_response$fullRespons2 = response.fullResponse) === null || _response$fullRespons2 === void 0 ? void 0 : _response$fullRespons2.resultCode,
    paymentMethod: (_response$fullRespons3 = response.fullResponse) !== null && _response$fullRespons3 !== void 0 && _response$fullRespons3.paymentMethod ? response.fullResponse.paymentMethod : (_response$fullRespons4 = response.fullResponse) === null || _response$fullRespons4 === void 0 ? void 0 : (_response$fullRespons5 = _response$fullRespons4.additionalData) === null || _response$fullRespons5 === void 0 ? void 0 : _response$fullRespons5.paymentMethod
  });
  document.querySelector('#showConfirmationForm').submit();
}

function handleError() {
  document.querySelector('#result').value = JSON.stringify({
    error: true
  });
  document.querySelector('#showConfirmationForm').submit();
}

function handleAmazonResponse(response, component) {
  var _response$fullRespons6;

  if ((_response$fullRespons6 = response.fullResponse) !== null && _response$fullRespons6 !== void 0 && _response$fullRespons6.action) {
    component.handleAction(response.fullResponse.action);
  } else if (response.resultCode === window.resultCodeAuthorised) {
    handleAuthorised(response);
  } else {
    // first try the amazon decline flow
    component.handleDeclineFlow(); // if this does not trigger a redirect, try the regular handleError flow

    handleError();
  }
}

function paymentFromComponent(data, component) {
  $.ajax({
    url: window.paymentFromComponentURL,
    type: 'post',
    data: {
      data: JSON.stringify(data),
      paymentMethod: 'amazonpay',
      merchantReference: document.querySelector('#merchantReference').value,
      orderToken: document.querySelector('#orderToken').value
    },
    success: function success(response) {
      helpers.setOrderFormData(response);
      handleAmazonResponse(response, component);
    }
  });
}

function mountAmazonPayComponent() {
  return _mountAmazonPayComponent.apply(this, arguments);
}

function _mountAmazonPayComponent() {
  _mountAmazonPayComponent = _asyncToGenerator( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
    var amazonPayNode, checkout, amazonConfig, amazonPayComponent;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            amazonPayNode = document.getElementById('amazon-container');
            _context.next = 3;
            return AdyenCheckout(window.Configuration);

          case 3:
            checkout = _context.sent;
            amazonConfig = {
              showOrderButton: false,
              returnUrl: window.returnURL,
              configuration: {
                merchantId: window.amazonMerchantID,
                storeId: window.amazonStoreID,
                publicKeyId: window.amazonPublicKeyID
              },
              amazonCheckoutSessionId: window.amazonCheckoutSessionId,
              onSubmit: function onSubmit(state, component) {
                document.querySelector('#adyenStateData').value = JSON.stringify(state.data);
                document.querySelector('#additionalDetailsHidden').value = JSON.stringify(state.data);
                paymentFromComponent(state.data, component);
              },
              onAdditionalDetails: function onAdditionalDetails(state) {
                state.data.paymentMethod = 'amazonpay';
                $.ajax({
                  type: 'post',
                  url: window.paymentsDetailsURL,
                  data: JSON.stringify({
                    data: state.data,
                    orderToken: window.orderToken
                  }),
                  contentType: 'application/json; charset=utf-8',
                  success: function success(data) {
                    if (data.isSuccessful) {
                      handleAuthorised(data);
                    } else if (!data.isFinal && _typeof(data.action) === 'object') {
                      checkout.createFromAction(data.action).mount('#amazon-container');
                    } else {
                      $('#action-modal').modal('hide');
                      handleError();
                    }
                  }
                });
              }
            };
            amazonPayComponent = checkout.create('amazonpay', amazonConfig).mount(amazonPayNode);
            helpers.createShowConfirmationForm(window.ShowConfirmationPaymentFromComponent);
            $('#dwfrm_billing').submit(function apiRequest(e) {
              e.preventDefault();
              var form = $(this);
              var url = form.attr('action');
              $.ajax({
                type: 'POST',
                url: url,
                data: form.serialize(),
                async: false,
                success: function success(data) {
                  store.formErrorsExist = 'fieldErrors' in data;
                }
              });
            });
            $('#action-modal').modal({
              backdrop: 'static',
              keyboard: false
            });
            amazonPayComponent.submit();

          case 10:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _mountAmazonPayComponent.apply(this, arguments);
}

mountAmazonPayComponent();