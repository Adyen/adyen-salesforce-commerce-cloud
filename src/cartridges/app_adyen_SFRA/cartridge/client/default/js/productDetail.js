/* eslint-disable global-require */
const processInclude = require('base/util');

$(document).ready(() => {
  processInclude(require('base/product/detail'));
  processInclude(require('./product/expressPayments'));
});
