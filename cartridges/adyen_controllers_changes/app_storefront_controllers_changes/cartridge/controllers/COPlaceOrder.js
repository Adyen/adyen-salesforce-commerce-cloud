'use strict';

/**
 * Controller that creates an order from the current basket. It's a pure processing controller and does
 * no page rendering. The controller is used by checkout and is called upon the triggered place order action.
 * It contains the actual logic to authorize the payment and create the order. The controller communicates the result
 * of the order creation process and uses a status object PlaceOrderError to set proper error states.
 * The calling controller is must handle the results of the order creation and evaluate any errors returned by it.
 *
 * @module controllers/COPlaceOrder
 */

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');
var Cart = app.getModel('Cart');
var Order = app.getModel('Order');
var PaymentProcessor = app.getModel('PaymentProcessor');

/**
 * Responsible for payment handling. This function uses PaymentProcessorModel methods to
 * handle payment processing specific to each payment instrument. It returns an
 * error if any of the authorizations failed or a payment
 * instrument is of an unknown payment method. If a payment method has no
 * payment processor assigned, the payment is accepted as authorized.
 *
 * @transactional
 * @param {dw.order.Order} order - the order to handle payments for.
 * @return {Object} JSON object containing information about missing payments, errors, or an empty object if the function is successful.
 */
// ### Custom Adyen cartridge start ###
function handlePayments(order) {
  if (order.getTotalNetPrice().value !== 0.00) {
    var paymentInstruments = order.getPaymentInstruments();
    if (paymentInstruments.length === 0) {
      return {
        missingPaymentInfo: true
      };
    }
    /**
     * Sets the transaction ID for the payment instrument.
     */
    var handlePaymentTransaction = function () {
      paymentInstrument.getPaymentTransaction().setTransactionID(order.getOrderNo());
    };
    for (var i = 0; i < paymentInstruments.length; i++) {
      var paymentInstrument = paymentInstruments[i];
      if (PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor() === null) {
        Transaction.wrap(handlePaymentTransaction);
      } else {
        var authorizationResult = PaymentProcessor.authorize(order, paymentInstrument);
        if (authorizationResult.not_supported || authorizationResult.error) {
          return {
            error: true
          };
        }
        if (authorizationResult.isAdyen) {
          return authorizationResult;
        }
      }
    }
  }
  return {};
}
// ### Custom Adyen cartridge end ###

/**
 * The entry point for order creation. This function is not exported, as this controller must only
 * be called by another controller.
 *
 * @transactional
 * @return {Object} JSON object that is empty, contains error information, or PlaceOrderError status information.
 */
// ### Custom Adyen cartridge start ###
function start() {
  var cart = Cart.get();
  if (!cart) {
    app.getController('Cart').Show();
    return {};
  }
  var COShipping = app.getController('COShipping');

  // Clean shipments.
  COShipping.PrepareShipments(cart);

  // Make sure there is a valid shipping address, accounting for gift certificates that do not have one.
  if (cart.getProductLineItems().size() > 0 && cart.getDefaultShipment().getShippingAddress() === null) {
    COShipping.Start();
    return {};
  }

  // Make sure the billing step is fulfilled, otherwise restart checkout.
  if (!session.forms.billing.fulfilled.value) {
    app.getController('COCustomer').Start();
    return {};
  }
  Transaction.wrap(function () {
    cart.calculate();
  });
  var COBilling = app.getController('COBilling');
  Transaction.wrap(function () {
    if (!COBilling.ValidatePayment(cart)) {
      COBilling.Start();
      return {};
    }
  });

  // Recalculate the payments. If there is only gift certificates, make sure it covers the order total, if not
  // back to billing page.
  Transaction.wrap(function () {
    if (!cart.calculatePaymentTransactionTotal()) {
      COBilling.Start();
      return {};
    }
  });

  // Handle used addresses and credit cards.
  var saveCCResult = COBilling.SaveCreditCard();
  if (!saveCCResult) {
    return {
      error: true,
      PlaceOrderError: new Status(Status.ERROR, 'confirm.error.technical')
    };
  }

  // Creates a new order. This will internally ReserveInventoryForOrder and will create a new Order with status
  // 'Created'.
  var order = cart.createOrder();
  if (!order) {
    // TODO - need to pass BasketStatus to Cart-Show ?
    app.getController('Cart').Show();
    return {};
  }
  var handlePaymentsResult = handlePayments(order);
  var constants = require('*/cartridge/adyenConstants/constants');
  var URLUtils = require('dw/web/URLUtils');

  // Cache current order number in order to potentially restore cart.
  session.privacy.currentOrderNumber = order.orderNo;
  session.privacy.currentOrderToken = order.orderToken;
  var submitOrder = handlePaymentsResult.isAdyen === false ||
  //adyen is not the payment processor for this payment
  handlePaymentsResult.isAdyen && !handlePaymentsResult.action ||
  // isAdyen and no action
  handlePaymentsResult.action && handlePaymentsResult.action.type === constants.ACTIONTYPES.VOUCHER ||
  // action type is voucher
  !handlePaymentsResult.action && !handlePaymentsResult.isFinal; // no action and payment is not final (SEPA)
  if (handlePaymentsResult.error) {
    return Transaction.wrap(function () {
      OrderMgr.failOrder(order);
      return {
        continueUrl: URLUtils.url('Adyen-ShowConfirmation', 'error', 'true', 'errorStatus', 'confirm.error.technical').toString()
      };
    });
  } else if (handlePaymentsResult.missingPaymentInfo) {
    return Transaction.wrap(function () {
      OrderMgr.failOrder(order);
      return {
        continueUrl: URLUtils.url('Adyen-ShowConfirmation', 'error', 'true', 'errorStatus', 'confirm.error.technical').toString()
      };
    });
  } else {
    if (submitOrder) {
      var orderPlacementStatus = Order.submit(order);
      if (!orderPlacementStatus.error) {
        clearForms();
      }
      if (handlePaymentsResult.isAdyen) {
        return {
          continueUrl: URLUtils.url('Adyen-ShowConfirmation', 'authorized', 'true', 'merchantReference', order.orderNo, 'orderToken', order.orderToken).toString()
        };
      }
      return orderPlacementStatus;
    }
  }
  return handlePaymentsResult;
}
// ### Custom Adyen cartridge end ###

