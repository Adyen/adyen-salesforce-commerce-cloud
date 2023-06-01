const server = require('server');

server.extend(module.superModule);

const termsAndConditions = require('*/cartridge/controllers/middlewares/termsAndConditions.js');

server.prepend('PlaceOrder', server.middleware.https, termsAndConditions);

module.exports = server.exports();
