const Transaction = require('dw/system/Transaction');
const checkAuth = require('*/cartridge/scripts/checkNotificationAuth');
const handleNotify = require('*/cartridge/scripts/handleNotify');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */

function handleHmacVerification(hmacKey, req) {
  if (!hmacKey) {
    return false;
  }
  return checkAuth.validateHmacSignature(req);
}

function notify(req, res, next) {
  const status = checkAuth.check(req);
  const hmacKey = AdyenConfigs.getAdyenHmacKey();
  const hmacVerification = handleHmacVerification(hmacKey, req);
  if (!status || (hmacKey && !hmacVerification)) {
    res.render('/adyen/error');
    return {};
  }
  Transaction.begin();
  const notificationResult = handleNotify.notify(req.form);
  if (notificationResult.success) {
    Transaction.commit();
    res.render('/notify');
  } else {
    res.render('/notifyError', {
      errorMessage: notificationResult.errorMessage,
    });
    Transaction.rollback();
  }
  return next();
}
module.exports = notify;
