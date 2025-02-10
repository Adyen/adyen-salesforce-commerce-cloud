const helpers = require('./adyen_checkout/helpers');
const {
  checkIfExpressMethodsAreReady,
  updateLoadedExpressMethods,
  getPaymentMethods,
  createTemporaryBasket,
} = require('./commons');
const { APPLE_PAY } = require('./constants');
const { httpClient } = require('./commons/httpClient');

let checkout;
let shippingMethodsData;

function formatCustomerObject(customerData, billingData) {
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
    billingAddressDetails: {
      address1: billingData.addressLines[0],
      address2:
        billingData.addressLines.length > 1
          ? billingData.addressLines[1]
          : null,
      city: billingData.locality,
      countryCode: {
        displayValue: billingData.country,
        value: billingData.countryCode,
      },
      firstName: billingData.givenName,
      lastName: billingData.familyName,
      postalCode: billingData.postalCode,
      stateCode: billingData.administrativeArea,
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
  if (document.querySelector('#result')) {
    document.querySelector('#result').value = JSON.stringify({
      pspReference: response.fullResponse?.pspReference,
      resultCode: response.fullResponse?.resultCode,
      paymentMethod: response.fullResponse?.paymentMethod
        ? response.fullResponse.paymentMethod
        : response.fullResponse?.additionalData?.paymentMethod,
      donationToken: response.fullResponse?.donationToken,
      amount: response.fullResponse?.amount,
    });
  }
  if (document.querySelector('#showConfirmationForm')) {
    document.querySelector('#showConfirmationForm').submit();
  }
}

function handleError(rejectApplePay) {
  rejectApplePay();
  if (document.querySelector('#result')) {
    document.querySelector('#result').value = JSON.stringify({
      error: true,
    });
  }
  if (document.querySelector('#showConfirmationForm')) {
    document.querySelector('#showConfirmationForm').submit();
  }
}

function handleApplePayResponse(response, resolveApplePay, rejectApplePay) {
  if (response?.resultCode === 'Authorised') {
    handleAuthorised(response, resolveApplePay);
  } else {
    handleError(rejectApplePay);
  }
}

async function callPaymentFromComponent(data, resolveApplePay, rejectApplePay) {
  const response = await httpClient({
    url: window.paymentFromComponentURL,
    method: 'POST',
    data: {
      data: JSON.stringify(data),
      paymentMethod: APPLE_PAY,
    },
  });
  helpers.createShowConfirmationForm(window.showConfirmationAction);
  helpers.setOrderFormData(response);
  if (document.querySelector('#additionalDetailsHidden')) {
    document.querySelector('#additionalDetailsHidden').value =
      JSON.stringify(data);
  }
  handleApplePayResponse(response, resolveApplePay, rejectApplePay);
}

async function selectShippingMethod({ shipmentUUID, ID }) {
  const requestBody = {
    paymentMethodType: APPLE_PAY,
    shipmentUUID,
    methodID: ID,
    isExpressPdp: true,
  };
  return httpClient({
    method: 'POST',
    url: window.selectShippingMethodUrl,
    data: {
      data: JSON.stringify(requestBody),
    },
  });
}

function getShippingMethod(shippingContact) {
  const requestBody = {
    paymentMethodType: APPLE_PAY,
    isExpressPdp: true,
  };
  if (shippingContact) {
    requestBody.address = {
      city: shippingContact.locality,
      country: shippingContact.country,
      countryCode: shippingContact.countryCode,
      stateCode: shippingContact.administrativeArea,
      postalCode: shippingContact.postalCode,
    };
  }
  return httpClient({
    method: 'POST',
    url: window.shippingMethodsUrl,
    data: {
      data: JSON.stringify(requestBody),
    },
  });
}

async function initializeCheckout(paymentMethodsResponse) {
  const applicationInfo = paymentMethodsResponse?.applicationInfo;
  checkout = await AdyenCheckout({
    environment: window.environment,
    clientKey: window.clientKey,
    locale: window.locale,
    analytics: {
      analyticsData: { applicationInfo },
    },
  });
}

async function createApplePayButton(applePayButtonConfig) {
  return checkout.create(APPLE_PAY, applePayButtonConfig);
}

async function onAuthorized(resolve, reject, event, amountValue, merchantName) {
  try {
    const customerData = event.payment.shippingContact;
    const billingData = event.payment.billingContact;
    const customer = formatCustomerObject(customerData, billingData);
    const stateData = {
      paymentMethod: {
        type: APPLE_PAY,
        applePayToken: event.payment.token.paymentData,
      },
      paymentType: 'express',
    };

    const resolveApplePay = () => {
      // ** is used instead of Math.pow
      const value = amountValue * 10 ** parseInt(window.digitsNumber, 10);
      const finalPriceUpdate = {
        newTotal: {
          type: 'final',
          label: merchantName,
          amount: `${Math.round(value)}`,
        },
      };
      resolve(finalPriceUpdate);
    };

    await callPaymentFromComponent(
      { ...stateData, customer, isExpressPdp: true },
      resolveApplePay,
      reject,
    );
  } catch (error) {
    reject(error);
  }
}

async function onShippingMethodSelected(
  resolve,
  reject,
  event,
  applePayButtonConfig,
  merchantName,
  shippingMethodsArg,
) {
  const { shippingMethod } = event;
  const shippingMethods =
    shippingMethodsArg || shippingMethodsData?.shippingMethods;
  const matchingShippingMethod = shippingMethods.find(
    (sm) => sm.ID === shippingMethod.identifier,
  );
  const calculationResponse = await selectShippingMethod(
    matchingShippingMethod,
  );
  if (calculationResponse?.grandTotalAmount) {
    applePayButtonConfig.amount = {
      value: calculationResponse.grandTotalAmount.value,
      currency: calculationResponse.grandTotalAmount.currency,
    };
    const applePayShippingMethodUpdate = {
      newTotal: {
        type: 'final',
        label: merchantName,
        amount: calculationResponse.grandTotalAmount.value,
      },
    };
    resolve(applePayShippingMethodUpdate);
  } else {
    reject();
  }
}

async function onShippingContactSelected(resolve, reject, event, merchantName) {
  const { shippingContact } = event;
  shippingMethodsData = await getShippingMethod(shippingContact);
  if (shippingMethodsData?.shippingMethods?.length) {
    const selectedShippingMethod = shippingMethodsData.shippingMethods[0];
    const newCalculation = await selectShippingMethod(selectedShippingMethod);
    if (newCalculation?.grandTotalAmount) {
      const shippingMethodsStructured = shippingMethodsData.shippingMethods.map(
        (sm) => ({
          label: sm.displayName,
          detail: sm.description,
          identifier: sm.ID,
          amount: `${sm.shippingCost.value}`,
        }),
      );
      const applePayShippingContactUpdate = {
        newShippingMethods: shippingMethodsStructured,
        newTotal: {
          type: 'final',
          label: merchantName,
          amount: newCalculation.grandTotalAmount.value,
        },
      };
      resolve(applePayShippingContactUpdate);
    } else {
      reject();
    }
  } else {
    reject();
  }
}

async function init(paymentMethodsResponse) {
  initializeCheckout(paymentMethodsResponse)
    .then(async () => {
      const applePayPaymentMethod =
        paymentMethodsResponse?.AdyenPaymentMethods?.paymentMethods.find(
          (pm) => pm.type === APPLE_PAY,
        );
      if (!applePayPaymentMethod) {
        updateLoadedExpressMethods(APPLE_PAY);
        checkIfExpressMethodsAreReady();
        return;
      }

      const applePayConfig = applePayPaymentMethod.configuration;
      const applePayButtonConfig = {
        showPayButton: true,
        isExpress: true,
        configuration: applePayConfig,
        amount: JSON.parse(window.basketAmount),
        requiredShippingContactFields: ['postalAddress', 'email', 'phone'],
        requiredBillingContactFields: ['postalAddress', 'phone'],
        onAuthorized: async (resolve, reject, event) => {
          await onAuthorized(
            resolve,
            reject,
            event,
            applePayButtonConfig.amount.value,
            applePayConfig.merchantName,
          );
        },
        onSubmit: () => {
          // This handler is empty to prevent sending a second payment request
          // We already do the payment in paymentFromComponent
        },
        onClick: async (resolve, reject) => {
          if (window.isExpressPdp) {
            const tempBasketResponse = await createTemporaryBasket();
            if (tempBasketResponse?.temporaryBasketCreated) {
              applePayButtonConfig.amount = {
                value: tempBasketResponse.amount.value,
                currency: tempBasketResponse.amount.currency,
              };
              const applePayAmountUpdate = {
                newTotal: {
                  type: 'final',
                  label: applePayConfig.merchantName,
                  amount: tempBasketResponse.amount.value,
                },
              };
              resolve(applePayAmountUpdate);
            } else {
              reject();
            }
          } else {
            resolve();
          }
        },
        onShippingMethodSelected: async (resolve, reject, event) => {
          await onShippingMethodSelected(
            resolve,
            reject,
            event,
            applePayButtonConfig,
            applePayConfig.merchantName,
          );
        },
        onShippingContactSelected: async (resolve, reject, event) => {
          await onShippingContactSelected(
            resolve,
            reject,
            event,
            applePayConfig.merchantName,
          );
        },
      };

      const cartContainer = document.getElementsByClassName(APPLE_PAY);
      const applePayButton = await createApplePayButton(applePayButtonConfig);
      const isApplePayButtonAvailable = await applePayButton.isAvailable();
      if (isApplePayButtonAvailable) {
        for (
          let expressCheckoutNodesIndex = 0;
          expressCheckoutNodesIndex < cartContainer.length;
          expressCheckoutNodesIndex += 1
        ) {
          applePayButton.mount(cartContainer[expressCheckoutNodesIndex]);
        }
      }

      updateLoadedExpressMethods(APPLE_PAY);
      checkIfExpressMethodsAreReady();
    })
    .catch(() => {
      updateLoadedExpressMethods(APPLE_PAY);
      checkIfExpressMethodsAreReady();
    });
}

module.exports = {
  handleAuthorised,
  handleError,
  handleApplePayResponse,
  callPaymentFromComponent,
  formatCustomerObject,
  init,
  selectShippingMethod,
  getShippingMethod,
  getPaymentMethods,
  initializeCheckout,
  createApplePayButton,
  onAuthorized,
  onShippingMethodSelected,
  onShippingContactSelected,
};
