'use strict';

var server = require('server');
server.extend(module.superModule);

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');

server.append('SubmitPayment',
  server.middleware.https,
  function (req, res, next) {
    var viewData = res.getViewData();
    var paymentForm = server.forms.getForm('billing');

      viewData.adyenEncryptedCardNumber = paymentForm.creditCardFields.adyenEncryptedCardNumber.value;
      viewData.adyenEncryptedExpiryMonth = paymentForm.creditCardFields.adyenEncryptedExpiryMonth.value;
      viewData.adyenEncryptedExpiryYear = paymentForm.creditCardFields.adyenEncryptedExpiryYear.value;
      viewData.adyenEncryptedSecurityCode = paymentForm.creditCardFields.adyenEncryptedSecurityCode.value;

    viewData.paymentInformation = {
      cardType: {
        value: paymentForm.creditCardFields.cardType.value
      },
      cardNumber: {
        value: paymentForm.creditCardFields.cardNumber.value
      },
      expirationMonth: {
        value: parseInt(paymentForm.creditCardFields.expirationMonth.selectedOption, 10)
      },
      expirationYear: {
        value: parseInt(paymentForm.creditCardFields.expirationYear.value, 10)
      },
      securityCode: {
          value: paymentForm.creditCardFields.securityCode.value
      }
    };

    if(paymentForm.creditCardFields.selectedCardID) {
        viewData.storedPaymentUUID = paymentForm.creditCardFields.selectedCardID.value;
    }

    // set selected brandCode & issuerId to session variable
    session.custom.brandCode = req.form.brandCode;
    session.custom.adyenPaymentMethod = req.form.adyenPaymentMethod;
    session.custom.issuerId = req.form.issuerId;
    session.custom.adyenIssuerName = req.form.adyenIssuerName;

    res.setViewData(viewData);
    next();
  });

server.replace('PlaceOrder', server.middleware.https, function (req, res, next) {
  var BasketMgr = require('dw/order/BasketMgr');
  var HookMgr = require('dw/system/HookMgr');
  var Resource = require('dw/web/Resource');
  var Transaction = require('dw/system/Transaction');
  var URLUtils = require('dw/web/URLUtils');
  var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

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

  var validationBasketStatus = HookMgr.callHook(
    'app.validate.basket',
    'validateBasket',
    currentBasket,
    false
  );
  if (validationBasketStatus.error) {
    res.json({
      error: true,
      errorMessage: validationBasketStatus.message
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
  var validPayment = adyenHelpers.validatePayment(req, currentBasket);
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
  if (handlePaymentResult.error) {
    res.json({
      error: true,
      errorMessage: Resource.msg('error.technical', 'checkout', null)
    });
    return next();
  }

  if (handlePaymentResult.redirectObject != '' && handlePaymentResult.authorized3d) {
    session.custom.MD = handlePaymentResult.redirectObject.data.MD;

    res.json({
      error: false,
      continueUrl: URLUtils.url('Adyen-Adyen3D', 'IssuerURL', handlePaymentResult.redirectObject.url, 'PaRequest', handlePaymentResult.redirectObject.data.PaReq, 'MD', handlePaymentResult.redirectObject.data.MD).toString()
    });
    return next();
  }

    var fraudDetectionStatus = HookMgr.callHook('app.fraud.detection', 'fraudDetection', currentBasket);
    if (fraudDetectionStatus.status === 'fail') {
        Transaction.wrap(function () { OrderMgr.failOrder(order); });

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
    var placeOrderResult = adyenHelpers.placeOrder(order, fraudDetectionStatus);

  if (placeOrderResult.error) {
    res.json({
      error: true,
      errorMessage: Resource.msg('error.placeorder', 'checkout', null)
    });
    return next();
  }

  // If payment is redirected, order is created first
  if (placeOrderResult.order.paymentInstrument.paymentMethod == 'Adyen' && placeOrderResult.order_created) {
    session.custom.orderNo = placeOrderResult.order.orderNo;
    res.json({
      error: false,
      orderID: placeOrderResult.order.orderNo,
      orderToken: placeOrderResult.order.orderToken,
      continueUrl: URLUtils.url('Adyen-Redirect').toString()
    });
    return next();
  }

  COHelpers.sendConfirmationEmail(order, req.locale.id);
  res.json({
    error: false,
    orderID: order.orderNo,
    orderToken: order.orderToken,
    continueUrl: URLUtils.url('Order-Confirm').toString()
  });
  return next();
});

module.exports = server.exports();
