const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const constants = require('*/cartridge/adyenConstants/constants');
const payment = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/payment');
const { clearForms } = require('*/cartridge/controllers/utils/index');
const handleAuthorised = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/authorise');

function getPaymentDetailsPayload(querystring) {
  const requestObject = {details: {}};
  if (querystring.redirectResult) {
    requestObject.details = {redirectResult: querystring.redirectResult};
  }
  if (querystring.payload) {
    requestObject.details = {payload: querystring.payload};
  }
  return requestObject;
}

function handleRedirectResultAndAuthorize(options) {
  const querystring = options.req.querystring;
  // redirect to payment/details
  const requestObject = getPaymentDetailsPayload(querystring)

  const result = adyenCheckout.doPaymentsDetailsCall(requestObject);
  Logger.getLogger('Adyen').error('result payments details = ' + JSON.stringify(result));
  if (
      [
        constants.RESULTCODES.AUTHORISED,
        constants.RESULTCODES.PENDING,
        constants.RESULTCODES.RECEIVED,
      ].indexOf(result.resultCode) === -1
  ) {
    return payment.handlePaymentError(order, 'placeOrder', options);
  }
  const order = OrderMgr.getOrder(querystring.merchantReference);
  return handleAuthorised(
      order,
      options,
  );
}
/*
 * Makes a payment details call to Adyen and calls for the order confirmation to be shown
 * if the payment was accepted.
 */
function showConfirmation(req, res, next) {
  const options = { req, res, next };
  try {
    const order = OrderMgr.getOrder(req.querystring.merchantReference);
    // details request contents are in either redirectResult or payload
    //TODO verify showConfirmation route
    if (req.querystring.redirectResult || req.querystring.payload) {
      return handleRedirectResultAndAuthorize(options);
    }

    //TODO currently only happy flow 3DS2, implement error flow
    return handleAuthorised(
        order,
        options,
    );
    // return payment.handlePaymentError(order, 'placeOrder', options);
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
