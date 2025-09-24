const processInclude = require('base/util');
const baseCheckout = require('base/checkout/checkout');
const adyenCheckout = require('./adyen/checkout');

$(document).ready(() => {
  processInclude(baseCheckout);
  processInclude(adyenCheckout);
});
