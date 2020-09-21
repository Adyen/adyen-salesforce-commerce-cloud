const adyen = require('./adyen/index');
const checkoutServices = require('./checkoutServices/index');
const checkout = require('./checkout/index');
const order = require('./order/index');
const paymentInstruments = require('./paymentInstruments/index');

module.exports = {
  adyen,
  checkoutServices,
  checkout,
  order,
  paymentInstruments,
};
