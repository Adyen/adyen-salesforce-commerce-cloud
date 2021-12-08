"use strict";

var Resource = require('dw/web/Resource');

var URLUtils = require('dw/web/URLUtils');

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');

var _require = require('*/cartridge/scripts/hooks/fraudDetection'),
    fraudDetection = _require.fraudDetection;

var _require2 = require('../helpers/index'),
    hasAdyenPaymentMethod = _require2.hasAdyenPaymentMethod;

var handleTransaction = require('./transaction');

var handlePaymentAuthorization = require('./payment');

var handleFraudDetection = require('./fraud');

function createOrder(currentBasket, _ref, emit) {
  var res = _ref.res,
      req = _ref.req,
      next = _ref.next;

  var validateOrder = function validateOrder(order) {
    // Creates a new order.
    if (!order) {
      res.json({
        error: true,
        errorMessage: Resource.msg('error.technical', 'checkout', null)
      });
      emit('route:Complete');
    }

    return !!order;
  };

  var handlePlaceOrder = function handlePlaceOrder(order, fraudDetectionStatus) {
    var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);

    if (placeOrderResult.error) {
      res.json({
        error: true,
        errorMessage: Resource.msg('error.technical', 'checkout', null)
      });
      emit('route:Complete');
    }

    return !placeOrderResult.error;
  };

  var validateOrderAndAuthorize = function validateOrderAndAuthorize(order) {
    var isValidOrder = validateOrder(order);

    if (isValidOrder) {
      var isAuthorized = handlePaymentAuthorization(order, {
        req: req,
        res: res
      }, emit);
      return isAuthorized;
    }

    return false;
  };

  var handleCreateOrder = function handleCreateOrder(order) {
    var isAuthorized = validateOrderAndAuthorize(order);

    if (isAuthorized) {
      var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', currentBasket, fraudDetection);
      var isSuccessful = handleFraudDetection(fraudDetectionStatus, order, {
        req: req,
        res: res
      }, emit); // Places the order

      return isSuccessful && handlePlaceOrder(order, fraudDetectionStatus);
    }

    return false;
  };

  var saveAddresses = function saveAddresses(_ref2, order) {
    var currentCustomer = _ref2.currentCustomer;

    if (currentCustomer.addressBook) {
      var allAddresses = addressHelpers.gatherShippingAddresses(order);
      allAddresses.forEach(function (address) {
        if (!addressHelpers.checkIfAddressStored(address, currentCustomer.addressBook.addresses)) {
          addressHelpers.saveAddress(address, currentCustomer, addressHelpers.generateAddressName(address));
        }
      });
    }
  };

  var isAdyen = hasAdyenPaymentMethod(currentBasket);

  if (!isAdyen) {
    return next();
  }

  var isValidTransaction = handleTransaction(currentBasket, {
    res: res,
    req: req
  }, emit);

  if (isValidTransaction) {
    var order = COHelpers.createOrder(currentBasket);
    saveAddresses(req, order);
    var isOrderCreated = handleCreateOrder(order);

    if (isOrderCreated) {
      COHelpers.sendConfirmationEmail(order, req.locale.id); // Reset usingMultiShip after successful Order placement

      req.session.privacyCache.set('usingMultiShipping', false);
      res.json({
        error: false,
        orderID: order.orderNo,
        orderToken: order.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString()
      });
      return emit('route:Complete');
    }
  }

  return undefined;
}

module.exports = createOrder;