const helpers = require('./helpers');
const { onBrand, onFieldValid } = require('../commons');
const store = require('../../../../store');
const constants = require('../constants');

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
      const adyenPartialPaymentsOrder = document.querySelector(
        '#adyenPartialPaymentsOrder',
      );
      const giftCardsList = document.querySelector('#giftCardsList');
      const giftCardAddButton = document.querySelector('#giftCardAddButton');
      const giftCardSelect = document.querySelector('#giftCardSelect');
      const giftCardUl = document.querySelector('#giftCardUl');

      adyenPartialPaymentsOrder.value = null;
      giftCardsList.innerHTML = '';
      giftCardAddButton.style.display = 'block';
      giftCardSelect.value = null;
      giftCardUl.innerHTML = '';

      store.partialPaymentsOrderObj = null;
      window.sessionStorage.removeItem(constants.GIFTCARD_DATA_ADDED);

      if (res.resultCode === constants.RECEIVED) {
        document.querySelector('#cancelGiftCardContainer')?.parentNode.remove();
        store.componentsObj?.giftcard?.node.unmount('component_giftcard');
      }
    },
  });
}

function showGiftCardWarningMessage() {
  const alertContainer = document.createElement('div');
  alertContainer.setAttribute('id', 'giftCardWarningMessage');
  alertContainer.classList.add('alert', 'alert-warning', 'error-message');
  alertContainer.style.display = 'block';
  alertContainer.style.margin = '20px 0';
  alertContainer.setAttribute('role', 'alert');

  const alertContainerP = document.createElement('p');
  alertContainerP.classList.add('error-message-text');
  alertContainerP.textContent = window.giftCardWarningMessage;

  alertContainer.appendChild(alertContainerP);

  const orderTotalSummaryEl = document.querySelector(
    '.card-body.order-total-summary',
  );
  orderTotalSummaryEl.appendChild(alertContainer);
}

function getGiftCardElements() {
  const giftCardSelect = document.querySelector('#giftCardSelect');
  const giftCardUl = document.querySelector('#giftCardUl');
  const giftCardContainer = document.querySelector('#giftCardContainer');
  const giftCardAddButton = document.querySelector('#giftCardAddButton');
  const giftCardSelectContainer = document.querySelector(
    '#giftCardSelectContainer',
  );
  const giftCardsList = document.querySelector('#giftCardsList');

  return {
    giftCardSelect,
    giftCardUl,
    giftCardContainer,
    giftCardAddButton,
    giftCardSelectContainer,
    giftCardsList,
  };
}

function attachGiftCardFormListeners() {
  const {
    giftCardUl,
    giftCardSelect,
    giftCardContainer,
    giftCardAddButton,
    giftCardSelectContainer,
  } = getGiftCardElements();

  if (giftCardUl) {
    giftCardUl.addEventListener('click', (event) => {
      giftCardUl.classList.toggle('invisible');
      const selectedGiftCard = {
        name: event.target.dataset.name,
        brand: event.target.dataset.brand,
        type: event.target.dataset.type,
      };
      if (
        selectedGiftCard.brand !== store.partialPaymentsOrderObj?.giftcard.brand
      ) {
        if (store.componentsObj?.giftcard) {
          store.componentsObj.giftcard.node.unmount('component_giftcard');
        }
        if (!store.partialPaymentsOrderObj) {
          store.partialPaymentsOrderObj = {};
        }
        store.partialPaymentsOrderObj.giftcard = selectedGiftCard;
        giftCardSelect.value = selectedGiftCard.brand;
        giftCardContainer.innerHTML = '';
        const giftCardNode = store.checkout
          .create(constants.GIFTCARD, {
            ...store.checkoutConfiguration.giftcard,
            brand: selectedGiftCard.brand,
            name: selectedGiftCard.name,
          })
          .mount(giftCardContainer);
        store.componentsObj.giftcard = { node: giftCardNode };
      }
    });
  }

  if (giftCardAddButton) {
    giftCardAddButton.addEventListener('click', () => {
      if (store.partialPaymentsOrderObj) {
        return;
      }
      const giftCardWarningMessageEl = document.querySelector(
        '#giftCardWarningMessage',
      );
      if (giftCardWarningMessageEl) {
        giftCardWarningMessageEl.style.display = 'none';
      }
      giftCardAddButton.style.display = 'none';
      giftCardSelectContainer.classList.remove('invisible');
    });
  }

  if (giftCardSelect) {
    giftCardSelect.addEventListener('click', () => {
      giftCardUl.classList.toggle('invisible');
    });
  }
}

