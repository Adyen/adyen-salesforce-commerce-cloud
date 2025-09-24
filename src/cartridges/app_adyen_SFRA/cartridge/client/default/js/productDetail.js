const processInclude = require('base/util');
const baseProductDetail = require('base/product/detail');
const adyenProductExpressPayments = require('./adyen/express/product/expressPayments');

$(document).ready(() => {
  processInclude(baseProductDetail);
  processInclude(adyenProductExpressPayments);
});
