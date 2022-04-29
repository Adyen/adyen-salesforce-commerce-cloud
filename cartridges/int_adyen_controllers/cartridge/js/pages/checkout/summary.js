"use strict";

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// This script is executed only on the checkout summary page
if ((window.location.pathname.includes('COBilling-Billing') || window.location.pathname.includes('Adyen-ShowConfirmation')) && window.isAdyenPayment) {
  var handleAction = /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regenerator["default"].mark(function _callee(action) {
      var checkout, actionContainer;
      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              window.Configuration.onAdditionalDetails = onAdditionalDetails;
              _context.next = 3;
              return AdyenCheckout(window.Configuration);

            case 3:
              checkout = _context.sent;
              actionContainer = document.getElementById('action-container');
              checkout.createFromAction(action).mount(actionContainer);

            case 6:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function handleAction(_x) {
      return _ref.apply(this, arguments);
    };
  }(); // onAdditionalDetails event handler to be included in Adyen Component configuration


  // serializes form data and submits to place order. Then proceeds to handle the result
  var placeOrder = function placeOrder(formId) {
    var form = $('#' + formId);
    $.ajax({
      method: 'POST',
      url: window.summarySubmitUrl,
      data: $(form).serialize(),
      success: function success(data) {
        if (data.action) {
          window.orderToken = data.orderToken;
          document.getElementById('action-modal-SG').style.display = "block";
          handleAction(data.action);
        } else {
          window.location.href = data.continueUrl;
        }
      },
      error: function error(err) {}
    });
  };

  var onAdditionalDetails = function onAdditionalDetails(state) {
    $.ajax({
      type: 'POST',
      url: 'Adyen-PaymentsDetails',
      data: JSON.stringify({
        data: state.data,
        orderToken: window.orderToken
      }),
      contentType: 'application/json; charset=utf-8',
      async: false,
      success: function success(data) {
        if (!data.response.isFinal && _typeof(data.response.action) === 'object') {
          handleAction(data.action);
        } else {
          window.location.href = data.response.redirectUrl;
        }
      }
    });
  };

  window.addEventListener("load", function () {
    // Override default submit form behavior
    var formId = 'submit-order-form';
    var form = document.getElementById(formId);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      placeOrder(formId);
    });
  });
}