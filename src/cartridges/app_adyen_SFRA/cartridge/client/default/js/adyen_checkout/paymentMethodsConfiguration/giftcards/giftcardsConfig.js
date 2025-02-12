const {
  getGiftCardElements,
  renderAddedGiftCard,
  showGiftCardInfoMessage,
  showGiftCardCancelButton,
  attachGiftCardCancelListener,
  createElementsToShowRemainingGiftCardAmount,
} = require('../../renderGiftcardComponent');
const store = require('../../../../../../store');
const { makePartialPayment } = require('../../makePartialPayment');
const { httpClient } = require('../../../commons/httpClient');
const { GIFTCARD, SUCCESS, NOTENOUGHBALANCE } = require('../../../constants');

function unmountGiftCardComponent() {
  const giftCard = store.componentsObj?.giftcard;
  if (giftCard) {
    giftCard.node.unmount('component_giftcard');
  }
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
    unmountGiftCardComponent();
    cancelMainPaymentGiftCard.classList.add('invisible');
    giftCardAddButton.style.display = 'block';
    giftCardSelect.value = null;
  });

  unmountGiftCardComponent();

  store.addedGiftCards.forEach(renderAddedGiftCard);

  if (store.addedGiftCards?.length) {
    showGiftCardInfoMessage();
  }

  showGiftCardCancelButton(true);
  attachGiftCardCancelListener();
  createElementsToShowRemainingGiftCardAmount();
}

async function makeGiftCardPaymentRequest(paymentMethod, reject) {
  const brandSelect = document.getElementById('giftCardSelect');
  const giftCardBrand = brandSelect.options[brandSelect.selectedIndex].text;

  const { encryptedCardNumber, encryptedSecurityCode, brand } = paymentMethod;

  try {
    await makePartialPayment({
      encryptedCardNumber,
      encryptedSecurityCode,
      brand,
      giftCardBrand,
    });
    handlePartialPaymentSuccess();
  } catch (error) {
    reject();
  }
}

function getGiftCardConfig() {
  let giftCardBalance;

  const handleBalanceCheckSuccess = (data, resolve) => {
    const {
      giftCardsInfoMessageContainer,
      giftCardSelect,
      cancelMainPaymentGiftCard,
      giftCardAddButton,
      giftCardSelectWrapper,
    } = getGiftCardElements();

    // Hide gift card select wrapper if it exists
    giftCardSelectWrapper?.classList.add('invisible');

    // Save initial partial payment object for potential rollback
    const initialPartialObject = { ...store.partialPaymentsOrderObj };

    // Configure cancel button behavior
    cancelMainPaymentGiftCard.classList.remove('invisible');
    cancelMainPaymentGiftCard.addEventListener('click', () => {
      unmountGiftCardComponent();
      cancelMainPaymentGiftCard.classList.add('invisible');
      giftCardAddButton.style.display = 'block';
      giftCardSelect.value = null;
      Object.assign(store.partialPaymentsOrderObj, initialPartialObject);
    });

    // Update UI and store with new balance information
    document.querySelector('button[value="submit-payment"]').disabled = true;
    giftCardsInfoMessageContainer.innerHTML = '';
    giftCardsInfoMessageContainer.classList.remove(
      'gift-cards-info-message-container',
    );
    store.partialPaymentsOrderObj.remainingAmountFormatted =
      data.remainingAmountFormatted;
    store.partialPaymentsOrderObj.totalDiscountedAmount =
      data.totalAmountFormatted;

    resolve(data);
  };

  return {
    showPayButton: true,

    onChange: (state) => {
      store.updateSelectedPayment(GIFTCARD, 'isValid', state.isValid);
      store.updateSelectedPayment(GIFTCARD, 'stateData', state.data);
    },

    onBalanceCheck: async (resolve, reject, requestData) => {
      try {
        const payload = {
          csrf_token: $('#adyen-token').val(),
          data: JSON.stringify(requestData),
        };
        const data = await httpClient({
          method: 'POST',
          url: window.checkBalanceUrl,
          data: payload,
        });

        giftCardBalance = data.balance;
        document.querySelector('button[value="submit-payment"]').disabled =
          false;

        if (data.resultCode === SUCCESS) {
          handleBalanceCheckSuccess(data, resolve);
        } else if (
          data.resultCode === NOTENOUGHBALANCE &&
          data.balance.value > 0
        ) {
          resolve(data);
        } else {
          reject();
        }
      } catch (error) {
        reject();
      }
    },

    onOrderRequest: async (resolve, reject, requestData) => {
      try {
        const { paymentMethod } = requestData;

        if (store.adyenOrderDataCreated) {
          await makeGiftCardPaymentRequest(
            paymentMethod,
            giftCardBalance,
            reject,
          );
        } else {
          const data = await httpClient({
            method: 'POST',
            url: window.partialPaymentsOrderUrl,
            data: {
              csrf_token: $('#adyen-token').val(),
              data: JSON.stringify(requestData),
            },
          });

          if (data.resultCode === 'Success') {
            store.adyenOrderDataCreated = true;
            await makeGiftCardPaymentRequest(
              paymentMethod,
              giftCardBalance,
              reject,
            );
          }
        }
      } catch (error) {
        reject();
      }
    },

    onSubmit(state, component) {
      store.selectedMethod = state.data.paymentMethod.type;
      store.brand = component?.displayName;

      const submitButton = document.querySelector(
        'button[value="submit-payment"]',
      );
      document.querySelector('input[name="brandCode"]').checked = false;
      submitButton.disabled = false;
      submitButton.click();
    },
  };
}

module.exports = {
  getGiftCardConfig,
};
