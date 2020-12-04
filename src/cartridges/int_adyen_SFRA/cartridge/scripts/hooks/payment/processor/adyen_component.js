/**
 *
 */

const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');
const Logger = require('dw/system/Logger');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const collections = require('*/cartridge/scripts/util/collections');
const constants = require('*/cartridge/adyenConstants/constants');

function Handle(basket, paymentInformation) {
  const currentBasket = basket;
  const cardErrors = {};
  const serverErrors = [];
  Transaction.wrap(function () {
    collections.forEach(currentBasket.getPaymentInstruments(), function (item) {
      currentBasket.removePaymentInstrument(item);
    });
    const paymentInstrument = currentBasket.createPaymentInstrument(
      constants.METHOD_ADYEN_COMPONENT,
      currentBasket.totalGrossPrice,
    );
    paymentInstrument.custom.adyenPaymentData = paymentInformation.stateData;
    paymentInstrument.custom.adyenPaymentMethod = paymentInformation.adyenPaymentMethod;

    if (paymentInformation.isCreditCard) {
      const sfccCardType = AdyenHelper.getSFCCCardType(
        paymentInformation.cardType,
      );
      const tokenID = AdyenHelper.getCardToken(
        paymentInformation.storedPaymentUUID,
        customer,
      );

      paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber);
      paymentInstrument.setCreditCardType(sfccCardType);

      if (tokenID) {
        paymentInstrument.setCreditCardExpirationMonth(
          paymentInformation.expirationMonth.value,
        );
        paymentInstrument.setCreditCardExpirationYear(
          paymentInformation.expirationYear.value,
        );
        paymentInstrument.setCreditCardToken(tokenID);
      }
    } else {
      // Local payment data
      paymentInstrument.custom.adyenIssuerName = paymentInformation.adyenIssuerName ? paymentInformation.adyenIssuerName : null;
    }
  });

  return { fieldErrors: cardErrors, serverErrors: serverErrors, error: false };
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
  const Transaction = require('dw/system/Transaction');
  const OrderMgr = require('dw/order/OrderMgr');
  const order = OrderMgr.getOrder(orderNumber);

  const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

  const errors = [];
  const errorObj = {
    authorized: false,
    fieldErrors: [],
    serverErrors: errors,
    error: true,
  };

  Transaction.begin();
  paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
  const orderCustomer = order.getCustomer();
  const sessionCustomer = session.getCustomer();
  if (orderCustomer.authenticated && orderCustomer.ID !== sessionCustomer.ID) {
    Logger.getLogger('Adyen').error('orderCustomer is not the same as the sessionCustomer');
    Transaction.wrap(function () {
      OrderMgr.failOrder(order, true);
    });
    errors.push(
      Resource.msg('error.technical', 'checkout', null),
    );
    return {
      ...errorObj,
    };
  }
  const result = adyenCheckout.createPaymentRequest({
    Order: order,
    PaymentInstrument: paymentInstrument,
  });
  if (result.error) {
    errors.push(
      Resource.msg('error.payment.processor.not.supported', 'checkout', null),
    );
    return {
      ...errorObj,
    };
  }
  // Trigger 3DS2 flow
  if (result.threeDS2 || result.resultCode === 'RedirectShopper') {
    paymentInstrument.custom.adyenPaymentData = result.paymentData;
    Transaction.commit();

    if (result.threeDS2) {
      return {
        threeDS2: result.threeDS2,
        resultCode: result.resultCode,
        token3ds2: result.token3ds2,
        action: result.action,
        merchantReference: order.orderNo,
      };
    }

    let signature = null;
    let authorized3d = false;

    // If the response has MD, then it is a 3DS transaction
    if (
      result.redirectObject
      && result.redirectObject.data
      && result.redirectObject.data.MD
    ) {
      authorized3d = true;
      signature = AdyenHelper.getAdyenHash(
        result.redirectObject.url.substr(result.redirectObject.url.length - 25),
        result.redirectObject.data.MD.substr(1, 25),
      );
    } else {
      // Signature only needed for redirect methods
      signature = AdyenHelper.getAdyenHash(
        result.redirectObject.url.substr(result.redirectObject.url.length - 25),
        result.paymentData.substr(1, 25),
      );
    }

    return {
      authorized: true,
      authorized3d: authorized3d,
      orderNo: orderNumber,
      paymentInstrument: paymentInstrument,
      redirectObject: result.redirectObject,
      signature: signature,
    };
  } if (result.decision !== 'ACCEPT') {
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

exports.Handle = Handle;
exports.Authorize = Authorize;
