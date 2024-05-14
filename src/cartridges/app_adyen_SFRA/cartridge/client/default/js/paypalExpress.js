const { getPaymentMethods } = require('./commons');
const helpers = require('./adyen_checkout/helpers');
const { PAYPAL } = require('./constants');

async function callPaymentFromComponent(data, component) {
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
  });
}

async function updateComponent(response, actions, component) {
  if (response.ok) {
    const { paymentData, status } = await response.json();
    if (!paymentData || status !== 'success') {
      actions.reject();
    }
    // Update the Component paymentData value with the new one.
    component.updatePaymentData(paymentData);
  }
  actions.reject();
}
async function handleShippingAddressChange(data, actions, component) {
  const { shippingAddress } = data;
  const currentPaymentData = component.paymentData;
  if (!shippingAddress) {
    actions.reject();
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
  await updateComponent(response, actions, component);
}

async function handleShippingOptionChange(data, actions, component) {
  const { selectedShippingOption } = data;
  const currentPaymentData = component.paymentData;
  if (!selectedShippingOption) {
    actions.reject();
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
  await updateComponent(response, actions, component);
}

function getPaypalButtonConfig(paypalConfig) {
  return {
    showPayButton: true,
    configuration: paypalConfig,
    returnUrl: window.returnUrl,
    isExpress: true,
    onSubmit: async (state, component) => {
      await callPaymentFromComponent(state.data, component);
    },
    onShopperDetails: async (shopperDetails, rawData, actions) => {
      await saveShopperDetails(shopperDetails);
      actions.resolve();
    },
    onAdditionalDetails: (state) => {
      makeExpressPaymentDetailsCall(state.data);
      document.querySelector('#additionalDetailsHidden').value = JSON.stringify(
        state.data,
      );
      document.querySelector('#showConfirmationForm').submit();
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
  } catch (e) {
    //
  }
}

mountPaypalComponent();
