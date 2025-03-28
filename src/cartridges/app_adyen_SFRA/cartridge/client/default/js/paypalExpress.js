const {
  updateLoadedExpressMethods,
  checkIfExpressMethodsAreReady,
} = require('./commons');
const helpers = require('./adyen_checkout/helpers');
const { PAYPAL } = require('./constants');

async function callPaymentFromComponent(data, component) {
  try {
    $.spinner().start();

    $.ajax({
      type: 'POST',
      url: window.makeExpressPaymentsCall,
      data: {
        csrf_token: $('#adyen-token').val(),
        data: JSON.stringify(data),
      }, // Send the data as a JSON string
      success(response) {
        const { action, errorMessage = '' } = response.fullResponse;
        if (action) {
          component.handleAction(action);
        } else {
          throw new Error(errorMessage);
        }
      },
      error() {
        component.handleError();
      },
    });
  } catch (e) {
    component.handleError();
  }
}

async function saveShopperDetails(details, actions) {
  return $.ajax({
    url: window.saveShopperData,
    type: 'post',
    data: {
      shopperDetails: JSON.stringify(details),
      csrf_token: $('#adyen-token').val(),
    },
    success() {
      actions.resolve();
    },
    error() {
      $.spinner().stop();
    },
  });
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

function makeExpressPaymentDetailsCall(data) {
  return $.ajax({
    type: 'POST',
    url: window.makeExpressPaymentDetailsCall,
    data: {
      csrf_token: $('#adyen-token').val(),
      data: JSON.stringify({ data }),
    },
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
    const { shippingAddress, errors } = data;
    const currentPaymentData = component.paymentData;
    if (!shippingAddress) {
      throw new Error(errors?.ADDRESS_ERROR);
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
    $.ajax({
      type: 'POST',
      url: window.shippingMethodsUrl,
      data: {
        csrf_token: $('#adyen-token').val(),
        data: JSON.stringify(requestBody),
      },
      async: false,
      success(response) {
        updateComponent(response, component);
      },
      error() {
        actions.reject();
      },
    });
  } catch (e) {
    actions.reject();
  }
  return false;
}

async function handleShippingOptionChange(data, actions, component) {
  try {
    const { selectedShippingOption, errors } = data;
    const currentPaymentData = component.paymentData;
    if (!selectedShippingOption) {
      throw new Error(errors?.METHOD_UNAVAILABLE);
    }
    const requestBody = {
      paymentMethodType: PAYPAL,
      currentPaymentData,
      methodID: selectedShippingOption?.id,
    };
    $.ajax({
      type: 'POST',
      url: window.selectShippingMethodUrl,
      data: {
        csrf_token: $('#adyen-token').val(),
        data: JSON.stringify(requestBody),
      },
      async: false,
      success(response) {
        updateComponent(response, component);
      },
      error() {
        actions.reject();
      },
    });
  } catch (e) {
    actions.reject();
  }
  return false;
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
      if (rawData.purchase_units?.length) {
        const shopperName = rawData.purchase_units[0].shipping?.name?.full_name;
        const [firstName, ...rest] = shopperName.split(' ');
        shopperDetails.shippingAddress.shopperName = {
          firstName: firstName || '',
          lastName: rest && rest.length ? rest.join(' ') : '',
        };
      }
      shopperDetails.billingAddress.shopperName = shopperDetails.shopperName;
      await saveShopperDetails(shopperDetails, actions);
    },
    onAdditionalDetails: (state) => {
      if (paypalReviewPageEnabled) {
        redirectToReviewPage(state.data);
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

async function init(paymentMethodsResponse) {
  try {
    const applicationInfo = paymentMethodsResponse?.applicationInfo;
    const paypalConfig =
      paymentMethodsResponse?.AdyenPaymentMethods?.paymentMethods.find(
        (pm) => pm.type === PAYPAL,
      )?.configuration;
    if (!paypalConfig) {
      updateLoadedExpressMethods(PAYPAL);
      checkIfExpressMethodsAreReady();
      return;
    }
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

module.exports = {
  callPaymentFromComponent,
  saveShopperDetails,
  makeExpressPaymentDetailsCall,
  handleShippingAddressChange,
  handleShippingOptionChange,
  getPaypalButtonConfig,
  init,
};
