const server = require('server');

server.extend(module.superModule);

const placeOrder = require('*/cartridge/controllers/middlewares/checkout_services/placeOrder');
const submitCustomer = require('*/cartridge/controllers/middlewares/checkout_services/submitCustomer');

server.prepend('PlaceOrder', server.middleware.https, placeOrder);

server.prepend('SubmitCustomer', server.middleware.https, submitCustomer);

module.exports = server.exports();
