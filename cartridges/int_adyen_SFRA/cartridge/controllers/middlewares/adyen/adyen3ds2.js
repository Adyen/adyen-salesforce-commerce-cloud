"use strict";

var URLUtils = require('dw/web/URLUtils');

var Logger = require('dw/system/Logger');

var OrderMgr = require('dw/order/OrderMgr');

var constants = require('*/cartridge/adyenConstants/constants');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');

function adyen3ds2(req, res, next) {
  var protocol = req.https ? 'https' : 'http';

  try {
    var originKey = adyenGetOriginKey.getOriginKeyFromRequest(protocol, req.host);
    var environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
    var resultCode = req.querystring.resultCode;
    var orderNo = req.querystring.orderNo;
    var order = OrderMgr.getOrder(orderNo);
    var paymentInstrument = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT)[0];
    var action = paymentInstrument.custom.adyenAction;
    res.render('/threeds2/adyen3ds2', {
      locale: request.getLocale(),
      originKey: originKey,
      environment: environment,
      resultCode: resultCode,
      action: action,
      merchantReference: orderNo
    });
  } catch (err) {
    Logger.getLogger('Adyen').error("3DS2 redirect failed with reason: ".concat(err.toString()));
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  }

  return next();
}

module.exports = adyen3ds2;