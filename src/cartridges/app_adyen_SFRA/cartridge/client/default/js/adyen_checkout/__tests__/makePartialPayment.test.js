/**
 * @jest-environment jsdom
 */
jest.mock('../../commons');
const { makePartialPayment } = require('../makePartialPayment');
const store = require('../../../../../store');
const {getPaymentMethods, fetchGiftCards} = require("../../commons");
let data;
const giftCardHtml = `
      <div id="paymentMethodsList"></div>
      <input type="radio" name="brandCode" value="card" />
      <button value="submit-payment">Submit</button>
      <div id="component_card"></div>
      <div class="gift-card-selection"></div>
      <div class="gift-card-separator"></div>
      <div id="adyenPosTerminals">
        <span>Child #1</span>
      </div>
      <button id="giftCardAddButton"></button>
      <ul id="giftCardUl"></ul>
      <select id="giftCardSelect"></select>
      <div id="giftCardsInfoMessage"></div>
      <div id="giftCardsCancelContainer"></div>
      <div id="giftCardInformation"></div>
      <div class="card-body order-total-summary"></div>
      <ul id="giftCardsList"></ul>
      <div>
        <input type="text" id="shippingFirstNamedefault" value="test">
        <input type="text" id="shippingLastNamedefault" value="test">
        <input type="text" id="shippingAddressOnedefault" value="test">
        <input type="text" id="shippingAddressCitydefault" value="test">
        <input type="text" id="shippingZipCodedefault" value="test">
        <input type="text" id="shippingCountrydefault" value="test">
        <input type="text" id="shippingPhoneNumberdefault" value="test">
        <input type="text" id="shippingZipCodedefault" value="test">
      </div>
    `;
beforeEach(() => {
  window.AdyenCheckout = jest.fn(async () => ({
    create: jest.fn(),
    paymentMethodsResponse: {
      storedPaymentMethods: [{ supportedShopperInteractions: ['Ecommerce'] }],
      paymentMethods: [{ type: 'giftcard' }],
    },
    options: {
      amount: 'mocked_amount',
      countryCode: 'mocked_countrycode',
    },
  }));
  store.checkout = {
    options: { amount: 100 },
  };
  data = {
    paymentMethod: {
      type: 'giftcard',
      brand: 'givex',
    },
    amount: {
      currency: 'USD',
      value: '50',
    },
    orderCreated: true,
    partialPaymentsOrder: {
      pspReference: 'store.adyenOrderData.pspReference',
      orderData: 'store.adyenOrderData.orderData',
    },
    giftcardBrand: 'Givex',
  };
  getPaymentMethods.mockReturnValue({
    json: jest.fn().mockReturnValue({
      adyenConnectedTerminals: { uniqueTerminalIds: ['mocked_id'] },
      imagePath: 'example.com',
      adyenDescriptions: {},
    }),
  });
  const availableGiftCards = {
    giftCards: [
      {
        orderAmount: {
          currency: 'EUR',
          value: 15,
        },
        remainingAmount: {
          currency: 'EUR',
          value: 100,
        },
      },
    ],
  }
  fetchGiftCards.mockReturnValue(availableGiftCards);
});

afterEach(() => {
  jest.resetModules();
});

describe('Make partial payment request', () => {
  it('should make partial payment', async () => {
    document.body.innerHTML = giftCardHtml;
    jest.spyOn($, 'ajax').mockImplementation(() => ({
      done: jest.fn().mockImplementation((callback) => callback(data)),
      fail: jest.fn(),
    }));
    await makePartialPayment(data);
    expect(store.adyenOrderDataCreated).toBeTruthy();
  });

  it('should handle partial payment with error', async () => {
    document.body.innerHTML = giftCardHtml;
    const responseData = { error: true };
    jest.spyOn($, 'ajax').mockImplementation(() => ({
      done: jest.fn().mockImplementation((callback) => callback(responseData)),
      fail: jest.fn(),
    }));
    try {
      await makePartialPayment(data);
      fail();
    } catch (error) {
      expect(error.message).toBe('Partial payment error true');
    }
  });

  it('should fail to make partial payment', async () => {
    document.body.innerHTML = giftCardHtml;
    jest.spyOn($, 'ajax').mockImplementation(() => ({
      done: jest.fn().mockImplementation((callback) => callback({})),
      fail: jest.fn(),
    }));
    await expect(makePartialPayment(data)).resolves.toBeUndefined();
    expect(store.addedGiftCards).toBeUndefined();
    expect(store.adyenOrderData).toBeUndefined();
  });
});
