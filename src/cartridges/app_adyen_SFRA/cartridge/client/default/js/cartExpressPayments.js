/* eslint-disable global-require */
const processInclude = require('base/util');
const $ = require('jquery');

$(document).ready(() => {
  processInclude(require('./adyen_express/cart/expressPayments'));
});
