const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const constants = require('*/cartridge/adyenConstants/constants');

/*
 * Makes a payment details call to Adyen to confirm the current status of a payment
 */
function paymentsDetails(req, res, next) {
  try {
    const request = JSON.parse(req.body);
    const isAmazonpay = request.paymentMethod === 'amazonpay';
    request.paymentMethod = undefined;

    const paymentsDetailsResponse = adyenCheckout.doPaymentsDetailsCall(
      request,
    );

    const response = AdyenHelper.createAdyenCheckoutResponse(
      paymentsDetailsResponse,
    );

    const signature = getSignature(paymentsDetailsResponse);

    if (isAmazonpay) {
      response.fullResponse = {
        pspReference: paymentsDetailsResponse.pspReference,
        paymentMethod: paymentsDetailsResponse.additionalData.paymentMethod,
        resultCode: paymentsDetailsResponse.resultCode,
      };
    }

    response.redirectUrl = URLUtils.url('Adyen-ShowConfirmation', 'merchantReference', response.merchantReference, 'signature', signature).toString();
    res.json(response);
    return next();
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

function getSignature(paymentsDetailsResponse){
  const order = OrderMgr.getOrder(paymentsDetailsResponse.merchantReference);
  const paymentInstruments = order.getPaymentInstruments(
      constants.METHOD_ADYEN_COMPONENT,
  );

  const signature = AdyenHelper.createSignature(paymentInstruments[0], order.getUUID(), paymentsDetailsResponse.merchantReference);
  Transaction.wrap(function(){
    paymentInstruments[0].paymentTransaction.custom.Adyen_authResult = JSON.stringify(paymentsDetailsResponse);
  })
  return signature;
}

module.exports = paymentsDetails;
