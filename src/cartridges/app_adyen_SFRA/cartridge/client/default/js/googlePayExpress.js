const helpers = require('./adyen_checkout/helpers');
const {
  checkIfExpressMethodsAreReady,
  updateLoadedExpressMethods,
} = require('./commons');
const { GOOGLE_PAY } = require('./constants');

let checkout;
let googlePayButton;
let shippingMethodsData;
let temporaryBasketId;

const CALLBACK_TRIGGERS = {
  INITIALIZE: 'INITIALIZE',
  SHIPPING_ADDRESS: 'SHIPPING_ADDRESS',
  SHIPPING_OPTION: 'SHIPPING_OPTION',
};

function formatCustomerObject(customerData) {
  const shippingData = customerData.shippingAddress;
  const billingData = customerData.paymentMethodData.info.billingAddress;
  const nameParts = customerData.shippingAddress.name.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''; // Join the rest
  return {
    addressBook: {
      addresses: {},
      preferredAddress: {
        address1: shippingData.address1,
        address2: shippingData.address2 ? shippingData.address2 : null,
        city: shippingData.locality,
        countryCode: {
          displayValue: shippingData.country,
          value: shippingData.administrativeArea,
        },
        firstName,
        lastName,
        ID: customerData.email,
        postalCode: shippingData.postalCode,
        stateCode: shippingData.administrativeArea,
      },
    },
    billingAddressDetails: {
      address1: billingData.address1,
      address2: billingData.address2 ? billingData.address2 : null,
      city: billingData.locality,
      countryCode: {
        displayValue: billingData.country,
        value: billingData.administrativeArea,
      },
      firstName,
      lastName,
      postalCode: billingData.postalCode,
      stateCode: billingData.administrativeArea,
    },
    customer: {},
    profile: {
      firstName,
      lastName,
      email: customerData.email,
      phone: shippingData.phoneNumber,
    },
  };
}

async function getShippingMethods(shippingAddress, basketId, reject) {
  const requestBody = {
    paymentMethodType: GOOGLE_PAY,
    basketId,
  };
  if (shippingAddress) {
    requestBody.address = {
      city: shippingAddress.locality,
      country: shippingAddress.country,
      countryCode: shippingAddress.countryCode,
      stateCode: shippingAddress.administrativeArea,
      postalCode: shippingAddress.postalCode,
    };
  }
  return $.ajax({
    type: 'POST',
    url: window.shippingMethodsUrl,
    data: {
      csrf_token: $('#adyen-token').val(),
      data: JSON.stringify(requestBody),
    },
    success(response) {
      return response;
    },
  }).fail(() => reject());
}

async function selectShippingMethod({ shipmentUUID, ID }, basketId, reject) {
  const requestBody = {
    paymentMethodType: GOOGLE_PAY,
    shipmentUUID,
    methodID: ID,
    basketId,
  };
  return $.ajax({
    type: 'POST',
    url: window.selectShippingMethodUrl,
    data: {
      csrf_token: $('#adyen-token').val(),
      data: JSON.stringify(requestBody),
    },
    success(response) {
      return response;
    },
  }).fail(() => reject());
}

function getTransactionInfo(newCalculation) {
  return {
    displayItems: [
      {
        price: newCalculation.totals.totalShippingCost.substring(1),
        label: 'Shipping',
        type: 'LINE_ITEM',
        status: 'FINAL',
      },
      {
        price: newCalculation.totals.totalTax.substring(1),
        label: 'Tax',
        type: 'TAX',
        status: 'FINAL',
      },
      {
        price: newCalculation.totals.subTotal.substring(1),
        label: 'Subtotal',
        type: 'SUBTOTAL',
        status: 'FINAL',
      },
    ],
    countryCode: shippingMethodsData.locale.slice(-2),
    currencyCode: newCalculation.grandTotalAmount.currency,
    totalPriceStatus: 'FINAL',
    totalPriceLabel: 'Total',
    totalPrice: `${newCalculation.grandTotalAmount.value}`,
  };
}

function getShippingOptionsParameters(selectedShippingMethod) {
  return {
    defaultSelectedOptionId: selectedShippingMethod.ID,
    shippingOptions: shippingMethodsData.shippingMethods.map((sm) => ({
      label: sm.displayName,
      description: sm.description,
      id: sm.ID,
    })),
  };
}

