const OrderMgr = require('dw/order/OrderMgr');
const handlePaymentsCall = require('./payment');
const { toggle3DS2Error } = require('./errorHandler');

function hasFingerprint({ req }) {
  return (
    req.form.resultCode === 'IdentifyShopper' && req.form.fingerprintResult
  );
}

function hasChallengeResult({ req }) {
  return req.form.resultCode === 'ChallengeShopper' && req.form.challengeResult;
}

function handle3DS2Authentication(session, options) {
  const { req } = options;
  const order = OrderMgr.getOrder(session.privacy.orderNo);
  const paymentInstrument = order.getPaymentInstruments(
    session.privacy.paymentMethod,
  )[0];

  if (hasFingerprint(options)) {
    const paymentDetailsRequest = {
      paymentData: paymentInstrument.custom.adyenPaymentData,
      details: {
        'threeds2.fingerprint': req.form.fingerprintResult,
      },
    };

    return handlePaymentsCall(
      paymentDetailsRequest,
      order,
      paymentInstrument,
      options,
    );
  }
  const paymentDetailsRequest = {
    paymentData: paymentInstrument.custom.adyenPaymentData,
    details: {
      'threeds2.challengeResult': req.form.challengeResult,
    },
  };

  return handlePaymentsCall(
    paymentDetailsRequest,
    order,
    paymentInstrument,
    options,
  );
}

function createAuthorization(session, options) {
  const is3DS2 = hasFingerprint(options) || hasChallengeResult(options);
  return is3DS2
    ? handle3DS2Authentication(session, options)
    : toggle3DS2Error(options);
}

module.exports = createAuthorization;
