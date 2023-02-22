function saveShopperDetails(details) {
  $.ajax({
    url: window.saveShopperDetailsURL,
    type: 'post',
    data: {
      shopperDetails: JSON.stringify(details),
      paymentMethod: 'amazonpay',
    },
    success(data) {
      const select = document.querySelector('#shippingMethods');
      select.innerHTML = '';
      data.shippingMethods.forEach((shippingMethod) => {
        const option = document.createElement('option');
        option.setAttribute('data-shipping-id', shippingMethod.ID);
        option.innerText = `${shippingMethod.displayName} (${shippingMethod.estimatedArrivalTime})`;
        select.appendChild(option);
      });
      select.options[0].selected = true;
      select.dispatchEvent(new Event('change'));
    },
  });
}

async function mountAmazonPayComponent() {
  const amazonPayNode = document.getElementById('amazon-container');
  const checkout = await AdyenCheckout(window.Configuration);

  try {
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
  } catch (e) {
    //
  }
}

mountAmazonPayComponent();

module.exports = saveShopperDetails;
