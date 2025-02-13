const {
  getGiftCardElements,
  renderAddedGiftCard,
  showGiftCardInfoMessage,
  showGiftCardCancelButton,
  attachGiftCardCancelListener,
  createElementsToShowRemainingGiftCardAmount,
} = require('../../renderGiftcardComponent');
const { makePartialPayment } = require('../../makePartialPayment');
const { GIFTCARD, SUCCESS, NOTENOUGHBALANCE } = require('../../../constants');

class GiftCardConfig {
  constructor(store, httpClient) {
    this.store = store;
    this.httpClient = httpClient;
  }

  handleBalanceCheckSuccess = (data, resolve) => {
    const {
      giftCardsInfoMessageContainer,
      giftCardSelect,
      cancelMainPaymentGiftCard,
      giftCardAddButton,
      giftCardSelectWrapper,
    } = getGiftCardElements();

    giftCardSelectWrapper?.classList.add('invisible');

    const initialPartialObject = { ...this.store.partialPaymentsOrderObj };

    cancelMainPaymentGiftCard.classList.remove('invisible');
    cancelMainPaymentGiftCard.addEventListener('click', () => {
      this.unmountGiftCardComponent();
      cancelMainPaymentGiftCard.classList.add('invisible');
      giftCardAddButton.style.display = 'block';
      giftCardSelect.value = null;
      Object.assign(this.store.partialPaymentsOrderObj, initialPartialObject);
    });

    document.querySelector('button[value="submit-payment"]').disabled = true;
    giftCardsInfoMessageContainer.innerHTML = '';
    giftCardsInfoMessageContainer.classList.remove(
      'gift-cards-info-message-container',
    );
    this.store.partialPaymentsOrderObj.remainingAmountFormatted =
      data.remainingAmountFormatted;
    this.store.partialPaymentsOrderObj.totalDiscountedAmount =
      data.totalAmountFormatted;

    resolve(data);
  };

  onBalanceCheck = async (resolve, reject, requestData) => {
    try {
      const payload = {
        csrf_token: $('#adyen-token').val(),
        data: JSON.stringify(requestData),
      };
      const data = await this.httpClient({
        method: 'POST',
        url: window.checkBalanceUrl,
        data: payload,
      });

      document.querySelector('button[value="submit-payment"]').disabled = false;

      if (data.resultCode === SUCCESS) {
        this.handleBalanceCheckSuccess(data, resolve);
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
  };

  async onOrderRequest(resolve, reject, requestData) {
    try {
      const { paymentMethod } = requestData;

      if (this.store.adyenOrderDataCreated) {
        await this.makeGiftCardPaymentRequest(paymentMethod, reject);
      } else {
        const data = await this.httpClient({
          method: 'POST',
          url: window.partialPaymentsOrderUrl,
          data: {
            csrf_token: $('#adyen-token').val(),
            data: JSON.stringify(requestData),
          },
        });

        if (data.resultCode === 'Success') {
          this.store.adyenOrderDataCreated = true;
          await this.makeGiftCardPaymentRequest(paymentMethod, reject);
        }
      }
    } catch (error) {
      reject();
    }
  }

  onSubmit(state, component) {
    this.store.selectedMethod = state.data.paymentMethod.type;
    this.store.brand = component?.displayName;

    const submitButton = document.querySelector(
      'button[value="submit-payment"]',
    );
    document.querySelector('input[name="brandCode"]').checked = false;
    submitButton.disabled = false;
    submitButton.click();
  }

  getConfig() {
    return {
      showPayButton: true,

      onChange: (state) => {
        this.store.updateSelectedPayment(GIFTCARD, 'isValid', state.isValid);
        this.store.updateSelectedPayment(GIFTCARD, 'stateData', state.data);
      },

      onBalanceCheck: (resolve, reject, requestData) => {
        this.onBalanceCheck(resolve, reject, requestData);
      },

      onOrderRequest: (resolve, reject, requestData) => {
        this.onOrderRequest(resolve, reject, requestData);
      },

      onSubmit: (state, component) => {
        this.onSubmit(state, component);
      },
    };
  }

  unmountGiftCardComponent() {
    const giftCard = this.store.componentsObj?.giftcard;
    if (giftCard) {
      giftCard.node.unmount('component_giftcard');
    }
  }

  handlePartialPaymentSuccess() {
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
      this.unmountGiftCardComponent();
      cancelMainPaymentGiftCard.classList.add('invisible');
      giftCardAddButton.style.display = 'block';
      giftCardSelect.value = null;
    });

    this.unmountGiftCardComponent();

    this.store.addedGiftCards.forEach(renderAddedGiftCard);

    if (this.store.addedGiftCards?.length) {
      showGiftCardInfoMessage();
    }

    showGiftCardCancelButton(true);
    attachGiftCardCancelListener();
    createElementsToShowRemainingGiftCardAmount();
  }

  async makeGiftCardPaymentRequest(paymentMethod, reject) {
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
      this.handlePartialPaymentSuccess();
    } catch (error) {
      reject();
    }
  }
}

module.exports = GiftCardConfig;
