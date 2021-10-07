"use strict";

var handleAuthorize = require('./authorizeWithForm/authorize');

var handleError = require('./authorizeWithForm/error');
/**
 * Continues a 3DS1 payment.
 * Makes /payments/details call to 3d verification system to complete authorization.
 */


function authorizeWithForm(req, res, next) {
  var handleErr = function handleErr(msg) {
    return handleError(msg, {
      res: res,
      next: next
    });
  };

  try {
    return handleAuthorize({
      req: req,
      res: res,
      next: next
    });
  } catch (e) {
    return handleErr("Unable to retrieve order data from session. Message = ".concat(e.message));
  }
}

module.exports = authorizeWithForm;