const { httpClient } = require('../../../commons/httpClient');
const store = require('../../../../../../store');
const helpers = require('../../../adyen_checkout/helpers');
const { PAYPAL } = require('../../../constants');
const { initializeCheckout } = require('../../initializeCheckout');

class Paypal {
  constructor(config, applicationInfo) {
    const {
      paypalReviewPageEnabled,
      returnURL,
      basketAmount,
      makeExpressPaymentsCall,
      saveShopperData,
      checkoutReview,
      makeExpressPaymentDetailsCall,
      showConfirmationAction,
      shippingMethodsUrl,
      selectShippingMethodUrl,
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
    this.checkoutReviewUrl = checkoutReview;
    this.makeExpressPaymentDetailsCallUrl = makeExpressPaymentDetailsCall;
    this.showConfirmationAction = showConfirmationAction;
    this.shippingMethodsUrl = shippingMethodsUrl;
    this.selectShippingMethodUrl = selectShippingMethodUrl;
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

  async callPaymentFromComponent(data, component) {
    try {
      $.spinner().start();
      const response = await httpClient({
        method: 'POST',
        url: this.makeExpressPaymentsCallUrl,
        data: {
          data: JSON.stringify(data),
        },
      });
      const { action } = response.fullResponse;
      if (action) {
        component.handleAction(action);
      } else {
        component.handleError();
      }
    } catch (e) {
      component.handleError();
    }
  }

  async saveShopperDetails(shopperDetails, rawData, actions) {
    try {
      await httpClient({
        method: 'POST',
        url: this.saveShopperDataUrl,
        data: {
          shopperDetails: JSON.stringify(shopperDetails),
        },
      });
      actions.resolve();
    } catch (e) {
      $.spinner().stop();
    }
  }

  redirectToReviewPage(data) {
    const redirect = $('<form>').appendTo(document.body).attr({
      method: 'POST',
      action: this.checkoutReviewUrl,
    });
    $('<input>')
      .appendTo(redirect)
      .attr({
        name: 'data',
        value: JSON.stringify(data),
      });

    $('<input>')
      .appendTo(redirect)
      .attr({
        name: 'csrf_token',
        value: $('#adyen-token').val(),
      });

    redirect.submit();
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

  async onAdditionalDetails(state) {
    if (this.userAction) {
      this.redirectToReviewPage(state.data);
    } else {
      await this.makeExpressPaymentDetailsCall(state.data);
      document.querySelector('#additionalDetailsHidden').value = JSON.stringify(
        state.data,
      );
      document.querySelector('#showConfirmationForm').submit();
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
      onSubmit: this.callPaymentFromComponent,
      onError: Paypal.onError,
      onShopperDetails: this.saveShopperDetails,
      onAdditionalDetails: this.onAdditionalDetails,
      onShippingAddressChange: this.onShippingAddressChange,
      onShippingOptionsChange: this.onShippingOptionsChange,
    };
  }

  async getComponent() {
    const checkout = await initializeCheckout(this.applicationInfo);
    const paypalConfig = this.getConfig();
    return window.AdyenWeb.createComponent(PAYPAL, checkout, paypalConfig);
  }
}

module.exports = Paypal;
