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

// handleNotify writes its custom objects in nested transactions, which SFCC
// rolls back on failure. Rolling back a transaction that is already closed
// throws, and that error must not replace the failure we are reporting.
function rollbackTransaction() {
  try {
    Transaction.rollback();
  } catch (rollbackError) {
    AdyenLogs.error_log(
      'Could not roll back the notification transaction:',
      rollbackError,
    );
  }
}

// Sole owner of the notification transaction: every exit path either commits or
// rolls back exactly once, before the response is touched.
function processNotification(notificationData) {
  Transaction.begin();
  try {
    const notificationResult = handleNotify.notify(notificationData);
    if (!notificationResult.success) {
      rollbackTransaction();
      return notificationResult;
    }
    Transaction.commit();
    return notificationResult;
  } catch (error) {
    rollbackTransaction();
    throw error;
  }
}

function notify(req, res, next) {
  // Adyen only queues a notification for retry on a 5xx response, so processing
  // failures must not be reported as 200 or as a 403 rejection.
  try {
    if (!isAuthorized(req)) {
      res.setStatusCode(403);
      res.render('/adyen/error');
      return next();
    }

    const notificationResult = processNotification(req.form);
    if (!notificationResult.success) {
      res.setStatusCode(500);
      res.render('/notifyError', {
        errorMessage: notificationResult.errorMessage,
      });
      return next();
    }
    res.render('/notify');
    return next();
  } catch (error) {
    AdyenLogs.error_log('Could not process notification:', error);
    res.setStatusCode(500);
    res.render('/notifyError', { errorMessage: error.message });
    return next();
  }
}
module.exports = notify;
