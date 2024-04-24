const adyen = require('*/cartridge/adyen/scripts/index');
const checkout = require('*/cartridge/controllers/middlewares/checkout/index');
const order = require('*/cartridge/controllers/middlewares/order/index');
const paymentInstruments = require('*/cartridge/controllers/middlewares/payment_instruments/index');

module.exports = {
  adyen,
  checkout,
  order,
  paymentInstruments,
};
