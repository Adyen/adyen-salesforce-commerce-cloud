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
//      helpers.setOrderFormData(response);
      console.log(response);
    },
  });
}

async function mountApplePayComponent() {
  let currentCustomer = null;
  const session = await fetch(window.sessionsUrl);
  const sessionData = await session.json();

  const shippingMethods = await fetch(window.shippingMethodsUrl);
  const shippingMethodsData = await shippingMethods.json();

  const environment = 'test';

  const checkout = await AdyenCheckout({
    environment,
    clientKey: window.clientKey,
    locale: window.locale,
    session: sessionData,
    onError: (error, component) => {
      console.log(error.name, error.message, error.stack, component);
    },
  });
  console.log(checkout.options.amount);

  const applePayConfig = checkout.paymentMethodsResponse.paymentMethods.find(
    (pm) => pm.type === 'applepay',
  ).configuration;

  const applePayButtonConfig = {
    showPayButton: true,
    configuration: applePayConfig,
    amount: checkout.options.amount,
    requiredShippingContactFields: ['postalAddress', 'email', 'phone'],
    shippingMethods: shippingMethodsData.shippingMethods.map((sm) => ({
      label: sm.displayName,
      detail: sm.description,
      identifier: sm.ID,
      amount: `${sm.shippingCost.value}`,
    })),
    onError: (error, component) => {
      console.log(error.name, error.message, error.stack, component);
    },
    onAuthorized: (resolve, reject, event) => {
      try{
        const customerData = event.payment.shippingContact;
        currentCustomer = {
          addressBook: {
            addresses: {},
            preferredAddress: {
              address1: customerData.addressLines[0],
              address2: null,
              city: customerData.locality,
              countryCode: {
                displayValue: customerData.country,
                value: customerData.countryCode,
              },
              firstName: customerData.givenName,
              lastName: customerData.familyName,
              ID: customerData.emailAddress,
              postalCode: customerData.postalCode,
              stateCode: customerData.administrativeArea,
            },
          },
          customer: {},
          profile: {
            firstName: customerData.givenName,
            lastName: customerData.familyName,
            email: customerData.emailAddress,
          },
        };
        const applePayShippingMethodUpdate = {
          newTotal: {
            type: 'final',
            label: 'new total',
            amount: `${applePayButtonConfig.amount.value / 100}`,
          },
        };

        const stateData = {
          'paymentMethod' : {
            'type' : 'applepay',
            'applePayToken' : event.payment.token.paymentData,
          }
        };
        paymentFromComponent({...stateData, customer: currentCustomer});
        // TODO : Await for the response before resolving
        resolve(applePayShippingMethodUpdate);
      }
      catch(error){
        console.log(error);
      }
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
      const amountWithoutCurrencyCode =
        newAmountResponse.totals.grandTotal.slice(1);
      const amountValue = parseFloat(amountWithoutCurrencyCode) * 100;
      applePayButtonConfig.amount = {
        value: amountValue,
        currency: checkout.options.amount.currency,
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
      try{
        //paymentFromComponent({...state.data, customer: currentCustomer}, component);
      }
      catch(error){
        console.log(error)
      }
    },
  };

  const applePayButton = checkout.create('applepay', applePayButtonConfig);
  const isApplePayButtonAvailable = await applePayButton.isAvailable();
  if (isApplePayButtonAvailable) {
    applePayButton.mount('#applepay-container');
  }
}

mountApplePayComponent();
