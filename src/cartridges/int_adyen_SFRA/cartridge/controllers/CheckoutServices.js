const server = require('server');

server.extend(module.superModule);

const placeOrder = require('*/cartridge/controllers/middlewares/checkout_services/placeOrder');

server.prepend('PlaceOrder', server.middleware.https, placeOrder);

module.exports = server.exports();
