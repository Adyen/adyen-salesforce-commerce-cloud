"use strict";

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var helpers = require('./helpers');

var _require = require('../commons'),
    onBrand = _require.onBrand,
    onFieldValid = _require.onFieldValid;

var _require2 = require('./renderPaymentMethod'),
    renderPaymentMethod = _require2.renderPaymentMethod;

var store = require('../../../../store');

function getCardConfig() {
  return {
    enableStoreDetails: window.showStoreDetails,
    showBrandsUnderCardNumber: false,
    onChange: function onChange(state) {
      store.isValid = state.isValid;
      var method = state.data.paymentMethod.storedPaymentMethodId ? "storedCard".concat(state.data.paymentMethod.storedPaymentMethodId) : store.selectedMethod;
      store.updateSelectedPayment(method, 'isValid', store.isValid);
      store.updateSelectedPayment(method, 'stateData', state.data);
    },
    onFieldValid: onFieldValid,
    onBrand: onBrand
  };
}

function getPaypalConfig() {
  store.paypalTerminatedEarly = false;
  return {
    showPayButton: true,
    environment: window.Configuration.environment,
    onSubmit: function onSubmit(state, component) {
      helpers.assignPaymentMethodValue();
      document.querySelector('#adyenStateData').value = JSON.stringify(store.selectedPayment.stateData);
      helpers.paymentFromComponent(state.data, component);
    },
    onCancel: function onCancel(data, component) {
      store.paypalTerminatedEarly = false;
      helpers.paymentFromComponent({
        cancelTransaction: true,
        merchantReference: document.querySelector('#merchantReference').value,
        orderToken: document.querySelector('#orderToken').value
      }, component);
    },
    onError: function onError(error, component) {
      store.paypalTerminatedEarly = false;

      if (component) {
        component.setStatus('ready');
      }

      document.querySelector('#showConfirmationForm').submit();
    },
    onAdditionalDetails: function onAdditionalDetails(state) {
      store.paypalTerminatedEarly = false;
      document.querySelector('#additionalDetailsHidden').value = JSON.stringify(state.data);
      document.querySelector('#showConfirmationForm').submit();
    },
    onClick: function onClick(data, actions) {
      if (store.paypalTerminatedEarly) {
        helpers.paymentFromComponent({
          cancelTransaction: true,
          merchantReference: document.querySelector('#merchantReference').value
        });
        store.paypalTerminatedEarly = false;
        return actions.resolve();
      }

      store.paypalTerminatedEarly = true;
      $('#dwfrm_billing').trigger('submit');

      if (store.formErrorsExist) {
        return actions.reject();
      }

      return null;
    }
  };
}

function getGooglePayConfig() {
  return {
    environment: window.Configuration.environment,
    onSubmit: function onSubmit() {
      helpers.assignPaymentMethodValue();
      document.querySelector('button[value="submit-payment"]').disabled = false;
      document.querySelector('button[value="submit-payment"]').click();
    },
    configuration: {
      gatewayMerchantId: window.merchantAccount
    },
    showPayButton: true,
    buttonColor: 'white'
  };
}

function getGiftCardConfig() {
  var giftcardBalance;
  return {
    showPayButton: true,
    onBalanceCheck: function onBalanceCheck(resolve, reject, requestData) {
      $.ajax({
        type: 'POST',
        url: 'Adyen-CheckBalance',
        data: JSON.stringify(requestData),
        contentType: 'application/json; charset=utf-8',
        async: false,
        success: function success(data) {
          giftcardBalance = data.balance;

          if (data.resultCode === 'Success') {
            resolve(data);
          } else if (data.resultCode === 'NotEnoughBalance') {
            resolve(data);
          } else {
            reject();
          }
        },
        fail: function fail() {
          reject();
        }
      });
    },
    onOrderRequest: function onOrderRequest(resolve, reject, requestData) {
      // Make a POST /orders request
      // Create an order for the total transaction amount
      var giftCardData = requestData.paymentMethod;
      $.ajax({
        type: 'POST',
        url: 'Adyen-SplitPayments',
        data: JSON.stringify(requestData),
        contentType: 'application/json; charset=utf-8',
        async: false,
        success: function success(data) {
          if (data.resultCode === 'Success') {
            // make payments call including giftcard data and order data
            var partialPaymentRequest = {
              paymentMethod: giftCardData,
              amount: giftcardBalance,
              splitPaymentsOrder: {
                pspReference: data.pspReference,
                orderData: data.orderData
              }
            };
            helpers.makePartialPayment(partialPaymentRequest);
            showRemainingAmount();
          }
        }
      });
    },
    onSubmit: function onSubmit() {
      $('#giftcard-modal').modal('hide');
      store.selectedMethod = 'giftcard';
      document.querySelector('input[name="brandCode"]').checked = false;
      document.querySelector('button[value="submit-payment"]').click();
    }
  };
}

function removeGiftCard() {
  $.ajax({
    type: 'POST',
    url: 'Adyen-CancelPartialPaymentOrder',
    data: JSON.stringify(store.splitPaymentsOrderObj),
    contentType: 'application/json; charset=utf-8',
    async: false,
    success: function success(res) {
      store.splitPaymentsOrderObj = null;

      if (res.resultCode === 'Received') {
        document.querySelector('#cancelGiftCardContainer').parentNode.remove();
        document.querySelector('#giftCardLabel').classList.remove('invisible'); // re render gift card component

        store.componentsObj.giftcard.node.unmount('component_giftcard');
        delete store.componentsObj.giftcard;
        document.querySelector('#component_giftcard').remove();
        renderPaymentMethod({
          type: 'giftcard'
        }, false, store.checkoutConfiguration.session.imagePath, null, true);
        document.querySelector('#component_giftcard').style.display = 'block';
      }
    }
  });
}

