"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Transaction = require('dw/system/Transaction');
var Money = require('dw/value/Money');
var BasketMgr = require('dw/order/BasketMgr');
var Resource = require('dw/web/Resource');
var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
var adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var constants = require('*/cartridge/adyen/config/constants');
function responseContainsErrors(response) {
  return (response === null || response === void 0 ? void 0 : response.error) || (response === null || response === void 0 ? void 0 : response.resultCode) !== constants.RESULTCODES.AUTHORISED;
}
function makePartialPayment(req, res, next) {
  try {
    var _response$order, _response$order2, _response$order3, _currentBasket$custom, _currentBasket$custom2;
    var request = JSON.parse(req.body);
    var currentBasket = BasketMgr.getCurrentBasket();
    var paymentMethod = request.paymentMethod,
      partialPaymentsOrder = request.partialPaymentsOrder,
      amount = request.amount,
      giftcardBrand = request.giftcardBrand;
    var partialPaymentRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount: amount,
      reference: currentBasket.custom.adyenGiftCardsOrderNo,
      paymentMethod: paymentMethod,
      order: partialPaymentsOrder
    };
    var response = adyenCheckout.doPaymentsCall(null, null, partialPaymentRequest); // no order created yet and no PI needed (for giftcards it will be created on Order level)

    if (responseContainsErrors(response)) {
      var errorMsg = "partial payment request did not go through .. resultCode: ".concat(response === null || response === void 0 ? void 0 : response.resultCode);
      throw new Error(errorMsg);
    }
    Transaction.wrap(function () {
      session.privacy.giftCardResponse = JSON.stringify(_objectSpread(_objectSpread(_objectSpread({
        giftCardpspReference: response.pspReference,
        orderPSPReference: response.order.pspReference
      }, response.order), response.amount), {}, {
        paymentMethod: response.paymentMethod,
        brand: giftcardBrand
      })); // entire response exceeds string length
    });
    var discountAmount = new Money(response.amount.value, response.amount.currency);
    var remainingAmount = new Money(response.order.remainingAmount.value, response.order.remainingAmount.currency);

    // Update cached session data
    var partialPaymentsOrderData = JSON.parse(session.privacy.partialPaymentData);
    partialPaymentsOrderData.order = {
      orderData: response === null || response === void 0 ? void 0 : (_response$order = response.order) === null || _response$order === void 0 ? void 0 : _response$order.orderData,
      pspReference: response === null || response === void 0 ? void 0 : (_response$order2 = response.order) === null || _response$order2 === void 0 ? void 0 : _response$order2.pspReference
    };
    partialPaymentsOrderData.remainingAmount = response === null || response === void 0 ? void 0 : (_response$order3 = response.order) === null || _response$order3 === void 0 ? void 0 : _response$order3.remainingAmount;
    session.privacy.partialPaymentData = JSON.stringify(partialPaymentsOrderData);
    var divideBy = AdyenHelper.getDivisorForCurrency(remainingAmount);
    var remainingAmountFormatted = remainingAmount.divide(divideBy).toFormattedString();
    response.remainingAmountFormatted = remainingAmountFormatted;
    var discountAmountFormatted = discountAmount.divide(divideBy).toFormattedString();
    response.discountAmountFormatted = discountAmountFormatted;
    var addedGiftCards = currentBasket !== null && currentBasket !== void 0 && (_currentBasket$custom = currentBasket.custom) !== null && _currentBasket$custom !== void 0 && _currentBasket$custom.adyenGiftCards ? JSON.parse((_currentBasket$custom2 = currentBasket.custom) === null || _currentBasket$custom2 === void 0 ? void 0 : _currentBasket$custom2.adyenGiftCards) : [];
    var dataToStore = {
      discountedAmount: discountAmountFormatted,
      expiresAt: response.order.expiresAt,
      giftCard: _objectSpread(_objectSpread({}, response.paymentMethod), {}, {
        amount: response.amount,
        name: giftcardBrand,
        pspReference: response.pspReference
      }),
      orderAmount: {
        currency: currentBasket.currencyCode,
        value: AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()).value
      },
      partialPaymentsOrder: {
        orderData: response.order.orderData,
        pspReference: response.order.pspReference
      },
      remainingAmount: response.order.remainingAmount,
      remainingAmountFormatted: remainingAmountFormatted
    };
    addedGiftCards.push(dataToStore);
    Transaction.wrap(function () {
      currentBasket.custom.adyenGiftCards = JSON.stringify(addedGiftCards);
    });
    var totalDiscountedAmount = new Money(addedGiftCards.reduce(function (accumulator, currentValue) {
      return accumulator + currentValue.giftCard.amount.value;
    }, 0), response.order.remainingAmount.currency);
    res.json(_objectSpread(_objectSpread({}, dataToStore), {}, {
      totalDiscountedAmount: totalDiscountedAmount.divide(divideBy).toFormattedString(),
      giftCards: addedGiftCards,
      message: Resource.msgf('infoMessage.giftCard', 'adyen', null, remainingAmountFormatted)
    }));
  } catch (error) {
    AdyenLogs.error_log('Failed to create partial payment:', error);
    res.json({
      error: true
    });
  }
  return next();
}
module.exports = makePartialPayment;