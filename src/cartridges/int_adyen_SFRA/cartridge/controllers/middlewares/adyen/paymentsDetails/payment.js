const Logger = require('dw/system/Logger');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

function getFinalResponse(paymentsDetailsResponse) {
  return {
    isFinal: true,
    isSuccessful: paymentsDetailsResponse.resultCode === 'Authorised',
    ...(['Refused', 'Error'].indexOf(paymentsDetailsResponse.resultCode) !==
      -1 && { refusalReason: paymentsDetailsResponse.refusalReason }),
  };
}

function handlePaymentsDetails(stateData) {
  const paymentsDetailsResponse = adyenCheckout.doPaymentDetailsCall(stateData);

  if (
    ['Authorised', 'Refused', 'Error', 'Cancelled'].indexOf(
      paymentsDetailsResponse.resultCode,
    ) !== -1
  ) {
    return getFinalResponse(paymentsDetailsResponse);
  }

  if (
    [
      'RedirectShopper',
      'IdentifyShopper',
      'ChallengeShopper',
      'PresentToShopper',
      'Pending',
    ].indexOf(paymentsDetailsResponse.resultCode) !== -1
  ) {
    return {
      isFinal: false,
      action: paymentsDetailsResponse.action,
    };
  }

  if (paymentsDetailsResponse.resultCode === 'Received') {
    return {
      isFinal: false,
    };
  }

  Logger.getLogger('Adyen').error(
    `Unknown resultCode: ${paymentsDetailsResponse.resultCode}.`,
  );
  return {
    isFinal: true,
    isSuccessful: false,
  };
}

module.exports = handlePaymentsDetails;
