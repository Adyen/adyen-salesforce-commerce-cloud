const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');
const Transaction = require('dw/system/Transaction');
const URLUtils = require('dw/web/URLUtils');
const Resource = require('dw/web/Resource');
const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const constants = require('*/cartridge/adyen/config/constants');
const clearForms = require('*/cartridge/adyen/utils/clearForms');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function handlePaymentError(order, adyenPaymentInstrument, { res, next }) {
  clearForms.clearAdyenData(adyenPaymentInstrument);
  Transaction.wrap(() => {
    OrderMgr.failOrder(order, true);
  });
  res.redirect(
    URLUtils.url(
      'Checkout-Begin',
      'stage',
      'payment',
      'paymentError',
      Resource.msg('error.payment.not.valid', 'checkout', null),
    ),
  );
  return next();
}

function handlePaymentsDetailsCall(stateData, adyenPaymentInstrument) {
  const { details, paymentData } = stateData;

  // redirect to payment/details
  const requestObject = {
    details,
    paymentData,
  };

  const result = adyenCheckout.doPaymentsDetailsCall(requestObject);
  return { result, adyenPaymentInstrument };
}

function handleAuthorisedPayment(
  order,
  result,
  adyenPaymentInstrument,
  { res, next },
) {
  Transaction.wrap(() => {
    AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, result);
  });

  clearForms.clearAdyenData(adyenPaymentInstrument);
  clearForms.clearForms();
  // determines SFRA version for backwards compatibility
  if (AdyenConfigs.getAdyenSFRA6Compatibility() === true) {
    res.render('orderConfirmForm', {
      orderID: order.orderNo,
      orderToken: order.orderToken,
    });
  } else {
    res.redirect(
      URLUtils.url(
        'Order-Confirm',
        'ID',
        order.orderNo,
        'token',
        order.orderToken,
      ).toString(),
    );
  }
  return next();
}

function handlePaymentResult(result, order, adyenPaymentInstrument, options) {
  // Authorised: The payment authorisation was successfully completed.
  if (
    [
      constants.RESULTCODES.AUTHORISED,
      constants.RESULTCODES.PENDING,
      constants.RESULTCODES.RECEIVED,
    ].indexOf(result.resultCode) > -1
  ) {
    return handleAuthorisedPayment(
      order,
      result,
      adyenPaymentInstrument,
      options,
    );
  }
  Transaction.wrap(() => {
    order.custom.Adyen_pspReference = result.pspReference;
    order.custom.Adyen_eventCode = result.resultCode;
    order.custom.Adyen_paypalExpressResponse = null;
    adyenPaymentInstrument.custom.adyenPaymentData = null;
    session.privacy.paypalExpressOrderNo = null;
    session.privacy.pspReference = null;
  });
  return handlePaymentError(order, adyenPaymentInstrument, options);
}

// eslint-disable-next-line complexity
function handlePayment(stateData, order, options) {
  const paymentInstruments = order.getPaymentInstruments(
    AdyenHelper.getOrderMainPaymentInstrumentType(order),
  );
  const result = JSON.parse(options.req.form?.result);

  const adyenPaymentInstrument = paymentInstruments[0];
  const hasStateData = stateData?.paymentData && stateData?.details;

  if (result?.error || order.status.value === Order.ORDER_STATUS_FAILED) {
    AdyenLogs.error_log(
      `Could not call payment/details for order ${order.orderNo}`,
    );
    return handlePaymentError(order, adyenPaymentInstrument, options);
  }

  let finalResult;
  if (!hasStateData) {
    if (
      result &&
      (JSON.stringify(result).indexOf('amazonpay') > -1 ||
        JSON.stringify(result).indexOf('applepay') > -1 ||
        JSON.stringify(result).indexOf('googlepay') > -1 ||
        JSON.stringify(result).indexOf('cashapp') > -1)
    ) {
      finalResult = result;
    } else {
      return handlePaymentError(order, adyenPaymentInstrument, options);
    }
  }
  const paymentData = JSON.parse(
    adyenPaymentInstrument.custom.adyenPaymentData,
  );
  const isPayPalExpress = AdyenHelper.isPayPalExpress(
    paymentData.paymentMethod,
  );
  const detailsCall =
    hasStateData && !isPayPalExpress
      ? handlePaymentsDetailsCall(stateData, adyenPaymentInstrument)
      : null;
  if (isPayPalExpress) {
    finalResult = JSON.parse(order.custom.Adyen_paypalExpressResponse);
  } else {
    finalResult = finalResult || detailsCall?.result;
  }

  return handlePaymentResult(
    finalResult,
    order,
    adyenPaymentInstrument,
    options,
  );
}

module.exports = handlePayment;
