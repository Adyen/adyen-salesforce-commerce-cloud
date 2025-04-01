const { httpClient } = require('../../../commons/httpClient');
const store = require('../../../../../../store');
const helpers = require('../../../adyen_checkout/helpers');
const {
  GOOGLE_PAY,
  GOOGLE_PAY_CALLBACK_TRIGGERS,
} = require('../../../constants');
const { initializeCheckout } = require('../../initializeCheckout');
const { createTemporaryBasket } = require('../../../commons');

class GooglePay {
  constructor(config, applicationInfo, isExpressPdp) {
    const {
      basketAmount,
      showConfirmationAction,
      shippingMethodsUrl,
      selectShippingMethodUrl,
      paymentFromComponentURL,
    } = window;
    this.store = store;
    this.helpers = helpers;
    this.amount = JSON.parse(basketAmount);
    this.showPayButton = true;
    this.isExpress = true;
    this.isExpressPdp = isExpressPdp;
    this.paymentFromComponentURL = paymentFromComponentURL;
    this.showConfirmationAction = showConfirmationAction;
    this.shippingMethodsUrl = shippingMethodsUrl;
    this.selectShippingMethodUrl = selectShippingMethodUrl;
    this.applicationInfo = applicationInfo;
    this.config = config;
    this.customerData = null;
    this.billingData = null;
    this.APPLE_PAY_SUCCESS = 1;
    this.APPLE_PAY_ERROR = 0;
  }

  static formatCustomerObject(customerData) {
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

  async getShippingMethods(shippingAddress) {
    const requestBody = {
      paymentMethodType: GOOGLE_PAY,
      isExpressPdp: this.isExpressPdp,
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
    return httpClient({
      method: 'POST',
      url: this.shippingMethodsUrl,
      data: {
        data: JSON.stringify(requestBody),
      },
    });
  }

  async selectShippingMethod({ shipmentUUID, ID }) {
    const requestBody = {
      paymentMethodType: GOOGLE_PAY,
      shipmentUUID,
      methodID: ID,
      isExpressPdp: this.isExpressPdp,
    };
    return httpClient({
      method: 'POST',
      url: this.selectShippingMethodUrl,
      data: {
        data: JSON.stringify(requestBody),
      },
    });
  }

  static getTransactionInfo(newCalculation) {
    return {
      countryCode: newCalculation?.locale?.slice(-2),
      currencyCode: newCalculation?.grandTotalAmount?.currency,
      totalPriceStatus: 'FINAL',
      totalPriceLabel: 'Total',
      totalPrice: `${newCalculation?.grandTotalAmount?.value}`,
    };
  }

  static getShippingOptionsParameters(
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

  static handleAuthorised(response) {
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

  static handleError() {
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

  static handleGooglePayResponse(response) {
    if (response.resultCode === 'Authorised') {
      GooglePay.handleAuthorised(response);
    } else {
      GooglePay.handleError();
    }
  }

  async paymentFromComponent(data) {
    try {
      $.spinner().start();
      const response = await httpClient({
        method: 'POST',
        url: this.paymentFromComponentURL,
        data: {
          data: JSON.stringify(data),
          paymentMethod: GOOGLE_PAY,
        },
      });
      helpers.createShowConfirmationForm(this.showConfirmationAction);
      helpers.setOrderFormData(response);
      document.querySelector('#additionalDetailsHidden').value = JSON.stringify(
        {
          ...data,
          ...response,
        },
      );
      GooglePay.handleGooglePayResponse(response);
    } catch (error) {
      $.spinner().stop();
    }
  }

  onShippingAddressChange = async (shippingAddress) => {
    const shippingMethodsData = await this.getShippingMethods(shippingAddress);
    if (shippingMethodsData?.shippingMethods?.length) {
      const selectedShippingMethod = shippingMethodsData.shippingMethods[0];
      const newCalculation = await this.selectShippingMethod(
        selectedShippingMethod,
      );
      if (newCalculation?.grandTotalAmount) {
        return {
          newShippingOptionParameters: GooglePay.getShippingOptionsParameters(
            selectedShippingMethod,
            shippingMethodsData,
          ),
          newTransactionInfo: GooglePay.getTransactionInfo(
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
  };

  async onShippingOptionChange(shippingAddress, shippingOptionData) {
    const shippingMethodsData = await this.getShippingMethods(shippingAddress);
    const shippingMethods = shippingMethodsData?.shippingMethods;
    const matchingShippingMethod = shippingMethods.find(
      (sm) => sm.ID === shippingOptionData.id,
    );
    const newCalculation = await this.selectShippingMethod(
      matchingShippingMethod,
    );
    if (newCalculation?.grandTotalAmount) {
      return {
        newTransactionInfo: this.getTransactionInfo(
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

  getConfig = () => ({
    showPayButton: this.showPayButton,
    isExpress: this.isExpress,
    buttonType: 'buy',
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
    configuration: this.config,
    callbackIntents: ['SHIPPING_ADDRESS', 'SHIPPING_OPTION'],
    amount: JSON.parse(window.basketAmount),
    onAuthorized: async (state) => {
      // const componentData = googlePayButton.data;
      // const customer = GooglePay.formatCustomerObject(data);
      // const requestData = {
      //   paymentMethod: {
      //     type: GOOGLE_PAY,
      //     googlePayToken: componentData.paymentMethod.googlePayToken,
      //   },
      //   paymentType: 'express',
      //   customer,
      //   isExpressPdp: this.isExpressPdp,
      // };
      await this.paymentFromComponent(state.data);
    },
    onSubmit: async () => {},
    paymentDataCallbacks: {
      onPaymentDataChanged: async (intermediatePaymentData) => {
        const { callbackTrigger, shippingAddress, shippingOptionData } =
          intermediatePaymentData;

        let paymentDataRequestUpdate = {};

        if (callbackTrigger === GOOGLE_PAY_CALLBACK_TRIGGERS.INITIALIZE) {
          if (this.isExpressPdp) {
            await createTemporaryBasket();
          }
          paymentDataRequestUpdate =
            await this.onShippingAddressChange(shippingAddress);
        }

        if (callbackTrigger === GOOGLE_PAY_CALLBACK_TRIGGERS.SHIPPING_ADDRESS) {
          paymentDataRequestUpdate =
            await this.onShippingAddressChange(shippingAddress);
        }

        if (callbackTrigger === GOOGLE_PAY_CALLBACK_TRIGGERS.SHIPPING_OPTION) {
          paymentDataRequestUpdate = await this.onShippingOptionChange(
            shippingAddress,
            shippingOptionData,
          );
        }

        return new Promise((resolve) => {
          resolve(paymentDataRequestUpdate);
        });
      },
    },
  });

  async getComponent() {
    const checkout = await initializeCheckout(this.applicationInfo);
    const applePayConfig = this.getConfig();
    return window.AdyenWeb.createComponent(
      GOOGLE_PAY,
      checkout,
      applePayConfig,
    );
  }
}

module.exports = GooglePay;
