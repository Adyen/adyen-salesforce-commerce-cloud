"use strict";

var CustomerMgr = require('dw/customer/CustomerMgr');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var _require = require('*/cartridge/scripts/adyenDeleteRecurringPayment'),
  deleteRecurringPayment = _require.deleteRecurringPayment;
function deletePayment(req, res, next) {
  var payment = res.getViewData();
  if (payment) {
    var customer = CustomerMgr.getCustomerByCustomerNumber(req.currentCustomer.profile.customerNo);
    var tokenToDelete = AdyenHelper.getCardToken(payment.UUID, customer);
    if (tokenToDelete) {
      deleteRecurringPayment({
        Customer: customer,
        RecurringDetailReference: tokenToDelete
      });
    }
  }
  return next();
}
module.exports = deletePayment;