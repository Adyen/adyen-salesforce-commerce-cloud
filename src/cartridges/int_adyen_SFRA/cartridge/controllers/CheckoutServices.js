const server = require('server');
const { checkoutServices } = require('./middlewares/index');

server.extend(module.superModule);
server.prepend(
  'PlaceOrder',
  server.middleware.https,
  checkoutServices.placeOrder,
);

module.exports = server.exports();
