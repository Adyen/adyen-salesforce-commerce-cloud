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
        <select id="giftCardSelect"><option value="givex">Givex</option></select>
        <ul id="giftCardUl"></ul>
        <ul id="giftCardsList"></ul>
        <div id="giftCardContainer"></div>
        <div id="giftCardSelectContainer"></div>
        <button id="giftCardAddButton"></button>
        <div id="adyenPartialPaymentsOrder"></div>
        <div id="cancelGiftCardButton"></div>
        <div id="giftCardsCancelContainer" class="invisible">
          <button id="giftCardCancelButton"></button>
        </div>
        <div id="giftCardsInfoMessage"></div>
        <button value="submit-payment"></button>
        <div class="card-body order-total-summary"></div>
      `;
  window.giftCardErrorMessage = GIFT_CARD_ERROR_MESSAGE;
  window.checkBalanceUrl = 'mocked_checkBalanceUrl';
  window.partialPaymentsOrderUrl = 'mocked_partialPaymentsOrderUrl';
  window.partialPaymentUrl = 'mocked_partialPaymentUrl';
  store.adyenOrderDataCreated = false;
  store.checkout = { options: {} };
  store.checkoutConfiguration = {
    paymentMethodsResponse: { imagePath: 'mocked_imagePath/' },
  };
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

  it('shows an error when the partial payment request fails', async () => {
    const config = createConfig(
      jest.fn(async () => {
        throw new Error('mocked_error');
      }),
    );

    await expect(config.makePartialPayment({})).rejects.toThrow('mocked_error');
    expect(shownErrorMessage().textContent).toBe(GIFT_CARD_ERROR_MESSAGE);
  });

  // a rejected request used to leave the component promise unsettled
  it('rejects the gift card request when the partial payment request fails', async () => {
    const reject = jest.fn();
    const config = createConfig(
      jest.fn(async () => {
        throw new Error('mocked_error');
      }),
    );
    store.adyenOrderDataCreated = true;

    await config.onOrderRequest(jest.fn(), reject, { paymentMethod: {} });

    expect(reject).toHaveBeenCalled();
    expect(shownErrorMessage().textContent).toBe(GIFT_CARD_ERROR_MESSAGE);
  });
});

describe('gift card success', () => {
  const partialPaymentResponse = {
    giftCards: [
      {
        giftCard: { brand: 'givex', name: 'Givex' },
        discountedAmount: '€10.00',
        remainingAmount: { currency: 'EUR', value: 1000 },
      },
    ],
    // the response carries a remaining amount hint that must not be rendered
    message: 'Add a gift card to pay the remaining €10.00',
    remainingAmount: { currency: 'EUR', value: 1000 },
    remainingAmountFormatted: '€10.00',
    totalDiscountedAmount: '€10.00',
    orderCreated: true,
  };

  it('does not show a warning after a successful partial payment', async () => {
    const reject = jest.fn();
    const config = createConfig(jest.fn(async () => partialPaymentResponse));
    store.adyenOrderDataCreated = true;

    await config.onOrderRequest(jest.fn(), reject, { paymentMethod: {} });

    expect(reject).not.toHaveBeenCalled();
    expect(document.querySelector('#giftCardsInfoMessage').innerHTML).toBe('');
    expect(
      document.querySelector('.adyen-checkout__alert-message--warning'),
    ).toBeNull();
    expect(
      document.querySelector('#giftCardsCancelContainer').classList,
    ).not.toContain('invisible');
    expect(document.querySelectorAll('#giftCardsList .gift-card')).toHaveLength(
      1,
    );
    expect(document.querySelector('#remainingAmountEndSpan').innerText).toBe(
      '€10.00',
    );
  });
});
