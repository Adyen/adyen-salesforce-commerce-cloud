const { httpClient } = require('../../../commons/httpClient');
const store = require('../../../../../../../config/store');
const helpers = require('../../../checkout/helpers');
const { APPLE_PAY } = require('../../../../../../../config/constants');
const { initializeCheckout } = require('../../initializeCheckout');
const { createTemporaryBasket } = require('../../../commons');

class ApplePay {
  constructor(config, applicationInfo, adyenTranslations, isExpressPdp) {
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
    this.translations = adyenTranslations;
    this.APPLE_PAY_SUCCESS = 1;
    this.APPLE_PAY_ERROR = 0;
  }

  formatAddress = (data) => ({
    address1: this[data].addressLines[0],
    address2:
      this[data].addressLines.length > 1 ? this[data].addressLines[1] : null,
    city: this[data].locality,
    countryCode: {
      displayValue: this[data].country,
      value: this[data].countryCode,
    },
    firstName: this[data].givenName,
    lastName: this[data].familyName,
    postalCode: this[data].postalCode,
    stateCode: this[data].administrativeArea,
  });

  formatCustomerObject = () => {
    const { customerData } = this;

    return {
      addressBook: {
        addresses: {},
        preferredAddress: {
          ...this.formatAddress('customerData'),
          ID: customerData.emailAddress,
        },
      },
      billingAddressDetails: this.formatAddress('billingData'),
      customer: {},
      profile: {
        firstName: customerData.givenName,
        lastName: customerData.familyName,
        email: customerData.emailAddress,
        phone: customerData.phoneNumber,
      },
    };
  };

  handleAuthorised = (response, resolve) => {
    resolve({
      newTotal: {
        type: 'final',
        label: this.config.merchantName,
        amount: `${response.fullResponse?.amount.value}`,
      },
    });
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
  };

  handleError = (rejectApplePay) => {
    rejectApplePay(this.APPLE_PAY_ERROR);
    if (document.querySelector('#result')) {
      document.querySelector('#result').value = JSON.stringify({
        error: true,
      });
    }
    if (document.querySelector('#showConfirmationForm')) {
      document.querySelector('#showConfirmationForm').submit();
    }
  };

  handleApplePayResponse = (response, resolveApplePay, rejectApplePay) => {
    if (response?.resultCode === 'Authorised') {
      this.handleAuthorised(response, resolveApplePay);
    } else {
      this.handleError(rejectApplePay);
    }
  };

  callPaymentFromComponent = async (data, resolveApplePay, rejectApplePay) => {
    const response = await httpClient({
      url: this.paymentFromComponentURL,
      method: 'POST',
      data: {
        data: JSON.stringify(data),
        paymentMethod: APPLE_PAY,
      },
    });
    helpers.createShowConfirmationForm(this.showConfirmationAction);
    helpers.setOrderFormData(response);
    if (document.querySelector('#additionalDetailsHidden')) {
      document.querySelector('#additionalDetailsHidden').value =
        JSON.stringify(data);
    }
    this.handleApplePayResponse(response, resolveApplePay, rejectApplePay);
  };

  selectShippingMethod = async ({ shipmentUUID, ID }) => {
    const requestBody = {
      paymentMethodType: APPLE_PAY,
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
  };

  getShippingMethod = (shippingContact) => {
    const requestBody = {
      paymentMethodType: APPLE_PAY,
      isExpressPdp: this.isExpressPdp,
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
      url: this.shippingMethodsUrl,
      data: {
        data: JSON.stringify(requestBody),
      },
    });
  };

  onAuthorized = async (data, actions) => {
    const { authorizedEvent } = data;
    const { resolve, reject } = actions;
    try {
      this.customerData = authorizedEvent.payment.shippingContact;
      this.billingData = authorizedEvent.payment.billingContact;
      const customer = this.formatCustomerObject();
      const stateData = {
        paymentMethod: {
          type: APPLE_PAY,
          applePayToken: authorizedEvent.payment.token.paymentData,
        },
        paymentType: 'express',
      };

      await this.callPaymentFromComponent(
        { ...stateData, customer, isExpressPdp: this.isExpressPdp },
        resolve,
        reject,
      );
    } catch (error) {
      reject(error);
    }
  };

  onShippingMethodSelected = async (resolve, reject, event) => {
    const { shippingMethod } = event;
    const shippingMethodsData = await this.getShippingMethod();
    const shippingMethods = shippingMethodsData?.shippingMethods;
    const matchingShippingMethod = shippingMethods.find(
      (sm) => sm.ID === shippingMethod.identifier,
    );
    const calculationResponse = await this.selectShippingMethod(
      matchingShippingMethod,
    );
    if (calculationResponse?.grandTotalAmount) {
      const applePayShippingMethodUpdate = {
        newTotal: {
          type: 'final',
          label: this.config.merchantName,
          amount: calculationResponse.grandTotalAmount.value,
        },
      };
      resolve(applePayShippingMethodUpdate);
    } else {
      reject();
    }
  };

  onShippingContactSelected = async (resolve, reject, event) => {
    const { shippingContact } = event;
    const shippingMethodsData = await this.getShippingMethod(shippingContact);
    if (shippingMethodsData?.shippingMethods?.length) {
      const selectedShippingMethod = shippingMethodsData.shippingMethods[0];
      const newCalculation = await this.selectShippingMethod(
        selectedShippingMethod,
      );
      if (newCalculation?.grandTotalAmount) {
        const shippingMethodsStructured =
          shippingMethodsData.shippingMethods.map((sm) => ({
            label: sm.displayName,
            detail: sm.description,
            identifier: sm.ID,
            amount: `${sm.shippingCost.value}`,
          }));
        const applePayShippingContactUpdate = {
          newShippingMethods: shippingMethodsStructured,
          newTotal: {
            type: 'final',
            label: this.config.merchantName,
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
  };

  onClick = async (resolve, reject) => {
    if (this.isExpressPdp) {
      const tempBasketResponse = await createTemporaryBasket();
      if (tempBasketResponse?.temporaryBasketCreated) {
        const applePayAmountUpdate = {
          newTotal: {
            type: 'final',
            label: this.config.merchantName,
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
  };

  getConfig() {
    return {
      configuration: this.config,
      showPayButton: this.showPayButton,
      amount: this.amount,
      isExpress: this.isExpress,
      requiredShippingContactFields: ['postalAddress', 'email', 'phone'],
      requiredBillingContactFields: ['postalAddress', 'phone'],
      onSubmit: () => {},
      onClick: this.onClick,
      onAuthorized: this.onAuthorized,
      onShippingMethodSelected: this.onShippingMethodSelected,
      onShippingContactSelected: this.onShippingContactSelected,
    };
  }

  async getComponent() {
    const checkout = await initializeCheckout(
      this.applicationInfo,
      this.translations,
    );
    const applePayConfig = this.getConfig();
    return window.AdyenWeb.createComponent(APPLE_PAY, checkout, applePayConfig);
  }
}

module.exports = ApplePay;
