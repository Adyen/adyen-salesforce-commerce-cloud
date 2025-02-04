const Transaction = require('dw/system/Transaction');
const checkAuth = require('*/cartridge/adyen/webhooks/checkNotificationAuth');
const handleNotify = require('*/cartridge/adyen/webhooks/handleNotify');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');

/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */

function handleHmacVerification(hmacKey, req) {
  if (hmacKey) {
    return checkAuth.validateHmacSignature(req);
  }
  return true;
}

function notify(req, res, next) {
  const status = checkAuth.check(req);
  const hmacKey = AdyenConfigs.getAdyenHmacKey();
  const isHmacValid = handleHmacVerification(hmacKey, req);
  if (!status || !isHmacValid) {
    res.status(403).render('/adyen/error');
    return {};
  }
  Transaction.begin();
  const notificationResult = handleNotify.notify(req.form);
  if (notificationResult.success) {
    Transaction.commit();
    res.render('/notify');
  } else {
    res.status(403).render('/notifyError', {
      errorMessage: notificationResult.errorMessage,
    });
    Transaction.rollback();
  }
  return next();
}
module.exports = notify;
