const OrderMgr = require('dw/order/OrderMgr');
const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');
const URLUtils = require('dw/web/URLUtils');

const handleFraudDetection = (
  fraudDetectionStatus,
  order,
  { req, res },
  emit,
) => {
  const isStatusFailed = fraudDetectionStatus.status === 'fail';
  if (isStatusFailed) {
    Transaction.wrap(() => {
      OrderMgr.failOrder(order, true);
    });

    // fraud detection failed
    req.session.privacyCache.set('fraudDetectionStatus', true);

    res.json({
      error: true,
      cartError: true,
      redirectUrl: URLUtils.url(
        'Error-ErrorCode',
        'err',
        fraudDetectionStatus.errorCode,
      ).toString(),
      errorMessage: Resource.msg('error.technical', 'checkout', null),
    });

    emit('route:Complete');
  }
  return !isStatusFailed;
};

module.exports = handleFraudDetection;
