"use strict";

var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');
var handlePayment = require('*/cartridge/adyen/scripts/showConfirmation/handlePaymentFromComponent');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

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
  } catch (error) {
    AdyenLogs.error_log('Could not verify /payment/details', error);
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}
module.exports = showConfirmationPaymentFromComponent;