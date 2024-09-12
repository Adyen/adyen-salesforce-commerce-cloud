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
  const partialPaymentsOrder = sessionStorage.getItem('partialPaymentsObj');
  const requestData = partialPaymentsOrder
    ? { ...data, partialPaymentsOrder: JSON.parse(partialPaymentsOrder) }
    : data;

  $.ajax({
    url: window.paymentFromComponentURL,
    type: 'post',
    data: {
      csrf_token: $('#adyen-token').val(),
      data: JSON.stringify(requestData),
      paymentMethod: 'amazonpay',
      merchantReference: document.querySelector('#merchantReference').value,
      orderToken: document.querySelector('#orderToken').value,
    },
    success(response) {
      sessionStorage.removeItem('partialPaymentsObj');
      helpers.setOrderFormData(response);

      handleAmazonResponse(response, component);
    },
  });
}

async function mountAmazonPayComponent() {
  const amazonPayNode = document.getElementById('amazon-container');
  const checkout = await AdyenCheckout(window.Configuration);

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
      const requestData = JSON.stringify({
        data: state.data,
        orderToken: window.orderToken,
      });
      $.ajax({
        type: 'post',
        url: window.paymentsDetailsURL,
        data: {
          csrf_token: $('#adyen-token').val(),
          data: requestData,
        },
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

  helpers.createShowConfirmationForm(
    window.ShowConfirmationPaymentFromComponent,
  );

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
}

mountAmazonPayComponent();
