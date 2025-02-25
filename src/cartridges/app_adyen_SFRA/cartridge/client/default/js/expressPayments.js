const {
  checkIfExpressMethodsAreReady,
  getPaymentMethods,
} = require('./commons');

const applePayExpressModule = require('./adyen_express/applePayExpress');
const paypalPayExpressModule = require('./adyen_express/paypalExpress');
const googlePayExpressModule = require('./adyen_express/googlePayExpress');
const amazonPayExpressModule = require('./adyen_express/amazonPayExpressPart1');

let paymentMethodsResponse = null;

function handleExpressPaymentsVisibility() {
  const { expressMethodsOrder } = window;
  if (expressMethodsOrder) {
    const sortOrder = expressMethodsOrder.split(',');
    const container = document.getElementById('express-container');
    const toSort = Array.prototype.slice.call(container.children, 0);
    toSort.sort(
      (a, b) =>
        sortOrder.indexOf(a.dataset.method) -
        sortOrder.indexOf(b.dataset.method),
    );
    container.innerHTML = '';
    [...toSort].map((node) => container.appendChild(node));
  }
}

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
handleExpressPaymentsVisibility();
checkIfExpressMethodsAreReady();
