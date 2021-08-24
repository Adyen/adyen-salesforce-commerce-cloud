const helpers = require('./helpers');
const { onBrand, onFieldValid } = require('../commons');
const store = require('../../../../store');

function getComponentName(data) {
  return data.paymentMethod.storedPaymentMethodId
    ? `storedCard${data.paymentMethod.storedPaymentMethodId}`
    : data.paymentMethod.type;
}

function getCardConfig() {
  return {
    enableStoreDetails: showStoreDetails,
    onChange(state) {
      store.isValid = state.isValid;
      const isSelected =
        getComponentName(state.data) === store.selectedMethod ||
        store.selectedMethod === 'bcmc';
      if (isSelected) {
        store.updateSelectedPayment('isValid', store.isValid);
        store.updateSelectedPayment('stateData', state.data);
      }
    },
    onFieldValid,
    onBrand,
  };
}

function getPaypalConfig() {
  store.paypalTerminatedEarly = false;
  return {
    showPayButton: true,
    environment: window.Configuration.environment,
    intent: window.paypalIntent,
    onSubmit: (state, component) => {
      helpers.assignPaymentMethodValue();
      document.querySelector('#adyenStateData').value = JSON.stringify(
        store.selectedPayment.stateData,
      );

      helpers.paymentFromComponent(state.data, component);
    },
    onCancel: (data, component) => {
      store.paypalTerminatedEarly = false;
      helpers.paymentFromComponent(
        {
          cancelTransaction: true,
          merchantReference: document.querySelector('#merchantReference').value,
        },
        component,
      );
    },
    onError: (error, component) => {
      store.paypalTerminatedEarly = false;
      if (component) {
        component.setStatus('ready');
      }
      document.querySelector('#showConfirmationForm').submit();
    },
    onAdditionalDetails: (state) => {
      store.paypalTerminatedEarly = false;
      document.querySelector('#additionalDetailsHidden').value = JSON.stringify(
        state.data,
      );
      document.querySelector('#showConfirmationForm').submit();
    },
    onClick: (data, actions) => {
      if (store.paypalTerminatedEarly) {
        helpers.paymentFromComponent({
          cancelTransaction: true,
          merchantReference: document.querySelector('#merchantReference').value,
        });
        store.paypalTerminatedEarly = false;
        return actions.resolve();
      }
      store.paypalTerminatedEarly = true;
      $('#dwfrm_billing').trigger('submit');
      if (store.formErrorsExist) {
        return actions.reject();
      }
      return null;
    },
  };
}

function getQRCodeConfig() {
  return {
    showPayButton: true,
    onSubmit: (state, component) => {
      $('#dwfrm_billing').trigger('submit');
      if (store.formErrorsExist) {
        return;
      }

      helpers.assignPaymentMethodValue();
      document.querySelector('#adyenStateData').value = JSON.stringify(
        store.selectedPayment.stateData,
      );

      helpers.paymentFromComponent(state.data, component);
    },
    onAdditionalDetails: (state /* , component */) => {
      document.querySelector('#additionalDetailsHidden').value = JSON.stringify(
        state.data,
      );
      document.querySelector('#showConfirmationForm').submit();
    },
  };
}

function getMbwayConfig() {
  return {
    showPayButton: true,
    onSubmit: (state, component) => {
      $('#dwfrm_billing').trigger('submit');
      helpers.assignPaymentMethodValue();
      if (!store.formErrorsExist) {
        if (document.getElementById('component_mbway')) {
          document
            .getElementById('component_mbway')
            .querySelector('button').disabled = true;
        }
        helpers.paymentFromComponent(state.data, component);
        document.querySelector('#adyenStateData').value = JSON.stringify(
          store.selectedPayment.stateData,
        );
      }
    },
    onError: (/* error, component */) => {
      document.querySelector('#showConfirmationForm').submit();
    },
    onAdditionalDetails: (state /* , component */) => {
      document.querySelector('#additionalDetailsHidden').value = JSON.stringify(
        state.data,
      );
      document.querySelector('#showConfirmationForm').submit();
    },
  };
}

function getGooglePayConfig() {
  return {
    environment: window.Configuration.environment,
    onSubmit: () => {
      helpers.assignPaymentMethodValue();
      document.querySelector('button[value="submit-payment"]').disabled = false;
      document.querySelector('button[value="submit-payment"]').click();
    },
    configuration: {
      gatewayMerchantId: window.merchantAccount,
    },
    showPayButton: true,
    buttonColor: 'white',
  };
}

