const server = require('server');

server.extend(module.superModule);

const placeOrder = require('*/cartridge/controllers/middlewares/checkout_services/placeOrder');
const submitCustomer = require('*/cartridge/controllers/middlewares/checkout_services/submitCustomer');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const {
  recreateBasketAfterKlarnaPayment,
} = require('*/cartridge/adyen/utils/klarnaHelper');

server.prepend(
  'SubmitPayment',
  server.middleware.https,
  recreateBasketAfterKlarnaPayment,
);

server.prepend('PlaceOrder', server.middleware.https, placeOrder);

if (AdyenConfigs.getAdyenSFRA6Compatibility() === true) {
  server.prepend('SubmitCustomer', server.middleware.https, submitCustomer);
}

module.exports = server.exports();
