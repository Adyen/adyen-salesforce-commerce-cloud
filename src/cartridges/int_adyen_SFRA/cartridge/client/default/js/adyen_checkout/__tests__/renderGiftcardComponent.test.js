/**
 * @jest-environment jsdom
 */
const {
  removeGiftCard,
  renderAddedGiftCard,
  renderGiftCardSelectForm,
  getGiftCardElements,
  showGiftCardWarningMessage,
  createElementsToShowRemainingGiftCardAmount,
} = require('../renderGiftcardComponent');
const { createSession } = require('../../commons');
const store = require('../../../../../store');

jest.mock('../../commons');
jest.mock('../../../../../store');

beforeEach(() => {
    document.body.innerHTML = `
        <select id="giftCardSelect"></select>
        <ul id="giftCardUl"></ul>
        <ul id="giftCardsList"></ul>
        <div id="giftCardContainer"></div>
        <div id="giftCardSelectContainer"></div>
        <button id="giftCardAddButton"></button>
        <div id="adyenPartialPaymentsOrder"></div>
      `;
  window.AdyenCheckout = jest.fn(async () => ({
    create: jest.fn(),
    paymentMethodsResponse: {
      storedPaymentMethods: [{ supportedShopperInteractions: ['Ecommerce'] }],
      paymentMethods: [{ type: 'amazonpay' }],
    },
    options: {
      amount: 'mocked_amount',
      countryCode: 'mocked_countrycode',
    },
  }));
  window.Configuration = { amount: 0 };
  store.checkoutConfiguration = {
    session: {
      imagePath: 'test_image_path',
    },
  };
  store.checkout = {
    options: {},
  };
  createSession.mockReturnValue({
    adyenConnectedTerminals: { uniqueTerminalIds: ['mocked_id'] },
    id: 'mock_id',
    sessionData: 'mock_session_data',
    imagePath: 'example.com',
    adyenDescriptions: {},
  });
});
describe.only('Render gift card', () => {
  it('should showGiftCardWarningMessage', async () => {
    document.body.innerHTML = `
      <div class="card-body order-total-summary"></div>
    `;

    showGiftCardWarningMessage();
    const orderTotalSummaryEl = document.querySelector(
      '.card-body.order-total-summary',
    );
    expect(orderTotalSummaryEl).toMatchSnapshot();
    expect(document.querySelector('#giftCardWarningMessage')).toBeTruthy();
  });

  it('should renderAddedGiftCard', async () => {
    store.partialPaymentsOrderObj = { giftcard: { brand: 'brand' } };
    renderAddedGiftCard();

    const giftCardAddButton = document.querySelector('#giftCardAddButton');
    const giftCardsList = document.querySelector('#giftCardsList');
    expect(giftCardsList).toMatchSnapshot();
    expect(document.querySelector('#giftCardAddButton').style.display).toBe(
      'none',
    );
  });

  it('should renderGiftCardSelectForm', async () => {
    store.checkout.paymentMethodsResponse = { paymentMethods: { filter: jest.fn(() => [{type: 'giftcard', brand: 'mocked_brand1'}, {type: 'giftcard', brand: 'mocked_brand2'}] ) } };
    renderGiftCardSelectForm();

    const giftCardsSelect = document.querySelector('#giftCardSelect');
    const giftCardUl = document.querySelector('#giftCardUl');
    expect(giftCardsSelect).toMatchSnapshot();
    expect(giftCardUl).toMatchSnapshot();
  });

  it('should remove entire giftcard container when removeGiftCard is successful', async () => {
        document.body.innerHTML += `
            <div id="biggerContainer">
              <div id="cancelGiftCardContainer"></div>
            </div>
          `;

    store.checkout.paymentMethodsResponse = { paymentMethods: { filter: jest.fn(() => [{type: 'giftcard', brand: 'brand1'}, {type: 'giftcard', brand: 'brand2'}] ) } };

    const biggerContainer = document.querySelector('#biggerContainer');
    const cancelGiftCardContainer = document.querySelector('#cancelGiftCardContainer');

      const data = {
        resultCode: 'Received',
      };
      $.ajax = jest.fn(({ success }) => {
        success(data);
        return { fail: jest.fn() };
      });

    expect(document.querySelector('#biggerContainer').innerHTML).toContain('cancelGiftCardContainer');
    removeGiftCard();
    expect(document.querySelector('#biggerContainer')).toBeNull;
  });
});