function renderGiftCardSelectForm() {
  const { paymentMethodsResponse } = store.checkout;
  const { imagePath } = store.checkoutConfiguration.session;

  const { giftCardSelect, giftCardUl } = getGiftCardElements();

  const giftCardBrands = paymentMethodsResponse.paymentMethods.filter(
    (pm) => pm.type === constants.GIFTCARD,
  );

  giftCardBrands.forEach((giftCard) => {
    const newListItem = document.createElement('li');
    newListItem.setAttribute('data-brand', giftCard.brand);
    newListItem.setAttribute('data-name', giftCard.name);
    newListItem.setAttribute('data-type', giftCard.type);

    const span = document.createElement('span');
    span.textContent = giftCard.name;
    const img = document.createElement('img');
    img.src = `${imagePath}${giftCard.brand}.png`;
    img.width = 40;
    img.height = 26;

    newListItem.appendChild(span);
    newListItem.appendChild(img);

    giftCardUl.appendChild(newListItem);

    const newOption = document.createElement('option');
    newOption.textContent = giftCard.name;
    newOption.value = giftCard.brand;
    newOption.style.visibility = 'hidden';
    giftCardSelect.appendChild(newOption);
  });
}

function renderAddedGiftCard() {
  const giftCardData = store.partialPaymentsOrderObj.giftcard;
  const { imagePath } = store.checkoutConfiguration.session;

  const { giftCardsList, giftCardAddButton } = getGiftCardElements();

  const giftCardDiv = document.createElement('div');
  giftCardDiv.classList.add('gift-card');

  const brandContainer = document.createElement('div');
  brandContainer.classList.add('brand-container');

  const giftCardImg = document.createElement('img');
  const giftCardImgSrc = `${imagePath}${giftCardData.brand}.png`;
  giftCardImg.setAttribute('src', giftCardImgSrc);
  giftCardImg.width = 40;
  giftCardImg.height = 26;

  const giftCardNameP = document.createElement('p');
  giftCardNameP.textContent = giftCardData.name;

  brandContainer.appendChild(giftCardImg);
  brandContainer.appendChild(giftCardNameP);

  const giftCardAction = document.createElement('div');
  giftCardAction.classList.add('gift-card-action');

  const removeAnchor = document.createElement('a');
  removeAnchor.textContent = window.removeGiftCardButtonText;
  removeAnchor.addEventListener('click', () => {
    removeGiftCard();
    renderGiftCardSelectForm();
  });

  giftCardAction.appendChild(removeAnchor);

  const brandAndRemoveActionWrapper = document.createElement('div');
  brandAndRemoveActionWrapper.classList.add('wrapper');
  brandAndRemoveActionWrapper.appendChild(brandContainer);
  brandAndRemoveActionWrapper.appendChild(giftCardAction);

  const giftCardAmountDiv = document.createElement('div');
  giftCardAmountDiv.classList.add('wrapper');
  const amountLabel = document.createElement('p');
  amountLabel.textContent = window.discountedAmountGiftCardResource;
  const amountValue = document.createElement('strong');
  amountValue.textContent = store.partialPaymentsOrderObj.discountedAmount;
  giftCardAmountDiv.appendChild(amountLabel);
  giftCardAmountDiv.appendChild(amountValue);

  giftCardDiv.appendChild(brandAndRemoveActionWrapper);
  giftCardDiv.appendChild(giftCardAmountDiv);

  giftCardsList.appendChild(giftCardDiv);

  giftCardAddButton.style.display = 'none';
}

