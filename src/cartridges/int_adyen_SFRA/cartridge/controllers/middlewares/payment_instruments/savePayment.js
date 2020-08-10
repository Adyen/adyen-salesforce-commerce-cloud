const server = require('server');
const Resource = require('dw/web/Resource');
const CustomerMgr = require('dw/customer/CustomerMgr');
const Transaction = require('dw/system/Transaction');
const URLUtils = require('dw/web/URLUtils');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenZeroAuth = require('*/cartridge/scripts/adyenZeroAuth');
const constants = require('*/cartridge/adyenConstants/constants');
const accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

function savePayment(req, res, next) {
  if (!AdyenHelper.getAdyenSecuredFieldsEnabled()) {
    return next();
  }

  const paymentForm = server.forms.getForm('creditCard');
  const customer = CustomerMgr.getCustomerByCustomerNumber(
    req.currentCustomer.profile.customerNo,
  );

  let paymentInstrument;
  const wallet = customer.getProfile().getWallet();
  Transaction.wrap(() => {
    paymentInstrument = wallet.createPaymentInstrument(
      constants.METHOD_ADYEN_COMPONENT,
    );
    paymentInstrument.custom.adyenPaymentData =
      paymentForm.adyenStateData.value;
  });

  Transaction.begin();
  const zeroAuthResult = adyenZeroAuth.zeroAuthPayment(
    customer,
    paymentInstrument,
  );
  if (zeroAuthResult.error || zeroAuthResult.resultCode !== 'Authorised') {
    Transaction.rollback();
    res.json({
      success: false,
      error: [Resource.msg('error.card.information.error', 'creditCard', null)],
    });
    this.emit('route:Complete', req, res);
    return;
  }
  Transaction.commit();

  require('*/cartridge/scripts/updateSavedCards').updateSavedCards({
    CurrentCustomer: req.currentCustomer.raw,
  });

  // Send account edited email
  accountHelpers.sendAccountEditedEmail(customer.profile);

  res.json({
    success: true,
    redirectUrl: URLUtils.url('PaymentInstruments-List').toString(),
  });
  this.emit('route:Complete', req, res);
}

module.exports = savePayment;
