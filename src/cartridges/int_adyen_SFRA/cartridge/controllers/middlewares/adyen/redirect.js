const OrderMgr = require('dw/order/OrderMgr');
const Logger = require('dw/system/Logger');
const {
  getCurrentSignature,
  handleIncorrectSignature,
} = require('./redirect/signature');

function redirect(req, res, next) {
  const { signature, redirectUrl, merchantReference } = req.querystring;
  const order = OrderMgr.getOrder(merchantReference);

  if (order && signature) {
    const currentSignature = getCurrentSignature(order, { req });

    if (signature === currentSignature) {
      res.redirect(redirectUrl);
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
