"use strict";

var Logger = require('dw/system/Logger');

var URLUtils = require('dw/web/URLUtils');

var createAuthorization = require('*/cartridge/controllers/middlewares/adyen/authorize3ds2/auth');
/**
 * Continues a 3DS2 payment.
 * Makes second call to /payments/details with IdentifyShopper or ChallengeShopper token.
 *
 * @returns rendering template or error
 */


function authorize3ds2(req, res, next) {
  var options = {
    req: req,
    res: res,
    next: next
  };

  try {
    return createAuthorization(options);
  } catch (e) {
    Logger.getLogger('Adyen').error("Unable to authorise 3DS2. Message: ".concat(e.message));
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = authorize3ds2;