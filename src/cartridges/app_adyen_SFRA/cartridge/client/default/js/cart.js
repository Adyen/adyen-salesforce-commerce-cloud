/* eslint-disable global-require */
const processInclude = require('base/util');

$(document).ready(() => {
  processInclude(require('base/cart/cart'));
  processInclude(require('./cart/expressPayments'));
});
