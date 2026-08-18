const Transaction = require('dw/system/Transaction');
const checkAuth = require('*/cartridge/checkNotificationAuth');
const handleNotify = require('*/cartridge/handleNotify');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */

function handleHmacVerification(hmacKey, req) {
  if (hmacKey) {
    return checkAuth.validateHmacSignature(req);
  }
  return true;
}

function isAuthorized(req) {
  const hmacKey = AdyenConfigs.getAdyenHmacKey();
  return checkAuth.check(req) && handleHmacVerification(hmacKey, req);
}

function notify(req, res, next) {
  // Adyen only queues a notification for retry on a 5xx response, so processing
  // failures must not be reported as 200 or as a 403 rejection.
  let isTransactionOpen = false;
  try {
    if (!isAuthorized(req)) {
      AdyenLogs.error_log(
        'Notification rejected: basic authentication or HMAC signature validation failed',
      );
      res.setStatusCode(403);
      res.render('/adyen/error');
      return next();
    }

    Transaction.begin();
    isTransactionOpen = true;
    const notificationResult = handleNotify.notify(req.form);
    if (!notificationResult.success) {
      Transaction.rollback();
      isTransactionOpen = false;
      res.setStatusCode(500);
      res.render('/notifyError', {
        errorMessage: notificationResult.errorMessage,
      });
      return next();
    }
    Transaction.commit();
    isTransactionOpen = false;
    res.render('/notify');
    return next();
  } catch (error) {
    if (isTransactionOpen) {
      Transaction.rollback();
    }
    AdyenLogs.error_log('Could not process notification:', error);
    res.setStatusCode(500);
    res.render('/notifyError', { errorMessage: error.message });
    return next();
  }
}
module.exports = notify;
