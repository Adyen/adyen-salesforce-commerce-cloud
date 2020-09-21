const Resource = require('dw/web/Resource');
const URLUtils = require('dw/web/URLUtils');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const hooksHelper = require('*/cartridge/scripts/helpers/hooks');
const { fraudDetection } = require('*/cartridge/scripts/hooks/fraudDetection');
const { hasAdyenPaymentMethod } = require('../helpers/index');
const handleTransaction = require('./transaction');
const handlePaymentAuthorization = require('./payment');
const handleFraudDetection = require('./fraud');

function createOrder(currentBasket, { res, req, next }, emit) {
  const validateOrder = (order) => {
    // Creates a new order.
    if (!order) {
      res.json({
        error: true,
        errorMessage: Resource.msg('error.technical', 'checkout', null),
      });
      emit('route:Complete');
    }
    return !!order;
  };

  const handlePlaceOrder = (order, fraudDetectionStatus) => {
    const placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
    if (placeOrderResult.error) {
      res.json({
        error: true,
        errorMessage: Resource.msg('error.technical', 'checkout', null),
      });
      emit('route:Complete');
    }

    return !placeOrderResult.error;
  };

  const validateOrderAndAuthorize = (order) => {
    const isValidOrder = validateOrder(order);
    if (isValidOrder) {
      const isAuthorized = handlePaymentAuthorization(
        order,
        { req, res },
        emit,
      );
      return isAuthorized;
    }
    return false;
  };

  const handleCreateOrder = (order) => {
    const isAuthorized = validateOrderAndAuthorize(order);
    if (isAuthorized) {
      const fraudDetectionStatus = hooksHelper(
        'app.fraud.detection',
        'fraudDetection',
        currentBasket,
        fraudDetection,
      );
      const isSuccessful = handleFraudDetection(
        fraudDetectionStatus,
        order,
        { req, res },
        emit,
      );
      // Places the order
      return isSuccessful && handlePlaceOrder(order, fraudDetectionStatus);
    }
    return false;
  };

  const isAdyen = hasAdyenPaymentMethod(currentBasket);

  if (!isAdyen) {
    return next();
  }

  const isValidTransaction = handleTransaction(
    currentBasket,
    { res, req },
    emit,
  );
  if (isValidTransaction) {
    const order = COHelpers.createOrder(currentBasket);
    const isOrderCreated = handleCreateOrder(order);
    if (isOrderCreated) {
      COHelpers.sendConfirmationEmail(order, req.locale.id);

      // Reset usingMultiShip after successful Order placement
      req.session.privacyCache.set('usingMultiShipping', false);

      res.json({
        error: false,
        orderID: order.orderNo,
        orderToken: order.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString(),
      });
      return emit('route:Complete');
    }
  }
  return undefined;
}

module.exports = createOrder;
