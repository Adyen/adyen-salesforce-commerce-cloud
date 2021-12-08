const URLUtils = require('dw/web/URLUtils');
const Logger = require('dw/system/Logger');
const OrderMgr = require('dw/order/OrderMgr');
const constants = require('*/cartridge/adyenConstants/constants');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

/**
 * Renders the action Processing template
 */
function actionProcessing(req, res, next) {
  try {
    const clientKey = AdyenHelper.getAdyenClientKey();
    const environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
    const { orderNo } = req.querystring;

    const order = OrderMgr.getOrder(orderNo);
    const paymentInstrument = order.getPaymentInstruments(
        constants.METHOD_ADYEN_COMPONENT,
    )[0];
    const action = paymentInstrument.custom.adyenAction;

    res.render('/adyenActionProcessing', {
      locale: request.getLocale(),
      clientKey,
      environment,
      action,
      merchantReference: orderNo,
    });
  } catch (err) {
    Logger.getLogger('Adyen').error(
        `Action processing redirect failed with reason: ${err.toString()}`,
    );
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  }

  return next();
}

module.exports = actionProcessing;
