'use strict';

var Transaction = require('dw/system/Transaction');
var HookMgr = require('dw/system/HookMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Status = require('dw/system/Status');
var PaymentInstrument = require('dw/order/PaymentInstrument');

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {string} orderNumber - The order number for the order
 * @returns {Object} an error object
 */
function handlePayments(order, orderNumber) {
  var result = {};
  if (order.totalNetPrice !== 0.00) {
    var paymentInstruments = order.paymentInstruments;

    if (paymentInstruments.length === 0) {
      Transaction.wrap(function () { OrderMgr.failOrder(order); });
      result.error = true;
    }
    if (!result.error) {
      for (var i = 0; i < paymentInstruments.length; i++) {
        var paymentInstrument = paymentInstruments[i];
        var paymentProcessor = PaymentMgr
          .getPaymentMethod(paymentInstrument.paymentMethod)
          .paymentProcessor;
        var authorizationResult;
        if (paymentProcessor === null) {
          Transaction.begin();
          paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
          Transaction.commit();
        } else {
          if (HookMgr.hasHook('app.payment.processor.'
                        + paymentProcessor.ID.toLowerCase())) {
            authorizationResult = HookMgr.callHook(
              'app.payment.processor.' + paymentProcessor.ID.toLowerCase(),
              'Authorize',
              orderNumber,
              paymentInstrument,
              paymentProcessor
            );
          } else {
            authorizationResult = HookMgr.callHook(
              'app.payment.processor.default',
              'Authorize'
            );
          }
          result = authorizationResult;
          if (authorizationResult.error) {
            Transaction.wrap(function () { OrderMgr.failOrder(order); });
            result.error = true;
            break;
          }
        }
      }
    }
  }

  return result;
}

/**
 * Validates payment
 * @param {Object} req - The local instance of the request object
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an object that has error information
 */
function validatePayment(req, currentBasket) {
  var applicablePaymentCards;
  var applicablePaymentMethods;
  var creditCardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
  var paymentAmount = currentBasket.totalGrossPrice.value;
  var countryCode = req.geolocation.countryCode;
  var currentCustomer = req.currentCustomer.raw;
  var paymentInstruments = currentBasket.paymentInstruments;
  var result = {};

  applicablePaymentMethods = PaymentMgr.getApplicablePaymentMethods(
    currentCustomer,
    countryCode,
    paymentAmount
  );
  applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
    currentCustomer,
    countryCode,
    paymentAmount
  );

  var invalid = true;

  for (var i = 0; i < paymentInstruments.length; i++) {
    var paymentInstrument = paymentInstruments[i];
    if (PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(paymentInstrument.paymentMethod)) {
      invalid = false;
    }

    var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
    if (paymentMethod && applicablePaymentMethods.contains(paymentMethod)) {
      if (PaymentInstrument.METHOD_CREDIT_CARD.equals(paymentInstrument.paymentMethod)) {
        var card = PaymentMgr.getPaymentCard(paymentInstrument.creditCardType);
        // Checks whether payment card is still applicable or if there is a credit card token set.
        if ((card && applicablePaymentCards.contains(card)) || paymentInstrument.getCreditCardToken()) {
          invalid = false;
        }
      } else {
        invalid = false;
      }
    }

    if (invalid) {
      break; // there is an invalid payment instrument
    }
  }

  result.error = invalid;
  return result;
}

/**
 * Attempts to place the order
 * @param {dw.order.Order} order - The order object to be placed
 * @returns {Object} an error object
 */
function placeOrder(order, fraudDetectionStatus) {
    var result = {error: false, order: order, order_created: false};

    try {
        if (order.paymentInstrument.paymentMethod == 'Adyen') {
            result.order_created = true;
        } else {
            Transaction.begin();
            var placeOrderStatus = OrderMgr.placeOrder(order);
            if (placeOrderStatus === Status.ERROR) {
                throw new Error();
            }
            if (fraudDetectionStatus.status === 'flag') {
                order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
            } else {
                order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
            }

            order.setExportStatus(Order.EXPORT_STATUS_READY);
            Transaction.commit();
        }
    }
    catch
        (e) {
        Transaction.wrap(function () {
            OrderMgr.failOrder(order);
        });
        result.error = true;
    }
    return result;
}

module.exports = {
  handlePayments: handlePayments,
  placeOrder: placeOrder,
  validatePayment: validatePayment
};
