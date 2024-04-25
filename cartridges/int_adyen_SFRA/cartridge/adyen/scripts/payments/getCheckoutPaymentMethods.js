"use strict";

var BasketMgr = require('dw/order/BasketMgr');
var Locale = require('dw/util/Locale');
var PaymentMgr = require('dw/order/PaymentMgr');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var adyenTerminalApi = require('*/cartridge/adyen/scripts/payments/adyenTerminalApi');
var paymentMethodDescriptions = require('*/cartridge/adyen/config/paymentMethodDescriptions');
var constants = require('*/cartridge/adyen/config/constants');
var getPaymentMethods = require('*/cartridge/adyen/scripts/payments/adyenGetPaymentMethods');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
function getCountryCode(currentBasket, locale) {
  var _currentBasket$getShi;
  var countryCode = Locale.getLocale(locale.id).country;
  var firstItem = currentBasket === null || currentBasket === void 0 ? void 0 : (_currentBasket$getShi = currentBasket.getShipments()) === null || _currentBasket$getShi === void 0 ? void 0 : _currentBasket$getShi[0];
  if (firstItem !== null && firstItem !== void 0 && firstItem.shippingAddress) {
    return firstItem.shippingAddress.getCountryCode().value;
  }
  return countryCode;
}
function getConnectedTerminals() {
  if (PaymentMgr.getPaymentMethod(constants.METHOD_ADYEN_POS).isActive()) {
    return adyenTerminalApi.getTerminals().response;
  }
  return '{}';
}
function getCheckoutPaymentMethods(req, res, next) {
  try {
    var currentBasket = BasketMgr.getCurrentBasket();
    var countryCode = currentBasket.getShipments().length > 0 && currentBasket.getShipments()[0].shippingAddress ? currentBasket.getShipments()[0].shippingAddress.getCountryCode().value : getCountryCode(currentBasket, req.locale).value;
    var adyenURL = "".concat(AdyenHelper.getLoadingContext(), "images/logos/medium/");
    var connectedTerminals = JSON.parse(getConnectedTerminals());
    var currency = currentBasket.getTotalGrossPrice().currencyCode;
    var getRemainingAmount = function getRemainingAmount(giftCardResponse) {
      if (giftCardResponse && JSON.parse(giftCardResponse).remainingAmount) {
        return JSON.parse(giftCardResponse).remainingAmount;
      }
      return {
        currency: currency,
        value: AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()).value
      };
    };
    var paymentAmount = getRemainingAmount(session.privacy.giftCardResponse);
    var paymentMethods = getPaymentMethods.getMethods(currentBasket, AdyenHelper.getCustomer(req.currentCustomer), countryCode);
    res.json({
      AdyenPaymentMethods: paymentMethods,
      imagePath: adyenURL,
      adyenDescriptions: paymentMethodDescriptions,
      adyenConnectedTerminals: connectedTerminals,
      amount: {
        value: paymentAmount.value,
        currency: currency
      },
      countryCode: countryCode,
      applicationInfo: AdyenHelper.getApplicationInfo()
    });
  } catch (err) {
    AdyenLogs.fatal_log("Failed to fetch payment methods ".concat(JSON.stringify(err)));
    res.json({
      error: true
    });
  }
  return next();
}
module.exports = getCheckoutPaymentMethods;