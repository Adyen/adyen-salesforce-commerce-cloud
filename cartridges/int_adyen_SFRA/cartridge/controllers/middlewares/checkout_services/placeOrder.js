"use strict";

/* ### Custom Adyen cartridge start ### */
var adyenHelpers = require('*/cartridge/adyen/utils/authorizationHelper');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var GiftCardsHelper = require('*/cartridge/adyen/utils/giftCardsHelper');
var constants = require('*/cartridge/adyen/config/constants');
var _require = require('*/cartridge/controllers/middlewares/checkout_services/adyenCheckoutServices'),
  processPayment = _require.processPayment,
  isNotAdyen = _require.isNotAdyen;
var Money = require('dw/value/Money');
var clearForms = require('*/cartridge/adyen/utils/clearForms');

/* ### Custom Adyen cartridge end ### */

function placeOrder(req, res, next) {
  var _currentBasket$custom,
    _this = this,
    _handlePaymentResult$;
  var BasketMgr = require('dw/order/BasketMgr');
  var OrderMgr = require('dw/order/OrderMgr');
  var Resource = require('dw/web/Resource');
  var Transaction = require('dw/system/Transaction');
  var URLUtils = require('dw/web/URLUtils');
  var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
  var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
  var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
  var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
  var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
  var currentBasket = BasketMgr.getCurrentBasket();
  if (!currentBasket) {
    res.json({
      error: true,
      cartError: true,
      fieldErrors: [],
      serverErrors: [],
      redirectUrl: URLUtils.url('Cart-Show').toString()
    });
    return next();
  }

  /* ### Custom Adyen cartridge ### */
  if (isNotAdyen(currentBasket)) {
    return next();
  }
  /* ### Custom Adyen cartridge ### */

  var validatedProducts = validationHelpers.validateProducts(currentBasket);
  if (validatedProducts.error) {
    res.json({
      error: true,
      cartError: true,
      fieldErrors: [],
      serverErrors: [],
      redirectUrl: URLUtils.url('Cart-Show').toString()
    });
    return next();
  }
  if (req.session.privacyCache.get('fraudDetectionStatus')) {
    res.json({
      error: true,
      cartError: true,
      redirectUrl: URLUtils.url('Error-ErrorCode', 'err', '01').toString(),
      errorMessage: Resource.msg('error.technical', 'checkout', null)
    });
    return next();
  }
  var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket, require('*/cartridge/scripts/hooks/validateOrder').validateOrder);
  if (validationOrderStatus.error) {
    res.json({
      error: true,
      errorMessage: validationOrderStatus.message
    });
    return next();
  }

  // Check to make sure there is a shipping address
  if (currentBasket.defaultShipment.shippingAddress === null) {
    res.json({
      error: true,
      errorStage: {
        stage: 'shipping',
        step: 'address'
      },
      errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null)
    });
    return next();
  }

  // Check to make sure billing address exists
  if (!currentBasket.billingAddress) {
    res.json({
      error: true,
      errorStage: {
        stage: 'payment',
        step: 'billingAddress'
      },
      errorMessage: Resource.msg('error.no.billing.address', 'checkout', null)
    });
    return next();
  }

  // Calculate the basket
  Transaction.wrap(function () {
    basketCalculationHelpers.calculateTotals(currentBasket);
  });

  // Re-calculate the payments.
  var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
  if (calculatedPaymentTransactionTotal.error) {
    res.json({
      error: true,
      errorMessage: Resource.msg('error.technical', 'checkout', null)
    });
    return next();
  }

  // Check if gift cards were used
  var giftCardsAdded = (_currentBasket$custom = currentBasket.custom) !== null && _currentBasket$custom !== void 0 && _currentBasket$custom.adyenGiftCards ? JSON.parse(currentBasket.custom.adyenGiftCards) : null;

  // Creates a new order.
  var order;
  if (giftCardsAdded) {
    var orderNo = currentBasket.custom.adyenGiftCardsOrderNo;
    order = OrderMgr.createOrder(currentBasket, orderNo);
  } else {
    order = COHelpers.createOrder(currentBasket);
  }
  if (!order) {
    session.privacy.orderNo = null;
    res.json({
      error: true,
      errorMessage: Resource.msg('error.technical', 'checkout', null)
    });
    return next();
  }

  /* ### Custom Adyen cartridge start ### */
  // Cache order number in order to be able to restore cart later
  req.session.privacyCache.set('currentOrderNumber', order.orderNo);
  req.session.privacyCache.set('currentOrderToken', order.orderToken);
  session.privacy.orderNo = order.orderNo;

  // Handles payment authorization
  var handlePaymentResult = adyenHelpers.handlePayments(order);
  var mainPaymentInstrument;
  if (giftCardsAdded) {
    mainPaymentInstrument = order.getPaymentInstruments(AdyenHelper.getOrderMainPaymentInstrumentType(order))[0];
    giftCardsAdded.forEach(function (giftCard) {
      var divideBy = AdyenHelper.getDivisorForCurrency(mainPaymentInstrument.paymentTransaction.getAmount());
      var amount = {
        value: giftCard.remainingAmount.value,
        currency: giftCard.remainingAmount.currency
      };
      var formattedAmount = new Money(amount.value, amount.currency).divide(divideBy);
      Transaction.wrap(function () {
        mainPaymentInstrument.paymentTransaction.setAmount(formattedAmount); //update amount from order total to PM total
      });
      GiftCardsHelper.createGiftCardPaymentInstrument(giftCard, divideBy, order);
    });
  }
  /* ### Custom Adyen cartridge end ### */

  // Handle custom processing post authorization
  var options = {
    req: req,
    res: res
  };
  var postAuthCustomizations = hooksHelper('app.post.auth', 'postAuthorization', handlePaymentResult, order, options, require('*/cartridge/scripts/hooks/postAuthorizationHandling').postAuthorization);
  if (postAuthCustomizations && Object.prototype.hasOwnProperty.call(postAuthCustomizations, 'error')) {
    res.json(postAuthCustomizations);
    return next();
  }
  if (handlePaymentResult.error) {
    res.json({
      error: true,
      errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
    });
    this.emit('route:Complete', req, res);
    return;
  }

  /* ### Custom Adyen cartridge start ### */
  var cbEmitter = function cbEmitter(route) {
    return _this.emit(route, req, res);
  };
  if (handlePaymentResult.action && ((_handlePaymentResult$ = handlePaymentResult.action) === null || _handlePaymentResult$ === void 0 ? void 0 : _handlePaymentResult$.type) !== constants.ACTIONTYPES.VOUCHER) {
    return processPayment(order, handlePaymentResult, req, res, cbEmitter);
  }
  /* ### Custom Adyen cartridge end ### */

  var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', currentBasket, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
  if (fraudDetectionStatus.status === 'fail') {
    Transaction.wrap(function () {
      OrderMgr.failOrder(order, true);
    });

    // fraud detection failed
    req.session.privacyCache.set('fraudDetectionStatus', true);
    res.json({
      error: true,
      cartError: true,
      redirectUrl: URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus.errorCode).toString(),
      errorMessage: Resource.msg('error.technical', 'checkout', null)
    });
    return next();
  }
  if (req.currentCustomer.addressBook) {
    // save all used shipping addresses to address book of the logged in customer
    var allAddresses = addressHelpers.gatherShippingAddresses(order);
    allAddresses.forEach(function (address) {
      if (!addressHelpers.checkIfAddressStored(address, req.currentCustomer.addressBook.addresses)) {
        addressHelpers.saveAddress(address, req.currentCustomer, addressHelpers.generateAddressName(address));
      }
    });
  }
  if (order.getCustomerEmail()) {
    COHelpers.sendConfirmationEmail(order, req.locale.id);
  }
  clearForms.clearForms();
  if (mainPaymentInstrument) {
    clearForms.clearPaymentTransactionData(mainPaymentInstrument);
    clearForms.clearAdyenData(mainPaymentInstrument);
  }
  // Reset usingMultiShip after successful Order placement
  req.session.privacyCache.set('usingMultiShipping', false);

  // TODO: Exposing a direct route to an Order, without at least encoding the orderID
  //  is a serious PII violation.  It enables looking up every customers orders, one at a
  //  time.
  res.json({
    error: false,
    orderID: order.orderNo,
    orderToken: order.orderToken,
    continueUrl: URLUtils.url('Order-Confirm').toString()
  });
  this.emit('route:Complete', req, res);
}
module.exports = placeOrder;