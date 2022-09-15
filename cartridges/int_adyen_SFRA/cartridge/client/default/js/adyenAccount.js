"use strict";

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _require = require('./commons/index'),
    onFieldValid = _require.onFieldValid,
    onBrand = _require.onBrand,
    createSession = _require.createSession;

var store = require('../../../store');

var checkout;
var card; // Store configuration

store.checkoutConfiguration.amount = {
  value: 0,
  currency: 'EUR'
};
store.checkoutConfiguration.paymentMethodsConfiguration = {
  card: {
    enableStoreDetails: false,
    hasHolderName: true,
    holderNameRequired: true,
    installments: [],
    onBrand: onBrand,
    onFieldValid: onFieldValid,
    onChange: function onChange(state) {
      store.isValid = state.isValid;
      store.componentState = state;
    }
  }
}; // Handle Payment action

function handleAction(action) {
  checkout.createFromAction(action).mount('#action-container');
  $('#action-modal').modal({
    backdrop: 'static',
    keyboard: false
  });
} // confirm onAdditionalDetails event and paymentsDetails response


store.checkoutConfiguration.onAdditionalDetails = function (state) {
  $.ajax({
    type: 'POST',
    url: 'Adyen-PaymentsDetails',
    data: JSON.stringify({
      data: state.data
    }),
    contentType: 'application/json; charset=utf-8',
    async: false,
    success: function success(data) {
      if (data.isSuccessful) {
        window.location.href = window.redirectUrl;
      } else if (!data.isFinal && _typeof(data.action) === 'object') {
        handleAction(data.action);
      } else {
        $('#action-modal').modal('hide');
        document.getElementById('cardError').style.display = 'block';
      }
    }
  });
};

function initializeCardComponent() {
  return _initializeCardComponent.apply(this, arguments);
}

function _initializeCardComponent() {
  _initializeCardComponent = _asyncToGenerator( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
    var session, cardNode;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return createSession();

          case 2:
            session = _context.sent;
            store.checkoutConfiguration.session = {
              id: session.id,
              sessionData: session.sessionData
            };
            cardNode = document.getElementById('card');
            _context.next = 7;
            return AdyenCheckout(store.checkoutConfiguration);

          case 7:
            checkout = _context.sent;
            card = checkout.create('card').mount(cardNode);

          case 9:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _initializeCardComponent.apply(this, arguments);
}

var formErrorsExist = false;

function submitAddCard() {
  var form = $(document.getElementById('payment-form'));
  $.ajax({
    type: 'POST',
    url: form.attr('action'),
    data: form.serialize(),
    async: false,
    success: function success(data) {
      if (data.redirectAction) {
        handleAction(data.redirectAction);
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.error) {
        formErrorsExist = true;
      }
    }
  });
}

initializeCardComponent(); // Add Payment Button event handler

$('button[value="add-new-payment"]').on('click', function (event) {
  if (store.isValid) {
    document.querySelector('#adyenStateData').value = JSON.stringify(store.componentState.data);
    submitAddCard();

    if (formErrorsExist) {
      return;
    }

    event.preventDefault();
  } else {
    var _card;

    (_card = card) === null || _card === void 0 ? void 0 : _card.showValidation();
  }
});