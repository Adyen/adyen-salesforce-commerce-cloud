async function saveShopperDetails(data) {
  $.ajax({
    url: window.saveShopperDetailsURL,
    type: 'post',
    data: {
      shopperDetails: JSON.stringify(data),
      paymentMethod: 'amazonpay',
    },
  });
}

function updateShippingMethods(data) {
    const template = document.createElement('template');
    const form = `<form method="post" id="updateShippingMethodsForm" name="updateShippingMethodsForm" action="${window.updateShippingMethodsURL}">
    <input type="hidden" id="additionalDetailsHidden" name="additionalDetailsHidden" value="${data}"/>
    </form>`;

    template.innerHTML = form;
    document.querySelector('body').appendChild(template.content);
    document.querySelector('#updateShippingMethodsForm').submit();

//  $.ajax({
//    url: window.updateShippingMethodsURL,
//    type: 'post',
//    data: {
//      basketModel: JSON.stringify(data),
//    },
//  });
}

function updateShippingMethodsList(data) {
    $.ajax({
        url: window.updateShippingMethodsListURL,
        type: 'post',
        data: data,
        success: function (data) {
            console.log('inside success');
            console.log('applicableShippingMethods ' + JSON.stringify(data.order.shipping[0].applicableShippingMethods));

            updateShippingMethods(data.order);

            if (data.error) {
                window.location.href = data.redirectUrl;
            } else {
                $('body').trigger('checkout:updateCheckoutView',
                    {
                        order: data.order,
                        customer: data.customer,
                        options: { keepOpen: true }
                    });
//                $shippingMethodList.spinner().stop();
            }
        }
    });
}

async function mountAmazonPayComponent() {
//  const amazonPayNode = document.getElementById('amazon-container');
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
//    .mount(amazonPayNode);

  const shopperDetails = await amazonPayComponent.getShopperDetails();
  await saveShopperDetails(shopperDetails);

  console.log('saved shopper details');

    const amazonPayNode = document.getElementById('amazon-container');
    console.log('about to mount');
    amazonPayComponent.mount(amazonPayNode);
    console.log('after mount');
//  const data = {
//    firstName: shopperDetails.shippingAddress.name.split(' ')[0],
//    lastName: shopperDetails.shippingAddress.name.split(' ')[1],
//    address1: shopperDetails.shippingAddress.addressLine1,
//    address2: shopperDetails.shippingAddress.addressLine2,
//    city: shopperDetails.shippingAddress.city,
//    postalCode: shopperDetails.shippingAddress.postalCode,
//    stateCode: shopperDetails.shippingAddress.stateOrRegion,
//    countryCode: shopperDetails.shippingAddress.countryCode,
//    phone: shopperDetails.shippingAddress.phoneNumber,
//    shipmentUUID: window.shipmentUUID,
//  };
//  updateShippingMethodsList(data);
}

mountAmazonPayComponent();


//$(document).ready(function(){
//});