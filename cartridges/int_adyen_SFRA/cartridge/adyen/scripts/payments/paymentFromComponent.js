"use strict";

var _excluded = ["isExpressPdp"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
var BasketMgr = require('dw/order/BasketMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');
var Money = require('dw/value/Money');
var adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var constants = require('*/cartridge/adyen/config/constants');
var collections = require('*/cartridge/scripts/util/collections');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var GiftCardsHelper = require('*/cartridge/adyen/utils/giftCardsHelper');
var expressMethods = [constants.PAYMENTMETHODS.APPLEPAY, constants.PAYMENTMETHODS.AMAZONPAY, constants.PAYMENTMETHODS.GOOGLEPAY];
function setBillingAndShippingAddress(reqDataObj, currentBasket) {
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
  var shopperDetails = reqDataObj.customer;
  Transaction.wrap(function () {
    billingAddress.setFirstName(shopperDetails.billingAddressDetails.firstName);
    billingAddress.setLastName(shopperDetails.billingAddressDetails.lastName);
    billingAddress.setPhone(shopperDetails.profile.phone);
    billingAddress.setAddress1(shopperDetails.billingAddressDetails.address1);
    billingAddress.setCity(shopperDetails.billingAddressDetails.city);
    billingAddress.setCountryCode(shopperDetails.billingAddressDetails.countryCode.value);
    billingAddress.setPostalCode(shopperDetails.billingAddressDetails.postalCode);
    if (shopperDetails.billingAddressDetails.address2) {
      billingAddress.setAddress2(shopperDetails.billingAddressDetails.address2);
    }
    if (shopperDetails.billingAddressDetails.stateCode) {
      billingAddress.setStateCode(shopperDetails.billingAddressDetails.stateCode);
    }
    currentBasket.setCustomerEmail(shopperDetails.profile.email);
    shippingAddress.setFirstName(shopperDetails.profile.firstName);
    shippingAddress.setLastName(shopperDetails.profile.lastName);
    shippingAddress.setPhone(shopperDetails.profile.phone);
    shippingAddress.setAddress1(shopperDetails.addressBook.preferredAddress.address1);
    shippingAddress.setCity(shopperDetails.addressBook.preferredAddress.city);
    shippingAddress.setCountryCode(shopperDetails.addressBook.preferredAddress.countryCode.value);
    shippingAddress.setPostalCode(shopperDetails.addressBook.preferredAddress.postalCode);
    if (shopperDetails.addressBook.preferredAddress.address2) {
      shippingAddress.setAddress2(shopperDetails.addressBook.preferredAddress.address2);
    }
    if (shopperDetails.addressBook.preferredAddress.stateCode) {
      shippingAddress.setStateCode(shopperDetails.addressBook.preferredAddress.stateCode);
    }
  });
}
function failOrder(order) {
  Transaction.wrap(function () {
    OrderMgr.failOrder(order, true);
  });
}
function handleGiftCardPayment(currentBasket, order) {
  var _currentBasket$custom;
  var giftCards = (_currentBasket$custom = currentBasket.custom) !== null && _currentBasket$custom !== void 0 && _currentBasket$custom.adyenGiftCards ? JSON.parse(currentBasket.custom.adyenGiftCards) : null;
  if (giftCards) {
    var mainPaymentInstrument = order.getPaymentInstruments(AdyenHelper.getOrderMainPaymentInstrumentType(order))[0];
    giftCards.forEach(function (giftCard) {
      var divideBy = AdyenHelper.getDivisorForCurrency(mainPaymentInstrument.paymentTransaction.getAmount());
      var amount = {
        value: giftCard.remainingAmount.value,
        currency: giftCard.remainingAmount.currency
      };
      var formattedAmount = new Money(amount.value, amount.currency).divide(divideBy);
      Transaction.wrap(function () {
        mainPaymentInstrument.paymentTransaction.setAmount(formattedAmount);
      });
      GiftCardsHelper.createGiftCardPaymentInstrument(giftCard, divideBy, order);
    });
  }
}
function handleCancellation(res, next, reqDataObj) {
  AdyenLogs.info_log("Shopper cancelled paymentFromComponent transaction for order ".concat(reqDataObj.merchantReference));
  var order = OrderMgr.getOrder(reqDataObj.merchantReference, reqDataObj.orderToken);
  failOrder(order);
  res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder'));
  return next();
}
function handleRefusedResultCode(result, reqDataObj, order) {
  AdyenLogs.error_log("Payment refused for order ".concat(order.orderNo));
  result.paymentError = true;

  // Decline flow for Amazonpay or Applepay is handled different from other Component PMs
  // Order needs to be failed here to handle decline flow.
  if (expressMethods.indexOf(reqDataObj.paymentMethod) > -1) {
    failOrder(order);
  }
}
function isExpressPayment(reqDataObj) {
  return reqDataObj.paymentType === 'express';
}
function handleExpressPayment(reqDataObj, currentBasket) {
  if (isExpressPayment(reqDataObj)) {
    setBillingAndShippingAddress(reqDataObj, currentBasket);
  }
}
function canSkipSummaryPage(reqDataObj) {
  var _reqDataObj$paymentMe;
  if (constants.CAN_SKIP_SUMMARY_PAGE.indexOf((_reqDataObj$paymentMe = reqDataObj.paymentMethod) === null || _reqDataObj$paymentMe === void 0 ? void 0 : _reqDataObj$paymentMe.type) >= 0) {
    return true;
  }
  return false;
}

/**
 * Make a payment from inside a component, skipping the summary page. (paypal, QRcodes, MBWay)
 */
function paymentFromComponent(req, res, next) {
  var _currentBasket$custom2;
  var _JSON$parse = JSON.parse(req.form.data),
    isExpressPdp = _JSON$parse.isExpressPdp,
    reqDataObj = _objectWithoutProperties(_JSON$parse, _excluded);
  if (reqDataObj.cancelTransaction) {
    return handleCancellation(res, next, reqDataObj);
  }
  var currentBasket = isExpressPdp ? BasketMgr.getTemporaryBasket(session.privacy.temporaryBasketId) : BasketMgr.getCurrentBasket();
  var paymentInstrument;
  Transaction.wrap(function () {
    collections.forEach(currentBasket.getPaymentInstruments(), function (item) {
      currentBasket.removePaymentInstrument(item);
    });
    var paymentInstrumentType = constants.METHOD_ADYEN_COMPONENT;
    paymentInstrument = currentBasket.createPaymentInstrument(paymentInstrumentType, currentBasket.totalGrossPrice);
    var _PaymentMgr$getPaymen = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod),
      paymentProcessor = _PaymentMgr$getPaymen.paymentProcessor;
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    paymentInstrument.custom.adyenMainPaymentInstrument = paymentInstrumentType;
    paymentInstrument.custom.adyenPaymentData = req.form.data;
    if (session.privacy.partialPaymentData) {
      paymentInstrument.custom.adyenPartialPaymentsOrder = session.privacy.partialPaymentData;
    }
    paymentInstrument.custom.adyenPaymentMethod = AdyenHelper.getAdyenComponentType(req.form.paymentMethod);
    paymentInstrument.custom["".concat(constants.OMS_NAMESPACE, "__Adyen_Payment_Method")] = AdyenHelper.getAdyenComponentType(req.form.paymentMethod);
    paymentInstrument.custom.Adyen_Payment_Method_Variant = req.form.paymentMethod.toLowerCase();
    paymentInstrument.custom["".concat(constants.OMS_NAMESPACE, "__Adyen_Payment_Method_Variant")] = req.form.paymentMethod.toLowerCase();
  });
  handleExpressPayment(reqDataObj, currentBasket);
  var order;
  // Check if gift card was used
  if ((_currentBasket$custom2 = currentBasket.custom) !== null && _currentBasket$custom2 !== void 0 && _currentBasket$custom2.adyenGiftCards) {
    var giftCardsOrderNo = currentBasket.custom.adyenGiftCardsOrderNo;
    order = OrderMgr.createOrder(currentBasket, giftCardsOrderNo);
  } else {
    order = COHelpers.createOrder(currentBasket);
  }
  session.privacy.orderNo = order.orderNo;
  var result;
  Transaction.wrap(function () {
    result = adyenCheckout.createPaymentRequest({
      Order: order
    });
  });
  currentBasket.custom.amazonExpressShopperDetails = null;
  currentBasket.custom.adyenGiftCardsOrderNo = null;
  if (result.resultCode === constants.RESULTCODES.REFUSED) {
    handleRefusedResultCode(result, reqDataObj, order);
  }
  handleGiftCardPayment(currentBasket, order);

  // Check if summary page can be skipped in case payment is already authorized
  result.skipSummaryPage = canSkipSummaryPage(reqDataObj);
  result.orderNo = order.orderNo;
  result.orderToken = order.orderToken;
  res.json(result);
  return next();
}
module.exports = paymentFromComponent;