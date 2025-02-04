/**
 * @jest-environment jsdom
 */
const {
  removeGiftCards,
  renderAddedGiftCard,
  renderGiftCardSelectForm,
  showGiftCardWarningMessage,
} = require('../renderGiftcardComponent');
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
        <div id="cancelGiftCardButton"></div>
        <div id="giftCardsCancelContainer"></div>
        <div id="giftCardsInfoMessage"></div>
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
    paymentMethodsResponse: {
      imagePath: 'test_image_path',
    },
  };
  store.checkout = {
    options: {},
  };
});
describe.only('Render gift card', () => {
  it('should remove entire giftcard container when removeGiftCards is successful', async () => {
    document.body.innerHTML += `
        <div id="biggerContainer">
          <div id="cancelGiftCardContainer"></div>
        </div>
      `;
    store.checkout.paymentMethodsResponse = {
      paymentMethods: {
        filter: jest.fn(() => [
          { type: 'giftcard', brand: 'brand1' },
          { type: 'giftcard', brand: 'brand2' },
        ]),
      },
    };

    expect(document.querySelector('#biggerContainer').innerHTML).toContain(
      'cancelGiftCardContainer',
    );
    removeGiftCards();
    expect(document.querySelector('#biggerContainer')).toBeNull;
  });

  it('should show a warning message if more items are added to cart later', async () => {
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

  it('should render applied gift cards', async () => {
    const giftCardData = { giftCard: { brand: 'brand', name: 'Name' } };
    store.partialPaymentsOrderObj = giftCardData;
    renderAddedGiftCard(giftCardData);

    const giftCardsList = document.querySelector('#giftCardsList');
    expect(giftCardsList).toMatchSnapshot();
  });

  it('should render a select form', async () => {
    store.checkout.paymentMethodsResponse = {
      paymentMethods: {
        filter: jest.fn(() => [
          { type: 'giftcard', brand: 'mocked_brand1' },
          { type: 'giftcard', brand: 'mocked_brand2' },
        ]),
      },
    };
    renderGiftCardSelectForm();

    const giftCardsSelect = document.querySelector('#giftCardSelect');
    const giftCardUl = document.querySelector('#giftCardUl');
    expect(giftCardsSelect).toMatchSnapshot();
    expect(giftCardUl).toMatchSnapshot();
  });
});
