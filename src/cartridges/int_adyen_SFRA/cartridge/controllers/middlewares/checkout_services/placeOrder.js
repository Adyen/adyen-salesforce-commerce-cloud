const BasketMgr = require('dw/order/BasketMgr');
const OrderMgr = require('dw/order/OrderMgr');
const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');
const URLUtils = require('dw/web/URLUtils');
const constants = require('*/cartridge/adyenConstants/constants');
const collections = require('*/cartridge/scripts/util/collections');
const adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
const hooksHelper = require('*/cartridge/scripts/helpers/hooks');

function hasAdyenPaymentMethod(currentBasket) {
  let result = false;
  collections.forEach(
    currentBasket.getPaymentInstruments(),
    (paymentInstrument) => {
      if (
        [
          constants.METHOD_ADYEN,
          paymentInstrument.METHOD_CREDIT_CARD,
          constants.METHOD_ADYEN_POS,
          constants.METHOD_ADYEN_COMPONENT,
        ].indexOf(paymentInstrument.paymentMethod) !== -1
      ) {
        result = true;
      }
    },
  );
  return result;
}

function placeOrder(req, res, next) {
  const currentBasket = BasketMgr.getCurrentBasket();
  const hasBasketErrors = () => {
    // Check to make sure there is a shipping address
    if (!currentBasket.defaultShipment.shippingAddress) {
      res.json({
        error: true,
        errorStage: {
          stage: 'shipping',
          step: 'address',
        },
        errorMessage: Resource.msg(
          'error.no.shipping.address',
          'checkout',
          null,
        ),
      });
      this.emit('route:Complete', req, res);
      return true;
    }

    // Check to make sure billing address exists
    if (!currentBasket.billingAddress) {
      res.json({
        error: true,
        errorStage: {
          stage: 'payment',
          step: 'billingAddress',
        },
        errorMessage: Resource.msg(
          'error.no.billing.address',
          'checkout',
          null,
        ),
      });
      this.emit('route:Complete', req, res);
      return true;
    }

    return false;
  };

  const hasGeneralErrors = () => {
    const viewData = res.getViewData();

    if (viewData?.csrfError) {
      res.json();
      this.emit('route:Complete', req, res);
      return true;
    }

    if (req.session.privacyCache.get('fraudDetectionStatus')) {
      res.json({
        error: true,
        cartError: true,
        redirectUrl: URLUtils.url('Error-ErrorCode', 'err', '01').toString(),
        errorMessage: Resource.msg('error.technical', 'checkout', null),
      });
      this.emit('route:Complete', req, res);
      return true;
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
      return true;
    }
    return false;
  };

  const hasError = () => hasGeneralErrors() || hasBasketErrors();
  const validatePayment = () => {
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
      return false;
    }
    return true;
  };

  const calculatePaymentTransaction = () => {
    const calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(
      currentBasket,
    );
    if (calculatedPaymentTransactionTotal.error) {
      res.json({
        error: true,
        errorMessage: Resource.msg('error.technical', 'checkout', null),
      });
      this.emit('route:Complete', req, res);
      return false;
    }
    return true;
  };

  const validateTransaction = () => {
    const isValidPayment = validatePayment();
    if (!isValidPayment) {
      return false;
    }

    // Re-calculate the payments.
    const isValidTransaction = calculatePaymentTransaction();
    if (!isValidTransaction) {
      return false;
    }

    return true;
  };

  const handleTransaction = () => {
    if (hasError()) {
      return false;
    }

    // Calculate the basket
    Transaction.wrap(() => {
      basketCalculationHelpers.calculateTotals(currentBasket);
    });

    const isValid = validateTransaction();
    if (!isValid) {
      return false;
    }

    return true;
  };

  const validateOrder = (order) => {
    // Creates a new order.
    if (!order) {
      res.json({
        error: true,
        errorMessage: Resource.msg('error.technical', 'checkout', null),
      });
      this.emit('route:Complete', req, res);
      return false;
    }
    return true;
  };

  const handleRedirectResult = (handlePaymentResult) => {
    if (handlePaymentResult.threeDS2) {
      res.json({
        error: false,
        continueUrl: URLUtils.url(
          'Adyen-Adyen3DS2',
          'resultCode',
          handlePaymentResult.resultCode,
          'token3ds2',
          handlePaymentResult.token3ds2,
        ).toString(),
      });
      this.emit('route:Complete', req, res);
      return false;
    }
    if (handlePaymentResult.redirectObject) {
      // If authorized3d, then redirectObject from credit card, hence it is 3D Secure
      if (handlePaymentResult.authorized3d) {
        session.privacy.MD = handlePaymentResult.redirectObject.data.MD;
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
          ).toString(),
        });
        this.emit('route:Complete', req, res);
        return false;
      }
      res.json({
        error: false,
        continueUrl: URLUtils.url(
          'Adyen-Redirect',
          'redirectUrl',
          handlePaymentResult.redirectObject.url,
          'signature',
          handlePaymentResult.signature,
        ).toString(),
      });
      this.emit('route:Complete', req, res);
      return false;
    }
    return true;
  };

  const handlePaymentAuthorization = (order) => {
    // Handles payment authorization
    const handlePaymentResult = adyenHelpers.handlePayments(
      order,
      order.orderNo,
    );
    if (handlePaymentResult.error) {
      res.json({
        error: true,
        errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null),
      });
      this.emit('route:Complete', req, res);
      return false;
    }

    const isValid = handleRedirectResult(handlePaymentResult);
    if (!isValid) {
      return false;
    }

    return true;
  };

  const handleFraudDetection = (fraudDetectionStatus, order) => {
    if (fraudDetectionStatus.status === 'fail') {
      Transaction.wrap(() => {
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
      return false;
    }
    return true;
  };

  const handlePlaceOrder = (order, fraudDetectionStatus) => {
    const placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
    if (placeOrderResult.error) {
      res.json({
        error: true,
        errorMessage: Resource.msg('error.technical', 'checkout', null),
      });
      this.emit('route:Complete', req, res);
      return false;
    }

    return true;
  };

  const validateOrderAndAuthorize = (order) => {
    const isValidOrder = validateOrder(order);
    if (!isValidOrder) {
      return false;
    }

    const isAuthorized = handlePaymentAuthorization(order);
    if (!isAuthorized) {
      return false;
    }
    return true;
  };

  const handleCreateOrder = (order) => {
    const isAuthorized = validateOrderAndAuthorize(order);
    if (!isAuthorized) {
      return false;
    }

    const fraudDetectionStatus = hooksHelper(
      'app.fraud.detection',
      'fraudDetection',
      currentBasket,
      require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection,
    );
    const isSuccessful = handleFraudDetection(fraudDetectionStatus, order);
    if (!isSuccessful) {
      return false;
    }

    // Places the order
    const isOrderPlaced = handlePlaceOrder(order, fraudDetectionStatus);
    if (!isOrderPlaced) {
      return false;
    }

    return true;
  };

  const createOrder = () => {
    const isAdyen = hasAdyenPaymentMethod(currentBasket);

    if (!isAdyen) {
      return next();
    }

    const isValidTransaction = handleTransaction();
    if (!isValidTransaction) {
      return;
    }

    const order = COHelpers.createOrder(currentBasket);
    const isOrderCreated = handleCreateOrder(order);
    if (!isOrderCreated) {
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
  };

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

  return createOrder();
}

module.exports = placeOrder;
