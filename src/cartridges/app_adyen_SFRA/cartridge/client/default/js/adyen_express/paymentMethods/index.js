const Paypal = require('./paypal/paypal');
const ApplePay = require('./applepay/applepay');

const expressPaymentMethods = {
  Paypal,
  ApplePay,
};
module.exports = expressPaymentMethods;
