"use strict";

var OrderMgr = require('dw/order/OrderMgr');

var Logger = require('dw/system/Logger');

var URLUtils = require('dw/web/URLUtils');

var handlePayment = require('*/cartridge/controllers/middlewares/adyen/showConfirmationPaymentFromComponent/payment');
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
    var stateData = JSON.parse(req.form.additionalDetailsHidden);
    var order = OrderMgr.getOrder(req.form.merchantReference, req.form.orderToken);
    return handlePayment(stateData, order, options);
  } catch (e) {
    Logger.getLogger('Adyen').error("Could not verify /payment/details: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = showConfirmationPaymentFromComponent;