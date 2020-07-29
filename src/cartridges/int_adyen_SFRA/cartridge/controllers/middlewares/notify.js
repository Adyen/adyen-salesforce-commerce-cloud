const Transaction = require('dw/system/Transaction');
const checkAuth = require('*/cartridge/scripts/checkNotificationAuth');
const handleNotify = require('*/cartridge/scripts/handleNotify');

function notify(req, res, next) {
  const status = checkAuth.check(req);
  if (!status) {
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
  next();
}
module.exports = notify;
