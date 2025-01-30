/* eslint-disable prefer-regex-literals, global-require */
const processInclude = require('base/util');
const baseCheckout = require('base/checkout/checkout');
const adyenCheckout = require('./adyen_checkout');

$(document).ready(() => {
  processInclude(baseCheckout);
  processInclude(adyenCheckout);
});
