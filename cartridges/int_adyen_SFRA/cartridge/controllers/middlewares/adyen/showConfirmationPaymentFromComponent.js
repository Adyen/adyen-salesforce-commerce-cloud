"use strict";

var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');
var handlePayment = require('*/cartridge/controllers/middlewares/adyen/showConfirmationPaymentFromComponent/payment');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

/*
 * Show confirmation for payments completed from component directly e.g. paypal, QRcode, ..
 */
function showConfirmationPaymentFromComponent(req, res, next) {
  var options = {
    req: req,
    res: res,
    next: next
  };
  try {
    session.privacy.giftCardResponse = null;
    var stateData = JSON.parse(req.form.additionalDetailsHidden);
    var order = OrderMgr.getOrder(req.form.merchantReference, req.form.orderToken);
    return handlePayment(stateData, order, options);
  } catch (e) {
    AdyenLogs.error_log("Could not verify /payment/details: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}
module.exports = showConfirmationPaymentFromComponent;