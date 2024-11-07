const helpers = require('./adyen_checkout/helpers');
const {
  checkIfExpressMethodsAreReady,
  updateLoadedExpressMethods,
  getPaymentMethods,
} = require('./commons');
const { GOOGLE_PAY } = require('./constants');

let checkout;
let paymentMethodsResponse;
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

async function initializeCheckout() {
  const paymentMethods = await getPaymentMethods();
  paymentMethodsResponse = await paymentMethods.json();
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

async function init() {
  initializeCheckout()
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
        onAuthorized: async (data) => {
          const componentData = googlePayButton.data;
          const stateData = {
            paymentMethod: componentData.paymentMethod,
            paymentType: 'express',
          };
          const customer = formatCustomerObject(data);
          paymentFromComponent({ ...stateData, customer });
        },
        onSubmit: async () => {},
        paymentDataCallbacks: {
          onPaymentDataChanged() {
            return new Promise((resolve) => {
              const paymentDataRequestUpdate = {
                newShippingOptionParameters: {
                  defaultSelectedOptionId: 'shipping-001',
                  shippingOptions: [
                    {
                      id: 'shipping-001',
                      label: '$0.00: Free shipping',
                      description:
                        'Free shipping: delivered in 10 business days.',
                    },
                  ],
                },
                newTransactionInfo: {
                  displayItems: [
                    {
                      label: 'Shipping',
                      type: 'LINE_ITEM',
                      price: '80.00',
                      status: 'FINAL',
                    },
                  ],
                  currencyCode: 'EUR',
                  totalPriceStatus: 'FINAL',
                  totalPrice: '80.00',
                  totalPriceLabel: 'Total',
                  countryCode: 'US',
                },
              };
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
