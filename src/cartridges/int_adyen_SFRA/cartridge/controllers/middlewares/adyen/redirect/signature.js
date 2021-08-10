const OrderMgr = require('dw/order/OrderMgr');
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const URLUtils = require('dw/web/URLUtils');
const Resource = require('dw/web/Resource');
const constants = require('*/cartridge/adyenConstants/constants');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

function handleIncorrectSignature(order, { res, next }) {
  Logger.getLogger('Adyen').error('Redirect signature is not correct');
  Transaction.wrap(() => {
    OrderMgr.failOrder(order, true);
  });
  res.redirect(
    URLUtils.url(
      'Checkout-Begin',
      'stage',
      'payment',
      'paymentError',
      Resource.msg('error.payment.not.valid', 'checkout', null),
    ),
  );
  return next();
}

function getCurrentSignature(order) {
  const paymentInstruments = order.getPaymentInstruments(
    constants.METHOD_ADYEN_COMPONENT,
  );
  const adyenPaymentInstrument = paymentInstruments[0];
  const paymentData = adyenPaymentInstrument.custom.adyenPaymentData;
  const redirectUrl = adyenPaymentInstrument.custom.adyenRedirectURL;

  return AdyenHelper.getAdyenHash(
    redirectUrl.substr(redirectUrl.length - 25),
    paymentData.substr(1, 25),
  );
}

module.exports = {
  handleIncorrectSignature,
  getCurrentSignature,
};
