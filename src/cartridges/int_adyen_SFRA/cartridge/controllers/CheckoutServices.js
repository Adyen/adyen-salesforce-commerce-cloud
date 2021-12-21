'use strict';

const server = require('server');
server.extend(module.superModule);

const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');
const collections = require('*/cartridge/scripts/util/collections');
const constants = require('*/cartridge/adyenConstants/constants');
const Logger = require('dw/system/Logger');

server.prepend('PlaceOrder', server.middleware.https, function (req, res, next) {
  const BasketMgr = require('dw/order/BasketMgr');
  const OrderMgr = require('dw/order/OrderMgr');
  const Resource = require('dw/web/Resource');
  const Transaction = require('dw/system/Transaction');
  const URLUtils = require('dw/web/URLUtils');
  const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
  const hooksHelper = require('*/cartridge/scripts/helpers/hooks');
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

  var viewData = res.getViewData();
  if (viewData && viewData.csrfError) {
    res.json();
    this.emit('route:Complete', req, res);
    return;
  }

  if (req.session.privacyCache.get('fraudDetectionStatus')) {
    res.json({
      error: true,
      cartError: true,
      redirectUrl: URLUtils.url('Error-ErrorCode', 'err', '01').toString(),
      errorMessage: Resource.msg('error.technical', 'checkout', null)
    });
    this.emit('route:Complete', req, res);
    return;
  }

  var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket, require('*/cartridge/scripts/hooks/validateOrder').validateOrder);
  if (validationOrderStatus.error) {
    res.json({
      error: true,
      errorMessage: validationOrderStatus.message
    });
    this.emit('route:Complete', req, res);
    return;
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
    this.emit('route:Complete', req, res);
    return;
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
    this.emit('route:Complete', req, res);
    return;
  }

  // Calculate the basket
  Transaction.wrap(function () {
    basketCalculationHelpers.calculateTotals(currentBasket);
  });

  // Zaid: to keep or not to keep???
  // Re-validates existing payment instruments
  // var validPayment = adyenHelpers.validatePayment(req, currentBasket);
  // if (validPayment.error) {
  //   res.json({
  //     error: true,
  //     errorStage: {
  //       stage: 'payment',
  //       step: 'paymentInstrument'
  //     },
  //     errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
  //   });
  //   this.emit('route:Complete', req, res);
  //   return;
  // }

  // Re-calculate the payments.
  var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
  if (calculatedPaymentTransactionTotal.error) {
    res.json({
      error: true,
      errorMessage: Resource.msg('error.technical', 'checkout', null)
    });
    this.emit('route:Complete', req, res);
    return;
  }

  // Creates a new order.
  var order = COHelpers.createOrder(currentBasket);
  if (!order) {
    res.json({
      error: true,
      errorMessage: Resource.msg('error.technical', 'checkout', null)
    });
    this.emit('route:Complete', req, res);
    return;
  }

  // Zaid: review, does it need unrefactoring?
  // Handles payment authorization
  var handlePaymentResult = adyenHelpers.handlePayments(order, order.orderNo);
  if (handlePaymentResult.error) {
    res.json({
      error: true,
      errorMessage: Resource.msg('error.technical', 'checkout', null)
    });
    this.emit('route:Complete', req, res);
    return;
  }

  Logger.getLogger('Adyen').error('handlePaymentResult ' + JSON.stringify(handlePaymentResult));
  const paymentInstrument = order.getPaymentInstruments(
      constants.METHOD_ADYEN_COMPONENT,
  )[0];

  if(handlePaymentResult.threeDS2) {
    Logger.getLogger('Adyen').error('inside threeDS2 ');
    Transaction.wrap(() => {
      paymentInstrument.custom.adyenAction = handlePaymentResult.action;
    });
    res.json({
      error: false,
      order,
      continueUrl: URLUtils.url('Adyen-Adyen3DS2', 'resultCode', handlePaymentResult.resultCode, 'orderNo', order.orderNo,).toString(),
    });
    this.emit('route:Complete', req, res);
    return;
  }
  else if (handlePaymentResult.redirectObject) {
    //If authorized3d, then redirectObject from credit card, hence it is 3D Secure
    if (handlePaymentResult.authorized3d) {
      Transaction.wrap(() => {
        paymentInstrument.custom.adyenMD =
            handlePaymentResult.redirectObject.data.MD;
      });
      res.json({
        error: false,
        continueUrl: URLUtils.url(
            'Adyen-Adyen3D',
            'IssuerURL',
            handlePaymentResult.redirectObject.url,
            'PaRequest',
            handlePaymentResult.redirectObject.data.PaReq,
            'MD',
            handlePaymentResult.redirectObject.data.MD,
            'merchantReference',
            handlePaymentResult.orderNo,
            'signature',
            handlePaymentResult.signature,
        ).toString(),
      });
      this.emit('route:Complete', req, res);
      return;
    } else {
      Transaction.wrap(() => {
        paymentInstrument.custom.adyenRedirectURL =
            handlePaymentResult.redirectObject.url;
      });
      res.json({
        error: false,
        continueUrl: URLUtils.url(
            'Adyen-Redirect',
            'merchantReference',
            handlePaymentResult.orderNo,
            'signature',
            handlePaymentResult.signature,
        ).toString(),
      });
      this.emit('route:Complete', req, res);
      return;
    }
  }

  var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', currentBasket, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
  if (fraudDetectionStatus.status === 'fail') {
    Transaction.wrap(function () {
      OrderMgr.failOrder(order);
    });

    // fraud detection failed
    req.session.privacyCache.set('fraudDetectionStatus', true);

    res.json({
      error: true,
      cartError: true,
      redirectUrl: URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus.errorCode).toString(),
      errorMessage: Resource.msg('error.technical', 'checkout', null)
    });

    this.emit('route:Complete', req, res);
    return;
  }

  // Places the order
  var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
  if (placeOrderResult.error) {
    res.json({
      error: true,
      errorMessage: Resource.msg('error.technical', 'checkout', null)
    });
    this.emit('route:Complete', req, res);
    return;
  }

  COHelpers.sendConfirmationEmail(order, req.locale.id);

  // Reset usingMultiShip after successful Order placement
  req.session.privacyCache.set('usingMultiShipping', false);

  res.json({
    error: false,
    orderID: order.orderNo,
    orderToken: order.orderToken,
    continueUrl: URLUtils.url('Order-Confirm').toString()
  });
  this.emit('route:Complete', req, res);
});

module.exports = server.exports();