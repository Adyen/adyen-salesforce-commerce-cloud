"use strict";

var Resource = require('dw/web/Resource');

var BasketMgr = require('dw/order/BasketMgr');

var getPaymentMethods = require('*/cartridge/scripts/adyenGetPaymentMethods');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var _require = require('./utils'),
    getConnectedTerminals = _require.getConnectedTerminals,
    getCountryCode = _require.getCountryCode,
    getCustomer = _require.getCustomer;

function handlePaymentMethod(_ref) {
  var req = _ref.req,
      res = _ref.res,
      next = _ref.next;
  var currentBasket = BasketMgr.getCurrentBasket();
  var countryCode = getCountryCode(currentBasket, req.locale);
  var response = getPaymentMethods.getMethods(BasketMgr.getCurrentBasket(), getCustomer(req.currentCustomer), countryCode);
  var paymentMethodDescriptions = response.paymentMethods.map(function (method) {
    return {
      brandCode: method.type,
      description: Resource.msg("hpp.description.".concat(method.type), 'hpp', '')
    };
  });
  var connectedTerminals = getConnectedTerminals();
  var adyenURL = "".concat(AdyenHelper.getLoadingContext(), "images/logos/medium/");
  var currency = currentBasket.getTotalGrossPrice().currencyCode;
  var paymentAmount = currentBasket.getTotalGrossPrice().isAvailable() ? AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()) : new dw.value.Money(1000, currency);
  var jsonResponse = {
    AdyenPaymentMethods: response,
    ImagePath: adyenURL,
    AdyenDescriptions: paymentMethodDescriptions,
    AdyenConnectedTerminals: JSON.parse(connectedTerminals),
    amount: {
      value: paymentAmount.value,
      currency: currency
    },
    countryCode: countryCode
  };
  res.json(jsonResponse);
  return next();
}

module.exports = handlePaymentMethod;