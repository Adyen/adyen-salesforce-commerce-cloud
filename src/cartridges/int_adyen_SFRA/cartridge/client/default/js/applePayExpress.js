const helpers = require('./adyen_checkout/helpers');

let checkout;
let shippingMethodsData;
async function initializeCheckout(){
  const session = await fetch(window.sessionsUrl);
  const sessionData = await session.json();
  
  const shippingMethods = await fetch(window.shippingMethodsUrl);
  shippingMethodsData = await shippingMethods.json();
  
  checkout = await AdyenCheckout({
    environment: window.environment,
    clientKey: window.clientKey,
    locale: window.locale,
    session: sessionData,
  });
}

initializeCheckout().then(()=> {
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
    onAuthorized: async (resolve, reject, event) => {
      try {
        const customerData = event.payment.shippingContact;
        const customer = getCustomerObject(customerData);
  
        const stateData = {
          paymentMethod: {
            type: 'applepay',
            applePayToken: event.payment.token.paymentData,
          },
          paymentType: 'express',
        };
  
        const resolveApplePay = () => {
          const finalPriceUpdate = {
            newTotal: {
              type: 'final',
              label: applePayConfig.merchantName,
              amount: `${applePayButtonConfig.amount.value / 100}`,
            },
          };
          resolve(finalPriceUpdate);
        };

        await callPaymentFromComponent(
          { ...stateData, customer },
          resolveApplePay,
          reject,
        );
      } catch (error) {
        reject(error);
      }
    },
    onShippingMethodSelected: async (resolve, reject, event) => {
      const { shippingMethod } = event;
      const matchingShippingMethod = shippingMethodsData.shippingMethods.find(
        (sm) => sm.ID === shippingMethod.identifier,
      );
      const calculationResponse = await fetch(
        `${window.calculateAmountUrl}?${new URLSearchParams({
          shipmentUUID: matchingShippingMethod.shipmentUUID,
          methodID: matchingShippingMethod.ID,
        })}`,
        {
          method: 'POST',
        },
      );
      if (calculationResponse.ok) {
        const newCalculation = await calculationResponse.json();
        applePayButtonConfig.amount = {
          value: newCalculation.grandTotalAmount.value,
          currency: newCalculation.grandTotalAmount.currency,
        };
        const applePayShippingMethodUpdate = {
          newTotal: {
            type: 'final',
            label: applePayConfig.merchantName,
            amount: newCalculation.grandTotalAmount.value,
          },
        };
        resolve(applePayShippingMethodUpdate);
      } else {
        reject();
      }
    },
  };
  
  function getCustomerObject(customerData) {
    return {
      addressBook: {
        addresses: {},
        preferredAddress: {
          address1: customerData.addressLines[0],
          address2:
            customerData.addressLines.length > 1
              ? customerData.addressLines[1]
              : null,
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
        phone: customerData.phoneNumber,
      },
    };
  }
  
  function handleAuthorised(response, resolveApplePay) {
    resolveApplePay();
    document.querySelector('#result').value = JSON.stringify({
      pspReference: response.fullResponse?.pspReference,
      resultCode: response.fullResponse?.resultCode,
      paymentMethod: response.fullResponse?.paymentMethod
        ? response.fullResponse.paymentMethod
        : response.fullResponse?.additionalData?.paymentMethod,
    });
    document.querySelector('#showConfirmationForm').submit();
  }
  
  function handleError(rejectApplePay) {
    rejectApplePay();
    document.querySelector('#result').value = JSON.stringify({
      error: true,
    });
    document.querySelector('#showConfirmationForm').submit();
  }
  
  function handleApplePayResponse(response, resolveApplePay, rejectApplePay) {
    if (response.resultCode === 'Authorised') {
      handleAuthorised(response, resolveApplePay);
    } else {
      handleError(rejectApplePay);
    }
  }
  
  function callPaymentFromComponent(data, resolveApplePay, rejectApplePay) {
    return $.ajax({
      url: window.paymentFromComponentURL,
      type: 'post',
      data: {
        data: JSON.stringify(data),
        paymentMethod: 'applepay',
      },
      success(response) {
        helpers.createShowConfirmationForm(window.showConfirmationAction);
        helpers.setOrderFormData(response);
        document.querySelector('#additionalDetailsHidden').value =
          JSON.stringify(data);
        handleApplePayResponse(response, resolveApplePay, rejectApplePay);
      },
    }).fail(() => {
      rejectApplePay();
    });
  }
  
  function createApplePayButton() {
    return checkout.create('applepay', applePayButtonConfig);
  }
  const cartContainer = document.getElementsByClassName('expressComponent');
  for (
    let expressCheckoutNodesIndex = 0;
    expressCheckoutNodesIndex < cartContainer.length;
    expressCheckoutNodesIndex += 1
  ) {
    createApplePayButton().then((applePayButton) => {
      const isApplePayButtonAvailable = applePayButton.isAvailable();
      if (isApplePayButtonAvailable) {
        applePayButton.mount(cartContainer[expressCheckoutNodesIndex]);
      }
    });
  }  
});