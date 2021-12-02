const server = require('server');
const {
  checkoutServices,
} = require('*/cartridge/controllers/middlewares/index');

server.extend(module.superModule);

/*
 * Prepends CheckoutServices' 'PlaceOrder' function to handle payment authorisation
 * when the selected payment processor is Adyen.
 */
server.prepend(
  'PlaceOrder',
  server.middleware.https,
  checkoutServices.placeOrder,
);

module.exports = server.exports();