function createElementsToShowRemainingGiftCardAmount() {
  const mainContainer = document.createElement('div');
  const remainingAmountContainer = document.createElement('div');
  const remainingAmountStart = document.createElement('div');
  const remainingAmountEnd = document.createElement('div');
  const discountedAmountContainer = document.createElement('div');
  const discountedAmountStart = document.createElement('div');
  const discountedAmountEnd = document.createElement('div');
  const cancelGiftCard = document.createElement('a');
  const remainingAmountStartP = document.createElement('p');
  const remainingAmountEndP = document.createElement('p');
  const discountedAmountStartP = document.createElement('p');
  const discountedAmountEndP = document.createElement('p');
  const cancelGiftCardP = document.createElement('p');
  const remainingAmountStartSpan = document.createElement('span');
  const discountedAmountStartSpan = document.createElement('span');
  const cancelGiftCardSpan = document.createElement('span');
  const remainingAmountEndSpan = document.createElement('span');
  const discountedAmountEndSpan = document.createElement('span');

  remainingAmountContainer.classList.add('row', 'grand-total', 'leading-lines');
  remainingAmountStart.classList.add('col-6', 'start-lines');
  remainingAmountEnd.classList.add('col-6', 'end-lines');
  remainingAmountStartP.classList.add('order-receipt-label');
  discountedAmountContainer.classList.add(
    'row',
    'grand-total',
    'leading-lines',
  );
  discountedAmountStart.classList.add('col-6', 'start-lines');
  discountedAmountEnd.classList.add('col-6', 'end-lines');
  discountedAmountStartP.classList.add('order-receipt-label');
  cancelGiftCardP.classList.add('order-receipt-label');
  remainingAmountEndP.classList.add('text-right');
  discountedAmountEndP.classList.add('text-right');
  cancelGiftCard.id = 'cancelGiftCardContainer';
  cancelGiftCard.role = 'button';
  discountedAmountContainer.id = 'discountedAmountContainer';
  remainingAmountContainer.id = 'remainingAmountContainer';

  remainingAmountStartSpan.innerText = window.remainingAmountGiftCardResource;
  discountedAmountStartSpan.innerText = window.discountedAmountGiftCardResource;
  cancelGiftCardSpan.innerText = window.cancelGiftCardResource;
  remainingAmountEndSpan.innerText =
    store.partialPaymentsOrderObj.remainingAmount;
  discountedAmountEndSpan.innerText =
    store.partialPaymentsOrderObj.discountedAmount;

  cancelGiftCard.addEventListener('click', () => {
    removeGiftCard();
    renderGiftCardSelectForm();
  });

  remainingAmountContainer.appendChild(remainingAmountStart);
  remainingAmountContainer.appendChild(remainingAmountEnd);
  remainingAmountContainer.appendChild(cancelGiftCard);
  remainingAmountStart.appendChild(remainingAmountStartP);

  discountedAmountContainer.appendChild(discountedAmountStart);
  discountedAmountContainer.appendChild(discountedAmountEnd);
  discountedAmountStart.appendChild(discountedAmountStartP);

  cancelGiftCard.appendChild(cancelGiftCardP);
  remainingAmountEnd.appendChild(remainingAmountEndP);
  remainingAmountStartP.appendChild(remainingAmountStartSpan);
  discountedAmountEnd.appendChild(discountedAmountEndP);
  discountedAmountStartP.appendChild(discountedAmountStartSpan);
  cancelGiftCardP.appendChild(cancelGiftCardSpan);
  remainingAmountEndP.appendChild(remainingAmountEndSpan);
  discountedAmountEndP.appendChild(discountedAmountEndSpan);

  const pricingContainer = document.querySelector(
    '.card-body.order-total-summary',
  );
  mainContainer.appendChild(discountedAmountContainer);
  mainContainer.appendChild(remainingAmountContainer);
  mainContainer.appendChild(cancelGiftCard);
  pricingContainer.appendChild(mainContainer);
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
  createElementsToShowRemainingGiftCardAmount,
  removeGiftCard,
  showGiftCardWarningMessage,
  renderAddedGiftCard,
  renderGiftCardSelectForm,
  attachGiftCardFormListeners,
};
