const helpers = require('./helpers');
const { makePartialPayment } = require('./makePartialPayment');
const { onBrand, onFieldValid } = require('../commons');
const store = require('../../../../store');
const constants = require('../constants');
const {
  createElementsToShowRemainingGiftCardAmount,
  renderAddedGiftCard,
  getGiftCardElements,
  showGiftCardInfoMessage,
  showGiftCardCancelButton,
  attachGiftCardCancelListener,
} = require('./renderGiftcardComponent');

function getCardConfig() {
  return {
    hasHolderName: true,
    holderNameRequired: true,
    enableStoreDetails: window.showStoreDetails,
    showBrandsUnderCardNumber: false,
    clickToPayConfiguration: {
      shopperEmail: window.customerEmail,
      merchantDisplayName: window.merchantAccount,
    },
    exposeExpiryDate: false,
    onChange(state) {
      store.isValid = state.isValid;
      const method = state.data.paymentMethod.storedPaymentMethodId
        ? `storedCard${state.data.paymentMethod.storedPaymentMethodId}`
        : store.selectedMethod;
      store.updateSelectedPayment(method, 'isValid', store.isValid);
      store.updateSelectedPayment(method, 'stateData', state.data);
    },
    onSubmit: () => {
      helpers.assignPaymentMethodValue();
      document.querySelector('button[value="submit-payment"]').disabled = false;
      document.querySelector('button[value="submit-payment"]').click();
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
      $('#dwfrm_billing').trigger('submit');
      if (store.formErrorsExist) {
        return actions.reject();
      }
      if (store.paypalTerminatedEarly) {
        helpers.paymentFromComponent({
          cancelTransaction: true,
          merchantReference: document.querySelector('#merchantReference').value,
        });
        store.paypalTerminatedEarly = false;
        return actions.resolve();
      }
      store.paypalTerminatedEarly = true;
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
  const {
    giftCardSelectContainer,
    giftCardSelect,
    giftCardsList,
    cancelMainPaymentGiftCard,
    giftCardAddButton,
  } = getGiftCardElements();
  giftCardSelectContainer.classList.add('invisible');
  giftCardSelect.value = null;
  giftCardsList.innerHTML = '';
  cancelMainPaymentGiftCard.addEventListener('click', () => {
    store.componentsObj.giftcard.node.unmount('component_giftcard');
    cancelMainPaymentGiftCard.classList.add('invisible');
    giftCardAddButton.style.display = 'block';
    giftCardSelect.value = 'null';
  });
  if (store.componentsObj.giftcard) {
    store.componentsObj.giftcard.node.unmount('component_giftcard');
  }
  store.addedGiftCards.forEach((card) => {
    renderAddedGiftCard(card);
  });
  if (store.addedGiftCards?.length) {
    showGiftCardInfoMessage();
  }
  showGiftCardCancelButton(true);
  attachGiftCardCancelListener();
  createElementsToShowRemainingGiftCardAmount();
}

async function makeGiftcardPaymentRequest(
  paymentMethod,
  giftcardBalance,
  reject,
) {
  const brandSelect = document.getElementById('giftCardSelect');
  const selectedBrandIndex = brandSelect.selectedIndex;
  const giftcardBrand = brandSelect.options[selectedBrandIndex].text;
  const { encryptedCardNumber, encryptedSecurityCode, brand } = paymentMethod;
  const partialPaymentRequest = {
    encryptedCardNumber,
    encryptedSecurityCode,
    brand,
    giftcardBrand,
  };
  const partialPaymentResponse = await makePartialPayment(
    partialPaymentRequest,
  );
  if (partialPaymentResponse?.error) {
    reject();
  } else {
    handlePartialPaymentSuccess();
  }
}

function getGiftCardConfig() {
  let giftcardBalance;
  return {
    showPayButton: true,
    onChange: (state) => {
      store.updateSelectedPayment(constants.GIFTCARD, 'isValid', state.isValid);
      store.updateSelectedPayment(constants.GIFTCARD, 'stateData', state.data);
    },
    onBalanceCheck: (resolve, reject, requestData) => {
      const payload = {
        csrf_token: $('#adyen-token').val(),
        data: JSON.stringify(requestData),
      };
      $.ajax({
        type: 'POST',
        url: window.checkBalanceUrl,
        data: payload,
        async: false,
        success: (data) => {
          giftcardBalance = data.balance;
          document.querySelector('button[value="submit-payment"]').disabled =
            false;
          if (data.resultCode === constants.SUCCESS) {
            const {
              giftCardsInfoMessageContainer,
              giftCardSelect,
              cancelMainPaymentGiftCard,
              giftCardAddButton,
              giftCardSelectWrapper,
            } = getGiftCardElements();
            if (giftCardSelectWrapper) {
              giftCardSelectWrapper.classList.add('invisible');
            }
            const initialPartialObject = { ...store.partialPaymentsOrderObj };

            cancelMainPaymentGiftCard.classList.remove('invisible');
            cancelMainPaymentGiftCard.addEventListener('click', () => {
              store.componentsObj.giftcard.node.unmount('component_giftcard');
              cancelMainPaymentGiftCard.classList.add('invisible');
              giftCardAddButton.style.display = 'block';
              giftCardSelect.value = 'null';
              store.partialPaymentsOrderObj.remainingAmountFormatted =
                initialPartialObject.remainingAmountFormatted;
              store.partialPaymentsOrderObj.totalDiscountedAmount =
                initialPartialObject.totalDiscountedAmount;
            });

            document.querySelector('button[value="submit-payment"]').disabled =
              true;
            giftCardsInfoMessageContainer.innerHTML = '';
            giftCardsInfoMessageContainer.classList.remove(
              'gift-cards-info-message-container',
            );
            store.partialPaymentsOrderObj.remainingAmountFormatted =
              data.remainingAmountFormatted;
            store.partialPaymentsOrderObj.totalDiscountedAmount =
              data.totalAmountFormatted;
            resolve(data);
          } else if (
            data.resultCode === constants.NOTENOUGHBALANCE &&
            data.balance.value > 0
          ) {
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
      const { paymentMethod } = requestData;
      if (store.adyenOrderDataCreated) {
        makeGiftcardPaymentRequest(paymentMethod, giftcardBalance, reject);
      } else {
        $.ajax({
          type: 'POST',
          url: window.partialPaymentsOrderUrl,
          data: {
            csrf_token: $('#adyen-token').val(),
            data: JSON.stringify(requestData),
          },
          async: false,
          success: (data) => {
            if (data.resultCode === 'Success') {
              store.adyenOrderDataCreated = true;
              // make payments call including giftcard data and order data
              makeGiftcardPaymentRequest(
                paymentMethod,
                giftcardBalance,
                reject,
              );
            }
          },
        });
      }
    },
    onSubmit(state, component) {
      store.selectedMethod = state.data.paymentMethod.type;
      store.brand = component?.displayName;
      document.querySelector('input[name="brandCode"]').checked = false;
      document.querySelector('button[value="submit-payment"]').disabled = false;
      document.querySelector('button[value="submit-payment"]').click();
    },
  };
}

async function handleOnChange(state) {
  const { type } = state.data.paymentMethod;
  store.isValid = state.isValid;
  if (!store.componentsObj[type]) {
    store.componentsObj[type] = {};
  }
  store.componentsObj[type].isValid = store.isValid;
  store.componentsObj[type].stateData = state.data;
}

const actionHandler = async (action) => {
  const checkout = await AdyenCheckout(store.checkoutConfiguration);
  checkout.createFromAction(action).mount('#action-container');
  $('#action-modal').modal({ backdrop: 'static', keyboard: false });
  if (action.type === constants.ACTIONTYPE.QRCODE) {
    document
      .getElementById('cancelQrMethodsButton')
      .classList.remove('invisible');
  }
};

function handleOnAdditionalDetails(state) {
  const requestData = JSON.stringify({
    data: state.data,
    orderToken: window.orderToken,
  });
  $.ajax({
    type: 'POST',
    url: window.paymentsDetailsURL,
    data: {
      csrf_token: $('#adyen-token').val(),
      data: requestData,
    },
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

function getApplePayConfig() {
  return {
    showPayButton: true,
    buttonColor: 'black',
    onSubmit: (state, component) => {
      $('#dwfrm_billing').trigger('submit');
      helpers.assignPaymentMethodValue();
      helpers.paymentFromComponent(state.data, component);
    },
  };
}

function getCashAppConfig() {
  return {
    showPayButton: true,
    onSubmit: (state, component) => {
      $('#dwfrm_billing').trigger('submit');
      helpers.assignPaymentMethodValue();
      helpers.paymentFromComponent(state.data, component);
    },
  };
}

function getKlarnaConfig() {
  const { klarnaWidgetEnabled } = window;
  if (klarnaWidgetEnabled) {
    return {
      showPayButton: true,
      useKlarnaWidget: true,
      onError: (component) => {
        helpers.paymentFromComponent(
          {
            cancelTransaction: true,
            merchantReference:
              document.querySelector('#merchantReference').value,
            orderToken: document.querySelector('#orderToken').value,
          },
          component,
        );
        document.querySelector('#showConfirmationForm').submit();
      },
      onSubmit: (state, component) => {
        helpers.assignPaymentMethodValue();
        helpers.paymentFromComponent(state.data, component);
      },
      onAdditionalDetails: (state) => {
        document.querySelector('#additionalDetailsHidden').value =
          JSON.stringify(state.data);
        document.querySelector('#showConfirmationForm').submit();
      },
    };
  }
  return null;
}

function getUpiConfig() {
  return {
    showPayButton: true,
    onSubmit: (state, component) => {
      $('#dwfrm_billing').trigger('submit');
      helpers.assignPaymentMethodValue();
      helpers.paymentFromComponent(state.data, component);
    },
    onAdditionalDetails: (state) => {
      document.querySelector('#additionalDetailsHidden').value = JSON.stringify(
        state.data,
      );
      document.querySelector('#showConfirmationForm').submit();
    },
    onError: (component) => {
      if (component) {
        component.setStatus('ready');
      }
      document.querySelector('#showConfirmationForm').submit();
    },
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
    storedCard: {
      ...getCardConfig(),
      holderNameRequired: false,
    },
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
    applepay: getApplePayConfig(),
    klarna: getKlarnaConfig(),
    klarna_account: getKlarnaConfig(),
    klarna_paynow: getKlarnaConfig(),
    cashapp: getCashAppConfig(),
    upi: getUpiConfig(),
  };
}

module.exports = {
  getCardConfig,
  getPaypalConfig,
  getGooglePayConfig,
  getAmazonpayConfig,
  getGiftCardConfig,
  getApplePayConfig,
  getCashAppConfig,
  getKlarnaConfig,
  setCheckoutConfiguration,
  actionHandler,
};
