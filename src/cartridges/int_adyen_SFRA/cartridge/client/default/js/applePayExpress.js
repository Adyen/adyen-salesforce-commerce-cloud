const helpers = require('./adyen_checkout/helpers');

function paymentFromComponent(data, component) {
  $.ajax({
    url: window.paymentFromComponentURL,
    type: 'post',
    data: {
      data: JSON.stringify(data),
      paymentMethod: 'applepay',
    },
    success(response) {
      helpers.setOrderFormData(response);
      console.log(response);
    },
  });
}

async function mountApplePayComponent() {
  const customerPaymentData = await fetch(
    `${window.customerPaymentDataUrl}?locale=${window.locale}`,
  );
  const customerPaymentDataResponse = await customerPaymentData.json();

  const shippingMethods = await fetch(window.shippingMethodsUrl);
  const shippingMethodsData = await shippingMethods.json();

  const environment = 'test';

  const checkout = await AdyenCheckout({
    environment,
    clientKey: window.clientKey,
    locale: window.locale,
    onError: (error, component) => {
      console.log(error.name, error.message, error.stack, component);
    },
  });

  const applePayConfig = customerPaymentDataResponse.paymentMethods.find(
    (pm) => pm.type === 'applepay',
  ).configuration;

  const applePayButtonConfig = {
    showPayButton: true,
    configuration: applePayConfig,
    amount: customerPaymentDataResponse.amount,
    countryCode: customerPaymentDataResponse.countryCode,
    shippingMethods: shippingMethodsData.shippingMethods.map((sm) => ({
      label: sm.displayName,
      detail: sm.description,
      identifier: sm.ID,
      amount: `${sm.shippingCost.value}`,
    })),
    onError: (error, component) => {
      console.log(error.name, error.message, error.stack, component);
    },
    onShippingMethodSelected: async (resolve, reject, event) => {
      const { shippingMethod } = event;
      const matchingShippingMethod = shippingMethodsData.shippingMethods.find(
        (sm) => sm.ID === shippingMethod.identifier,
      );
      const response = await fetch(
        `${window.calculateAmountUrl}?${new URLSearchParams({
          shipmentUUID: matchingShippingMethod.shipmentUUID,
          methodID: matchingShippingMethod.ID,
        })}`,
        {
          method: 'POST',
        },
      );
      const newAmountResponse = await response.json();
      console.log(newAmountResponse);
      const amountWithoutCurrencyCode =
        newAmountResponse.totals.grandTotal.slice(1);
      const amountValue = parseFloat(amountWithoutCurrencyCode) * 100;
      applePayButtonConfig.amount = {
        value: amountValue,
        currency: customerPaymentDataResponse.amount.currency,
      };
      const applePayShippingMethodUpdate = {
        newTotal: {
          type: 'final',
          label: 'new total',
          amount: amountWithoutCurrencyCode,
        },
      };
      resolve(applePayShippingMethodUpdate);
    },
    onSubmit: (state, component) => {
      console.log('onSubmit', state, component);
      paymentFromComponent(state.data, component);
    },
  };

  const applePayButton = checkout.create('applepay', applePayButtonConfig);
  const isApplePayButtonAvailable = await applePayButton.isAvailable();
  if (isApplePayButtonAvailable) {
    applePayButton.mount('#applepay-container');
  }
}

mountApplePayComponent();
