/* API Includes */
const PaymentMgr = require('dw/order/PaymentMgr');
const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');
const constants = require('*/cartridge/adyenConstants/constants');

/* Script Modules */
const app = require(Resource.msg('scripts.app.js', 'require', null));
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenRemovePreviousPI = require('*/cartridge/scripts/adyenRemovePreviousPI');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

/**
 * Creates a Adyen payment instrument for the given basket
 */
function Handle(args) {
  const currentBasket = args.Basket;
  const paymentInformation = app.getForm('adyPaydata');

  Transaction.wrap(() => {
    const result = adyenRemovePreviousPI.removePaymentInstruments(
      currentBasket,
    );
    if (result.error) {
      return result;
    }
    const paymentInstrument = currentBasket.createPaymentInstrument(
      constants.METHOD_ADYEN_COMPONENT,
      currentBasket.totalGrossPrice,
    );
    paymentInstrument.custom.adyenPaymentData = paymentInformation
      .get('adyenStateData')
      .value();
    session.privacy.adyenFingerprint = paymentInformation
      .get('adyenFingerprint')
      .value();
  });

  return { success: true };
}

/**
 * Call the  Adyen API to Authorize CC using details entered by shopper.
 */
function Authorize(args) {
  const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
  const order = args.Order;
  const paymentInstrument = args.PaymentInstrument;
  const paymentProcessor = PaymentMgr.getPaymentMethod(
    paymentInstrument.getPaymentMethod(),
  ).getPaymentProcessor();

  Transaction.begin();
  paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;

  const orderCustomer = order.getCustomer();
  const sessionCustomer = session.getCustomer();
  if (orderCustomer.authenticated && orderCustomer.ID !== sessionCustomer.ID) {
    AdyenLogs.debug_log('orderCustomer is not the same as the sessionCustomer');
    Transaction.wrap(function () {
      OrderMgr.failOrder(order, true);
    });
    return {
      isAdyen: true,
      error: true,
      PlaceOrderError: 'orderCustomer is not the same as the sessionCustomer',
    };
  }

  const result = adyenCheckout.createPaymentRequest({
    Order: order,
    PaymentInstrument: paymentInstrument,
  });

  if (result.error) {
    Transaction.rollback();
    const args = 'args' in result ? result.args : null;

    return {
      isAdyen: true,
      error: true,
      PlaceOrderError:
        !empty(args) &&
        'AdyenErrorMessage' in args &&
        !empty(args.AdyenErrorMessage)
          ? args.AdyenErrorMessage
          : '',
    };
  }

  if (result.pspReference) {
    order.custom.Adyen_pspReference = result.pspReference;
  }

  const checkoutResponse = AdyenHelper.createAdyenCheckoutResponse(result);
  if (!checkoutResponse.isFinal) {
    checkoutResponse.isAdyen = true;
    checkoutResponse.orderToken = order.orderToken;
    return checkoutResponse;
  }

  if (!checkoutResponse.isSuccessful) {
    Transaction.rollback();
    return {
      isAdyen: true,
      error: true,
      PlaceOrderError:
        'AdyenErrorMessage' in result && !empty(result.adyenErrorMessage)
          ? result.adyenErrorMessage
          : '',
    };
  }

  AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
  Transaction.commit();
  return { isAdyen: true, authorized: true, error: false };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
