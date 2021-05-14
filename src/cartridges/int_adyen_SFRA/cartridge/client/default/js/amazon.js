const amazonPayNode = document.getElementById('amazon-container');

console.log(window.amazonCheckoutSessionId)
const amazonConfig = {
  showPayButton: true,
  // productType: 'PayOnly',
  // checkoutMode: 'ProcessOrder',
  returnUrl: window.returnURL,
  // configuration: {
  //   merchantId: "AAUL9GPRGTX1U",
  //   storeId: "amzn1.application-oa2-client.3e5db0a580f7468da2d9903dda981fce",
  //   publicKeyId: "AGDRUNN37LQHSOCHN24AEYYB"
  // },
  amazonCheckoutSessionId: window.amazonCheckoutSessionId,
  amount: {
    value: "88800",
    currency: "GBP"
  },
};

const checkout = new AdyenCheckout(window.Configuration);
checkout.create('amazonpay', amazonConfig).mount(amazonPayNode);
