const Paypal = require('./paypal/paypal');
const ApplePay = require('./applepay/applepay');
const AmazonPay = require('./amazonpay/amazonPayExpressPart1');

const expressPaymentMethods = {
  Paypal,
  ApplePay,
  AmazonPay,
};
module.exports = expressPaymentMethods;
