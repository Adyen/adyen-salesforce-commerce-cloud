"use strict";

var server = require('server');
server.extend(module.superModule);
var placeOrder = require('*/cartridge/controllers/middlewares/checkout_services/placeOrder');
server.prepend('PlaceOrder', server.middleware.https, placeOrder);
module.exports = server.exports();