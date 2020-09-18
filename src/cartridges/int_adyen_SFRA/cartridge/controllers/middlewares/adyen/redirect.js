const OrderMgr = require('dw/order/OrderMgr');
const Logger = require('dw/system/Logger');
const {
  getCurrentSignature,
  handleIncorrectSignature,
} = require('./redirect/signature');

function redirect(req, res, next) {
  const order = OrderMgr.getOrder(session.privacy.orderNo);

  const { signature, redirectUrl } = req.querystring;
  if (order && signature) {
    const currentSignature = getCurrentSignature(order, { req });

    if (signature === currentSignature) {
      res.redirect(redirectUrl);
      return next();
    }
  } else {
    Logger.getLogger('Adyen').error(
      `No signature or no order with orderNo ${session.privacy.orderNo}`,
    );
  }

  return handleIncorrectSignature(order, { res, next });
}

module.exports = redirect;
