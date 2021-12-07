const Resource = require('dw/web/Resource');
const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');
const constants = require('*/cartridge/adyenConstants/constants');
const adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');
const Logger = require('dw/system/Logger');

function handlePaymentAuthorization(order, { res }, emit) {

  // Handles payment authorization
  const handlePaymentResult = adyenHelpers.handlePayments(order, order.orderNo);
  if (handlePaymentResult.error) {
    res.json({
      error: true,
      errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null),
    });
    emit('route:Complete');
    return false;
  }

  //handle action types accordingly
  if(handlePaymentResult?.action?.type === constants.ACTIONTYPES.VOUCHER) {
    return true;
  }

  // Get the payment instrument and store the action
  const paymentInstrument = order.getPaymentInstruments(
      constants.METHOD_ADYEN_COMPONENT,
  )[0];
  Transaction.wrap(() => {
    paymentInstrument.custom.adyenAction = handlePaymentResult.action;
  });

  Logger.getLogger('Adyen').error('res.rendering! ' + order.orderNo);
  res.render('actionRedirectForm', {
    orderID: order.orderNo,
    orderToken: order.orderToken,
  });

  emit('route:Complete');
  return false;
}

module.exports = handlePaymentAuthorization;
