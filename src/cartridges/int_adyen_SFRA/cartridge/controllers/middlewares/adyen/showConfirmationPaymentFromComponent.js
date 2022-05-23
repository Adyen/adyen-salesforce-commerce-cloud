const OrderMgr = require('dw/order/OrderMgr');
const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const handlePayment = require('*/cartridge/controllers/middlewares/adyen/showConfirmationPaymentFromComponent/payment');

/*
 * Show confirmation for payments completed from component directly e.g. paypal, QRcode, ..
 */
function showConfirmationPaymentFromComponent(req, res, next) {
  const options = { req, res, next };
  try {
    const stateData = JSON.parse(req.form.additionalDetailsHidden);
    const order = OrderMgr.getOrder(
      req.form.merchantReference,
      req.form.orderToken,
    );
    return handlePayment(stateData, order, options);
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
