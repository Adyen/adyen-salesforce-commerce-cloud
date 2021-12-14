const Resource = require('dw/web/Resource');
const constants = require('*/cartridge/adyenConstants/constants');
const adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');

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
  if(handlePaymentResult.action && handlePaymentResult.action?.type !== constants.ACTIONTYPES.VOUCHER) {
    res.json({
      error: false,
      action: handlePaymentResult.action,
      orderID: order.orderNo,
      orderToken: order.orderToken,
    });

    emit('route:Complete');
    return false;
  }
  return true;
}

module.exports = handlePaymentAuthorization;
