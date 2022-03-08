const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const constants = require('*/cartridge/adyenConstants/constants');

function getSignature(paymentsDetailsResponse) {
  const order = OrderMgr.getOrder(paymentsDetailsResponse.merchantReference);
  if (order) {
    const paymentInstruments = order.getPaymentInstruments(
      constants.METHOD_ADYEN_COMPONENT,
    );

    const signature = AdyenHelper.createSignature(
      paymentInstruments[0],
      order.getUUID(),
      paymentsDetailsResponse.merchantReference,
    );
    Transaction.wrap(() => {
      paymentInstruments[0].paymentTransaction.custom.Adyen_authResult = JSON.stringify(
        paymentsDetailsResponse,
      );
    });
    return signature;
  }
  return undefined;
}

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

    // Create signature to verify returnUrl
    const signature = getSignature(paymentsDetailsResponse);

    if (isAmazonpay) {
      response.fullResponse = {
        pspReference: paymentsDetailsResponse.pspReference,
        paymentMethod: paymentsDetailsResponse.additionalData.paymentMethod,
        resultCode: paymentsDetailsResponse.resultCode,
      };
    }

    if (signature !== null) {
      response.redirectUrl = URLUtils.url(
        'Adyen-ShowConfirmation',
        'merchantReference',
        response.merchantReference,
        'signature',
        signature,
      ).toString();
    }

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

module.exports = paymentsDetails;
