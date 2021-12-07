"use strict";

var server = require('server');

var _require = require('*/cartridge/controllers/middlewares/index'),
    checkoutServices = _require.checkoutServices;

server.extend(module.superModule);
/*
 * Prepends CheckoutServices' 'PlaceOrder' function to handle payment authorisation
 * when the selected payment processor is Adyen.
 */

server.prepend('PlaceOrder', server.middleware.https, checkoutServices.placeOrder);
module.exports = server.exports();