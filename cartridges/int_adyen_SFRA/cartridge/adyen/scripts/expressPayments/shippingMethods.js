"use strict";

var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var addressMapping = {
  city: 'setCity',
  countryCode: 'setCountryCode',
  stateCode: 'setStateCode',
  postalCode: 'setPostalCode'
};

/**
 * Sets address properties for express PM
 * @param {dw.order.shippingAddress} shippingAddress - shippingAddress for the default shipment
 * @param {object} inputAddress - address coming from the input field based on shopper selection
 * @param {object} mapping - address mapping between property and setter for that property
 */
function setAddressProperties(shippingAddress, inputAddress, mapping) {
  Object.keys(inputAddress).forEach(function (key) {
    if (inputAddress[key] && mapping[key]) {
      shippingAddress[mapping[key]](inputAddress[key]);
    }
  });
}

/**
 * Make a request to Adyen to get shipping methods
 */
function callGetShippingMethods(req, res, next) {
  try {
    var address = null;
    if (req.querystring) {
      address = {
        city: req.querystring.city,
        countryCode: req.querystring.countryCode,
        stateCode: req.querystring.stateCode,
        postalCode: req.querystring.postalCode
      };
    }
    var currentBasket = BasketMgr.getCurrentBasket();
    var shipment = currentBasket.getDefaultShipment();
    Transaction.wrap(function () {
      var shippingAddress = shipment.shippingAddress;
      if (!shippingAddress) {
        shippingAddress = currentBasket.getDefaultShipment().createShippingAddress();
      }
      if (address) {
        setAddressProperties(shippingAddress, address, addressMapping);
      }
    });
    var currentShippingMethodsModels = AdyenHelper.getApplicableShippingMethods(shipment, address);
    res.json({
      shippingMethods: currentShippingMethodsModels
    });
    return next();
  } catch (error) {
    AdyenLogs.error_log('Failed to fetch shipping methods');
    AdyenLogs.error_log(error);
    return next();
  }
}
module.exports = callGetShippingMethods;