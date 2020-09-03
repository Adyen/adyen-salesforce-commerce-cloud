const Resource = require('dw/web/Resource');
const Logger = require('dw/system/Logger');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function authorize(orderNumber, paymentInstrument, paymentProcessor) {
  const Transaction = require('dw/system/Transaction');
  const OrderMgr = require('dw/order/OrderMgr');
  const order = OrderMgr.getOrder(orderNumber);

  const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
  Transaction.wrap(() => {
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
  });

  Transaction.begin();
  const result = adyenCheckout.createPaymentRequest({
    Order: order,
    PaymentInstrument: paymentInstrument,
  });
  if (result.error) {
    const errors = [];
    errors.push(
      Resource.msg('error.payment.processor.not.supported', 'checkout', null),
    );
    return {
      authorized: false,
      fieldErrors: [],
      serverErrors: errors,
      error: true,
    };
  }
  // Trigger 3DS2 flow
  if (result.threeDS2 || result.resultCode === 'RedirectShopper') {
    paymentInstrument.custom.adyenPaymentData = result.paymentData;
    Transaction.commit();

    session.privacy.orderNo = order.orderNo;
    session.privacy.paymentMethod = paymentInstrument.paymentMethod;

    if (result.threeDS2) {
      return {
        threeDS2: result.threeDS2,
        resultCode: result.resultCode,
        token3ds2: result.token3ds2,
      };
    }

    let signature = null;
    let authorized3d = false;

    // If the response has MD, then it is a 3DS transaction
    if (
      result.redirectObject &&
      result.redirectObject.data &&
      result.redirectObject.data.MD
    ) {
      authorized3d = true;
      // Signature for 3DS payments
      signature = AdyenHelper.getAdyenHash(
        result.redirectObject.url.substr(result.redirectObject.url.length - 25),
        result.redirectObject.data.MD.substr(1, 25),
      );
    } else {
      // Signature for redirect methods
      signature = AdyenHelper.getAdyenHash(
        result.redirectObject.url.substr(result.redirectObject.url.length - 25),
        result.paymentData.substr(1, 25),
      );
    }

    return {
      authorized: true,
      authorized3d,
      orderNo: orderNumber,
      paymentInstrument,
      redirectObject: result.redirectObject,
      signature,
    };
  }
  if (result.decision !== 'ACCEPT') {
    Logger.getLogger('Adyen').error(
      `Payment failed, result: ${JSON.stringify(result)}`,
    );
    Transaction.rollback();
    return { error: true };
  }
  AdyenHelper.savePaymentDetails(paymentInstrument, order, result.fullResponse);
  Transaction.commit();
  return { authorized: true, error: false };
}

module.exports = authorize;
