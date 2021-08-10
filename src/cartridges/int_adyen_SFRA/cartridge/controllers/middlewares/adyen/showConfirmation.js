const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const constants = require('*/cartridge/adyenConstants/constants');
const payment = require('./showConfirmation/payment');
const { clearForms } = require('../../utils/index');
const handleAuthorised = require('./showConfirmation/authorise');

/*
 * Makes a payment details call to Adyen and calls for the order confirmation to be shown
 * if the payment was accepted.
 */
function showConfirmation(req, res, next) {
  const options = { req, res, next };

  try {
    const order = OrderMgr.getOrder(req.querystring.merchantReference);
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
    clearForms.clearAdyenData(adyenPaymentInstrument);

    if (result.invalidRequest) {
      Logger.getLogger('Adyen').error('Invalid /payments/details call');
      return response.redirect(URLUtils.httpHome());
    }
    // Authorised: The payment authorisation was successfully completed.
    if (['Authorised', 'Pending', 'Received'].indexOf(result.resultCode) > -1) {
      const merchantRefOrder = OrderMgr.getOrder(result.merchantReference);
      return handleAuthorised(
        merchantRefOrder,
        result,
        adyenPaymentInstrument,
        options,
      );
    }
    return payment.handlePaymentError(order, 'placeOrder', options);
  } catch (e) {
    Logger.getLogger('Adyen').error(
      `Could not verify /payment/details: ${e.toString()} in ${e.fileName}:${
        e.lineNumber
      }`,
    );
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = showConfirmation;
