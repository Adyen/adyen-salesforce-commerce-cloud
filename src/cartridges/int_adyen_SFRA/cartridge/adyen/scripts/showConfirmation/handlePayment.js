const URLUtils = require('dw/web/URLUtils');
const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');
const OrderMgr = require('dw/order/OrderMgr');

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

function handlePaymentError(order, page, { res, next }) {
  Transaction.wrap(() => {
    OrderMgr.failOrder(order, true);
  });
  handleRedirect(page, { res });
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
  handlePaymentError,
  handlePaymentInstruments,
};
