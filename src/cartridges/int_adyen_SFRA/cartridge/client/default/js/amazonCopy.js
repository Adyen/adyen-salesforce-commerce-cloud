const store = require('../../../store');
const helpers = require('./adyen_checkout/helpers');

function handleAuthorised(response) {
  document.querySelector('#result').value = JSON.stringify({
    pspReference: response.fullResponse?.pspReference,
    resultCode: response.fullResponse?.resultCode,
    paymentMethod: response.fullResponse?.paymentMethod
      ? response.fullResponse.paymentMethod
      : response.fullResponse?.additionalData?.paymentMethod,
  });
  document.querySelector('#showConfirmationForm').submit();
}

function handleError() {
  document.querySelector('#result').value = JSON.stringify({
    error: true,
  });
  document.querySelector('#showConfirmationForm').submit();
}

function handleAmazonResponse(response, component) {
  if (response.fullResponse?.action) {
    component.handleAction(response.fullResponse.action);
  } else if (response.resultCode === window.resultCodeAuthorised) {
    handleAuthorised(response);
  } else {
    // first try the amazon decline flow
    component.handleDeclineFlow();
    // if this does not trigger a redirect, try the regular handleError flow
    handleError();
  }
}

function paymentFromComponent(data, component) {
  $.ajax({
    url: window.paymentFromComponentURL,
    type: 'post',
    data: {
      data: JSON.stringify(data),
      paymentMethod: 'amazonpay',
      merchantReference: document.querySelector('#merchantReference').value,
      orderToken: document.querySelector('#orderToken').value,
    },
    success(response) {
      helpers.setOrderFormData(response);
      handleAmazonResponse(response, component);
    },
  });
}

//function paymentFromComponent(data, component) {
//    console.log('inside PFC .. save shopper url is ')
//    console.log(window.saveShopperDetailsURL);
//    console.log(data);
//  $.ajax({
////    url: window.paymentFromComponentURL,
//    url: window.saveShopperDetailsURL,
//    type: 'post',
//    data: {
//      data: JSON.stringify(data),
//      paymentMethod: 'amazonpay',
//    },
//    success(response) {
//      helpers.setOrderFormData(response);
//      handleAmazonResponse(response, component);
//    },
//    fail: (e) => {
//      console.log('inside fail');
//      console.log(e.toString());
//    },
//  });
//}

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
//    returnUrl: 'https://10.211.55.3:3000/secondRedirect',
    returnUrl: window.returnUrl,
      amount: JSON.parse(window.basketAmount),
    amazonCheckoutSessionId: window.amazonCheckoutSessionId,
    //    configuration: {
    //      merchantId: window.amazonMerchantID,
    //      storeId: window.amazonStoreID,
    //      publicKeyId: window.amazonPublicKeyID,
    //    },
//    onSubmit: async (state, component) => {
//      document.querySelector('#adyenStateData').value = JSON.stringify(
//        state.data,
//      );
//      document.querySelector('#additionalDetailsHidden').value = JSON.stringify(
//        state.data,
//      );
//
//        const shopperDetails = await window.amazonPayComponent.getShopperDetails();
//        console.log('shopper details ' + JSON.stringify(shopperDetails));
//
//        state.data.shopperDetails = shopperDetails;
//
//      paymentFromComponent(state.data, component);
//    },
//    onAdditionalDetails: (state) => {
//      state.data.paymentMethod = 'amazonpay';
//      $.ajax({
//        type: 'post',
//        url: window.paymentsDetailsURL,
//        data: JSON.stringify({
//          data: state.data,
//          orderToken: window.orderToken,
//        }),
//        contentType: 'application/json; charset=utf-8',
//        success(data) {
//          if (data.isSuccessful) {
//            handleAuthorised(data);
//          } else if (!data.isFinal && typeof data.action === 'object') {
//            checkout.createFromAction(data.action).mount('#amazon-container');
//          } else {
//            $('#action-modal').modal('hide');
//            handleError();
//          }
//        },
//      });
//    },
  };

//  const amazonConfig = {
//             showOrderButton: true,
//             amount: {
//                      currency: 'GBP',
//                      value: 1000
//                  },
//               amazonCheckoutSessionId: window.amazonCheckoutSessionId,
//               returnUrl: 'https://10.211.55.3:3000/secondRedirect',
//  }

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
