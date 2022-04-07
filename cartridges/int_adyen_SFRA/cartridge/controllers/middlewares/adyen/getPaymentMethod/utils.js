"use strict";

var Locale = require('dw/util/Locale');

var PaymentMgr = require('dw/order/PaymentMgr');

var adyenTerminalApi = require('*/cartridge/scripts/adyenTerminalApi');

var constants = require('*/cartridge/adyenConstants/constants');

function getCountryCode(currentBasket, locale) {
  var _currentBasket$getShi;

  var countryCode = Locale.getLocale(locale.id).country;
  var firstItem = (_currentBasket$getShi = currentBasket.getShipments()) === null || _currentBasket$getShi === void 0 ? void 0 : _currentBasket$getShi[0];

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

module.exports = {
  getCountryCode: getCountryCode,
  getConnectedTerminals: getConnectedTerminals
};