function paymentFromComponent(data) {
  $.ajax({
    url: window.paymentFromComponentURL,
    type: 'post',
    data: {
      csrf_token: $('#adyen-token').val(),
      data: JSON.stringify(data),
      paymentMethod: GOOGLE_PAY,
    },
    success(response) {
      helpers.createShowConfirmationForm(window.showConfirmationAction);
      helpers.setOrderFormData(response);
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

async function init(paymentMethodsResponse) {
  initializeCheckout(paymentMethodsResponse)
    .then(async () => {
      const googlePayPaymentMethod =
        paymentMethodsResponse?.AdyenPaymentMethods?.paymentMethods.find(
          (pm) => pm.type === GOOGLE_PAY,
        );
      if (!googlePayPaymentMethod) {
        updateLoadedExpressMethods(GOOGLE_PAY);
        checkIfExpressMethodsAreReady();
        return;
      }

      const googlePayConfig = googlePayPaymentMethod.configuration;
      const googlePayButtonConfig = {
        showPayButton: true,
        buttonType: 'buy',
        environment: window.environment,
        emailRequired: true,
        shippingAddressRequired: true,
        shippingOptionRequired: true,
        shippingAddressParameters: {
          phoneNumberRequired: true,
        },
        billingAddressRequired: true,
        billingAddressParameters: {
          format: 'FULL',
          phoneNumberRequired: true,
        },
        gatewayMerchantId: window.merchantAccount,
        configuration: googlePayConfig,
        callbackIntents: ['SHIPPING_ADDRESS', 'SHIPPING_OPTION'],
        amount: JSON.parse(window.basketAmount),
        onError: (err) => console.log(err),
        onAuthorized: async (data) => {
          console.log(data);
          const componentData = googlePayButton.data;
          const stateData = {
            paymentMethod: componentData.paymentMethod,
            paymentType: 'express',
          };
          const customer = formatCustomerObject(data);
          paymentFromComponent({ ...stateData, customer });
        },
        onSubmit: async () => {
          console.log('onsubmit');
        },
        paymentDataCallbacks: {
          onPaymentDataChanged(intermediatePaymentData) {
            // eslint-disable-next-line no-async-promise-executor
            return new Promise(async (resolve, reject) => {
              const paymentDataRequestUpdate = {};
              const { callbackTrigger, shippingAddress, shippingOptionData } =
                intermediatePaymentData;
              if (
                callbackTrigger === CALLBACK_TRIGGERS.INITIALIZE ||
                callbackTrigger === CALLBACK_TRIGGERS.SHIPPING_ADDRESS
              ) {
                shippingMethodsData = await getShippingMethods(
                  shippingAddress,
                  temporaryBasketId,
                  reject,
                );
                if (shippingMethodsData?.shippingMethods?.length) {
                  const selectedShippingMethod =
                    shippingMethodsData.shippingMethods[0];
                  const newCalculation = await selectShippingMethod(
                    selectedShippingMethod,
                    temporaryBasketId,
                    reject,
                  );
                  if (newCalculation?.grandTotalAmount) {
                    paymentDataRequestUpdate.newShippingOptionParameters =
                      getShippingOptionsParameters(selectedShippingMethod);
                    paymentDataRequestUpdate.newTransactionInfo =
                      getTransactionInfo(newCalculation);
                  } else {
                    reject();
                  }
                } else {
                  reject();
                }
              }

              if (callbackTrigger === CALLBACK_TRIGGERS.SHIPPING_OPTION) {
                const shippingMethods = shippingMethodsData?.shippingMethods;
                const matchingShippingMethod = shippingMethods.find(
                  (sm) => sm.ID === shippingOptionData.id,
                );
                const newCalculation = await selectShippingMethod(
                  matchingShippingMethod,
                  temporaryBasketId,
                  reject,
                );
                if (newCalculation?.grandTotalAmount) {
                  paymentDataRequestUpdate.newTransactionInfo =
                    getTransactionInfo(newCalculation);
                } else {
                  reject();
                }
              }

              resolve(paymentDataRequestUpdate);
            });
          },
        },
      };

      googlePayButton = checkout.create(GOOGLE_PAY, googlePayButtonConfig);
      googlePayButton.mount('.googlepay');
      updateLoadedExpressMethods(GOOGLE_PAY);
      checkIfExpressMethodsAreReady();
    })
    .catch(() => {
      updateLoadedExpressMethods(GOOGLE_PAY);
      checkIfExpressMethodsAreReady();
    });
}

module.exports = {
  init,
};
