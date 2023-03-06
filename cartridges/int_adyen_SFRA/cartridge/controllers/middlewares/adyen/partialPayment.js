"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var Transaction = require('dw/system/Transaction');
var Money = require('dw/value/Money');
var BasketMgr = require('dw/order/BasketMgr');
var Resource = require('dw/web/Resource');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
var constants = require('*/cartridge/adyenConstants/constants');
function responseContainsErrors(response) {
  return (response === null || response === void 0 ? void 0 : response.error) || (response === null || response === void 0 ? void 0 : response.resultCode) !== constants.RESULTCODES.AUTHORISED;
}
function makePartialPayment(req, res, next) {
  try {
    var _response$order, _currentBasket$custom, _currentBasket$custom2;
    var request = JSON.parse(req.body);
    var currentBasket = BasketMgr.getCurrentBasket();
    var paymentMethod = request.paymentMethod,
      partialPaymentsOrder = request.partialPaymentsOrder,
      amount = request.amount,
      giftcardBrand = request.giftcardBrand;
    var partialPaymentRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount: amount,
      reference: currentBasket.getUUID(),
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
    partialPaymentsOrderData.remainingAmount = response === null || response === void 0 ? void 0 : (_response$order = response.order) === null || _response$order === void 0 ? void 0 : _response$order.remainingAmount;
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
    AdyenLogs.error_log("Failed to create partial payment.. ".concat(error.toString()));
    res.json({
      error: true
    });
  }
  return next();
}
module.exports = makePartialPayment;