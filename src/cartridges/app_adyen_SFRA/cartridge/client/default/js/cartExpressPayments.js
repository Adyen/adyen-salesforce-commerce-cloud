/* eslint-disable global-require */
const processInclude = require('base/util');

$(document).ready(() => {
  processInclude(require('./adyen_express/cart/expressPayments'));
});
