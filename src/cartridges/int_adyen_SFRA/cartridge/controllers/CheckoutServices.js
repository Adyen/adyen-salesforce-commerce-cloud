const server = require('server');
const failUnsuccessfulKlarnaInlineOrder = require('*/cartridge/adyen/utils/failUnsuccessfulKlarnaInlineOrder');

server.extend(module.superModule);

const placeOrder = require('*/cartridge/controllers/middlewares/checkout_services/placeOrder');
const submitCustomer = require('*/cartridge/controllers/middlewares/checkout_services/submitCustomer');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');

server.prepend('SubmitPayment', server.middleware.https, (req, res, next) => {
  failUnsuccessfulKlarnaInlineOrder();
  next();
});

server.prepend('PlaceOrder', server.middleware.https, placeOrder);

if (AdyenConfigs.getAdyenSFRA6Compatibility() === true) {
  server.prepend('SubmitCustomer', server.middleware.https, submitCustomer);
}

module.exports = server.exports();
