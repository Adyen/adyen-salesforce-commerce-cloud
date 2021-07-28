"use strict";

var Logger = require('dw/system/Logger');

var handlePaymentMethod = require('./getPaymentMethod/payment');
/**
 * Make a request to Adyen to get available payment methods
 */


function getPMs(req, res, next) {
  try {
    return handlePaymentMethod({
      req: req,
      res: res,
      next: next
    });
  } catch (err) {
    var msg = "Error retrieving Payment Methods. Error message: ".concat(err.message, " more details: ").concat(err.toString(), " in ").concat(err.fileName, ":").concat(err.lineNumber);
    Logger.getLogger('Adyen').error(msg);
    return next();
  }
}

module.exports = getPMs;