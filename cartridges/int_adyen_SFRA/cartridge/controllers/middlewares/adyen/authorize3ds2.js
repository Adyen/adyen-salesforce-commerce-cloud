"use strict";

var Logger = require('dw/system/Logger');

var URLUtils = require('dw/web/URLUtils');

var createAuthorization = require('./authorize3ds2/auth');

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