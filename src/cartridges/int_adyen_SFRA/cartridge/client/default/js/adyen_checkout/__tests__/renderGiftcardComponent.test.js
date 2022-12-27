/**
 * @jest-environment jsdom
 */
const {
          removeGiftCard,
          renderAddedGiftCard,
          renderGiftCardSelectForm,
          getGiftCardElements,
          showGiftCardWarningMessage,
          createElementsToShowRemainingGiftCardAmount } = require('../renderGiftcardComponent');
const { createSession } = require('../../commons');
const store = require('../../../../../store');

jest.mock('../../commons');
jest.mock('../../../../../store');

beforeEach(() => {
  window.AdyenCheckout = jest.fn(async () => ({
    create: jest.fn(),
    paymentMethodsResponse: {
      storedPaymentMethods: [{ supportedShopperInteractions: ['Ecommerce'] }],
      paymentMethods: [{ type: 'amazonpay' }],
    },
    options: {
      amount: 'mocked_amount',
      countryCode: 'mocked_countrycode',
    }
  }));
  window.Configuration = { amount: 0 };
  store.checkoutConfiguration = {
    session: {
        imagePath: "test_image_path"
    }
  };
  store.checkout = {
   options: {}
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
      store.partialPaymentsOrderObj = {giftcard: {brand: 'brand'}};
      document.body.innerHTML = `
        <select id="giftCardSelect"></select>
        <ul id="giftCardUl"></ul>
        <ul id="giftCardsList"></ul>
        <div id="giftCardContainer"></div>
        <div id="giftCardSelectContainer"></div>
        <button id="giftCardAddButton"></button>
      `;

      renderAddedGiftCard();

        const giftCardAddButton = document.querySelector('#giftCardAddButton');
        const giftCardsList = document.querySelector('#giftCardsList');
        expect(giftCardsList).toMatchSnapshot();
//      brandAndRemoveActionWrapper.classList.add('wrapper');
      expect(document.querySelector('#giftCardAddButton').style.display).toBe('none');
    });
});
