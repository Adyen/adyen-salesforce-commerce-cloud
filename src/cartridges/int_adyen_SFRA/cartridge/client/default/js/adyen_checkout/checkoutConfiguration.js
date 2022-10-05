const helpers = require('./helpers');
const { onBrand, onFieldValid } = require('../commons');
const { renderPaymentMethod } = require('./renderPaymentMethod');
const store = require('../../../../store');

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

function removeGiftCard() {
  $.ajax({
    type: 'POST',
    url: 'Adyen-CancelPartialPaymentOrder',
    data: JSON.stringify(store.partialPaymentsOrderObj),
    contentType: 'application/json; charset=utf-8',
    async: false,
    success(res) {
      store.partialPaymentsOrderObj = null;
      if (res.resultCode === 'Received') {
        document.querySelector('#cancelGiftCardContainer').parentNode.remove();
        document.querySelector('#giftCardLabel').classList.remove('invisible');

        // re render gift card component
        store.componentsObj.giftcard.node.unmount('component_giftcard');
        delete store.componentsObj.giftcard;

        document.querySelector('#component_giftcard').remove();
        renderPaymentMethod(
          { type: 'giftcard' },
          false,
          store.checkoutConfiguration.session.imagePath,
          null,
          true,
        );
        document.querySelector('#component_giftcard').style.display = 'block';
      }
    },
  });
}

function showRemainingAmount() {
  $('#giftcard-modal').modal('hide');
  document.querySelector('#giftCardLabel').classList.add('invisible');

  const remainingAmountContainer = document.createElement('div');
  const remainingAmountStart = document.createElement('div');
  const remainingAmountEnd = document.createElement('div');
  const cancelGiftCard = document.createElement('div');
  const remainingAmountStartP = document.createElement('p');
  const remainingAmountEndP = document.createElement('p');
  const cancelGiftCardP = document.createElement('p');
  const remainingAmountStartSpan = document.createElement('span');
  const cancelGiftCardSpan = document.createElement('span');
  const remainingAmountEndSpan = document.createElement('span');

  remainingAmountContainer.classList.add('row', 'grand-total', 'leading-lines');
  remainingAmountStart.classList.add('col-6', 'start-lines');
  remainingAmountEnd.classList.add('col-6', 'end-lines');
  remainingAmountStartP.classList.add('order-receipt-label');
  cancelGiftCardP.classList.add('order-receipt-label');
  remainingAmountEndP.classList.add('text-right');
//  remainingAmountEndSpan.classList.add('grand-total-sum');
  cancelGiftCard.id = 'cancelGiftCardContainer';

  remainingAmountStartSpan.innerText = 'Remaining Amount'; // todo: use localisation
  cancelGiftCardSpan.innerText = 'cancel giftcard?'; // todo: use localisation
  remainingAmountEndSpan.innerText =
    store.partialPaymentsOrderObj.remainingAmount;

  cancelGiftCard.addEventListener('click', removeGiftCard);

  remainingAmountContainer.appendChild(remainingAmountStart);
  remainingAmountContainer.appendChild(remainingAmountEnd);
  remainingAmountContainer.appendChild(cancelGiftCard);
  remainingAmountStart.appendChild(remainingAmountStartP);
  cancelGiftCard.appendChild(cancelGiftCardP);
  remainingAmountEnd.appendChild(remainingAmountEndP);
  remainingAmountStartP.appendChild(remainingAmountStartSpan);
  cancelGiftCardP.appendChild(cancelGiftCardSpan);
  remainingAmountEndP.appendChild(remainingAmountEndSpan);
  const pricingContainer = document.querySelector(
    '.card-body.order-total-summary',
  );
  pricingContainer.appendChild(remainingAmountContainer);
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
          if (data.resultCode === 'Success') {
            resolve(data);
          } else if (data.resultCode === 'NotEnoughBalance') {
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
            };
            const partialPaymentResponse = helpers.makePartialPayment(partialPaymentRequest);
            console.log('partialPaymentResponse ' + JSON.stringify(partialPaymentResponse));
            if(partialPaymentResponse?.error) {
                reject();
            } else {
                showRemainingAmount();
            }
          }
        },
      });
    },
    onSubmit() {
      $('#giftcard-modal').modal('hide');
      store.selectedMethod = 'giftcard';
      document.querySelector('input[name="brandCode"]').checked = false;
      document.querySelector('button[value="submit-payment"]').click();
    },
  };
}

function handleOnChange(state) {
  let { type } = state.data.paymentMethod;
  if (store.selectedMethod === 'googlepay' && type === 'paywithgoogle') {
    type = 'googlepay';
  }
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
  getGiftCardConfig,
  setCheckoutConfiguration,
  actionHandler,
};
