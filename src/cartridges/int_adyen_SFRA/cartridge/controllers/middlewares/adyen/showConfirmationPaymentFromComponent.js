const OrderMgr = require('dw/order/OrderMgr');
const URLUtils = require('dw/web/URLUtils');
const handlePayment = require('*/cartridge/controllers/middlewares/adyen/showConfirmationPaymentFromComponent/payment');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

/*
 * Show confirmation for payments completed from component directly e.g. paypal, QRcode, ..
 */
function showConfirmationPaymentFromComponent(req, res, next) {
  const options = { req, res, next };
  try {
    session.privacy.giftCardResponse = null;
    const stateData = JSON.parse(req.form.additionalDetailsHidden);
    const order = OrderMgr.getOrder(
      req.form.merchantReference,
      req.form.orderToken,
    );
    return handlePayment(stateData, order, options);
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

module.exports = showConfirmationPaymentFromComponent;
