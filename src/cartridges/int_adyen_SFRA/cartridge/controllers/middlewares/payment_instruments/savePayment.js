const server = require('server');
const Resource = require('dw/web/Resource');
const CustomerMgr = require('dw/customer/CustomerMgr');
const Transaction = require('dw/system/Transaction');
const URLUtils = require('dw/web/URLUtils');
const PaymentMgr = require('dw/order/PaymentMgr');
const adyenZeroAuth = require('*/cartridge/adyen/scripts/payments/adyenZeroAuth');
const constants = require('*/cartridge/adyen/config/constants');
const accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
const {
  updateSavedCards,
} = require('*/cartridge/adyen/scripts/payments/updateSavedCards');
const {
  paymentProcessorIDs,
} = require('*/cartridge/controllers/middlewares/payment_instruments/paymentProcessorIDs');

function containsValidResultCode(req) {
  return (
    [
      constants.RESULTCODES.AUTHORISED,
      constants.RESULTCODES.IDENTIFYSHOPPER,
      constants.RESULTCODES.CHALLENGESHOPPER,
      constants.RESULTCODES.REDIRECTSHOPPER,
    ].indexOf(req.resultCode) !== -1
  );
}

function createPaymentInstrument(customer) {
  let paymentInstrument;
  const paymentForm = server.forms.getForm('creditCard');
  const wallet = customer.getProfile().getWallet();
  Transaction.wrap(() => {
    paymentInstrument = wallet.createPaymentInstrument(
      constants.METHOD_ADYEN_COMPONENT,
    );
    paymentInstrument.custom.adyenPaymentData =
      paymentForm.adyenStateData.value;
  });

  return paymentInstrument;
}

function getResponseBody(action) {
  return {
    success: true,
    redirectUrl: URLUtils.url('PaymentInstruments-List').toString(),
    ...(action && { redirectAction: action }),
  };
}

function isAdyen() {
  return (
    paymentProcessorIDs.indexOf(
      PaymentMgr.getPaymentMethod('CREDIT_CARD')
        ?.getPaymentProcessor()
        ?.getID(),
    ) > -1 ||
    PaymentMgr.getPaymentMethod(constants.METHOD_ADYEN_COMPONENT).isActive()
  );
}

function savePayment(req, res, next) {
  if (!isAdyen()) {
    return next();
  }
  const customer = CustomerMgr.getCustomerByCustomerNumber(
    req.currentCustomer.profile.customerNo,
  );

  Transaction.begin();
  const zeroAuthResult = adyenZeroAuth.zeroAuthPayment(
    customer,
    createPaymentInstrument(customer),
  );

  if (zeroAuthResult.error || !containsValidResultCode(zeroAuthResult)) {
    Transaction.rollback();
    res.json({
      success: false,
      error: [Resource.msg('error.card.information.error', 'creditCard', null)],
    });
    return this.emit('route:Complete', req, res);
  }

  Transaction.commit();

  updateSavedCards({
    CurrentCustomer: req.currentCustomer.raw,
  });

  // Send account edited email
  accountHelpers.sendAccountEditedEmail(customer.profile);

  res.json(getResponseBody(zeroAuthResult.action));
  return this.emit('route:Complete', req, res);
}

module.exports = savePayment;
