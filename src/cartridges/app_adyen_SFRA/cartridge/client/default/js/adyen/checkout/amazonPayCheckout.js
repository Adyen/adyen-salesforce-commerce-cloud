const store = require('../../../../../config/store');
const helpers = require('./helpers');
const { AMAZON_PAY } = require('../../../../../config/constants');
const { httpClient } = require('../../commons/httpClient');

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

async function paymentFromComponent(data, component) {
  const partialPaymentsOrder = sessionStorage.getItem('partialPaymentsObj');
  const requestData = partialPaymentsOrder
    ? { ...data, partialPaymentsOrder: JSON.parse(partialPaymentsOrder) }
    : data;

  const response = await httpClient({
    method: 'POST',
    url: window.paymentFromComponentURL,
    data: {
      data: JSON.stringify(requestData),
      paymentMethod: AMAZON_PAY,
      merchantReference: document.querySelector('#merchantReference').value,
      orderToken: document.querySelector('#orderToken').value,
    },
  });
  sessionStorage.removeItem('partialPaymentsObj');
  helpers.setOrderFormData(response);
  handleAmazonResponse(response, component);
}

async function mountAmazonPayComponent() {
  const amazonPayNode = document.getElementById('amazon-container');
  const checkout = await window.AdyenWeb.AdyenCheckout(window.Configuration);

  const amazonConfig = {
    showOrderButton: false,
    returnUrl: window.returnURL,
    configuration: {
      merchantId: window.amazonMerchantID,
      storeId: window.amazonStoreID,
      publicKeyId: window.amazonPublicKeyID,
    },
    amazonCheckoutSessionId: window.amazonCheckoutSessionId,
    onSubmit: async (state, component) => {
      document.querySelector('#adyenStateData').value = JSON.stringify(
        state.data,
      );
      document.querySelector('#additionalDetailsHidden').value = JSON.stringify(
        state.data,
      );
      await paymentFromComponent(state.data, component);
    },
    onAdditionalDetails: async (state) => {
      state.data.paymentMethod = AMAZON_PAY;
      const requestData = JSON.stringify({
        data: state.data,
        orderToken: window.orderToken,
      });
      const data = await httpClient({
        method: 'POST',
        url: window.paymentsDetailsURL,
        data: {
          data: requestData,
        },
      });
      if (data.isSuccessful) {
        handleAuthorised(data);
      } else if (!data.isFinal && typeof data.action === 'object') {
        checkout.createFromAction(data.action).mount('#amazon-container');
      } else {
        $('#action-modal').modal('hide');
        handleError();
      }
    },
  };

  const amazonPayComponent = window.AdyenWeb.createComponent(
    AMAZON_PAY,
    checkout,
    amazonConfig,
  );
  amazonPayComponent.mount(amazonPayNode);
  helpers.createShowConfirmationForm(
    window.ShowConfirmationPaymentFromComponent,
  );

  $('#dwfrm_billing').submit(async function apiRequest(e) {
    e.preventDefault();

    const form = $(this);
    const url = form.attr('action');

    const formDataObject = form.serializeArray().reduce((obj, item) => {
      obj[item.name] = item.value;
      return obj;
    }, {});

    const data = await httpClient({
      method: 'POST',
      url,
      data: formDataObject,
    });
    store.formErrorsExist = 'fieldErrors' in data;
  });
  $('#action-modal').modal({ backdrop: 'static', keyboard: false });
  amazonPayComponent.submit();
}

mountAmazonPayComponent();
