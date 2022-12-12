const helpers = require('./helpers');
const { onBrand, onFieldValid } = require('../commons');
const store = require('../../../../store');
const constants = require('../constants');
const {
  createElementsToShowRemainingGiftCardAmount,
  renderAddedGiftCard,
  getGiftCardElements,
} = require('./renderGiftcardComponent');

function getCardConfig() {
  return {
    enableStoreDetails: window.showStoreDetails,
    showBrandsUnderCardNumber: false,
    onChange(state) {
      store.isValid = state.isValid;
      const method = state.data.paymentMethod.storedPaymentMethodId
        ? `storedCard${state.data.paymentMethod.storedPaymentMethodId}`
        : store.selectedMethod;
      store.updateSelectedPayment(method, 'isValid', store.isValid);
      store.updateSelectedPayment(method, 'stateData', state.data);
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
          orderToken: document.querySelector('#orderToken').value,
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

function handlePartialPaymentSuccess() {
  const { giftCardSelectContainer, giftCardSelect } = getGiftCardElements();
  giftCardSelectContainer.classList.add('invisible');
  giftCardSelect.value = null;
  store.componentsObj.giftcard.node.unmount('component_giftcard');
  renderAddedGiftCard();
  createElementsToShowRemainingGiftCardAmount();
}

function getGiftCardConfig() {
  let giftcardBalance;
  return {
    showPayButton: true,
    onBalanceCheck: (resolve, reject, requestData) => {
      $.ajax({
        type: 'POST',
        url: 'Adyen-CheckBalance',
        data: JSON.stringify(requestData),
        contentType: 'application/json; charset=utf-8',
        async: false,
        success: (data) => {
          giftcardBalance = data.balance;
          if (data.resultCode === constants.SUCCESS) {
            const giftCardSelect = document.querySelector('#giftCardSelect');
            if (giftCardSelect) {
              giftCardSelect.classList.add('invisible');
            }
            resolve(data);
          } else if (data.resultCode === constants.NOTENOUGHBALANCE) {
            resolve(data);
          } else {
            reject();
          }
        },
        fail: () => {
          reject();
        },
      });
    },
    onOrderRequest: (resolve, reject, requestData) => {
      // Make a POST /orders request
      // Create an order for the total transaction amount
      const giftCardData = requestData.paymentMethod;
      $.ajax({
        type: 'POST',
        url: 'Adyen-PartialPaymentsOrder',
        data: JSON.stringify(requestData),
        contentType: 'application/json; charset=utf-8',
        async: false,
        success: (data) => {
          if (data.resultCode === 'Success') {
            // make payments call including giftcard data and order data
            const partialPaymentRequest = {
              paymentMethod: giftCardData,
              amount: giftcardBalance,
              partialPaymentsOrder: {
                pspReference: data.pspReference,
                orderData: data.orderData,
              },
              giftcardBrand: store.partialPaymentsOrderObj?.giftcard?.brand,
            };
            const partialPaymentResponse = helpers.makePartialPayment(
              partialPaymentRequest,
              data.expiresAt,
              data.remainingAmount,
            );
            if (partialPaymentResponse?.error) {
              reject();
            } else {
              handlePartialPaymentSuccess();
            }
          }
        },
      });
    },
    onSubmit(state) {
      store.selectedMethod = state.data.paymentMethod.type;
      store.brand = state.data?.paymentMethod?.brand;
      document.querySelector('input[name="brandCode"]').checked = false;
      document.querySelector('button[value="submit-payment"]').click();
    },
  };
}

function handleOnChange(state) {
  store.isValid = state.isValid;
  if (!store.componentsObj[store.selectedMethod]) {
    store.componentsObj[store.selectedMethod] = {};
  }
  store.componentsObj[store.selectedMethod].isValid = store.isValid;
  store.componentsObj[store.selectedMethod].stateData = state.data;
}

const actionHandler = async (action) => {
  const checkout = await AdyenCheckout(store.checkoutConfiguration);
  checkout.createFromAction(action).mount('#action-container');
  $('#action-modal').modal({ backdrop: 'static', keyboard: false });
};

function handleOnAdditionalDetails(state) {
  $.ajax({
    type: 'POST',
    url: 'Adyen-PaymentsDetails',
    data: JSON.stringify({
      data: state.data,
      orderToken: window.orderToken,
    }),
    contentType: 'application/json; charset=utf-8',
    async: false,
    success(data) {
      if (!data.isFinal && typeof data.action === 'object') {
        actionHandler(data.action);
      } else {
        window.location.href = data.redirectUrl;
      }
    },
  });
}

function getAmazonpayConfig() {
  return {
    showPayButton: true,
    productType: 'PayAndShip',
    checkoutMode: 'ProcessOrder',
    locale: window.Configuration.locale,
    returnUrl: window.returnURL,
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

function setCheckoutConfiguration() {
  store.checkoutConfiguration.onChange = handleOnChange;
  store.checkoutConfiguration.onAdditionalDetails = handleOnAdditionalDetails;
  store.checkoutConfiguration.showPayButton = false;
  store.checkoutConfiguration.clientKey = window.adyenClientKey;

  store.checkoutConfiguration.paymentMethodsConfiguration = {
    card: getCardConfig(),
    bcmc: getCardConfig(),
    storedCard: getCardConfig(),
    boletobancario: {
      personalDetailsRequired: true, // turn personalDetails section on/off
      billingAddressRequired: false, // turn billingAddress section on/off
      showEmailAddress: false, // allow shopper to specify their email address
    },
    paywithgoogle: getGooglePayConfig(),
    googlepay: getGooglePayConfig(),
    paypal: getPaypalConfig(),
    amazonpay: getAmazonpayConfig(),
    giftcard: getGiftCardConfig(),
  };
}

module.exports = {
  getCardConfig,
  getPaypalConfig,
  getGooglePayConfig,
  setCheckoutConfiguration,
  actionHandler,
};