function showRemainingAmount() {
  $('#giftcard-modal').modal('hide');
  document.querySelector('#giftCardLabel').classList.add('invisible');
  var remainingAmountContainer = document.createElement('div');
  var remainingAmountStart = document.createElement('div');
  var remainingAmountEnd = document.createElement('div');
  var cancelGiftCard = document.createElement('div');
  var remainingAmountStartP = document.createElement('p');
  var remainingAmountEndP = document.createElement('p');
  var cancelGiftCardP = document.createElement('p');
  var remainingAmountStartSpan = document.createElement('span');
  var cancelGiftCardSpan = document.createElement('span');
  var remainingAmountEndSpan = document.createElement('span');
  remainingAmountContainer.classList.add('row', 'grand-total', 'leading-lines');
  remainingAmountStart.classList.add('col-6', 'start-lines');
  remainingAmountEnd.classList.add('col-6', 'end-lines');
  remainingAmountStartP.classList.add('order-receipt-label');
  cancelGiftCardP.classList.add('order-receipt-label');
  remainingAmountEndP.classList.add('text-right');
  remainingAmountEndSpan.classList.add('grand-total-sum');
  cancelGiftCard.id = 'cancelGiftCardContainer';
  remainingAmountStartSpan.innerText = 'Remaining Amount'; // todo: use localisation

  cancelGiftCardSpan.innerText = 'cancel giftcard?'; // todo: use localisation

  remainingAmountEndSpan.innerText = store.splitPaymentsOrderObj.remainingAmount;
  cancelGiftCard.addEventListener('click', removeGiftCard);
  remainingAmountContainer.appendChild(remainingAmountStart);
  remainingAmountContainer.appendChild(remainingAmountEnd);
  remainingAmountContainer.appendChild(cancelGiftCard);
  remainingAmountStart.appendChild(remainingAmountStartP);
  cancelGiftCard.appendChild(cancelGiftCardP);
  remainingAmountEnd.appendChild(remainingAmountEndP);
  remainingAmountStartP.appendChild(remainingAmountStartSpan);
  cancelGiftCardP.appendChild(cancelGiftCardSpan);
  remainingAmountEndP.appendChild(remainingAmountEndSpan);
  var pricingContainer = document.querySelector('.card-body.order-total-summary');
  pricingContainer.appendChild(remainingAmountContainer);
}

function handleOnChange(state) {
  var type = state.data.paymentMethod.type;

  if (store.selectedMethod === 'googlepay' && type === 'paywithgoogle') {
    type = 'googlepay';
  }

  store.isValid = state.isValid;

  if (!store.componentsObj[type]) {
    store.componentsObj[type] = {};
  }

  store.componentsObj[type].isValid = store.isValid;
  store.componentsObj[type].stateData = state.data;
}

var actionHandler = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regenerator["default"].mark(function _callee(action) {
    var checkout;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return AdyenCheckout(store.checkoutConfiguration);

          case 2:
            checkout = _context.sent;
            checkout.createFromAction(action).mount('#action-container');
            $('#action-modal').modal({
              backdrop: 'static',
              keyboard: false
            });

          case 5:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function actionHandler(_x) {
    return _ref.apply(this, arguments);
  };
}();

function handleOnAdditionalDetails(state) {
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
      if (!data.isFinal && _typeof(data.action) === 'object') {
        actionHandler(data.action);
      } else {
        window.location.href = data.redirectUrl;
      }
    }
  });
}

function getAmazonpayConfig() {
  return {
    showPayButton: true,
    productType: 'PayAndShip',
    checkoutMode: 'ProcessOrder',
    locale: window.Configuration.locale,
    returnUrl: window.returnURL,
    onClick: function onClick(resolve, reject) {
      $('#dwfrm_billing').trigger('submit');

      if (store.formErrorsExist) {
        reject();
      } else {
        helpers.assignPaymentMethodValue();
        resolve();
      }
    },
    onError: function onError() {}
  };
}

function setCheckoutConfiguration() {
  store.checkoutConfiguration.onChange = handleOnChange;
  store.checkoutConfiguration.onAdditionalDetails = handleOnAdditionalDetails;
  store.checkoutConfiguration.showPayButton = false;
  store.checkoutConfiguration.clientKey = window.adyenClientKey;
  store.checkoutConfiguration.paymentMethodsConfiguration = {
    card: getCardConfig(),
    storedCard: getCardConfig(),
    boletobancario: {
      personalDetailsRequired: true,
      // turn personalDetails section on/off
      billingAddressRequired: false,
      // turn billingAddress section on/off
      showEmailAddress: false // allow shopper to specify their email address

    },
    paywithgoogle: getGooglePayConfig(),
    googlepay: getGooglePayConfig(),
    paypal: getPaypalConfig(),
    amazonpay: getAmazonpayConfig(),
    giftcard: getGiftCardConfig()
  };
}

module.exports = {
  getCardConfig: getCardConfig,
  getPaypalConfig: getPaypalConfig,
  getGooglePayConfig: getGooglePayConfig,
  getGiftCardConfig: getGiftCardConfig,
  setCheckoutConfiguration: setCheckoutConfiguration,
  actionHandler: actionHandler
};