function handleOnChange(state) {
  const { type } = state.data.paymentMethod;
  store.isValid = state.isValid;
  if (!store.componentsObj[type]) {
    store.componentsObj[type] = {};
  }
  store.componentsObj[type].isValid = store.isValid;
  store.componentsObj[type].stateData = state.data;
}

function getAmazonpayConfig() {
  return {
    showPayButton: true,
    productType: 'PayAndShip',
    checkoutMode: 'ProcessOrder',
    locale: window.Configuration.locale,
    returnUrl: window.returnURL,
    addressDetails: {
      name: `${document.querySelector('#shippingFirstNamedefault')?.value} ${
        document.querySelector('#shippingLastNamedefault')?.value
      }`,
      addressLine1: document.querySelector('#shippingFirstNamedefault')?.value,
      city: document.querySelector('#shippingAddressCitydefault')?.value,
      stateOrRegion: document.querySelector('#shippingAddressCitydefault')
        ?.value,
      postalCode: document.querySelector('#shippingZipCodedefault')?.value,
      countryCode: document.querySelector('#shippingCountrydefault')?.value,
      phoneNumber: document.querySelector('#shippingPhoneNumberdefault')?.value,
    },
    onClick: (resolve, reject) => {
      $('#dwfrm_billing').trigger('submit');
      if (store.formErrorsExist) {
        reject();
      } else {
        helpers.assignPaymentMethodValue();
        resolve();
      }
    },
    onError: () => {},
  };
}

function getPersonalDetails() {
  return {
    firstName: document.querySelector('#shippingFirstNamedefault')?.value,
    lastName: document.querySelector('#shippingLastNamedefault')?.value,
    telephoneNumber: document.querySelector('#shippingPhoneNumberdefault')
      ?.value,
    shopperEmail: document.querySelector('.customer-summary-email')
      ?.textContent,
    billingAddress: {
      city: document.querySelector('#billingAddressCity')?.value,
      postalCode: document.querySelector('#billingZipCode')?.value,
      country: document.querySelector('#billingCountry')?.value,
    },
    deliveryAddress: {
      city: document.querySelector('#shippingAddressCitydefault')?.value,
      postalCode: document.querySelector('#shippingZipCodedefault')?.value,
      country: document.querySelector('#shippingCountrydefault')?.value,
    },
  };
}

function setPersonalDetails(paymentMethodsConfiguration) {
  const paymentMethodsConfigurationValues = Object.values(
    paymentMethodsConfiguration,
  );
  for (
    let paymentMethodConfigurationIndex = 0;
    paymentMethodConfigurationIndex < paymentMethodsConfigurationValues.length;
    paymentMethodConfigurationIndex += 1
  ) {
    paymentMethodsConfigurationValues[
      paymentMethodConfigurationIndex
    ].data = getPersonalDetails();

    paymentMethodsConfigurationValues[
        paymentMethodConfigurationIndex
        ].data.personalDetails = getPersonalDetails();
  }
}

function setCheckoutConfiguration() {
  store.checkoutConfiguration.onChange = handleOnChange;
  store.checkoutConfiguration.showPayButton = false;
  store.checkoutConfiguration.clientKey = window.adyenClientKey;

  store.checkoutConfiguration.paymentMethodsConfiguration = {
    card: getCardConfig(),
    storedCard: getCardConfig(),
    boletobancario: {
      personalDetailsRequired: true, // turn personalDetails section on/off
      billingAddressRequired: false, // turn billingAddress section on/off
      showEmailAddress: false, // allow shopper to specify their email address
    },
    paywithgoogle: getGooglePayConfig(),
    paypal: getPaypalConfig(),
    mbway: getMbwayConfig(),
    swish: getQRCodeConfig(),
    bcmc_mobile: getQRCodeConfig(),
    wechatpayQR: getQRCodeConfig(),
    amazonpay: getAmazonpayConfig(),
    pix: getQRCodeConfig(),
    afterpay_default: {
      visibility: {
        personalDetails: 'editable',
        billingAddress: 'hidden',
        deliveryAddress: 'hidden',
      },
    },
    facilypay_3x: {
      visibility: {
        personalDetails: 'editable',
        billingAddress: 'hidden',
        deliveryAddress: 'hidden',
      },
    },
    ratepay: {
      visibility: {
        personalDetails: 'editable',
        billingAddress: 'hidden',
        deliveryAddress: 'hidden',
      },
    },
  };

  setPersonalDetails(store.checkoutConfiguration.paymentMethodsConfiguration);
}

module.exports = {
  getCardConfig,
  getPaypalConfig,
  getGooglePayConfig,
  setCheckoutConfiguration,
  getMbwayConfig,
  getQRCodeConfig,
};
