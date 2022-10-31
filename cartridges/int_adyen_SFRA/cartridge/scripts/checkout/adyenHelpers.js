"use strict";

var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var _require = require('*/cartridge/scripts/checkout/utils/index'),
  getPayments = _require.getPayments;

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {string} orderNumber - The order number for the order
 * @returns {Object} an error object
 */
function handlePayments(order) {
  if (order.totalNetPrice === 0.0) {
    return {};
  }
  if (order.paymentInstruments.length) {
    return getPayments(order);
  }
  Transaction.wrap(function () {
    OrderMgr.failOrder(order, true);
  });
  return {
    error: true
  };
}
module.exports = {
  handlePayments: handlePayments
};