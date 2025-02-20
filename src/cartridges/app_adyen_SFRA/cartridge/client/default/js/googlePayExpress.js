const helpers = require('./adyen_checkout/helpers');
const {
  checkIfExpressMethodsAreReady,
  updateLoadedExpressMethods,
  createTemporaryBasket,
} = require('./commons');
const {
  GOOGLE_PAY,
  PAY_WITH_GOOGLE,
  GOOGLE_PAY_CALLBACK_TRIGGERS,
} = require('./constants');

let checkout;
let googlePayButton;

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
          displayValue: shippingData.countryCode,
          value: shippingData.countryCode,
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
        displayValue: billingData.countryCode,
        value: billingData.countryCode,
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

async function getShippingMethods(shippingAddress) {
  const requestBody = {
    paymentMethodType: GOOGLE_PAY,
    isExpressPdp: window.isExpressPdp,
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
  });
}

async function selectShippingMethod({ shipmentUUID, ID }) {
  const requestBody = {
    paymentMethodType: GOOGLE_PAY,
    shipmentUUID,
    methodID: ID,
    isExpressPdp: window.isExpressPdp,
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
  });
}

function getTransactionInfo(newCalculation) {
  return {
    countryCode: newCalculation?.locale?.slice(-2),
    currencyCode: newCalculation?.grandTotalAmount?.currency,
    totalPriceStatus: 'FINAL',
    totalPriceLabel: 'Total',
    totalPrice: `${newCalculation?.grandTotalAmount?.value}`,
  };
}

function getShippingOptionsParameters(
  selectedShippingMethod,
  shippingMethodsData,
) {
  return {
    defaultSelectedOptionId: selectedShippingMethod.ID,
    shippingOptions: shippingMethodsData.shippingMethods.map((sm) => ({
      label: sm.displayName,
      description: sm.description,
      id: sm.ID,
    })),
  };
}

function handleAuthorised(response) {
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
  document.querySelector('#showConfirmationForm')?.submit();
  if ($?.spinner) {
    $.spinner()?.stop();
  }
}

function handleError() {
  if (document.querySelector('#result')) {
    document.querySelector('#result').value = JSON.stringify({
      error: true,
    });
  }
  document.querySelector('#showConfirmationForm')?.submit();
  if ($?.spinner) {
    const spinnerFn = $.spinner();
    if (spinnerFn.stop) {
      $.spinner()?.stop();
    }
  }
}

function handleGooglePayResponse(response) {
  if (response.resultCode === 'Authorised') {
    handleAuthorised(response);
  } else {
    handleError();
  }
}

function paymentFromComponent(data) {
  $.spinner().start();
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
      document.querySelector('#additionalDetailsHidden').value = JSON.stringify(
        {
          ...data,
          ...response,
        },
      );
      handleGooglePayResponse(response);
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

async function onShippingAddressChange(shippingAddress) {
  const shippingMethodsData = await getShippingMethods(shippingAddress);
  if (shippingMethodsData?.shippingMethods?.length) {
    const selectedShippingMethod = shippingMethodsData.shippingMethods[0];
    const newCalculation = await selectShippingMethod(selectedShippingMethod);
    if (newCalculation?.grandTotalAmount) {
      return {
        newShippingOptionParameters: getShippingOptionsParameters(
          selectedShippingMethod,
          shippingMethodsData,
        ),
        newTransactionInfo: getTransactionInfo(
          newCalculation,
          shippingMethodsData,
        ),
      };
    }
  }
  return {
    error: {
      reason: 'SHIPPING_ADDRESS_UNSERVICEABLE',
      message: 'Cannot ship to the selected address',
      intent: 'SHIPPING_ADDRESS',
    },
  };
}

async function onShippingOptionChange(shippingAddress, shippingOptionData) {
  const shippingMethodsData = await getShippingMethods(shippingAddress);
  const shippingMethods = shippingMethodsData?.shippingMethods;
  const matchingShippingMethod = shippingMethods.find(
    (sm) => sm.ID === shippingOptionData.id,
  );
  const newCalculation = await selectShippingMethod(matchingShippingMethod);
  if (newCalculation?.grandTotalAmount) {
    return {
      newTransactionInfo: getTransactionInfo(
        newCalculation,
        shippingMethodsData,
      ),
    };
  }
  return {
    error: {
      reason: 'SHIPPING_ADDRESS_UNSERVICEABLE',
      message: 'Cannot ship to the selected address',
      intent: 'SHIPPING_OPTION',
    },
  };
}

async function init(paymentMethodsResponse, isExpressPdp) {
  window.isExpressPdp = isExpressPdp;
  initializeCheckout(paymentMethodsResponse)
    .then(async () => {
      const googlePayPaymentMethod =
        paymentMethodsResponse?.AdyenPaymentMethods?.paymentMethods.find(
          (pm) => pm.type === GOOGLE_PAY || pm.type === PAY_WITH_GOOGLE,
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
        onAuthorized: async (data) => {
          const componentData = googlePayButton.data;
          const customer = formatCustomerObject(data);
          const requestData = {
            paymentMethod: {
              type: GOOGLE_PAY,
              googlePayToken: componentData.paymentMethod.googlePayToken,
            },
            paymentType: 'express',
            customer,
            isExpressPdp: window.isExpressPdp,
          };
          paymentFromComponent(requestData);
        },
        onSubmit: async () => {},
        paymentDataCallbacks: {
          async onPaymentDataChanged(intermediatePaymentData) {
            const { callbackTrigger, shippingAddress, shippingOptionData } =
              intermediatePaymentData;

            let paymentDataRequestUpdate = {};

            if (callbackTrigger === GOOGLE_PAY_CALLBACK_TRIGGERS.INITIALIZE) {
              if (window.isExpressPdp) {
                await createTemporaryBasket();
              }
              paymentDataRequestUpdate =
                await onShippingAddressChange(shippingAddress);
            }

            if (
              callbackTrigger === GOOGLE_PAY_CALLBACK_TRIGGERS.SHIPPING_ADDRESS
            ) {
              paymentDataRequestUpdate =
                await onShippingAddressChange(shippingAddress);
            }

            if (
              callbackTrigger === GOOGLE_PAY_CALLBACK_TRIGGERS.SHIPPING_OPTION
            ) {
              paymentDataRequestUpdate = await onShippingOptionChange(
                shippingAddress,
                shippingOptionData,
              );
            }

            return new Promise((resolve) => {
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
  formatCustomerObject,
  getTransactionInfo,
  getShippingOptionsParameters,
  onShippingAddressChange,
  onShippingOptionChange,
  getShippingMethods,
  selectShippingMethod,
  handleAuthorised,
  handleError,
  paymentFromComponent,
};
