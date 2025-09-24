const processInclude = require('base/util');
const $ = require('jquery');
const adyenExpressCheckout = require('./adyen/express/cart/expressPayments');

$(document).ready(() => {
  processInclude(adyenExpressCheckout);
});
