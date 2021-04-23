"use strict";

var OrderMgr = require('dw/order/OrderMgr');

var Logger = require('dw/system/Logger');

var Transaction = require('dw/system/Transaction');

var constants = require('*/cartridge/adyenConstants/constants');

var _require = require('./redirect/signature'),
    getCurrentSignature = _require.getCurrentSignature,
    handleIncorrectSignature = _require.handleIncorrectSignature;

function redirect(req, res, next) {
  var _req$querystring = req.querystring,
      signature = _req$querystring.signature,
      merchantReference = _req$querystring.merchantReference;
  var order = OrderMgr.getOrder(merchantReference);

  if (order && signature) {
    var currentSignature = getCurrentSignature(order);

    if (signature === currentSignature) {
      var paymentInstrument = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT)[0];
      var redirectUrl = paymentInstrument.custom.adyenRedirectURL;
      res.redirect(redirectUrl);
      Transaction.wrap(function () {
        paymentInstrument.custom.adyenRedirectURL = null;
      });
      return next();
    }
  } else {
    Logger.getLogger('Adyen').error("No signature or no order with orderNo ".concat(merchantReference));
  }

  return handleIncorrectSignature(order, {
    res: res,
    next: next
  });
}

module.exports = redirect;