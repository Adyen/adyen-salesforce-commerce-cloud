"use strict";

var BasketMgr = require('dw/order/BasketMgr');
var Locale = require('dw/util/Locale');
var getPaymentMethods = require('*/cartridge/scripts/adyenGetPaymentMethods');
function getCheckoutPaymentMethods(req, res, next) {
  var countryCode = Locale.getLocale(req.locale.id).country;
  var currentBasket = BasketMgr.getCurrentBasket();
  if (currentBasket.getShipments().length > 0 && currentBasket.getShipments()[0].shippingAddress) {
    countryCode = currentBasket.getShipments()[0].shippingAddress.getCountryCode();
  }
  var paymentMethods;
  try {
    var _countryCode$value;
    paymentMethods = getPaymentMethods.getMethods(BasketMgr.getCurrentBasket(), ((_countryCode$value = countryCode.value) === null || _countryCode$value === void 0 ? void 0 : _countryCode$value.toString()) || countryCode.value).paymentMethods;
  } catch (err) {
    paymentMethods = [];
  }
  res.json({
    AdyenPaymentMethods: paymentMethods
  });
  return next();
}
module.exports = getCheckoutPaymentMethods;