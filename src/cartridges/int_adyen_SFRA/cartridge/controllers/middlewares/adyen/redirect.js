const OrderMgr = require('dw/order/OrderMgr');
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const constants = require('*/cartridge/adyenConstants/constants');

const {
  getCurrentSignature,
  handleIncorrectSignature,
} = require('./redirect/signature');

function redirect(req, res, next) {
  const { signature, merchantReference } = req.querystring;
  const order = OrderMgr.getOrder(merchantReference);
  if (order && signature) {
    const currentSignature = getCurrentSignature(order);
    if (signature === currentSignature) {
      const paymentInstrument = order.getPaymentInstruments(
        constants.METHOD_ADYEN_COMPONENT,
      )[0];
      const redirectUrl = paymentInstrument.custom.adyenRedirectURL;
      res.redirect(redirectUrl);
      Transaction.wrap(() => {
        paymentInstrument.custom.adyenRedirectURL = null;
      });
      return next();
    }
  } else {
    Logger.getLogger('Adyen').error(
      `No signature or no order with orderNo ${merchantReference}`,
    );
  }

  return handleIncorrectSignature(order, { res, next });
}

module.exports = redirect;
