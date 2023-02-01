const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

function getSignature(paymentsDetailsResponse, orderToken) {
  const order = OrderMgr.getOrder(
    paymentsDetailsResponse.merchantReference,
    orderToken,
  );
  if (order) {
    const paymentInstruments = order.getPaymentInstruments(
      AdyenHelper.getOrderMainPaymentInstrumentType(order),
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

    const isAmazonpay = request?.data?.paymentMethod === 'amazonpay';
    if (request.data) {
      request.data.paymentMethod = undefined;
    }

    const paymentsDetailsResponse = adyenCheckout.doPaymentsDetailsCall(
      request.data,
    );

    const response = AdyenHelper.createAdyenCheckoutResponse(
      paymentsDetailsResponse,
    );

    // Create signature to verify returnUrl
    const signature = getSignature(paymentsDetailsResponse, request.orderToken);

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
        'orderToken',
        request.orderToken,
      ).toString();
    }

    res.json(response);
    return next();
  } catch (e) {
    AdyenLogs.error_log(
      `Could not verify /payment/details: ${e.toString()} in ${e.fileName}:${
        e.lineNumber
      }`,
    );
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = paymentsDetails;
