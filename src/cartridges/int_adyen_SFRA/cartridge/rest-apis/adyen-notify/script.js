const Transaction = require('dw/system/Transaction');
const RESTResponseMgr = require('dw/system/RESTResponseMgr');
const checkAuth = require('*/cartridge/adyen/webhooks/checkNotificationAuth');
const handleNotify = require('*/cartridge/adyen/webhooks/handleNotify');
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

exports.notify = function () {
  const requestBody = request.httpParameterMap.requestBodyAsString;
  const req = JSON.parse(requestBody);
  AdyenLogs.debug_log(JSON.stringify(req));
  // the req needs to de parsed correctly and passed to handleHmacVerification() and handleNotify.notify()
  const hmacKey = AdyenConfigs.getAdyenHmacKey();
  const isHmacValid = handleHmacVerification(hmacKey, req);
  if (!isHmacValid) {
    RESTResponseMgr.createError(403).render();
  }
  Transaction.begin();
  const notificationResult = handleNotify.notify(req);
  if (notificationResult.success) {
    Transaction.commit();
    RESTResponseMgr.createEmptySuccess(200).render();
  } else {
    RESTResponseMgr.createError(
      403,
      'forbidden',
      notificationResult.errorMessage,
    ).render();
    Transaction.rollback();
  }
};
exports.notify.public = true;
