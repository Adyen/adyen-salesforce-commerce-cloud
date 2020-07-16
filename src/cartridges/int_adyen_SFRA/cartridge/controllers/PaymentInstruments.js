const server = require('server');

server.extend(module.superModule);

const Resource = require('dw/web/Resource');
const userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
const consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const constants = require('*/cartridge/adyenConstants/constants');
const adyenZeroAuth = require('*/cartridge/scripts/adyenZeroAuth');

server.prepend(
  'List',
  userLoggedIn.validateLoggedIn,
  consentTracking.consent,
  function (req, res, next) {
    require('*/cartridge/scripts/updateSavedCards').updateSavedCards({
      CurrentCustomer: req.currentCustomer.raw,
    });
    next();
  },
);

server.prepend(
  'AddPayment',
  csrfProtection.generateToken,
  consentTracking.consent,
  userLoggedIn.validateLoggedIn,
  function (req, res, next) {
    const protocol = req.https ? 'https' : 'http';
    const originKey = adyenGetOriginKey.getOriginKeyFromRequest(
      protocol,
      req.host,
    );
    const environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
    const viewData = res.getViewData();
    viewData.adyen = {
      originKey: originKey,
      environment: environment,
    };

    res.setViewData(viewData);
    next();
  },
);

server.prepend('SavePayment', csrfProtection.validateAjaxRequest, function (
  req,
  res,
  next,
) {
  if (!AdyenHelper.getAdyenSecuredFieldsEnabled) {
    return next();
  }
  const CustomerMgr = require('dw/customer/CustomerMgr');
  const Transaction = require('dw/system/Transaction');
  const URLUtils = require('dw/web/URLUtils');
  const accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

  const paymentForm = server.forms.getForm('creditCard');
  const customer = CustomerMgr.getCustomerByCustomerNumber(
    req.currentCustomer.profile.customerNo,
  );

  let paymentInstrument;
  const wallet = customer.getProfile().getWallet();
  Transaction.wrap(function () {
    paymentInstrument = wallet.createPaymentInstrument(
      constants.METHOD_ADYEN_COMPONENT,
    );
    paymentInstrument.custom.adyenPaymentData = paymentForm.adyenStateData.value;
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
});

server.append('DeletePayment', userLoggedIn.validateLoggedInAjax, function (
  req,
  res,
  next,
) {
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
});

module.exports = server.exports();