function clearForms() {
  // Clears all forms used in the checkout process.
  session.forms.singleshipping.clearFormElement();
  session.forms.multishipping.clearFormElement();
  session.forms.billing.clearFormElement();

  // clear cached order number
  session.privacy.currentOrderNumber = null;
  session.privacy.currentOrderToken = null;
}

/**
 * Asynchronous Callbacks for OCAPI. These functions result in a JSON response.
 * Sets the payment instrument information in the form from values in the httpParameterMap.
 * Checks that the payment instrument selected is valid and authorizes the payment. Renders error
 * message information if the payment is not authorized.
 */
function submitPaymentJSON() {
  var order = Order.get(request.httpParameterMap.order_id.stringValue);
  if (!order.object || request.httpParameterMap.order_token.stringValue !== order.getOrderToken()) {
    app.getView().render('checkout/components/faults');
    return;
  }
  session.forms.billing.paymentMethods.clearFormElement();
  var requestObject = JSON.parse(request.httpParameterMap.requestBodyAsString);
  var form = session.forms.billing.paymentMethods;
  for (var requestObjectItem in requestObject) {
    var asyncPaymentMethodResponse = requestObject[requestObjectItem];
    var terms = requestObjectItem.split('_');
    if (terms[0] === 'creditCard') {
      var value = terms[1] === 'month' || terms[1] === 'year' ? Number(asyncPaymentMethodResponse) : asyncPaymentMethodResponse;
      form.creditCard[terms[1]].setValue(value);
    } else if (terms[0] === 'selectedPaymentMethodID') {
      form.selectedPaymentMethodID.setValue(asyncPaymentMethodResponse);
    }
  }
  if (app.getController('COBilling').HandlePaymentSelection('cart').error || handlePayments().error) {
    app.getView().render('checkout/components/faults');
    return;
  }
  app.getView().render('checkout/components/payment_methods_success');
}

/*
 * Asynchronous Callbacks for SiteGenesis.
 * Identifies if an order exists, submits the order, and shows a confirmation message.
 */
function submit() {
  var order = Order.get(request.httpParameterMap.order_id.stringValue);
  var orderPlacementStatus;
  if (order.object && request.httpParameterMap.order_token.stringValue === order.getOrderToken()) {
    orderPlacementStatus = Order.submit(order.object);
    if (!orderPlacementStatus.error) {
      clearForms();
      return app.getController('COSummary').ShowConfirmation(order.object);
    }
  }
  app.getController('COSummary').Start();
}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controllers/COPlaceOrder~submitPaymentJSON */
exports.SubmitPaymentJSON = guard.ensure(['https'], submitPaymentJSON);
/** @see module:controllers/COPlaceOrder~submitPaymentJSON */
exports.Submit = guard.ensure(['https'], submit);

/*
 * Local methods
 */
exports.Start = start;