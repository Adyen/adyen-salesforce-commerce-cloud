const URLUtils = require('dw/web/URLUtils');
const Logger = require('dw/system/Logger');
const OrderMgr = require('dw/order/OrderMgr');
const constants = require('*/cartridge/adyenConstants/constants');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

/**
 * Initiates a 3DS2 payment
 */
function adyen3ds2(req, res, next) {

  try {
    const clientKey = AdyenHelper.getAdyenClientKey();
    environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
    const { resultCode } = req.querystring;
    const { orderNo } = req.querystring;

    const order = OrderMgr.getOrder(orderNo);
    const paymentInstrument = order.getPaymentInstruments(
      constants.METHOD_ADYEN_COMPONENT,
    )[0];
    const action = paymentInstrument.custom.adyenAction;

    res.render('/threeds2/adyen3ds2', {
      locale: request.getLocale(),
      clientKey,
      environment,
      resultCode,
      action,
      merchantReference: orderNo,
    });
  } catch (err) {
    Logger.getLogger('Adyen').error(
      `3DS2 redirect failed with reason: ${err.toString()}`,
    );
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  }

  return next();
}

module.exports = adyen3ds2;
