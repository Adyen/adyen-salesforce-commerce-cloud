const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const constants = require('*/cartridge/adyenConstants/constants');
const payment = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/payment');
const { clearForms } = require('*/cartridge/controllers/utils/index');
const handleAuthorised = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/authorise');

function getPaymentDetailsPayload(querystring) {
  const details = querystring.redirectResult
    ? { redirectResult: querystring.redirectResult }
    : { payload: querystring.payload };
  return {
    details,
  };
}

function getPaymentsDetailsResult(
  paymentInstruments,
  redirectResult,
  payload,
  req,
) {
  const hasQuerystringDetails = !!(redirectResult || payload);
  // Saved response from Adyen-PaymentsDetails
  let result = JSON.parse(
    paymentInstruments[0].paymentTransaction.custom.Adyen_authResult,
  );
  if (hasQuerystringDetails) {
    const requestObject = getPaymentDetailsPayload(req.querystring);
    result = adyenCheckout.doPaymentsDetailsCall(requestObject);
  }
  clearForms.clearPaymentTransactionData(paymentInstruments[0]);
  return result;
}

function handlePaymentsDetailsResult(detailsResult, order, options) {
  if (
    [
      constants.RESULTCODES.AUTHORISED,
      constants.RESULTCODES.PENDING,
      constants.RESULTCODES.RECEIVED,
    ].indexOf(detailsResult.resultCode) > -1
  ) {
    return handleAuthorised(order, options);
  }
  return payment.handlePaymentError(order, 'placeOrder', options);
}

/*
 * Makes a payment details call to Adyen and calls for the order confirmation to be shown
 * if the payment was accepted.
 */
function showConfirmation(req, res, next) {
  const options = { req, res, next };
  const {
    redirectResult,
    payload,
    signature,
    merchantReference,
  } = req.querystring;
  try {
    const order = OrderMgr.getOrder(merchantReference);
    const paymentInstruments = order.getPaymentInstruments(
      constants.METHOD_ADYEN_COMPONENT,
    );
    if (
      paymentInstruments[0].paymentTransaction.custom.Adyen_merchantSig ===
      signature
    ) {
      if (order.status.value === Order.ORDER_STATUS_FAILED) {
        Logger.getLogger('Adyen').error(
          `Could not call payment/details for failed order ${order.orderNo}`,
        );
        return payment.handlePaymentError(order, 'placeOrder', options);
      }
      const detailsResult = getPaymentsDetailsResult(
        paymentInstruments,
        redirectResult,
        payload,
        req,
      );
      return handlePaymentsDetailsResult(detailsResult, order, options);
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
}

module.exports = showConfirmation;
