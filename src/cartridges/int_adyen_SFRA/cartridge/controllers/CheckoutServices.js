const server = require('server');

server.extend(module.superModule);

const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');
const collections = require('*/cartridge/scripts/util/collections');
const constants = require('*/cartridge/adyenConstants/constants');

server.prepend('PlaceOrder', server.middleware.https, function (
  req,
  res,
  next,
) {
  const BasketMgr = require('dw/order/BasketMgr');
  const OrderMgr = require('dw/order/OrderMgr');
  const Resource = require('dw/web/Resource');
  const Transaction = require('dw/system/Transaction');
  const URLUtils = require('dw/web/URLUtils');
  const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
  const hooksHelper = require('*/cartridge/scripts/helpers/hooks');
  let isAdyen = false;

  const currentBasket = BasketMgr.getCurrentBasket();
  if (!currentBasket) {
    res.json({
      error: true,
      cartError: true,
      fieldErrors: [],
      serverErrors: [],
      redirectUrl: URLUtils.url('Cart-Show').toString(),
    });
    return next();
  }

  collections.forEach(currentBasket.getPaymentInstruments(), function (
    paymentInstrument,
  ) {
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

  const viewData = res.getViewData();

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
      errorMessage: Resource.msg('error.technical', 'checkout', null),
    });
    this.emit('route:Complete', req, res);
    return;
  }

  const validationOrderStatus = hooksHelper(
    'app.validate.order',
    'validateOrder',
    currentBasket,
    require('*/cartridge/scripts/hooks/validateOrder').validateOrder,
  );
  if (validationOrderStatus.error) {
    res.json({
      error: true,
      errorMessage: validationOrderStatus.message,
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
        step: 'address',
      },
      errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null),
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
        step: 'billingAddress',
      },
      errorMessage: Resource.msg('error.no.billing.address', 'checkout', null),
    });
    this.emit('route:Complete', req, res);
    return;
  }

  // Calculate the basket
  Transaction.wrap(function () {
    basketCalculationHelpers.calculateTotals(currentBasket);
  });

  // Re-validates existing payment instruments
  const validPayment = adyenHelpers.validatePayment(req, currentBasket);
  if (validPayment.error) {
    res.json({
      error: true,
      errorStage: {
        stage: 'payment',
        step: 'paymentInstrument',
      },
      errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null),
    });
    this.emit('route:Complete', req, res);
    return;
  }
  // Re-calculate the payments.
  const calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(
    currentBasket,
  );
  if (calculatedPaymentTransactionTotal.error) {
    res.json({
      error: true,
      errorMessage: Resource.msg('error.technical', 'checkout', null),
    });
    this.emit('route:Complete', req, res);
    return;
  }

  // Creates a new order.
  const order = COHelpers.createOrder(currentBasket);
  const orderToken = order.getOrderToken();

  if (!order) {
    res.json({
      error: true,
      errorMessage: Resource.msg('error.technical', 'checkout', null),
    });
    this.emit('route:Complete', req, res);
    return;
  }
  const paymentInstrument = order.getPaymentInstruments(
    constants.METHOD_ADYEN_COMPONENT,
  )[0];

  // Handles payment authorization
  const handlePaymentResult = adyenHelpers.handlePayments(order, order.orderNo);
  if (handlePaymentResult.error) {
    res.json({
      error: true,
      errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null),
    });
    this.emit('route:Complete', req, res);
    return;
  }

  if (handlePaymentResult.threeDS2) {
    Transaction.wrap(function () {
      paymentInstrument.custom.adyenAction = handlePaymentResult.action;
    });
    res.json({
      error: false,
      continueUrl: URLUtils.url(
        'Adyen-Adyen3DS2',
        'resultCode',
        handlePaymentResult.resultCode,
        'merchantReference',
        order.orderNo,
        'orderToken',
        orderToken,
      ).toString(),
    });
    this.emit('route:Complete', req, res);
    return;
  } if (handlePaymentResult.redirectObject) {
    // If authorized3d, then redirectObject from credit card, hence it is 3D Secure
    if (handlePaymentResult.authorized3d) {
      Transaction.wrap(() => {
        paymentInstrument.custom.adyenMD = handlePaymentResult.redirectObject.data.MD;
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
          'signature',
          handlePaymentResult.signature,
          'merchantReference',
          order.orderNo,
          'orderToken',
          orderToken,
        ).toString(),
      });
      this.emit('route:Complete', req, res);
      return;
    }
    res.json({
      error: false,
      continueUrl: URLUtils.url(
        'Adyen-Redirect',
        'redirectUrl',
        handlePaymentResult.redirectObject.url,
        'signature',
        handlePaymentResult.signature,
        'merchantReference',
        order.orderNo,
        'orderToken',
        orderToken,
      ).toString(),
    });
    this.emit('route:Complete', req, res);
    return;
  }

  const fraudDetectionStatus = hooksHelper(
    'app.fraud.detection',
    'fraudDetection',
    currentBasket,
    require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection,
  );
  if (fraudDetectionStatus.status === 'fail') {
    Transaction.wrap(function () {
      OrderMgr.failOrder(order, true);
    });

    // fraud detection failed
    req.session.privacyCache.set('fraudDetectionStatus', true);

    res.json({
      error: true,
      cartError: true,
      redirectUrl: URLUtils.url(
        'Error-ErrorCode',
        'err',
        fraudDetectionStatus.errorCode,
      ).toString(),
      errorMessage: Resource.msg('error.technical', 'checkout', null),
    });

    this.emit('route:Complete', req, res);
    return;
  }

  // Places the order
  const placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
  if (placeOrderResult.error) {
    res.json({
      error: true,
      errorMessage: Resource.msg('error.technical', 'checkout', null),
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
    continueUrl: URLUtils.url('Order-Confirm').toString(),
  });
  this.emit('route:Complete', req, res);
});

module.exports = server.exports();
