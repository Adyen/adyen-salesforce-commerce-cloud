const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const server = require('server');

server.extend(module.superModule);

const placeOrder = require('*/cartridge/controllers/middlewares/checkout_services/placeOrder');
const submitCustomer = require('*/cartridge/controllers/middlewares/checkout_services/submitCustomer');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');

server.prepend('SubmitPayment', server.middleware.https, (req, res, next) => {
  if (session.privacy.attemptedKlarnaPayment && session.privacy.orderNo) {
    Transaction.wrap(() => {
      const order = OrderMgr.getOrder(session.privacy.orderNo);
      OrderMgr.failOrder(order, true);
      session.privacy.attemptedKlarnaPayment = null;
      session.privacy.orderNo = null;
    });
  }
  next();
});

server.prepend('PlaceOrder', server.middleware.https, placeOrder);

if (AdyenConfigs.getAdyenSFRA6Compatibility() === true) {
  server.prepend('SubmitCustomer', server.middleware.https, submitCustomer);
}

module.exports = server.exports();
