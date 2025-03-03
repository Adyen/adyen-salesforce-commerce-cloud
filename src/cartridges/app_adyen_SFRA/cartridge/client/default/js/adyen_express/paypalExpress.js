const {
  updateLoadedExpressMethods,
  checkIfExpressMethodsAreReady,
} = require('../commons');
const helpers = require('../adyen_checkout/helpers');
const { PAYPAL } = require('../constants');
const { httpClient } = require('../commons/httpClient');
const { initializeCheckout } = require('./initializeCheckout');

async function callPaymentFromComponent(data, component) {
  try {
    $.spinner().start();
    const response = await httpClient({
      method: 'POST',
      url: window.makeExpressPaymentsCall,
      data: {
        data: JSON.stringify(data),
      },
    });
    const { action } = response.fullResponse;
    if (action) {
      component.handleAction(action);
    } else {
      component.handleError();
    }
  } catch (e) {
    component.handleError();
  }
}

async function saveShopperDetails(details, actions) {
  try {
    await httpClient({
      method: 'POST',
      url: window.saveShopperData,
      data: {
        shopperDetails: JSON.stringify(details),
      },
    });
    actions.resolve();
  } catch (e) {
    $.spinner().stop();
  }
}

function redirectToReviewPage(data) {
  const redirect = $('<form>').appendTo(document.body).attr({
    method: 'POST',
    action: window.checkoutReview,
  });
  $('<input>')
    .appendTo(redirect)
    .attr({
      name: 'data',
      value: JSON.stringify(data),
    });

  $('<input>')
    .appendTo(redirect)
    .attr({
      name: 'csrf_token',
      value: $('#adyen-token').val(),
    });

  redirect.submit();
}

async function makeExpressPaymentDetailsCall(data) {
  try {
    const response = await httpClient({
      method: 'POST',
      url: window.makeExpressPaymentDetailsCall,
      data: {
        data: JSON.stringify({ data }),
      },
    });
    helpers.createShowConfirmationForm(window.showConfirmationAction);
    helpers.setOrderFormData(response);
  } catch (e) {
    $.spinner().stop();
  }
}

function updateComponent(response, component) {
  if (response) {
    const { paymentData, status, errorMessage = '' } = response;
    if (!paymentData || status !== 'success') {
      throw new Error(errorMessage);
    }
    // Update the Component paymentData value with the new one.
    component.updatePaymentData(paymentData);
  } else {
    const { errorMessage = '' } = response;
    throw new Error(errorMessage);
  }
  return false;
}

async function handleShippingAddressChange(data, actions, component) {
  try {
    const { shippingAddress } = data;
    const currentPaymentData = component.paymentData;
    if (!shippingAddress) {
      actions.reject();
      return;
    }
    const requestBody = {
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
    const response = await httpClient({
      method: 'POST',
      url: window.shippingMethodsUrl,
      data: {
        data: JSON.stringify(requestBody),
      },
    });
    updateComponent(response, component);
  } catch (e) {
    actions.reject();
  }
}

async function handleShippingOptionChange(data, actions, component) {
  try {
    const { selectedShippingOption } = data;
    if (!selectedShippingOption) {
      actions.reject();
    } else {
      const response = await httpClient({
        method: 'POST',
        url: window.selectShippingMethodUrl,
        data: {
          data: JSON.stringify({
            paymentMethodType: PAYPAL,
            currentPaymentData: component.paymentData,
            methodID: selectedShippingOption?.id,
          }),
        },
      });
      updateComponent(response, component);
    }
  } catch (e) {
    actions.reject();
  }
}

function getPaypalButtonConfig(paypalConfig) {
  const { paypalReviewPageEnabled } = window;
  return {
    showPayButton: true,
    configuration: paypalConfig,
    returnUrl: window.returnUrl,
    amount: JSON.parse(window.basketAmount),
    isExpress: true,
    ...(paypalReviewPageEnabled ? { userAction: 'continue' } : {}),
    onSubmit: async (state, component) => {
      await callPaymentFromComponent(state.data, component);
    },
    onError: async () => {
      $.spinner().stop();
    },
    onShopperDetails: async (shopperDetails, rawData, actions) => {
      await saveShopperDetails(shopperDetails, actions);
    },
    onAdditionalDetails: async (state) => {
      if (paypalReviewPageEnabled) {
        redirectToReviewPage(state.data);
      } else {
        await makeExpressPaymentDetailsCall(state.data);
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

async function init(paymentMethodsResponse) {
  try {
    const paypalConfig =
      paymentMethodsResponse?.AdyenPaymentMethods?.paymentMethods.find(
        (pm) => pm.type === PAYPAL,
      )?.configuration;
    if (!paypalConfig) {
      updateLoadedExpressMethods(PAYPAL);
      checkIfExpressMethodsAreReady();
      return;
    }
    const checkout = await initializeCheckout(paymentMethodsResponse);
    const paypalButtonConfig = getPaypalButtonConfig(paypalConfig);
    const paypalExpressButton = window.AdyenWeb.createComponent(
      PAYPAL,
      checkout,
      paypalButtonConfig,
    );
    paypalExpressButton.mount('#paypal-container');
    updateLoadedExpressMethods(PAYPAL);
    checkIfExpressMethodsAreReady();
  } catch (e) {
    //
  }
}

module.exports = {
  callPaymentFromComponent,
  saveShopperDetails,
  makeExpressPaymentDetailsCall,
  handleShippingAddressChange,
  handleShippingOptionChange,
  getPaypalButtonConfig,
  init,
};
