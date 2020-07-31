function deletePayment(req, res, next) {
  const CustomerMgr = require('dw/customer/CustomerMgr');
  const payment = res.getViewData();

  if (payment) {
    const customer = CustomerMgr.getCustomerByCustomerNumber(
      req.currentCustomer.profile.customerNo,
    );
    const tokenToDelete = AdyenHelper.getCardToken(payment.UUID, customer);
    if (tokenToDelete) {
      require('*/cartridge/scripts/adyenDeleteRecurringPayment').deleteRecurringPayment(
        {
          Customer: customer,
          RecurringDetailReference: tokenToDelete,
        },
      );
    }
  }

  return next();
}

module.exports = deletePayment;
