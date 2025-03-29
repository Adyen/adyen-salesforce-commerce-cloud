const Paypal = require('./paypal/paypal');
const ApplePay = require('./applepay/applepay');
const GooglePay = require('./googlepay/googlepay');

const expressPaymentMethods = {
  Paypal,
  ApplePay,
  GooglePay,
};
module.exports = expressPaymentMethods;
