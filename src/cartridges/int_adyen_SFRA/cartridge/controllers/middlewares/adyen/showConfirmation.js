const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
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
  adyenPaymentInstrument,
  redirectResult,
  payload,
  req,
) {
  const hasQuerystringDetails = !!(redirectResult || payload);
  // Saved response from Adyen-PaymentsDetails
  let result = JSON.parse(
    adyenPaymentInstrument.paymentTransaction.custom.Adyen_authResult,
  );
  if (hasQuerystringDetails) {
    const requestObject = getPaymentDetailsPayload(req.querystring);
    result = adyenCheckout.doPaymentsDetailsCall(requestObject);
  }
  clearForms.clearPaymentTransactionData(adyenPaymentInstrument);
  return result;
}

function handlePaymentsDetailsResult(
  adyenPaymentInstrument,
  detailsResult,
  order,
  options,
) {
  if (
    [
      constants.RESULTCODES.AUTHORISED,
      constants.RESULTCODES.PENDING,
      constants.RESULTCODES.RECEIVED,
    ].indexOf(detailsResult.resultCode) > -1
  ) {
    return handleAuthorised(
      adyenPaymentInstrument,
      detailsResult,
      order,
      options,
    );
  }
  return payment.handlePaymentError(order, 'placeOrder', options);
}

function setPaymentMethodField(adyenPaymentInstrument, order) {
  if (adyenPaymentInstrument.custom.adyenPaymentData) {
    // Adyen_paymentMethod is used in Adyen Giving
    Transaction.wrap(() => {
      order.custom.Adyen_paymentMethod = JSON.parse(
        adyenPaymentInstrument.custom.adyenPaymentData,
      ).paymentMethod?.type;
    });
  }
}

function isOrderAlreadyProcessed(order) {
  return (
    order.status.value !== Order.ORDER_STATUS_CREATED &&
    order.status.value !== Order.ORDER_STATUS_FAILED
  );
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
    orderToken,
  } = req.querystring;
  try {
    const order = OrderMgr.getOrder(merchantReference, orderToken);
    const adyenPaymentInstrument = order.getPaymentInstruments(
      constants.METHOD_ADYEN_COMPONENT,
    )[0];

    if (isOrderAlreadyProcessed(order)) {
      Logger.getLogger('Adyen').debug(
        'ShowConfirmation called for an order which has already been processed. This is likely to be caused by shoppers using the back button after order confirmation',
      );
      res.redirect(URLUtils.url('Cart-Show'));
      return next();
    }

    if (
      adyenPaymentInstrument.paymentTransaction.custom.Adyen_merchantSig ===
      signature
    ) {
      if (order.status.value === Order.ORDER_STATUS_FAILED) {
        Logger.getLogger('Adyen').error(
          `Could not call payment/details for failed order ${order.orderNo}`,
        );
        return payment.handlePaymentError(order, 'placeOrder', options);
      }

      // making sure Adyen_paymentMethod is populated before calling clearAdyenData()
      setPaymentMethodField(adyenPaymentInstrument, order);

      const detailsResult = getPaymentsDetailsResult(
        adyenPaymentInstrument,
        redirectResult,
        payload,
        req,
      );
      return handlePaymentsDetailsResult(
        adyenPaymentInstrument,
        detailsResult,
        order,
        options,
      );
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
