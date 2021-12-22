const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const constants = require('*/cartridge/adyenConstants/constants');
const payment = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/payment');
const { clearForms } = require('*/cartridge/controllers/utils/index');
const handleAuthorised = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/authorise');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');

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

/*
 * Makes a payment details call to Adyen and calls for the order confirmation to be shown
 * if the payment was accepted.
 */
function showConfirmation(req, res, next) {
  const options = { req, res, next };
  const { redirectResult, payload, signature, merchantReference } = req.querystring;
  try {
    const order = OrderMgr.getOrder(merchantReference);
    const paymentInstruments = order.getPaymentInstruments(
        constants.METHOD_ADYEN_COMPONENT,
    );
    if(paymentInstruments[0].paymentTransaction.custom.Adyen_merchantSig === signature) {
      //Saved response from Adyen-PaymentsDetails
      if (order.status.value === Order.ORDER_STATUS_FAILED) {
        Logger.getLogger('Adyen').error(
            `Could not call payment/details for failed order ${order.orderNo}`,
        );
        return payment.handlePaymentError(order, 'placeOrder', options);
      }
      let result = JSON.parse(paymentInstruments[0].paymentTransaction.custom.Adyen_authResult);
      if (redirectResult || payload) {
        const requestObject = getPaymentDetailsPayload(req.querystring);
        result = adyenCheckout.doPaymentsDetailsCall(requestObject);
      }
      clearPaymentTransactionData(paymentInstruments[0]);
      if (
          [
            constants.RESULTCODES.AUTHORISED,
            constants.RESULTCODES.PENDING,
            constants.RESULTCODES.RECEIVED,
          ].indexOf(result.resultCode) > -1
      ) {
        return handleAuthorised(
            order,
            options,
        );
      }

      return payment.handlePaymentError(order, 'placeOrder', options);
    }

    throw new Error(`Incorrect signature for order ${merchantReference}`);
  } catch (e) {
    Logger.getLogger('Adyen').error(
      `Could not verify /payment/details: ${e.toString()} in ${e.fileName}:${
        e.lineNumber
      }`,
    );
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }

  function clearPaymentTransactionData(paymentInstrument){
    Transaction.wrap(function(){
      paymentInstrument.paymentTransaction.custom.Adyen_authResult = null;
      paymentInstrument.paymentTransaction.custom.Adyen_merchantSig = null;
    })
  }
}

module.exports = showConfirmation;
