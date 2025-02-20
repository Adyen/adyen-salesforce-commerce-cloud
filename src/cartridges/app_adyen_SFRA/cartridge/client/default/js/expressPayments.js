const { getPaymentMethods } = require('./commons');
const applePayExpressModule = require('./applePayExpress');
const paypalPayExpressModule = require('./paypalExpress');
const googlePayExpressModule = require('./googlePayExpress');
const amazonPayExpressModule = require('./amazonPayExpressPart1');

let paymentMethodsResponse = null;

async function init() {
  paymentMethodsResponse = await getPaymentMethods();
  $(document).ready(async () => {
    if (window.isApplePayExpressEnabled === 'true') {
      await applePayExpressModule.init(paymentMethodsResponse);
    }
    if (window.isPayPalExpressEnabled === 'true') {
      await paypalPayExpressModule.init(paymentMethodsResponse);
    }
    if (window.isAmazonPayExpressEnabled === 'true') {
      await amazonPayExpressModule.init(paymentMethodsResponse);
    }
    if (window.isGooglePayExpressEnabled === 'true') {
      await googlePayExpressModule.init(paymentMethodsResponse);
    }
  });
}

init();
