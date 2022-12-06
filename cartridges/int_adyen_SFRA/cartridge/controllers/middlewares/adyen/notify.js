"use strict";

var Transaction = require('dw/system/Transaction');
var checkAuth = require('*/cartridge/scripts/checkNotificationAuth');
var handleNotify = require('*/cartridge/scripts/handleNotify');

/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */
function notify(req, res, next) {
  var status = checkAuth.check(req);
  if (!status) {
    res.render('/adyen/error');
    return {};
  }
  Transaction.begin();
  var notificationResult = handleNotify.notify(req.form);
  if (notificationResult.success) {
    Transaction.commit();
    res.render('/notify');
  } else {
    res.render('/notifyError', {
      errorMessage: notificationResult.errorMessage
    });
    Transaction.rollback();
  }
  return next();
}
module.exports = notify;