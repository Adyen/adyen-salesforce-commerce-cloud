"use strict";

var OrderMgr = require('dw/order/OrderMgr');

var Resource = require('dw/web/Resource');

var Transaction = require('dw/system/Transaction');

var URLUtils = require('dw/web/URLUtils');

var handleFraudDetection = function handleFraudDetection(fraudDetectionStatus, order, _ref, emit) {
  var req = _ref.req,
      res = _ref.res;
  var isStatusFailed = fraudDetectionStatus.status === 'fail';

  if (isStatusFailed) {
    Transaction.wrap(function () {
      OrderMgr.failOrder(order, true);
    }); // fraud detection failed

    req.session.privacyCache.set('fraudDetectionStatus', true);
    res.json({
      error: true,
      cartError: true,
      redirectUrl: URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus.errorCode).toString(),
      errorMessage: Resource.msg('error.technical', 'checkout', null)
    });
    emit('route:Complete');
  }

  return !isStatusFailed;
};

module.exports = handleFraudDetection;