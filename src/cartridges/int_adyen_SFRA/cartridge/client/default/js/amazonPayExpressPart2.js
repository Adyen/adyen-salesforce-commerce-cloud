function saveShopperDetails(data) {
  $.ajax({
    url: window.saveShopperDetailsURL,
    type: 'post',
    data: {
      shopperDetails: JSON.stringify(data),
      paymentMethod: 'amazonpay',
    },
  });
}

async function mountAmazonPayComponent() {
  const amazonPayNode = document.getElementById('amazon-container');
  const checkout = await AdyenCheckout(window.Configuration);

  const amazonConfig = {
    showOrderButton: true,
    returnUrl: window.returnUrl,
    showChangePaymentDetailsButton: true,
    amount: JSON.parse(window.basketAmount),
    amazonCheckoutSessionId: window.amazonCheckoutSessionId,
  };

  const amazonPayComponent = checkout
    .create('amazonpay', amazonConfig)
    .mount(amazonPayNode);

  const shopperDetails = await amazonPayComponent.getShopperDetails();
  saveShopperDetails(shopperDetails);
}

mountAmazonPayComponent();
