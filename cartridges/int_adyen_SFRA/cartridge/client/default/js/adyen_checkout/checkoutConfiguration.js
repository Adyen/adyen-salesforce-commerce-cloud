"use strict";

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
var helpers = require('./helpers');
var _require = require('../commons'),
  onBrand = _require.onBrand,
  onFieldValid = _require.onFieldValid;
var store = require('../../../../store');
var constants = require('../constants');
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
function removeGiftCard() {
  $.ajax({
    type: 'POST',
    url: 'Adyen-CancelPartialPaymentOrder',
    data: JSON.stringify(store.partialPaymentsOrderObj),
    contentType: 'application/json; charset=utf-8',
    async: false,
    success: function success(res) {
      store.partialPaymentsOrderObj = null;
      document.querySelector('#adyenPartialPaymentsOrder').value = null;
      if (res.resultCode === constants.RECEIVED) {
        document.querySelector('#cancelGiftCardContainer').parentNode.remove();
        document.querySelector('#giftCardLabel').classList.remove('invisible');
        store.componentsObj.giftcard.node.unmount('component_giftcard');
      }
    }
  });
}
function createElementsToShowRemainingGiftCardAmount() {
  var mainContainer = document.createElement('div');
  var remainingAmountContainer = document.createElement('div');
  var remainingAmountStart = document.createElement('div');
  var remainingAmountEnd = document.createElement('div');
  var discountedAmountContainer = document.createElement('div');
  var discountedAmountStart = document.createElement('div');
  var discountedAmountEnd = document.createElement('div');
  var cancelGiftCard = document.createElement('a');
  var remainingAmountStartP = document.createElement('p');
  var remainingAmountEndP = document.createElement('p');
  var discountedAmountStartP = document.createElement('p');
  var discountedAmountEndP = document.createElement('p');
  var cancelGiftCardP = document.createElement('p');
  var remainingAmountStartSpan = document.createElement('span');
  var discountedAmountStartSpan = document.createElement('span');
  var cancelGiftCardSpan = document.createElement('span');
  var remainingAmountEndSpan = document.createElement('span');
  var discountedAmountEndSpan = document.createElement('span');
  remainingAmountContainer.classList.add('row', 'grand-total', 'leading-lines');
  remainingAmountStart.classList.add('col-6', 'start-lines');
  remainingAmountEnd.classList.add('col-6', 'end-lines');
  remainingAmountStartP.classList.add('order-receipt-label');
  discountedAmountContainer.classList.add('row', 'grand-total', 'leading-lines');
  discountedAmountStart.classList.add('col-6', 'start-lines');
  discountedAmountEnd.classList.add('col-6', 'end-lines');
  discountedAmountStartP.classList.add('order-receipt-label');
  cancelGiftCardP.classList.add('order-receipt-label');
  remainingAmountEndP.classList.add('text-right');
  discountedAmountEndP.classList.add('text-right');
  cancelGiftCard.id = 'cancelGiftCardContainer';
  cancelGiftCard.role = 'button';
  discountedAmountContainer.id = 'discountedAmountContainer';
  remainingAmountContainer.id = 'remainingAmountContainer';
  remainingAmountStartSpan.innerText = window.remainingAmountGiftCardResource;
  discountedAmountStartSpan.innerText = window.discountedAmountGiftCardResource;
  cancelGiftCardSpan.innerText = window.cancelGiftCardResource;
  remainingAmountEndSpan.innerText = store.partialPaymentsOrderObj.remainingAmount;
  discountedAmountEndSpan.innerText = store.partialPaymentsOrderObj.discountedAmount;
  cancelGiftCard.addEventListener('click', removeGiftCard);
  remainingAmountContainer.appendChild(remainingAmountStart);
  remainingAmountContainer.appendChild(remainingAmountEnd);
  remainingAmountContainer.appendChild(cancelGiftCard);
  remainingAmountStart.appendChild(remainingAmountStartP);
  discountedAmountContainer.appendChild(discountedAmountStart);
  discountedAmountContainer.appendChild(discountedAmountEnd);
  discountedAmountStart.appendChild(discountedAmountStartP);
  cancelGiftCard.appendChild(cancelGiftCardP);
  remainingAmountEnd.appendChild(remainingAmountEndP);
  remainingAmountStartP.appendChild(remainingAmountStartSpan);
  discountedAmountEnd.appendChild(discountedAmountEndP);
  discountedAmountStartP.appendChild(discountedAmountStartSpan);
  cancelGiftCardP.appendChild(cancelGiftCardSpan);
  remainingAmountEndP.appendChild(remainingAmountEndSpan);
  discountedAmountEndP.appendChild(discountedAmountEndSpan);
  var pricingContainer = document.querySelector('.card-body.order-total-summary');
  mainContainer.appendChild(discountedAmountContainer);
  mainContainer.appendChild(remainingAmountContainer);
  mainContainer.appendChild(cancelGiftCard);
  pricingContainer.appendChild(mainContainer);
}
function showRemainingAmount() {
  $('#giftcard-modal').modal('hide');
  document.querySelector('#giftCardLabel').classList.add('invisible');
  createElementsToShowRemainingGiftCardAmount();
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
          if (data.resultCode === constants.SUCCESS) {
            resolve(data);
          } else if (data.resultCode === constants.NOTENOUGHBALANCE) {
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
        url: 'Adyen-PartialPaymentsOrder',
        data: JSON.stringify(requestData),
        contentType: 'application/json; charset=utf-8',
        async: false,
        success: function success(data) {
          if (data.resultCode === 'Success') {
            // make payments call including giftcard data and order data
            var partialPaymentRequest = {
              paymentMethod: giftCardData,
              amount: giftcardBalance,
              partialPaymentsOrder: {
                pspReference: data.pspReference,
                orderData: data.orderData
              },
              giftcardBrand: store.giftcardBrand
            };
            var partialPaymentResponse = helpers.makePartialPayment(partialPaymentRequest);
            if (partialPaymentResponse !== null && partialPaymentResponse !== void 0 && partialPaymentResponse.error) {
              reject();
            } else {
              showRemainingAmount();
            }
          }
        }
      });
    },
    onSubmit: function onSubmit(state) {
      var _state$data, _state$data$paymentMe;
      $('#giftcard-modal').modal('hide');
      store.selectedMethod = state.data.paymentMethod.type;
      store.brand = (_state$data = state.data) === null || _state$data === void 0 ? void 0 : (_state$data$paymentMe = _state$data.paymentMethod) === null || _state$data$paymentMe === void 0 ? void 0 : _state$data$paymentMe.brand;
      document.querySelector('input[name="brandCode"]').checked = false;
      document.querySelector('button[value="submit-payment"]').click();
    }
  };
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
    bcmc: getCardConfig(),
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