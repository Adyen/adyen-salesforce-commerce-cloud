"use strict";

var BasketMgr = require('dw/order/BasketMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');
var Money = require('dw/value/Money');
var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var constants = require('*/cartridge/adyenConstants/constants');
var collections = require('*/cartridge/scripts/util/collections');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
var expressMethods = ['applepay', 'amazonpay'];
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
  // Check if gift card was used
  var divideBy = AdyenHelper.getDivisorForCurrency(currentBasket.totalGrossPrice);
  var parsedGiftCardObj = JSON.parse(session.privacy.giftCardResponse);
  var remainingAmount = {
    value: parsedGiftCardObj.remainingAmount.value,
    currency: parsedGiftCardObj.remainingAmount.currency
  };
  var formattedAmount = new Money(remainingAmount.value, remainingAmount.currency).divide(divideBy);
  var mainPaymentInstrument = order.getPaymentInstruments(AdyenHelper.getOrderMainPaymentInstrumentType(order))[0];
  // update amount from order total to PM total
  Transaction.wrap(function () {
    mainPaymentInstrument.paymentTransaction.setAmount(formattedAmount);
  });
  var paidGiftcardAmount = {
    value: parsedGiftCardObj.value,
    currency: parsedGiftCardObj.currency
  };
  var formattedGiftcardAmount = new Money(paidGiftcardAmount.value, paidGiftcardAmount.currency).divide(divideBy);
  Transaction.wrap(function () {
    var giftcardPM = order.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT, formattedGiftcardAmount);
    var _PaymentMgr$getPaymen = PaymentMgr.getPaymentMethod(giftcardPM.paymentMethod),
      paymentProcessor = _PaymentMgr$getPaymen.paymentProcessor;
    giftcardPM.paymentTransaction.paymentProcessor = paymentProcessor;
    giftcardPM.custom.adyenPaymentMethod = parsedGiftCardObj.brand;
    giftcardPM.custom["".concat(constants.OMS_NAMESPACE, "_Adyen_Payment_Method")] = parsedGiftCardObj.brand;
    giftcardPM.custom.Adyen_Payment_Method_Variant = parsedGiftCardObj.paymentMethod.brand;
    giftcardPM.custom["".concat(constants.OMS_NAMESPACE, "_Adyen_Payment_Method_Variant")] = parsedGiftCardObj.paymentMethod.brand;
    giftcardPM.paymentTransaction.custom.Adyen_log = session.privacy.giftCardResponse;
    giftcardPM.paymentTransaction.custom.Adyen_pspReference = parsedGiftCardObj.giftCardpspReference;
  });
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

/**
 * Make a payment from inside a component, skipping the summary page. (paypal, QRcodes, MBWay)
 */
function paymentFromComponent(req, res, next) {
  var _reqDataObj$paymentMe;
  var reqDataObj = JSON.parse(req.form.data);
  if (reqDataObj.cancelTransaction) {
    return handleCancellation(res, next, reqDataObj);
  }
  var currentBasket = BasketMgr.getCurrentBasket();
  var paymentInstrument;
  Transaction.wrap(function () {
    collections.forEach(currentBasket.getPaymentInstruments(), function (item) {
      currentBasket.removePaymentInstrument(item);
    });
    paymentInstrument = currentBasket.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT, currentBasket.totalGrossPrice);
    var _PaymentMgr$getPaymen2 = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod),
      paymentProcessor = _PaymentMgr$getPaymen2.paymentProcessor;
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    paymentInstrument.custom.adyenPaymentData = req.form.data;
    if (reqDataObj.partialPaymentsOrder) {
      paymentInstrument.custom.adyenPartialPaymentsOrder = session.privacy.partialPaymentData;
    }
    paymentInstrument.custom.adyenPaymentMethod = AdyenHelper.getAdyenComponentType(req.form.paymentMethod);
    paymentInstrument.custom["".concat(constants.OMS_NAMESPACE, "_Adyen_Payment_Method")] = AdyenHelper.getAdyenComponentType(req.form.paymentMethod);
    paymentInstrument.custom.Adyen_Payment_Method_Variant = req.form.paymentMethod.toLowerCase();
    paymentInstrument.custom["".concat(constants.OMS_NAMESPACE, "_Adyen_Payment_Method_Variant")] = req.form.paymentMethod.toLowerCase();
  });
  handleExpressPayment(reqDataObj, currentBasket);
  var order = COHelpers.createOrder(currentBasket);
  var result;
  Transaction.wrap(function () {
    result = adyenCheckout.createPaymentRequest({
      Order: order,
      PaymentInstrument: paymentInstrument
    });
  });
  currentBasket.custom.amazonExpressShopperDetails = null;
  if (result.resultCode === constants.RESULTCODES.REFUSED) {
    handleRefusedResultCode(result, reqDataObj, order);
  }

  // Check if gift card was used
  if (session.privacy.giftCardResponse) {
    handleGiftCardPayment(currentBasket, order);
  }
  if (AdyenHelper.isApplePay((_reqDataObj$paymentMe = reqDataObj.paymentMethod) === null || _reqDataObj$paymentMe === void 0 ? void 0 : _reqDataObj$paymentMe.type)) {
    result.isApplePay = true;
  }
  result.orderNo = order.orderNo;
  result.orderToken = order.orderToken;
  res.json(result);
  return next();
}
module.exports = paymentFromComponent;