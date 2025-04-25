const Paypal = require('./paypal/paypal');
const ApplePay = require('./applepay/applepay');
const GooglePay = require('./googlepay/googlepay');
const AmazonPay = require('./amazonpay/amazonPayExpressPart1');

const expressPaymentMethods = {
  Paypal,
  ApplePay,
  GooglePay,
  AmazonPay,
};
module.exports = expressPaymentMethods;
