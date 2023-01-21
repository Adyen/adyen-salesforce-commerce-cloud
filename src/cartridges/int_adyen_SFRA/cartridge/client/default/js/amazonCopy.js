const helpers = require('./adyen_checkout/helpers');

function saveShopperDetails(data) {
    console.log('save shopper details');
    console.log(window.saveShopperDetailsURL)
  $.ajax({
    url: window.saveShopperDetailsURL,
    type: 'post',
    data: {
      shopperDetails: JSON.stringify(data),
      paymentMethod: 'amazonpay',
    },
    success(response) {
        console.log('response ' + JSON.stringify(response));
    },
      fail: (e) => {
        console.log('inside fail');
        console.log(e.toString());
      },
  });
}

async function mountAmazonPayComponent() {
  const amazonPayNode = document.getElementById('amazon-container');
  const checkout = await AdyenCheckout(window.Configuration);

  const amazonConfig = {
    showOrderButton: true,
    returnUrl: window.returnUrl,
      amount: JSON.parse(window.basketAmount),
    amazonCheckoutSessionId: window.amazonCheckoutSessionId,
  };

   window.amazonPayComponent = checkout
    .create('amazonpay', amazonConfig)
    .mount(amazonPayNode);

    helpers.createShowConfirmationForm(
      window.ShowConfirmationPaymentFromComponent,
    );

    $('#action-modal').modal({ backdrop: 'static', keyboard: false });
//    amazonPayComponent.submit();

    const shopperDetails = await window.amazonPayComponent.getShopperDetails();
    console.log('shopper details ' + JSON.stringify(shopperDetails));
    saveShopperDetails(shopperDetails);

}

console.log('inside amazon Copyy.js')
    mountAmazonPayComponent();
