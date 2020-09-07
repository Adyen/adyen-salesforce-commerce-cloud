const OrderMgr = require('dw/order/OrderMgr');
const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');
const Locale = require('dw/util/Locale');
const Resource = require('dw/web/Resource');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const constants = require('*/cartridge/adyenConstants/constants');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const OrderModel = require('*/cartridge/models/order');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const { clearForms } = require('../../utils/index');

function showConfirmationPaymentFromComponent(req, res, next) {
  function handlePaymentError(order) {
    Transaction.wrap(() => {
      OrderMgr.failOrder(order, true);
    });
    res.redirect(
      URLUtils.url(
        'Checkout-Begin',
        'stage',
        'placeOrder',
        'paymentError',
        Resource.msg('error.payment.not.valid', 'checkout', null),
      ),
    );
    return next();
  }

  function checkStateData(stateData, paymentInstruments) {
    let adyenPaymentInstrument;

    // looping through all Adyen payment methods, however, this only can be one.
    const instrumentsIter = paymentInstruments.iterator();
    while (instrumentsIter.hasNext()) {
      adyenPaymentInstrument = instrumentsIter.next();
    }

    const hasStateData =
      stateData && stateData.paymentData && stateData.details;

    return { hasStateData, adyenPaymentInstrument };
  }

  function handlePaymentsDetailsCall(stateData, adyenPaymentInstrument) {
    const { details } = stateData;
    const { paymentData } = stateData;

    // redirect to payment/details
    const requestObject = {
      details,
      paymentData,
    };

    const result = adyenCheckout.doPaymentDetailsCall(requestObject);
    return { result, adyenPaymentInstrument };
  }

  function handleAuthorisedPayment(order, result, adyenPaymentInstrument) {
    // custom fraudDetection
    const fraudDetectionStatus = { status: 'success' };

    // Places the order
    const placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
    if (placeOrderResult.error) {
      return handlePaymentError(order);
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

    clearForms();
    res.redirect(
      URLUtils.https(
        'Order-Confirm',
        'ID',
        order.orderNo,
        'token',
        order.orderToken,
      ).toString(),
    );
    return next();
  }
  console.log('showConfirmation start');
  try {
    const stateData = JSON.parse(req.form.additionalDetailsHidden);
    const order = OrderMgr.getOrder(session.privacy.orderNo);
    const paymentInstruments = order.getPaymentInstruments(
      constants.METHOD_ADYEN_COMPONENT,
    );

    const { hasStateData, adyenPaymentInstrument } = checkStateData(
      stateData,
      paymentInstruments,
    );

    if (!hasStateData) {
      Transaction.wrap(() => {
        OrderMgr.failOrder(order, true);
        adyenPaymentInstrument.custom.adyenPaymentData = null;
      });
      res.redirect(
        URLUtils.url(
          'Checkout-Begin',
          'stage',
          'placeOrder',
          'paymentError',
          Resource.msg('error.payment.not.valid', 'checkout', null),
        ),
      );
      return next();
    }

    const { result } = handlePaymentsDetailsCall(
      stateData,
      adyenPaymentInstrument,
    );
    console.log(result);
    Transaction.wrap(() => {
      adyenPaymentInstrument.custom.adyenPaymentData = null;
    });
    // Authorised: The payment authorisation was successfully completed.
    if (['Authorised', 'Pending', 'Received'].indexOf(result.resultCode) > -1) {
      return handleAuthorisedPayment(order, result, adyenPaymentInstrument);
    }
    console.log(result.resultCode);
    return handlePaymentError(order);
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

module.exports = showConfirmationPaymentFromComponent;
