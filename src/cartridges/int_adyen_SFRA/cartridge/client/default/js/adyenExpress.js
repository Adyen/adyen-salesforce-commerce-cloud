const store = require('../../../store');

$(document).ready(() => {
  // card and checkout component creation
  const expressCheckoutNodes = document.getElementsByClassName(
    'expressComponent',
  );
  const checkout = new AdyenCheckout(store.checkoutConfiguration);
  console.log(expressCheckoutNodes.length)

  for (
    let expressCheckoutNodesIndex = 0;
    expressCheckoutNodesIndex < expressCheckoutNodes.length;
    expressCheckoutNodesIndex += 1
  ) {
//    if (window.configuration.isPayPalExpressEnabled) {
      checkout
        .create('paypal')
        .mount(expressCheckoutNodes[expressCheckoutNodesIndex]);
    }
//  }
});