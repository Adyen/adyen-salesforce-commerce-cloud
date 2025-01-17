/* eslint-disable global-require */
const BasketMgr = require('dw/order/BasketMgr');

let fetchGiftCards;
let res;
let req;
let adyenGiftCards = [{
  giftCard: {
    amount: {
      value: 100,
      currency: 'USD',
    }
  }
}]

jest.mock(
  '*/cartridge/adyen/utils/adyenHelper',
  () => ({
    getDivisorForCurrency: jest.fn(),
  }),
  { virtual: true },
);

jest.mock('dw/value/Money', () => {
  return jest.fn().mockImplementation((value, currency) => {
    return {
      getValue: jest.fn(() => value),
      getCurrency: jest.fn(() => currency),
      divide: jest.fn().mockReturnThis(),
      toFormattedString: jest.fn()
    };
  });
});

beforeEach(() => {
  const { adyen } = require('../../../../controllers/middlewares/index');
  fetchGiftCards = adyen.fetchGiftCards;
  jest.clearAllMocks();
  res = { redirect: jest.fn(), json: jest.fn() };
});

afterEach(() => {
  jest.resetModules();
});

describe('fetchGiftCards', () => {
  it('should return gift cards', () => {
    const currentBasket = {
      custom: {
        adyenGiftCards: JSON.stringify(adyenGiftCards)
      }
    };
    BasketMgr.getCurrentBasket.mockReturnValueOnce(currentBasket);
    fetchGiftCards(req, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({
      giftCards: adyenGiftCards
    });
  });

  it('should return empty array for gift cards', () => {
    const currentBasket = {
      custom: {
        adyenGiftCards: []
      }
    };
    BasketMgr.getCurrentBasket.mockReturnValueOnce(currentBasket);
    fetchGiftCards(req, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({
      giftCards: [],
      totalDiscountedAmount: null
    });
  });
});
