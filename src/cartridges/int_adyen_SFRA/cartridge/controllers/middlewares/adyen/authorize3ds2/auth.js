const OrderMgr = require('dw/order/OrderMgr');
const handlePaymentsCall = require('./payment');
const { toggle3DS2Error } = require('./errorHandler');
const Logger = require('dw/system/Logger');

function contains3ds2Action({ req }) {
  return (
    req.form.resultCode === 'IdentifyShopper' ||
    req.form.resultCode === 'ChallengeShopper' ||
    req.form.resultCode === 'challengeResult'
  );
}

function handle3DS2Authentication(session, options) {
  const { req } = options;
  const order = OrderMgr.getOrder(session.privacy.orderNo);
  const paymentInstrument = order.getPaymentInstruments(
    session.privacy.paymentMethod,
  )[0];
  const paymentDetailsRequest = {
    paymentData: paymentInstrument.custom.adyenPaymentData,
    details: JSON.parse(req.form.stateData).details
  };
  Logger.getLogger('Adyen').error('paymentDetailsRequest handle3DS2Authentication is ... ' + JSON.stringify(paymentDetailsRequest));
  return handlePaymentsCall(
    paymentDetailsRequest,
    order,
    paymentInstrument,
    options,
  );
}

function createAuthorization(session, options) {
  const is3DS2 = contains3ds2Action(options);
  return is3DS2
    ? handle3DS2Authentication(session, options)
    : toggle3DS2Error(options);
}

module.exports = createAuthorization;
