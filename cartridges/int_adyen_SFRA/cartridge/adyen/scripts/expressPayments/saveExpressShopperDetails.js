"use strict";

var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var BasketMgr = require('dw/order/BasketMgr');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
function setBillingAndShippingAddress(currentBasket) {
  var billingAddress = currentBasket.billingAddress;
  var _currentBasket$getDef = currentBasket.getDefaultShipment(),
    shippingAddress = _currentBasket$getDef.shippingAddress;
  Transaction.wrap(function () {
    if (!shippingAddress) {
      shippingAddress = currentBasket.getDefaultShipment().createShippingAddress();
    }
    if (!billingAddress) {
      billingAddress = currentBasket.createBillingAddress();
    }
  });
  var shopperDetails = JSON.parse(currentBasket.custom.amazonExpressShopperDetails); // apple pay or amazon pay

  Transaction.wrap(function () {
    billingAddress.setFirstName(shopperDetails.billingAddress.name.split(' ')[0]);
    billingAddress.setLastName(shopperDetails.billingAddress.name.split(' ')[1]);
    billingAddress.setAddress1(shopperDetails.billingAddress.addressLine1);
    billingAddress.setAddress2(shopperDetails.billingAddress.addressLine2);
    billingAddress.setCity(shopperDetails.billingAddress.city);
    billingAddress.setPhone(shopperDetails.billingAddress.phoneNumber);
    billingAddress.setPostalCode(shopperDetails.billingAddress.postalCode);
    billingAddress.setStateCode(shopperDetails.billingAddress.stateOrRegion);
    billingAddress.setCountryCode(shopperDetails.billingAddress.countryCode);
    shippingAddress.setFirstName(shopperDetails.shippingAddress.name.split(' ')[0]);
    shippingAddress.setLastName(shopperDetails.shippingAddress.name.split(' ')[1]);
    shippingAddress.setAddress1(shopperDetails.shippingAddress.addressLine1);
    shippingAddress.setAddress2(shopperDetails.shippingAddress.addressLine2);
    shippingAddress.setCity(shopperDetails.shippingAddress.city);
    shippingAddress.setPhone(shopperDetails.shippingAddress.phoneNumber);
    shippingAddress.setPostalCode(shopperDetails.shippingAddress.postalCode);
    shippingAddress.setStateCode(shopperDetails.shippingAddress.stateOrRegion);
    shippingAddress.setCountryCode(shopperDetails.shippingAddress.countryCode);
    currentBasket.setCustomerEmail(shopperDetails.buyer.email);
  });
}
function saveExpressShopperDetails(req, res, next) {
  try {
    var currentBasket = BasketMgr.getCurrentBasket();
    var shopperDetails = JSON.parse(req.form.shopperDetails);
    Transaction.wrap(function () {
      currentBasket.custom.amazonExpressShopperDetails = JSON.stringify(shopperDetails);
    });
    setBillingAndShippingAddress(currentBasket);
    var _currentBasket$getDef2 = currentBasket.getDefaultShipment(),
      shippingAddress = _currentBasket$getDef2.shippingAddress;
    var shippingMethods = AdyenHelper.getApplicableShippingMethods(currentBasket.getDefaultShipment(), shippingAddress);
    res.json({
      shippingMethods: shippingMethods
    });
    return next();
  } catch (error) {
    AdyenLogs.error_log('Could not save amazon express shopper details:', error);
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}
module.exports = saveExpressShopperDetails;