const URLUtils = require('dw/web/URLUtils');
const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');
const OrderMgr = require('dw/order/OrderMgr');
const Logger = require('dw/system/Logger');

function handleRedirect(page, { res }) {
  res.redirect(
    URLUtils.url(
      'Checkout-Begin',
      'stage',
      page,
      'paymentError',
      Resource.msg('error.payment.not.valid', 'checkout', null),
    ),
  );
}

function handleReceived(order, result, { res, next }) {
  Transaction.wrap(() => {
    OrderMgr.failOrder(order, true);
  });
  Logger.getLogger('Adyen').error(
    `Did not complete Alipay transaction, result: ${JSON.stringify(result)}`,
  );
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

function handlePaymentError(order, page, { next }) {
  Transaction.wrap(() => {
    OrderMgr.failOrder(order, true);
  });
  handleRedirect(page);
  return next();
}

function handlePaymentInstruments(paymentInstruments, { req }) {
  let adyenPaymentInstrument;
  let paymentData;
  let details;

  // looping through all Adyen payment methods, however, this only can be one.
  const instrumentsIter = paymentInstruments.iterator();
  while (instrumentsIter.hasNext()) {
    adyenPaymentInstrument = instrumentsIter.next();
    paymentData = adyenPaymentInstrument.custom.adyenPaymentData;
  }

  // details is either redirectResult or payload
  if (req.querystring.redirectResult) {
    details = { redirectResult: req.querystring.redirectResult };
  } else if (req.querystring.payload) {
    details = { payload: req.querystring.payload };
  }
  return { details, paymentData, adyenPaymentInstrument };
}

module.exports = {
  handleRedirect,
  handleReceived,
  handlePaymentError,
  handlePaymentInstruments,
};
