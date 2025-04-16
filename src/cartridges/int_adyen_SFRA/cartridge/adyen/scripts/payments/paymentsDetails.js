const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function getRedirectUrl(paymentInstruments, orderNo, orderToken) {
  const redirectUrl = AdyenHelper.createRedirectUrl(
    paymentInstruments[0],
    orderNo,
    orderToken,
  );
  return redirectUrl;
}

function getOrderAndValidate(orderNo, orderToken) {
  const order = OrderMgr.getOrder(orderNo, orderToken);
  if (!order) {
    throw new Error('Cannot perform /payments/details for invalid order');
  }
  return order;
}

function updatePaymentInstrument(paymentInstrument, paymentsDetailsResponse) {
  Transaction.wrap(() => {
    paymentInstrument.paymentTransaction.custom.Adyen_authResult =
      JSON.stringify(paymentsDetailsResponse);
  });
}

/*
 * Makes a payment details call to Adyen to confirm the current status of a payment
 */
function paymentsDetails(req, res, next) {
  try {
    const request = JSON.parse(req.form.data);
    const { orderNo } = session.privacy;
    const { orderToken } = request;
    const isAmazonpay = request?.data?.paymentMethod === 'amazonpay';
    if (request.data) {
      request.data.paymentMethod = undefined;
    }

    const paymentsDetailsResponse = adyenCheckout.doPaymentsDetailsCall(
      request.data,
    );
    const order = getOrderAndValidate(orderNo, orderToken);
    const paymentInstruments = order.getPaymentInstruments(
      AdyenHelper.getOrderMainPaymentInstrumentType(order),
    );
    updatePaymentInstrument(paymentInstruments[0], paymentsDetailsResponse);

    const response = AdyenHelper.createAdyenCheckoutResponse(
      paymentsDetailsResponse,
    );
    // Create signature to verify returnUrl
    const redirectUrl = getRedirectUrl(paymentInstruments, orderNo, orderToken);
    if (isAmazonpay) {
      response.fullResponse = {
        pspReference: paymentsDetailsResponse.pspReference,
        paymentMethod: paymentsDetailsResponse.additionalData.paymentMethod,
        resultCode: paymentsDetailsResponse.resultCode,
      };
    }
    if (redirectUrl) {
      response.redirectUrl = redirectUrl;
    }

    res.json(response);
    return next();
  } catch (error) {
    AdyenLogs.error_log('Could not verify /payment/details:', error);
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = paymentsDetails;
