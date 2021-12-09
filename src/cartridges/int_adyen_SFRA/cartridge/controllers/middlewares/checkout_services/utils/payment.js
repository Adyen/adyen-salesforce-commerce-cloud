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

  // if there is an action which is not a voucher
  Logger.getLogger('Adyen').error('handlePaymentResult = ' + JSON.stringify(handlePaymentResult));
  if(handlePaymentResult?.action?.type !== constants.ACTIONTYPES.VOUCHER) {
    // Get the payment instrument and store the action
    const paymentInstrument = order.getPaymentInstruments(
        constants.METHOD_ADYEN_COMPONENT,
    )[0];
    Transaction.wrap(() => {
      paymentInstrument.custom.adyenAction = handlePaymentResult.action;
    });

    Logger.getLogger('Adyen').error('Return the Action here');
    res.json({
      error: false,
      handleAction: true,
      action: JSON.stringify(handlePaymentResult.action)
    });

    emit('route:Complete');
    return {
      action: handlePaymentResult.action
    };
  }
  Logger.getLogger('Adyen').error('Return TRUE');
  return true;
}

module.exports = handlePaymentAuthorization;
