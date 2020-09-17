const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const constants = require('*/cartridge/adyenConstants/constants');
const payment = require('./showConfirmation/payment');
const handleAuthorised = require('./showConfirmation/authorise');

function showConfirmation(req, res, next) {
  const options = { req, res, next };

  try {
    const order = OrderMgr.getOrder(session.privacy.orderNo);
    const paymentInstruments = order.getPaymentInstruments(
      constants.METHOD_ADYEN_COMPONENT,
    );
    const {
      details,
      paymentData,
      adyenPaymentInstrument,
    } = payment.handlePaymentInstruments(paymentInstruments, options);

    // redirect to payment/details
    const requestObject = {
      details,
      paymentData,
    };

    const result = adyenCheckout.doPaymentDetailsCall(requestObject);
    Transaction.wrap(() => {
      adyenPaymentInstrument.custom.adyenPaymentData = null;
    });

    // Authorised: The payment authorisation was successfully completed.
    if (['Authorised', 'Pending', 'Received'].indexOf(result.resultCode) > -1) {
      return handleAuthorised(order, result, adyenPaymentInstrument, options);
    }
    return payment.handlePaymentError(order, 'placeOrder', options);
  } catch (e) {
    Logger.getLogger('Adyen').error(
      `Could not verify /payment/details: ${e.message}`,
    );
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = showConfirmation;
