const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const constants = require('*/cartridge/adyenConstants/constants');
const payment = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/payment');
const { clearForms } = require('*/cartridge/controllers/utils/index');
const handleAuthorised = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/authorise');

/*
 * Makes a payment details call to Adyen and calls for the order confirmation to be shown
 * if the payment was accepted.
 */
function showConfirmation(req, res, next) {
  const options = { req, res, next };
  try {
    const order = OrderMgr.getOrder(req.querystring.merchantReference);
    // details is either redirectResult or payload
    //TODO verify showConfirmation route
    if (req.querystring.redirectResult) {
      let details = {redirectResult: req.querystring.redirectResult};
      if (req.querystring.payload) {
        details = {payload: req.querystring.payload};
      }

      // redirect to payment/details
      const requestObject = {
        details,
      };

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
    }

    // const merchantRefOrder = OrderMgr.getOrder(req.querystring.merchantReference);
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
