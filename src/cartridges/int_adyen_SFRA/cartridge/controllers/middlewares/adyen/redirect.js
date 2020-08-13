const OrderMgr = require('dw/order/OrderMgr');
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const URLUtils = require('dw/web/URLUtils');
const Resource = require('dw/web/Resource');
const constants = require('*/cartridge/adyenConstants/constants');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

function redirect(req, res, next) {
  const order = OrderMgr.getOrder(session.privacy.orderNo);
  function handleIncorrectSignature() {
    Logger.getLogger('Adyen').error('Redirect signature is not correct');
    Transaction.wrap(() => {
      OrderMgr.failOrder(order, true);
    });
    res.redirect(
      URLUtils.url(
        'Checkout-Begin',
        'stage',
        'payment',
        'paymentError',
        Resource.msg('error.payment.not.valid', 'checkout', null),
      ),
    );
    return next();
  }

  function getCurrentSignature() {
    const paymentInstruments = order.getPaymentInstruments(
      constants.METHOD_ADYEN_COMPONENT,
    );
    let adyenPaymentInstrument;
    let paymentData;

    // looping through all Adyen payment methods, however, this only can be one.
    const instrumentsIter = paymentInstruments.iterator();
    while (instrumentsIter.hasNext()) {
      adyenPaymentInstrument = instrumentsIter.next();
      paymentData = adyenPaymentInstrument.custom.adyenPaymentData;
    }
    const currentSignature = AdyenHelper.getAdyenHash(
      req.querystring.redirectUrl.substr(
        req.querystring.redirectUrl.length - 25,
      ),
      paymentData.substr(1, 25),
    );
    return currentSignature;
  }

  const { signature } = req.querystring;
  if (order && signature) {
    const currentSignature = getCurrentSignature();

    if (signature === currentSignature) {
      res.redirect(req.querystring.redirectUrl);
      return next();
    }
  } else {
    Logger.getLogger('Adyen').error(
      `No signature or no order with orderNo ${session.privacy.orderNo}`,
    );
  }

  return handleIncorrectSignature();
}

module.exports = redirect;
