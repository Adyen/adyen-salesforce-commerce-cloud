/**
 *
 */

/* API Includes */
const Logger = require('dw/system/Logger');

/* Script Modules */
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

function zeroAuthPayment(customer, paymentInstrument) {
  try {
    let zeroAuthRequest = AdyenHelper.createAdyenRequestObject(
      null,
      paymentInstrument,
    );

    if (AdyenHelper.getAdyen3DS2Enabled()) {
      zeroAuthRequest = AdyenHelper.add3DS2Data(zeroAuthRequest);
    }
    zeroAuthRequest.amount = {
      currency: session.currency.currencyCode,
      value: 0,
    };

    zeroAuthRequest.storePaymentMethod = true;
    zeroAuthRequest.shopperReference = customer.getProfile().getCustomerNo();
    zeroAuthRequest.shopperEmail = customer.getProfile().getEmail();

    return adyenCheckout.doPaymentCall(
      null,
      paymentInstrument,
      zeroAuthRequest,
    );
  } catch (e) {
    Logger.getLogger('Adyen').error(
      `error processing zero auth payment. Error message: ${
        e.message
      } more details: ${
        e.toString()
      } in ${
        e.fileName
      }:${
        e.lineNumber}`,
    );
    return { error: true };
  }
}

module.exports = {
  zeroAuthPayment: zeroAuthPayment,
};
