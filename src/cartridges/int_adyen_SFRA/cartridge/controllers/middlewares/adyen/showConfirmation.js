const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
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
  let order;
  try {
    if(req.httpMethod === 'GET') {
      const querystring = options.req.querystring;
      const order = OrderMgr.getOrder(querystring.merchantReference);
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
      return handleAuthorised(
          order,
          options,
      );

    }

    if(req.httpMethod === 'POST') {
      Logger.getLogger('Adyen').error('req.body:');
      const body = JSON.parse(req.body);
      Logger.getLogger('Adyen').error(JSON.stringify(body.data));
      const requestObject = body.data;
      const order = OrderMgr.getOrder(body.merchantReference);
      const paymentsDetailsResponse = adyenCheckout.doPaymentsDetailsCall(requestObject);
      const response = AdyenHelper.createAdyenCheckoutResponse(
          paymentsDetailsResponse,
      );
      if(response.isSuccessful){
        response.redirectUrl = URLUtils.url('Adyen-ShowConfirmation', 'merchantReference', response.merchantReference).toString();
      } else {
        Transaction.wrap(() => {
          OrderMgr.failOrder(order, true);
        });
        response.redirectUrl = URLUtils.url(
            'Checkout-Begin',
            'stage',
            'placeOrder',
            'paymentError',
            Resource.msg('error.payment.not.valid', 'checkout', null),
        ).toString()
      }
      res.json(response);
      return next();
    }

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
