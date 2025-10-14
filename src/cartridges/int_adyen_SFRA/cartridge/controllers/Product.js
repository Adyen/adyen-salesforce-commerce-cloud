const server = require('server');
const csrf = require('*/cartridge/scripts/middleware/csrf');

server.extend(module.superModule);

/*
 * Prepends Product's PDP routes to have csrf token.
 * This is needed for csrf protection for express payments on PDP.
 */
server.prepend('Show', csrf.generateToken, (req, res, next) => {
  next();
});

server.prepend('ShowInCategory', csrf.generateToken, (req, res, next) => {
  next();
});

module.exports = server.exports();
