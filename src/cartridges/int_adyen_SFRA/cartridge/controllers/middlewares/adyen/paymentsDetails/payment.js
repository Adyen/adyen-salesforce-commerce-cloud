const URLUtils = require('dw/web/URLUtils');
const Resource = require('dw/web/Resource');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

function handlePaymentsDetails(stateData) {
  return adyenCheckout.doPaymentDetailsCall(stateData);
}

module.exports = handlePaymentsDetails;
