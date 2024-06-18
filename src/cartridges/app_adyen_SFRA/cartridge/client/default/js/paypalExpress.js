const {
  getPaymentMethods,
  updateLoadedExpressMethods,
  checkIfExpressMethodsAreReady,
} = require('./commons');
const helpers = require('./adyen_checkout/helpers');
const { PAYPAL } = require('./constants');

async function callPaymentFromComponent(data, component) {
  $.spinner().start();
  const response = await fetch(window.makeExpressPaymentsCall, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (response.ok) {
    const { action } = await response.json();
    if (!action) {
      component.handleError();
    }
    component.handleAction(action);
  } else {
    component.handleError();
  }
}

async function saveShopperDetails(details) {
  return $.ajax({
    url: window.saveShopperData,
    type: 'post',
    data: {
      shopperDetails: JSON.stringify(details),
    },
    error() {
      $.spinner().stop();
    },
  });
}

async function redirectToReviewPage() {
  return $.ajax({
    url: window.checkoutReview,
    type: 'get',
    success() {
      window.location.href = window.checkoutReview;
    },
    error() {
      $.spinner().stop();
    },
  });
}

function makeExpressPaymentDetailsCall(data) {
  return $.ajax({
    type: 'POST',
    url: window.makeExpressPaymentDetailsCall,
    data: JSON.stringify({ data }),
    contentType: 'application/json; charset=utf-8',
    async: false,
    success(response) {
      helpers.createShowConfirmationForm(window.showConfirmationAction);
      helpers.setOrderFormData(response);
    },
    error() {
      $.spinner().stop();
    },
  });
}

async function updateComponent(response, component) {
  if (response.ok) {
    const { paymentData, status, errorMessage = '' } = await response.json();
    if (!paymentData || status !== 'success') {
      throw new Error(errorMessage);
    }
    // Update the Component paymentData value with the new one.
    component.updatePaymentData(paymentData);
  } else {
    const { errorMessage = '' } = await response.json();
    throw new Error(errorMessage);
  }
  return false;
}
async function handleShippingAddressChange(data, actions, component) {
  try {
    const { shippingAddress, errors } = data;
    const currentPaymentData = component.paymentData;
    if (!shippingAddress) {
      throw new Error(errors?.ADDRESS_ERROR);
    }
    const request = {
      paymentMethodType: PAYPAL,
      currentPaymentData,
      address: {
        city: shippingAddress.city,
        country: shippingAddress.country,
        countryCode: shippingAddress.countryCode,
        stateCode: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
      },
    };
    const response = await fetch(window.shippingMethodsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(request),
    });
    return updateComponent(response, component);
  } catch (e) {
    return actions.reject();
  }
}

async function handleShippingOptionChange(data, actions, component) {
  try {
    const { selectedShippingOption, errors } = data;
    const currentPaymentData = component.paymentData;
    if (!selectedShippingOption) {
      throw new Error(errors?.METHOD_UNAVAILABLE);
    }
    const request = {
      paymentMethodType: PAYPAL,
      currentPaymentData,
      methodID: selectedShippingOption?.id,
    };
    const response = await fetch(window.selectShippingMethodUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(request),
    });
    return updateComponent(response, component);
  } catch (e) {
    return actions.reject();
  }
}

function getPaypalButtonConfig(paypalConfig) {
  const { paypalReviewPageEnabled } = window;
  return {
    showPayButton: true,
    configuration: paypalConfig,
    returnUrl: window.returnUrl,
    isExpress: true,
    ...(paypalReviewPageEnabled ? { userAction: 'continue' } : {}),
    onSubmit: async (state, component) => {
      await callPaymentFromComponent(state.data, component);
    },
    onError: async () => {
      $.spinner().stop();
    },
    onShopperDetails: async (shopperDetails, rawData, actions) => {
      await saveShopperDetails(shopperDetails);
      actions.resolve();
    },
    onAdditionalDetails: (state) => {
      if (paypalReviewPageEnabled) {
        redirectToReviewPage();
        // continue the rest of logic
      } else {
        makeExpressPaymentDetailsCall(state.data);
        document.querySelector('#additionalDetailsHidden').value =
          JSON.stringify(state.data);
        document.querySelector('#showConfirmationForm').submit();
      }
    },
    onShippingAddressChange: async (data, actions, component) => {
      await handleShippingAddressChange(data, actions, component);
    },
    onShippingOptionsChange: async (data, actions, component) => {
      await handleShippingOptionChange(data, actions, component);
    },
  };
}

async function mountPaypalComponent() {
  try {
    const paymentMethod = await getPaymentMethods();
    const paymentMethodsResponse = paymentMethod?.AdyenPaymentMethods;
    const applicationInfo = paymentMethod?.applicationInfo;
    const paypalConfig = paymentMethodsResponse?.paymentMethods.find(
      (pm) => pm.type === PAYPAL,
    )?.configuration;
    if (!paypalConfig) return;
    const checkout = await AdyenCheckout({
      environment: window.environment,
      clientKey: window.clientKey,
      locale: window.locale,
      analytics: {
        analyticsData: { applicationInfo },
      },
    });
    const paypalButtonConfig = getPaypalButtonConfig(paypalConfig);
    const paypalExpressButton = checkout.create(PAYPAL, paypalButtonConfig);
    paypalExpressButton.mount('#paypal-container');
    updateLoadedExpressMethods(PAYPAL);
    checkIfExpressMethodsAreReady();
  } catch (e) {
    //
  }
}

mountPaypalComponent();
