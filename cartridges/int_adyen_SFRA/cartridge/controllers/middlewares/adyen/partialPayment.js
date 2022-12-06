"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var Money = require('dw/value/Money');
var BasketMgr = require('dw/order/BasketMgr');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
function makePartialPayment(req, res, next) {
  try {
    var _response$order;
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
    response.remainingAmountFormatted = remainingAmount.divide(divideBy).toFormattedString();
    response.discountAmountFormatted = discountAmount.divide(divideBy).toFormattedString();
    res.json(response);
  } catch (error) {
    Logger.getLogger('Adyen').error("Failed to create partial payment.. ".concat(error.toString()));
    res.json({
      error: true
    });
  }
  return next();
}
module.exports = makePartialPayment;