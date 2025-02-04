"use strict";

var server = require('server');
var csrf = require('*/cartridge/scripts/middleware/csrf');
server.extend(module.superModule);

/*
 * Prepends Cart's 'MiniCartShow' function to have csrf token.
 * This is needed for csrf protection for express payments on mini cart.
 */
server.prepend('MiniCartShow', csrf.generateToken, function (req, res, next) {
  next();
});
module.exports = server.exports();