const helpers = require('./adyen_checkout/helpers');

const APPLE_PAY = 'applepay';
const isSafari = /^((?!chrome|android|ios).)*safari/i.test(navigator.userAgent);

let checkout;
let shippingMethodsData;

async function initializeCheckout() {
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

async function createApplePayButton(applePayButtonConfig) {
  return checkout.create(APPLE_PAY, applePayButtonConfig);
}

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
      paymentMethod: APPLE_PAY,
    },
    success(response) {
      helpers.createShowConfirmationForm(window.showConfirmationAction);
      helpers.setOrderFormData(response);
      document.querySelector('#additionalDetailsHidden').value = JSON.stringify(
        data,
      );
      handleApplePayResponse(response, resolveApplePay, rejectApplePay);
    },
  }).fail(() => {
    rejectApplePay();
  });
}

if (isSafari) {
  initializeCheckout().then(() => {
    const applePayPaymentMethod = checkout.paymentMethodsResponse.paymentMethods.find(
      (pm) => pm.type === APPLE_PAY,
    );

    if (!applePayPaymentMethod) {
      return;
    }

    const applePayConfig = applePayPaymentMethod.configuration;

    const applePayButtonConfig = {
      showPayButton: true,
      configuration: applePayConfig,
      amount: checkout.options.amount,
      requiredShippingContactFields: ['postalAddress', 'email', 'phone'],
      requiredBillingContactFields: ['postalAddress', 'phone'],
      shippingMethods: shippingMethodsData.shippingMethods.map((sm) => ({
        label: sm.displayName,
        detail: sm.description,
        identifier: sm.ID,
        amount: `${sm.shippingCost.value}`,
      })),
      onAuthorized: async (resolve, reject, event) => {
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
      onSubmit: () => {
        // This handler is empty to prevent sending a second payment request
        // We already do the payment in paymentFromComponent
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
      onShippingContactSelected: async (resolve, reject, event) => {
        const { shippingContact } = event;
        const shippingMethods = await fetch(
          `${window.shippingMethodsUrl}?${new URLSearchParams({
            city: shippingContact.locality,
            country: shippingContact.country,
            countryCode: shippingContact.countryCode,
            stateCode: shippingContact.administrativeArea,
          })}`,
        );
        if (shippingMethods.ok) {
          shippingMethodsData = await shippingMethods.json();
          if (shippingMethodsData.shippingMethods?.length) {
            const selectedShippingMethod =
              shippingMethodsData.shippingMethods[0];
            const calculationResponse = await fetch(
              `${window.calculateAmountUrl}?${new URLSearchParams({
                shipmentUUID: selectedShippingMethod.shipmentUUID,
                methodID: selectedShippingMethod.ID,
              })}`,
              {
                method: 'POST',
              },
            );
            if (calculationResponse.ok) {
              const shippingMethodsStructured = shippingMethodsData.shippingMethods.map(
                (sm) => ({
                  label: sm.displayName,
                  detail: sm.description,
                  identifier: sm.ID,
                  amount: `${sm.shippingCost.value}`,
                }),
              );
              const newCalculation = await calculationResponse.json();
              const applePayShippingContactUpdate = {
                newShippingMethods: shippingMethodsStructured,
                newTotal: {
                  type: 'final',
                  label: applePayConfig.merchantName,
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
        } else {
          reject();
        }
      },
    };

    const cartContainer = document.getElementsByClassName('applepay');
    for (
      let expressCheckoutNodesIndex = 0;
      expressCheckoutNodesIndex < cartContainer.length;
      expressCheckoutNodesIndex += 1
    ) {
      createApplePayButton(applePayButtonConfig).then((applePayButton) => {
        const isApplePayButtonAvailable = applePayButton.isAvailable();
        if (isApplePayButtonAvailable) {
          applePayButton.mount(cartContainer[expressCheckoutNodesIndex]);
        }
      });
    }
  });
}

module.exports = {
  createApplePayButton,
  formatCustomerObject,
  handleAuthorised,
  handleError,
  handleApplePayResponse,
  callPaymentFromComponent,
}