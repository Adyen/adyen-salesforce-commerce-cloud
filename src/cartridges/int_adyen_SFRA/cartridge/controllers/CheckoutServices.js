'use strict';

const server = require('server');
server.extend(module.superModule);

const adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');
const collections = require('*/cartridge/scripts/util/collections');
const constants = require('*/cartridge/adyenConstants/constants');
const Logger = require('dw/system/Logger');
const processPayment = require('*/cartridge/controllers/utils/adyenCheckoutServices');

server.prepend('PlaceOrder', server.middleware.https, function (req, res, next) {
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
  let isAdyen = false;

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

  //**** Adyen
  collections.forEach(currentBasket.getPaymentInstruments(), function (paymentInstrument) {
    if (
        [
          constants.METHOD_ADYEN,
          paymentInstrument.METHOD_CREDIT_CARD,
          constants.METHOD_ADYEN_POS,
          constants.METHOD_ADYEN_COMPONENT,
        ].indexOf(paymentInstrument.paymentMethod) !== -1
    ) {

      isAdyen = true;
    }
  });

  if (!isAdyen) {
    return next();
  }

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

  // Re-validates existing payment instruments
  var validPayment = COHelpers.validatePayment(req, currentBasket);
  if (validPayment.error) {
    res.json({
      error: true,
      errorStage: {
        stage: 'payment',
        step: 'paymentInstrument'
      },
      errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
    });
    return next();
  }

  // Re-calculate the payments.
  var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
  if (calculatedPaymentTransactionTotal.error) {
    res.json({
      error: true,
      errorMessage: Resource.msg('error.technical', 'checkout', null)
    });
    return next();
  }

  // Creates a new order.
  var order = COHelpers.createOrder(currentBasket);
  if (!order) {
    res.json({
      error: true,
      errorMessage: Resource.msg('error.technical', 'checkout', null)
    });
    return next();
  }

  // Handles payment authorization
  var handlePaymentResult = adyenHelpers.handlePayments(order, order.orderNo);

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
      errorMessage: Resource.msg('error.technical', 'checkout', null)
    });
    return next();
  }

  // ************** ADYEN
  const cbEmitter = (route) => this.emit(route, req, res);
  const _this = this;
  processPayment(order, handlePaymentResult, req, res, x);
// **************

  var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', currentBasket, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
  if (fraudDetectionStatus.status === 'fail') {
    Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

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

  // Places the order
  var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
  if (placeOrderResult.error) {
    res.json({
      error: true,
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

  return next();
});

module.exports = server.exports();