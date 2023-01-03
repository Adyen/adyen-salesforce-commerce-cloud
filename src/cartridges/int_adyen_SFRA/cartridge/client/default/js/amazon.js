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

async function mountAmazonPayComponent() {
  const amazonPayNode = document.getElementById('amazon-container');

  const environment = 'test';
  const session = await fetch(window.sessionsUrl);
  const sessionData = await session.json();
//  const checkout = await AdyenCheckout(window.Configuration);
  const checkout = await AdyenCheckout({
    environment,
    clientKey: window.clientKey,
    locale: window.locale,
    session: sessionData,
    onPaymentCompleted: (result, component) => {
      console.log(result, component);
    },
    // onError: (error, component) => {
    //   console.log(error.name, error.message, error.stack, component);
    // },
  });

  const builtInConfig = checkout.paymentMethodsResponse.paymentMethods.find(
    (pm) => pm.type === 'amazonpay',
  ).configuration;


// add the amazon pay configs ??
  const amazonConfig = {
    showOrderButton: false,
    returnUrl: window.returnURL,
    configuration: builtInConfig,
//    clientKey: window.clientKey,
//    productType: 'PayAndShip',
    amazonCheckoutSessionId: window.amazonCheckoutSessionId,
    onSubmit: (state, component) => {
//      document.querySelector('#adyenStateData').value = JSON.stringify(
//        state.data,
//      );
//      document.querySelector('#additionalDetailsHidden').value = JSON.stringify(
//        state.data,
//      );
      console.log('inside on submit')
      paymentFromComponent(state.data, component);
    },
    onAdditionalDetails: (state) => {
      state.data.paymentMethod = 'amazonpay';
      $.ajax({
        type: 'post',
        url: window.paymentsDetailsURL,
        data: JSON.stringify({
          data: state.data,
          orderToken: window.orderToken,
        }),
        contentType: 'application/json; charset=utf-8',
        success(data) {
          if (data.isSuccessful) {
            handleAuthorised(data);
          } else if (!data.isFinal && typeof data.action === 'object') {
            checkout.createFromAction(data.action).mount('#amazon-container');
          } else {
            $('#action-modal').modal('hide');
            handleError();
          }
        },
      });
    },
  };

  const amazonPayComponent = checkout
    .create('amazonpay', amazonConfig)
    .mount(amazonPayNode);

    console.log(amazonPayComponent.submit)

    const shopperDetails = await amazonPayComponent.getShopperDetails();
    console.log('shopper details ' + JSON.stringify(shopperDetails));

  helpers.createShowConfirmationForm(
    window.ShowConfirmationPaymentFromComponent,
  );

//  $('#dwfrm_billing').submit(function apiRequest(e) {
//    e.preventDefault();
//
//    const form = $(this);
//    const url = form.attr('action');
//
//    $.ajax({
//      type: 'POST',
//      url,
//      data: form.serialize(),
//      async: false,
//      success(data) {
//        store.formErrorsExist = 'fieldErrors' in data;
//      },
//    });
//  });
//  $('#action-modal').modal({ backdrop: 'static', keyboard: false });
  console.log('ABOUT to submit amazon pay');
  amazonPayComponent.submit();
}

mountAmazonPayComponent();
