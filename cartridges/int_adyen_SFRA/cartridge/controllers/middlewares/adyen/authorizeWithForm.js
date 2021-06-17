"use strict";

var handleAuthorize = require('./authorizeWithForm/authorize');

var handleError = require('./authorizeWithForm/error');

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