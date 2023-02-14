const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');
const Transaction = require('dw/system/Transaction');
const URLUtils = require('dw/web/URLUtils');
const Locale = require('dw/util/Locale');
const Resource = require('dw/web/Resource');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const OrderModel = require('*/cartridge/models/order');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const constants = require('*/cartridge/adyenConstants/constants');
const { clearForms } = require('*/cartridge/controllers/utils/index');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

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
  { req, res, next }
  )
  {
  // custom fraudDetection
  const fraudDetectionStatus = { status: 'success' };

  // Places the order
  const placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
  if (placeOrderResult.error) {
    return handlePaymentError(order, adyenPaymentInstrument, { res, next });
  }

  const currentLocale = Locale.getLocale(req.locale.id);
  const orderModel = new OrderModel(order, {
    countryCode: currentLocale.country,
  });

  // Save orderModel to custom object during session
  Transaction.wrap(() => {
    order.custom.Adyen_CustomerEmail = JSON.stringify(orderModel);
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

// Check result for Apple Pay, does not require /payments/details
function checkApplePayResponse(adyenPaymentInstrument, result) {
  const paymentMethodVariant =
    adyenPaymentInstrument.custom.adyenAction?.additionalData
      ?.paymentMethodVariant;
  if (
    AdyenHelper.isApplePay(paymentMethodVariant) &&
    result?.fullResponse?.isFinal
  ) {
    return JSON.parse(adyenPaymentInstrument.custom.adyenAction);
  }
  return false;
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
  return handlePaymentError(order, adyenPaymentInstrument, options);
}

// eslint-disable-next-line complexity
function handlePayment(stateData, order, options) {
  const paymentInstruments = order.getPaymentInstruments(
    AdyenHelper.getOrderMainPaymentInstrumentType(order),
  );
  const result = options.req.form?.result;

    AdyenLogs.error_log(`result ` + JSON.stringify(result));

//  const result = JSON.parse(options.req.form?.result); //todo: test with other PMs, can we parse it okay?
  const adyenPaymentInstrument = paymentInstruments[0];
  const hasStateData = stateData?.paymentData && stateData?.details;

  AdyenLogs.error_log(`before result.error`);

    if (result?.error || order.status.value === Order.ORDER_STATUS_FAILED) {
      AdyenLogs.error_log(
        `Could not call payment/details for order ${order.orderNo}`,
      );
      return handlePaymentError(order, adyenPaymentInstrument, options);
    }
  AdyenLogs.error_log(`after result.error`);

  let finalResult;
  if (!hasStateData) {
    AdyenLogs.error_log(`inside no state data`);
      const applePayResponse = checkApplePayResponse(
        adyenPaymentInstrument,
        result,
      );
    AdyenLogs.error_log(`result ` + JSON.stringify(result));

    if (
      result &&
      (JSON.stringify(result).indexOf('amazonpay') > -1 ||
        JSON.stringify(result).indexOf('applepay') > -1) //express
    ) {
      AdyenLogs.error_log(`inside first if in no state data`);
      finalResult = JSON.parse(result);
    }else if (applePayResponse) {
       AdyenLogs.error_log(`inside else apple pay response`);
       return handlePaymentResult(
         applePayResponse,
         order,
         adyenPaymentInstrument,
         options,
       );
     } else {
      AdyenLogs.error_log(`inside last else if no state data`);
      return handlePaymentError(order, adyenPaymentInstrument, options);
    }
  }
    AdyenLogs.error_log(`after if not has data`);

  const detailsCall = hasStateData
    ? handlePaymentsDetailsCall(stateData, adyenPaymentInstrument)
    : null;

  AdyenLogs.error_log(`detailsCall`);

  Transaction.wrap(() => {
    adyenPaymentInstrument.custom.adyenPaymentData = null;
  });
  finalResult = finalResult || detailsCall?.result;

 AdyenLogs.error_log(`before return `);

  return handlePaymentResult(
    finalResult,
    order,
    adyenPaymentInstrument,
    options,
  );
}

module.exports = handlePayment;
