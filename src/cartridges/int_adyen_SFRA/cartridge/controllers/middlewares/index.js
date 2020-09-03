const adyen = require('./adyen/index');
const checkoutServices = require('./checkout_services/index');
const checkout = require('./checkout/index');
const order = require('./order/index');
const paymentInstruments = require('./payment_instruments/index');

module.exports = {
  adyen,
  checkoutServices,
  checkout,
  order,
  paymentInstruments,
};
