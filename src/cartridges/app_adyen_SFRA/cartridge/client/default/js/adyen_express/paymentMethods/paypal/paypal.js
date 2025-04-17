const { httpClient } = require('../../../commons/httpClient');
const store = require('../../../../../../config/store');
const helpers = require('../../../adyen_checkout/helpers');
const { PAYPAL } = require('../../../../../../config/constants');
const { initializeCheckout } = require('../../initializeCheckout');

class Paypal {
  constructor(config, applicationInfo) {
    const {
      paypalReviewPageEnabled,
      returnURL,
      basketAmount,
      makeExpressPaymentsCall,
      saveShopperData,
      makeExpressPaymentDetailsCall,
      showConfirmationAction,
      shippingMethodsUrl,
      selectShippingMethodUrl,
      saveExpressPaymentDataUrl,
    } = window;
    this.store = store;
    this.helpers = helpers;
    this.returnUrl = returnURL;
    this.amount = JSON.parse(basketAmount);
    this.showPayButton = true;
    this.isExpress = true;
    this.userAction = paypalReviewPageEnabled ? 'continue' : null;
    this.makeExpressPaymentsCallUrl = makeExpressPaymentsCall;
    this.saveShopperDataUrl = saveShopperData;
    this.makeExpressPaymentDetailsCallUrl = makeExpressPaymentDetailsCall;
    this.showConfirmationAction = showConfirmationAction;
    this.shippingMethodsUrl = shippingMethodsUrl;
    this.selectShippingMethodUrl = selectShippingMethodUrl;
    this.saveExpressPaymentDataUrl = saveExpressPaymentDataUrl;
    this.applicationInfo = applicationInfo;
    this.config = config;
  }

  static updateComponent(response, component) {
    if (response) {
      const { paymentData, status, errorMessage = '' } = response;
      if (!paymentData || status !== 'success') {
        throw new Error(errorMessage);
      }
      // Update the Component paymentData value with the new one.
      component.updatePaymentData(paymentData);
    } else {
      const { errorMessage = '' } = response;
      throw new Error(errorMessage);
    }
    return false;
  }

  static onError() {
    $.spinner().stop();
  }

  async callPaymentFromComponent(state, component) {
    try {
      $.spinner().start();
      const response = await httpClient({
        method: 'POST',
        url: this.makeExpressPaymentsCallUrl,
        data: {
          data: JSON.stringify(state.data),
        },
      });
      const { action } = response.fullResponse;
      if (action) {
        component.handleAction(action);
      } else {
        component.handleError();
      }
    } catch (e) {
      component.handleError(e);
    }
  }

  async onAuthorized(data, actions) {
    try {
      const {
        authorizedEvent: { payer = {} },
        billingAddress,
        deliveryAddress,
      } = data;
      const shopperDetails = {
        shopperEmail: payer.email_address,
        telephoneNumber: payer.phone?.phone_number?.national_number,
        shopperName: {
          firstName: payer.name?.given_name,
          lastName: payer.name?.surname,
        },
        shippingAddress: deliveryAddress,
        billingAddress,
      };
      await httpClient({
        method: 'POST',
        url: this.saveShopperDataUrl,
        data: {
          data: JSON.stringify(shopperDetails),
        },
      });
      actions.resolve();
    } catch (e) {
      $.spinner().stop();
    }
  }

  async makeExpressPaymentDetailsCall(data) {
    try {
      const response = await httpClient({
        method: 'POST',
        url: this.makeExpressPaymentDetailsCallUrl,
        data: {
          data: JSON.stringify({ data }),
        },
      });
      this.helpers.createShowConfirmationForm(this.showConfirmationAction);
      this.helpers.setOrderFormData(response);
    } catch (e) {
      $.spinner().stop();
    }
  }

  async onShippingAddressChange(data, actions, component) {
    try {
      const { shippingAddress } = data;
      const currentPaymentData = component.paymentData;
      if (!shippingAddress) {
        actions.reject();
        return;
      }
      const requestBody = {
        paymentMethodType: PAYPAL,
        currentPaymentData,
        address: {
          city: shippingAddress.city,
          country: shippingAddress.country,
          countryCode: shippingAddress.countryCode,
          stateCode: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
        },
      };
      const response = await httpClient({
        method: 'POST',
        url: this.shippingMethodsUrl,
        data: {
          data: JSON.stringify(requestBody),
        },
      });
      Paypal.updateComponent(response, component);
    } catch (e) {
      actions.reject();
    }
  }

  async onShippingOptionsChange(data, actions, component) {
    try {
      const { selectedShippingOption } = data;
      if (!selectedShippingOption) {
        actions.reject();
      } else {
        const response = await httpClient({
          method: 'POST',
          url: this.selectShippingMethodUrl,
          data: {
            data: JSON.stringify({
              paymentMethodType: PAYPAL,
              currentPaymentData: component.paymentData,
              methodID: selectedShippingOption?.id,
            }),
          },
        });
        Paypal.updateComponent(response, component);
      }
    } catch (e) {
      actions.reject();
    }
  }

  async onAdditionalDetails(state, component) {
    try {
      if (this.userAction) {
        const response = await httpClient({
          method: 'POST',
          url: this.saveExpressPaymentDataUrl,
          data: {
            data: JSON.stringify(state.data),
          },
        });
        if (response.success && response.redirectUrl) {
          window.location.href = response.redirectUrl;
        }
      } else {
        await this.makeExpressPaymentDetailsCall(state.data);
        document.querySelector('#additionalDetailsHidden').value =
          JSON.stringify(state.data);
        document.querySelector('#showConfirmationForm').submit();
      }
    } catch (e) {
      component.handleError(e);
      $.spinner().stop();
    }
  }

  getConfig() {
    return {
      configuration: this.config,
      showPayButton: this.showPayButton,
      returnUrl: this.returnUrl,
      amount: this.amount,
      isExpress: this.isExpress,
      ...(this.userAction ? { userAction: this.userAction } : {}),
      onSubmit: this.callPaymentFromComponent.bind(this),
      onError: Paypal.onError,
      onAuthorized: this.onAuthorized.bind(this),
      onAdditionalDetails: this.onAdditionalDetails.bind(this),
      onShippingAddressChange: this.onShippingAddressChange.bind(this),
      onShippingOptionsChange: this.onShippingOptionsChange.bind(this),
      blockPayPalCreditButton: true,
      blockPayPalPayLaterButton: true,
    };
  }

  async getComponent() {
    const checkout = await initializeCheckout(this.applicationInfo);
    const paypalConfig = this.getConfig();
    return window.AdyenWeb.createComponent(PAYPAL, checkout, paypalConfig);
  }
}

module.exports = Paypal;
