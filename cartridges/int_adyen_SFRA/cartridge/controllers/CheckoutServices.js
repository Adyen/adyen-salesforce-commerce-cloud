"use strict";

var server = require('server');

var _require = require('./middlewares/index'),
    checkoutServices = _require.checkoutServices;

server.extend(module.superModule);
server.prepend('PlaceOrder', server.middleware.https, checkoutServices.placeOrder);
module.exports = server.exports();