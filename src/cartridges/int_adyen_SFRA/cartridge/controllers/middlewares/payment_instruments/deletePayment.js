const CustomerMgr = require('dw/customer/CustomerMgr');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const {
  deleteRecurringPayment,
} = require('*/cartridge/adyen/scripts/payments/adyenDeleteRecurringPayment');

function deletePayment(req, res, next) {
  const payment = res.getViewData();

  if (payment) {
    const customer = CustomerMgr.getCustomerByCustomerNumber(
      req.currentCustomer.profile.customerNo,
    );
    const tokenToDelete = AdyenHelper.getCardToken(payment.UUID, customer);
    if (tokenToDelete) {
      deleteRecurringPayment({
        Customer: customer,
        RecurringDetailReference: tokenToDelete,
      });
    }
  }

  return next();
}

module.exports = deletePayment;
