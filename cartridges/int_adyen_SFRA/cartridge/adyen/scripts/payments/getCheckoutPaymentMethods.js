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
  var countryCode;
  if (currentBasket) {
    var _currentBasket$getDef = currentBasket.getDefaultShipment(),
      shippingAddress = _currentBasket$getDef.shippingAddress;
    if (shippingAddress) {
      countryCode = shippingAddress.getCountryCode().value;
    }
  }
  return countryCode || Locale.getLocale(locale.id).country;
}
function getConnectedTerminals() {
  if (PaymentMgr.getPaymentMethod(constants.METHOD_ADYEN_POS).isActive()) {
    return adyenTerminalApi.getTerminals().response;
  }
  return '{}';
}
var getRemainingAmount = function getRemainingAmount(giftCardResponse, currency, currentBasket) {
  if (giftCardResponse && JSON.parse(giftCardResponse).remainingAmount) {
    var _JSON$parse$remaining = JSON.parse(giftCardResponse).remainingAmount.value,
      value = _JSON$parse$remaining === void 0 ? 1000 : _JSON$parse$remaining;
    return new dw.value.Money(value, currency);
  }
  return currentBasket !== null && currentBasket !== void 0 && currentBasket.getTotalGrossPrice().isAvailable() ? AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()) : new dw.value.Money(1000, currency);
};
function getCheckoutPaymentMethods(req, res, next) {
  try {
    var currentBasket = BasketMgr.getCurrentBasket();
    var countryCode = getCountryCode(currentBasket, req.locale);
    var adyenURL = "".concat(AdyenHelper.getLoadingContext(), "images/logos/medium/");
    var connectedTerminals = JSON.parse(getConnectedTerminals());
    var currency = currentBasket ? currentBasket.getTotalGrossPrice().currencyCode : session.currency.currencyCode;
    var paymentAmount = getRemainingAmount(session.privacy.giftCardResponse, currency, currentBasket);
    var paymentMethods = getPaymentMethods.getMethods(paymentAmount, AdyenHelper.getCustomer(req.currentCustomer), countryCode);
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
  } catch (error) {
    AdyenLogs.fatal_log('Failed to fetch payment methods', error);
    res.json({
      error: true
    });
  }
  return next();
}
module.exports = getCheckoutPaymentMethods;