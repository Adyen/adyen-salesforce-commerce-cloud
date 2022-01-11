"use strict";

var OrderMgr = require('dw/order/OrderMgr');

var constants = require('*/cartridge/adyenConstants/constants');

var handlePaymentsDetailsCall = require('./payment');

var _require = require('./errorHandler'),
    toggle3DS2Error = _require.toggle3DS2Error;

function contains3ds2Action(_ref) {
  var req = _ref.req;
  return [constants.RESULTCODES.IDENTIFYSHOPPER, constants.RESULTCODES.CHALLENGESHOPPER].indexOf(req.form.resultCode) !== -1 || req.form.challengeResult;
}

function handle3DS2Authentication(options) {
  var req = options.req;
  var order = OrderMgr.getOrder(req.form.merchantReference);
  var paymentInstrument = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT)[0];
  var paymentDetailsRequest = {
    paymentData: paymentInstrument.custom.adyenPaymentData,
    details: JSON.parse(req.form.stateData).details
  };
  return handlePaymentsDetailsCall(paymentDetailsRequest, order, paymentInstrument, options);
}

function createAuthorization(options) {
  var is3DS2 = contains3ds2Action(options);
  return is3DS2 ? handle3DS2Authentication(options) : toggle3DS2Error(options);
}

module.exports = createAuthorization;