"use strict";

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

if (window.amazonCheckoutSessionId) {
  var handleAuthorised = function handleAuthorised(response) {
    document.querySelector('#result').value = JSON.stringify({
      pspReference: response.fullResponse.pspReference,
      resultCode: response.fullResponse.resultCode,
      paymentMethod: response.fullResponse.paymentMethod ? response.fullResponse.paymentMethod : response.fullResponse.additionalData.paymentMethod
    });
    document.querySelector('#paymentFromComponentStateData').value = JSON.stringify(response);
    document.querySelector('#showConfirmationForm').submit();
  };

  var handleError = function handleError() {
    document.querySelector('#result').value = JSON.stringify({
      error: true
    });
    document.querySelector('#paymentFromComponentStateData').value = JSON.stringify({
      error: true
    });
    document.querySelector('#showConfirmationForm').submit();
  };

  var handleAmazonResponse = function handleAmazonResponse(response, component) {
    if (response.fullResponse && response.fullResponse.action) {
      component.handleAction(response.fullResponse.action);
    } else if (response.resultCode === window.resultCodeAuthorised) {
      handleAuthorised(response);
    } else {
      // first try the amazon decline flow
      component.handleDeclineFlow(); // if this does not trigger a redirect, try the regular handleError flow

      handleError();
    }
  };

  var paymentFromComponent = function paymentFromComponent(data, component) {
    $.ajax({
      url: window.paymentFromComponentURL,
      type: 'post',
      contentType: 'application/; charset=utf-8',
      data: JSON.stringify(data),
      success: function success(response) {
        if (response.result && response.result.orderNo && response.result.orderToken) {
          document.querySelector('#orderToken').value = response.result.orderToken;
          document.querySelector('#merchantReference').value = response.result.orderNo;
        }

        handleAmazonResponse(response.result, component);
      }
    });
  };

  var mountAmazonPayComponent = /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
      var checkout, amazonPayComponent;
      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return AdyenCheckout(window.Configuration);

            case 2:
              checkout = _context.sent;
              amazonPayComponent = checkout.create('amazonpay', amazonConfig).mount(amazonPayNode);
              amazonPayComponent.submit();

            case 5:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function mountAmazonPayComponent() {
      return _ref.apply(this, arguments);
    };
  }();

  window.sessionsResponse = null;
  var amazonPayNode = document.getElementById('amazonContainerSG');
  var amazonConfig = {
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
      paymentFromComponent(state.data, component);
    },
    onAdditionalDetails: function onAdditionalDetails(state) {
      state.data.paymentMethod = 'amazonpay';
      $.ajax({
        type: 'post',
        url: window.paymentsDetailsURL,
        data: JSON.stringify({
          data: state.data,
          orderToken: document.querySelector('#orderToken').value
        }),
        contentType: 'application/; charset=utf-8',
        success: function success(data) {
          if (data.response.isSuccessful) {
            handleAuthorised(data.response);
          } else if (!data.response.isFinal && _typeof(data.response.action) === 'object') {
            checkout.createFromAction(data.action).mount('#amazonContainerSG');
          } else {
            handleError();
          }
        }
      });
    }
  };
  mountAmazonPayComponent();
}