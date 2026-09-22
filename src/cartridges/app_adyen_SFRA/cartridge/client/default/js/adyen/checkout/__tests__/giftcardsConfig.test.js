/**
 * @jest-environment jsdom
 */
jest.mock('../../commons');
jest.mock('../../../../../../config/store');

const GiftCardConfig = require('../paymentMethodsConfiguration/giftcards/giftcardsConfig');
const store = require('../../../../../../config/store');

const GIFT_CARD_ERROR_MESSAGE = 'mocked_giftCardErrorMessage';

function createConfig(httpClient) {
  return new GiftCardConfig(store, httpClient, { setOrderFormData: jest.fn() });
}

function shownErrorMessage() {
  return document.querySelector('#giftCardsInfoMessage #giftCardErrorMessage');
}

beforeEach(() => {
  document.body.innerHTML = `
        <select id="giftCardSelect"></select>
        <ul id="giftCardUl"></ul>
        <ul id="giftCardsList"></ul>
        <div id="giftCardContainer"></div>
        <div id="giftCardSelectContainer"></div>
        <button id="giftCardAddButton"></button>
        <div id="adyenPartialPaymentsOrder"></div>
        <div id="cancelGiftCardButton"></div>
        <div id="giftCardsCancelContainer"></div>
        <div id="giftCardsInfoMessage"></div>
        <button value="submit-payment"></button>
      `;
  window.giftCardErrorMessage = GIFT_CARD_ERROR_MESSAGE;
  window.checkBalanceUrl = 'mocked_checkBalanceUrl';
  window.partialPaymentsOrderUrl = 'mocked_partialPaymentsOrderUrl';
  window.partialPaymentUrl = 'mocked_partialPaymentUrl';
  store.adyenOrderDataCreated = false;
});

describe('gift card failures', () => {
  it('shows an error when the balance check is unsuccessful', async () => {
    const reject = jest.fn();
    const config = createConfig(jest.fn(async () => ({ resultCode: 'Error' })));

    await config.onBalanceCheck(jest.fn(), reject, {});

    expect(reject).toHaveBeenCalled();
    expect(shownErrorMessage().textContent).toBe(GIFT_CARD_ERROR_MESSAGE);
  });

  it('shows an error when the balance check request fails', async () => {
    const reject = jest.fn();
    const config = createConfig(
      jest.fn(async () => {
        throw new Error('mocked_error');
      }),
    );

    await config.onBalanceCheck(jest.fn(), reject, {});

    expect(reject).toHaveBeenCalled();
    expect(shownErrorMessage().textContent).toBe(GIFT_CARD_ERROR_MESSAGE);
  });

  it('shows an error when the partial payments order is unsuccessful', async () => {
    const reject = jest.fn();
    const config = createConfig(jest.fn(async () => ({ resultCode: 'Error' })));

    await config.onOrderRequest(jest.fn(), reject, { paymentMethod: {} });

    expect(reject).toHaveBeenCalled();
    expect(shownErrorMessage().textContent).toBe(GIFT_CARD_ERROR_MESSAGE);
  });

  it('shows an error when the partial payments order request fails', async () => {
    const reject = jest.fn();
    const config = createConfig(
      jest.fn(async () => {
        throw new Error('mocked_error');
      }),
    );

    await config.onOrderRequest(jest.fn(), reject, { paymentMethod: {} });

    expect(reject).toHaveBeenCalled();
    expect(shownErrorMessage().textContent).toBe(GIFT_CARD_ERROR_MESSAGE);
  });

  it('shows an error when the partial payment is unsuccessful', async () => {
    const config = createConfig(jest.fn(async () => ({ error: true })));

    await expect(config.makePartialPayment({})).rejects.toThrow(
      'Partial payment error',
    );
    expect(shownErrorMessage().textContent).toBe(GIFT_CARD_ERROR_MESSAGE);
  });
});
