const store = require('../../../store');
const helpers = require('./adyen_checkout/helpers');

const amazonPayNode = document.getElementById('amazon-container');
const checkout = new AdyenCheckout(window.Configuration);

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
  } else if (response.paymentError) {
    // first try the amazon decline flow
    component.handleDeclineFlow();
    // if this does not trigger a redirect, try te regular handleError flow
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
    },
    success(response) {
      if (response.orderNo) {
        document.querySelector('#merchantReference').value = response.orderNo;
      }
      handleAmazonResponse(response, component);
    },
  });
}

const amazonConfig = {
  showOrderButton: false,
  returnUrl: window.returnURL,
  configuration: {
    merchantId: window.amazonMerchantID,
    storeId: window.amazonStoreID,
    publicKeyId: window.amazonPublicKeyID,
  },
  amazonCheckoutSessionId: window.amazonCheckoutSessionId,
  onSubmit: (state, component) => {
    document.querySelector('#adyenStateData').value = JSON.stringify(
      state.data,
    );
    document.querySelector('#additionalDetailsHidden').value = JSON.stringify(
      state.data,
    );
    paymentFromComponent(state.data, component);
  },
  onAdditionalDetails: (state) => {
    state.data.paymentMethod = 'amazonpay';
    $.ajax({
      type: 'post',
      url: window.paymentsDetailsURL,
      data: JSON.stringify(state.data),
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

helpers.createShowConfirmationForm(window.ShowConfirmationPaymentFromComponent);

$('#dwfrm_billing').submit(function apiRequest(e) {
  e.preventDefault();

  const form = $(this);
  const url = form.attr('action');

  $.ajax({
    type: 'POST',
    url,
    data: form.serialize(),
    async: false,
    success(data) {
      store.formErrorsExist = 'fieldErrors' in data;
    },
  });
});
$('#action-modal').modal({ backdrop: 'static', keyboard: false });
amazonPayComponent.submit();
