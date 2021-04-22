"use strict";

var URLUtils = require('dw/web/URLUtils');

var Logger = require('dw/system/Logger');

function handleError(msg, _ref) {
  var res = _ref.res,
      next = _ref.next;
  Logger.getLogger('Adyen').error(msg);
  res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  return next();
}

module.exports = handleError;